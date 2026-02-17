import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Record } from './../../records/entities/record.entity';
import {
  ProceduralPart,
  PartType,
} from '../../procedural-part/entities/procedural-part.entity';
import { Performance } from '../../perfomance/entities/perfomance.entity';
import {
  MonolegalRecordData,
  ProcessResult,
  SyncResponse,
} from '../dto/import-monolegal.dto';
import { MonolegalApiService } from './monolegal-api.service';
import { JuzgadoNormalizerService } from './juzgado-normalizer.service';
import { normalizeClientType } from '../constants/normalize-client-type';
import { OrchestratorService } from 'src/orchestrator/services/orchestrator.service';

@Injectable()
export class MonolegalService {
  private readonly logger = new Logger(MonolegalService.name);

  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(ProceduralPart.name)
    private proceduralPartModel: Model<ProceduralPart>,
    @InjectModel(Performance.name) private performanceModel: Model<Performance>,
    private readonly monolegalApiService: MonolegalApiService,
    private readonly juzgadoNormalizer: JuzgadoNormalizerService,
    private readonly orchestratorService: OrchestratorService,
  ) {}

  async importFromExcel(
    file: Express.Multer.File,
    userId: string,
  ): Promise<any> {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    if (!file.originalname.match(/\.(xlsx|xls)$/)) {
      throw new BadRequestException(
        'El archivo debe ser un Excel (.xlsx o .xls)',
      );
    }

    try {
      const workbook = XLSX.read(file.buffer, { type: 'buffer' });

      const sheetName =
        workbook.SheetNames.find(
          (name) => name.includes('InformeCambios') || name.includes('Informe'),
        ) || workbook.SheetNames[workbook.SheetNames.length - 1];

      const worksheet = workbook.Sheets[sheetName];

      let data: any[] = XLSX.utils.sheet_to_json(worksheet, {
        range: 1,
        defval: '',
      });

      if (data.length === 0 || !data[0] || !data[0]['Número Proceso']) {
        data = XLSX.utils.sheet_to_json(worksheet, {
          range: 2,
          defval: '',
        });
      }

      if (!data || data.length === 0) {
        throw new BadRequestException(
          'El archivo Excel está vacío o no contiene datos válidos',
        );
      }

      if (data[0] && !data[0]['Número Proceso']) {
        throw new BadRequestException(
          'El archivo no tiene el formato esperado de Monolegal (falta columna "Número Proceso")',
        );
      }

      const results: ProcessResult[] = [];
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const row of data) {
        try {
          const result = await this.processRow(row, userId);
          results.push(result);

          if (result.status === 'created') created++;
          else if (result.status === 'updated') updated++;
          else if (result.status === 'skipped') skipped++;
          else if (result.status === 'error') errors++;
        } catch (error) {
          errors++;
          results.push({
            radicado: row['Número Proceso'] || 'Desconocido',
            status: 'error',
            message: (error as any).message,
          });
        }
      }

      return {
        success: true,
        message: 'Importación completada',
        summary: {
          total: data.length,
          created,
          updated,
          skipped,
          errors,
        },
        details: results,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al procesar el archivo: ${(error as any).message}`,
      );
    }
  }

  private async processRow(row: any, userId: string): Promise<ProcessResult> {
    const radicado =
      row['Número Proceso'] ||
      row['Numero Proceso'] ||
      row['numero proceso'] ||
      '';
    const demandantes = row['Demandantes'] || row['demandantes'] || '';
    const demandados = row['Demandados'] || row['demandados'] || '';
    const despacho = row['Despacho'] || row['despacho'] || '';
    const etiqueta = row['Etiqueta'] || row['etiqueta'] || '';
    const etapaProcesal =
      row['Etapa Procesal'] ||
      row['Etapa procesal'] ||
      row['etapa procesal'] ||
      '';
    const ultimaActuacion =
      row['Última Actuación'] ||
      row['Ultima Actuacion'] ||
      row['ultima actuacion'] ||
      '';

    if (!radicado || radicado.trim() === '') {
      return {
        radicado: 'Sin radicado',
        status: 'skipped',
        message: 'No tiene número de proceso',
      };
    }

    const ciudadExtraida = this.extractCityFromDespacho(despacho);

    const despachoNormalizado = this.normalizeDespacho(
      despacho.trim(),
      ciudadExtraida,
    );

    const record = await this.recordModel.findOne({
      radicado: radicado.trim(),
    });

    let internalCode = record?.internalCode;

    if (!internalCode) {
      const year = new Date().getFullYear();
      const count = await this.recordModel.countDocuments({
        internalCode: { $regex: `^ML-${year}-` },
      });
      internalCode = `ML-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const recordData = {
      radicado: radicado.trim(),
      internalCode,
      despachoJudicial: despachoNormalizado,
      city: ciudadExtraida,
      etiqueta: etiqueta.trim(),
      etapaProcesal: etapaProcesal.trim(),
      ultimaActuacion: ultimaActuacion.trim(),
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
    };
    if (record) {
      Object.assign(record, recordData);

      record.clientType = normalizeClientType(
        record.clientType || row['Tipo Cliente'] || row['clientType'],
      );
      await record.save();

      if (ultimaActuacion) {
        await this.createOrUpdatePerformance(record._id, {
          ultimaActuacion,
          etapaProcesal,
        });
      }

      return {
        radicado: radicado.trim(),
        status: 'updated',
        message: 'Registro actualizado exitosamente',
      };
    } else {
      const newRecord = new this.recordModel({
        user: userId,
        ...recordData,
        clientType: normalizeClientType(
          row['Tipo Cliente'] || row['clientType'],
        ),
        country: 'Colombia',
      });

      await newRecord.save();

      await this.createProceduralParts(newRecord._id, {
        demandantes,
        demandados,
      });

      if (ultimaActuacion) {
        await this.createOrUpdatePerformance(newRecord._id, {
          ultimaActuacion,
          etapaProcesal,
        });
      }

      return {
        radicado: radicado.trim(),
        status: 'created',
        message: 'Registro creado exitosamente',
      };
    }
  }

  private async createProceduralParts(
    recordId: any,
    data: { demandantes: string; demandados: string },
  ): Promise<void> {
    const demandantes =
      data.demandantes
        ?.split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0) || [];

    const demandados =
      data.demandados
        ?.split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0) || [];

    const isRappi = (nombre: string): boolean => {
      return (nombre || '').toLowerCase().includes('rappi');
    };

    // Crear demandantes
    for (const nombre of demandantes) {
      if (nombre) {
        await this.proceduralPartModel.create({
          record: recordId,
          partType: PartType.demandante,
          name: nombre,
          documentType: 'Por verificar',
          document: 'Por verificar',
          email: 'por-verificar@temp.com',
          contact: 'Por verificar',
        });
      }
    }

    // Crear demandados / Rappi
    for (const nombre of demandados) {
      if (nombre) {
        if (isRappi(nombre)) {
          await this.proceduralPartModel.create({
            record: recordId,
            partType: PartType.demandada,
            name: 'Rappi SAS',
            documentType: 'NIT',
            document: '900843898',
            email: 'notificacionesrappi@rappi.com',
            contact: '6017433711',
          });
        } else {
          // Otros demandados
          await this.proceduralPartModel.create({
            record: recordId,
            partType: PartType.demandada,
            name: nombre,
            documentType: 'Por verificar',
            document: 'Por verificar',
            email: 'por-verificar@temp.com',
            contact: 'Por verificar',
          });
        }
      }
    }
  }

  private async updateOrCreateProceduralParts(
    recordId: any,
    data: { demandantes: string; demandados: string },
  ): Promise<void> {
    const demandantes =
      data.demandantes
        ?.split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0) || [];

    const demandados =
      data.demandados
        ?.split(',')
        .map((d) => d.trim())
        .filter((d) => d.length > 0) || [];

    const isRappi = (nombre: string): boolean => {
      return (nombre || '').toLowerCase().includes('rappi');
    };

    const existingDemandantes = await this.proceduralPartModel.find({
      record: recordId,
      partType: PartType.demandante,
    });

    const existingDemandados = await this.proceduralPartModel.find({
      record: recordId,
      partType: PartType.demandada,
    });

    if (existingDemandantes.length === 0) {
      for (const nombre of demandantes) {
        if (nombre) {
          await this.proceduralPartModel.create({
            record: recordId,
            partType: PartType.demandante,
            name: nombre,
            documentType: 'Por verificar',
            document: 'Por verificar',
            email: 'por-verificar@temp.com',
            contact: 'Por verificar',
          });
        }
      }
    }

    if (existingDemandados.length === 0) {
      for (const nombre of demandados) {
        if (nombre) {
          if (isRappi(nombre)) {
            await this.proceduralPartModel.create({
              record: recordId,
              partType: PartType.demandada,
              name: 'Rappi SAS',
              documentType: 'NIT',
              document: '900843898',
              email: 'notificacionesrappi@rappi.com',
              contact: '6017433711',
            });
          } else {
            await this.proceduralPartModel.create({
              record: recordId,
              partType: PartType.demandada,
              name: nombre,
              documentType: 'Por verificar',
              document: 'Por verificar',
              email: 'por-verificar@temp.com',
              contact: 'Por verificar',
            });
          }
        }
      }
    }
  }

  private async createOrUpdatePerformance(
    recordId: any,
    data: {
      ultimaActuacion: string;
      etapaProcesal: string;
      ultimaAnotacion?: string;
    },
  ): Promise<void> {
    const actuacion = data.ultimaActuacion?.trim();

    if (!actuacion || actuacion === '---') return;

    const existingPerformance = await this.performanceModel.findOne({
      record: recordId,
      performanceType: actuacion,
    });

    if (!existingPerformance) {
      await this.performanceModel.create({
        record: recordId,
        performanceType: actuacion,
        responsible: 'Monolegal',
        observation:
          data.ultimaAnotacion?.trim() ||
          `Sincronizado desde Monolegal - ${data.etapaProcesal || 'Sin etapa'}`,
      });
    }
  }
  private parseDate(dateString: any): Date | undefined {
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }

    if (!dateString) {
      return undefined;
    }

    if (typeof dateString === 'number') {
      const days = Math.floor(dateString);
      const timeFraction = dateString - days;

      const excelEpoch = new Date(1900, 0, days > 59 ? days - 1 : days);

      const millisInDay = 24 * 60 * 60 * 1000;
      const timeMillis = Math.round(timeFraction * millisInDay);
      excelEpoch.setTime(excelEpoch.getTime() + timeMillis);

      return excelEpoch;
    }

    const dateStr = String(dateString).trim();

    if (dateStr === '' || dateStr === '---') {
      return undefined;
    }

    try {
      const fullTextRegex =
        /(\d{1,2})\/(\d{1,2})\/(\d{4})\s+A\s+LAS\s+(\d{1,2}):(\d{1,2}):(\d{1,2})/i;
      const fullMatch = dateStr.match(fullTextRegex);

      if (fullMatch) {
        const day = fullMatch[1];
        const month = fullMatch[2];
        const year = fullMatch[3];
        const hour = fullMatch[4];
        const minute = fullMatch[5];
        const second = fullMatch[6];

        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(
          2,
          '0',
        )}T${hour.padStart(2, '0')}:${minute.padStart(
          2,
          '0',
        )}:${second.padStart(2, '0')}`;
        const parsedDate = new Date(isoString);

        return parsedDate;
      }

      const ddmmyyyyRegex = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
      const match = dateStr.match(ddmmyyyyRegex);

      if (match) {
        const day = match[1];
        const month = match[2];
        const year = match[3];

        const isoString = `${year}-${month.padStart(2, '0')}-${day.padStart(
          2,
          '0',
        )}T12:00:00`;
        const parsedDate = new Date(isoString);

        return parsedDate;
      }

      return undefined;
    } catch (error) {
      return undefined;
    }
  }

  async syncFromApiAbstract(
    isUpdating: boolean,
    fecha?: Date,
    userId?: string,
  ): Promise<SyncResponse> {
    const fechaConsulta = fecha || new Date();
    const fechaFormateada =
      this.monolegalApiService.formatearFechaMonolegal(fechaConsulta);

    try {
      const resumen = await this.monolegalApiService.getResumenCambios(
        fechaFormateada,
      );

      if (!resumen.tieneCambios) {
        return {
          success: true,
          message: 'No hay cambios para sincronizar',
          summary: {
            total: 0,
            created: 0,
            updated: 0,
            skipped: 0,
            errors: 0,
          },
          details: [],
          updatedRecords: [],
        };
      }

      const cambios = await this.monolegalApiService.getTodosCambios(
        fechaFormateada,
      );

      const results: ProcessResult[] = [];
      const updatedRecords: Array<{
        radicado: string;
        despachoJudicial: string;
        city: string;
        ultimaActuacion: string;
      }> = [];

      let created = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      for (const cambio of cambios) {
        try {
          let result;
          if (isUpdating) {
            result = await this.processApiChange(cambio, userId);
          } else {
            result = await this.getApiChange(cambio);
          }
          results.push(result);

          if (result.status === 'created') {
            created++;
          } else if (result.status === 'updated') {
            updated++;
            updatedRecords.push({
              radicado: result.radicado,
              despachoJudicial: result.details?.despachoJudicial || '',
              city: result.details?.city || '',
              ultimaActuacion: result.details?.ultimaActuacion || '',
            });
          } else if (result.status === 'skipped') {
            skipped++;
          } else if (result.status === 'error') {
            errors++;
          }
        } catch (error) {
          errors++;
          results.push({
            radicado: cambio.numero || 'Desconocido',
            status: 'error',
            message: (error as any).message,
          });
        }
      }

      return {
        success: true,
        message: 'Sincronización completada',
        summary: {
          total: cambios.length,
          created,
          updated,
          skipped,
          errors,
        },
        details: results,
        updatedRecords,
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al sincronizar con Monolegal: ${(error as any).message}`,
      );
    }
  }

  async syncFromApi(userId: string, fecha?: Date): Promise<SyncResponse> {
    return this.syncFromApiAbstract(true, fecha, userId);
  }

  async syncHistoryFromApi(fecha?: Date): Promise<SyncResponse> {
    const fechaConsulta = fecha || new Date();
    const fechaFormateada =
      this.monolegalApiService.formatearFechaMonolegal(fechaConsulta);

    try {
      const resumen = await this.monolegalApiService.getResumenCambios(
        fechaFormateada,
      );

      if (!resumen.tieneCambios) {
        return {
          success: true,
          message: 'No hay cambios para sincronizar',
          summary: { total: 0, created: 0, updated: 0, skipped: 0, errors: 0 },
          details: [],
          updatedRecords: [],
        };
      }

      const cambios = await this.monolegalApiService.getTodosCambios(
        fechaFormateada,
      );

      const BATCH_SIZE = 10; 
      const results: ProcessResult[] = [];
      let created = 0,
        updated = 0,
        skipped = 0,
        errors = 0;

      for (let i = 0; i < cambios.length; i += BATCH_SIZE) {
        const batch = cambios.slice(i, i + BATCH_SIZE);

        const batchResults = await Promise.allSettled(
          batch.map((cambio) => this.getApiChangeFast(cambio)),
        );

        for (const result of batchResults) {
          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.status === 'created') created++;
            else if (result.value.status === 'updated') updated++;
            else if (result.value.status === 'skipped') skipped++;
          } else {
            errors++;
            results.push({
              radicado: 'Desconocido',
              status: 'error',
              message: result.reason?.message || 'Error desconocido',
            });
          }
        }

        this.logger.log(
          `Procesados ${Math.min(i + BATCH_SIZE, cambios.length)}/${
            cambios.length
          }`,
        );
      }

      return {
        success: true,
        message: 'Consulta completada',
        summary: { total: cambios.length, created, updated, skipped, errors },
        details: results,
        updatedRecords: [],
      };
    } catch (error) {
      throw new BadRequestException(
        `Error al consultar Monolegal: ${(error as any).message}`,
      );
    }
  }

  private async getApiChangeFast(cambio: any): Promise<ProcessResult> {
    const radicado = cambio.numero?.trim();

    if (!radicado) {
      return {
        radicado: 'Sin radicado',
        status: 'skipped',
        message: 'No tiene número de proceso',
      };
    }
    
    const record = await this.recordModel.findOne({ radicado }).lean();
  
    const recordDataFast = this.prepareRecordDataFast(cambio);

    if (record) {      
      return {
        radicado,
        status: 'updated',
        message: 'Registro se actualizaría',
        details: {
          despachoJudicial: recordDataFast.despachoJudicial,
          city: recordDataFast.city,
          ultimaActuacion: recordDataFast.ultimaActuacion,
          ultimaAnotacion: recordDataFast.ultimaAnotacion,
          etiqueta: record.etiqueta || '',
        },
      };
    } else {
      return {
        radicado,
        status: 'created',
        message: 'Registro se crearía',
      };
    }
  }

  private prepareRecordDataFast(cambio: any): MonolegalRecordData {
    const radicado = cambio.numero?.trim();
    const despachoOriginal = cambio.despacho?.trim() || '';
    
    const ciudad = this.extractCityFromDespacho(despachoOriginal);
    
    const despachoNormalizado = this.normalizeDespacho(
      despachoOriginal,
      ciudad,
    );
    
    const fechaUltimaActuacionTexto = cambio.fechaUltimaActuacion || '';
    const fechaExtraida = this.extractFechaFromUltimaAnotacion(
      fechaUltimaActuacionTexto,
    );

    const isRappiClient = (cambio.demandados || '')
      .toLowerCase()
      .includes('rappi');
    const departmentValue = this.inferirDepartamento(ciudad);

    return {
      radicado,
      despachoJudicial: despachoNormalizado,
      city: ciudad,
      department: departmentValue,
      location: '', 
      idProcesoMonolegal: '', 
      idProcesoPublicaciones: '', 
      etapaProcesal: '',
      ultimaActuacion: cambio.ultimaActuacion?.trim() || '',
      ultimaAnotacion: cambio.ultimaAnotacion?.trim() || '',
      fechaUltimaActuacion: fechaExtraida || fechaUltimaActuacionTexto,
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
      internalCode: '',
      processType: isRappiClient ? 'Ordinario' : '',
      jurisdiction: isRappiClient ? 'Laboral circuito' : '',
      ...(cambio.etiqueta &&
        cambio.etiqueta.trim() !== '' && {
          etiqueta: cambio.etiqueta.replace(/\s+/g, ''),
        }),
    };
  }

  private extractCityFromDespacho(despacho: string): string {
    if (!despacho || despacho.trim() === '') return '';

    const despachoNorm = despacho.trim().toUpperCase();

    const pattern1 = /\s+DE\s+([A-ZÁÉÍÓÚÑ\s\.]+)(?:\s*\*)?$/i;
    const match1 = despachoNorm.match(pattern1);
    if (match1 && match1[1]) {
      return this.capitalizeCityName(match1[1].trim().replace(/\*$/, ''));
    }

    const pattern2 = /\s+EN\s+([A-ZÁÉÍÓÚÑ\s\.]+)(?:\s*\*)?$/i;
    const match2 = despachoNorm.match(pattern2);
    if (match2 && match2[1]) {
      return this.capitalizeCityName(match2[1].trim().replace(/\*$/, ''));
    }

    const lastDe = despachoNorm.lastIndexOf(' DE ');
    if (lastDe !== -1) {
      const afterDe = despachoNorm
        .substring(lastDe + 4)
        .trim()
        .replace(/\*$/, '');
      if (afterDe.length > 0 && afterDe.length < 50) {
        return this.capitalizeCityName(afterDe);
      }
    }

    return '';
  }

  private capitalizeCityName(ciudad: string): string {
    const specialCases: { [key: string]: string } = {
      'BOGOTA D.C.': 'Bogotá D.C.',
      'BOGOTA DC': 'Bogotá D.C.',
      'SANTA MARTA': 'Santa Marta',
      'SANTA FE DE BOGOTA': 'Santa Fe de Bogotá',
    };

    const upperCiudad = ciudad.toUpperCase().trim();
    if (specialCases[upperCiudad]) {
      return specialCases[upperCiudad];
    }

    return ciudad
      .toLowerCase()
      .split(' ')
      .map((word, index) => {
        if (word.length === 0) return word;

        if (word === 'd.c.' || word === 'dc') return 'D.C.';

        if (
          index > 0 &&
          ['de', 'del', 'la', 'las', 'los', 'el'].includes(word)
        ) {
          return word;
        }

        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ');
  }

  private normalizeDespacho(despacho: string, city: string): string {
    return this.juzgadoNormalizer.normalizeJuzgado(despacho, city);
  }

  private extractFechaFromUltimaAnotacion(
    fechaUltimaActuacion: string,
  ): string | null {
    if (!fechaUltimaActuacion || typeof fechaUltimaActuacion !== 'string') {
      return null;
    }

    const regex = /(\d{1,2})\/(\d{1,2})\/(\d{4})/;
    const match = fechaUltimaActuacion.match(regex);

    if (match) {
      const part1 = parseInt(match[1], 10);
      const part2 = parseInt(match[2], 10);
      const year = match[3];

      let day: number;
      let month: number;

      // Si part2 > 12, es imposible que sea mes, entonces es DD Significa que el formato es MM/DD/YYYY
      if (part2 > 12 && part1 <= 12) {
        day = part2;
        month = part1;
      } else {
        // Formato DD/MM/YYYY (estándar colombiano)
        day = part1;
        month = part2;
      }

      return `${String(day).padStart(2, '0')}/${String(month).padStart(
        2,
        '0',
      )}/${year}`;
    }

    return null;
  }

  private async prepareRecordData(cambio: any): Promise<MonolegalRecordData> {
    const radicado = cambio.numero?.trim();

    let ciudad = '';
    let ubicacion = '';
    let idProcesoMonolegal = '';
    let idProcesoPublicaciones = '';

    try {
      if (cambio.id) {
        const expedienteDetalle = await this.monolegalApiService.getExpediente(
          cambio.id,
        );

        // Extraer idProceso de ambas fuentes desde procesosEnFuentesDatos
        if (expedienteDetalle.procesosEnFuentesDatos?.length > 0) {
          for (const fuente of expedienteDetalle.procesosEnFuentesDatos) {
            if (!fuente.activo || !fuente.idProceso) continue;

            const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

            if (tipoFuente === 'unificada') {
              idProcesoMonolegal = fuente.idProceso;
            } else if (tipoFuente === 'publicacionesprocesales') {
              idProcesoPublicaciones = fuente.idProceso;
            }
          }
        }

        // Fallback al método anterior si no encontramos Unificada
        if (!idProcesoMonolegal && cambio.ultimosCambiosEnFuentes?.length > 0) {
          const fuenteUnificada = cambio.ultimosCambiosEnFuentes.find(
            (f: any) => f.fuente?.toLowerCase() === 'unificada' && f.idProceso,
          );

          if (fuenteUnificada) {
            idProcesoMonolegal = fuenteUnificada.idProceso;
          }
        }
        ciudad = expedienteDetalle.ciudad || '';
        ubicacion = expedienteDetalle.ubicacion || '';

        if (!ciudad || ciudad.trim() === '') {
          const despacho = cambio.despacho || '';
          const ciudadExtraida = this.extractCityFromDespacho(despacho);

          if (ciudadExtraida) {
            ciudad = ciudadExtraida;
          }
        }

        if (
          !ubicacion &&
          expedienteDetalle.procesosEnFuentesDatos?.length > 0
        ) {
          const fuenteActiva = expedienteDetalle.procesosEnFuentesDatos.find(
            (f: any) => f.activo === true || f.estado === 2,
          );
          if (fuenteActiva) {
            ubicacion = fuenteActiva.tipoFuente || '';
          }
        }
      } else {
        this.logger.warn(
          `El cambio para ${radicado} no tiene ID, no se puede obtener detalles del expediente`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error al obtener detalles del expediente para ${radicado}: ${
          (error as any).message
        }`,
      );
    }

    const despachoOriginal = cambio.despacho?.trim() || '';
    const despachoNormalizado = this.normalizeDespacho(
      despachoOriginal,
      ciudad,
    );

    const fechaUltimaActuacionTexto = cambio.fechaUltimaActuacion || '';
    let fechaExtraida = this.extractFechaFromUltimaAnotacion(
      fechaUltimaActuacionTexto,
    );

    if (!fechaExtraida && cambio.ultimoRegistro) {
      const ultimoRegistro = cambio.ultimoRegistro;

      if (typeof ultimoRegistro === 'string' && ultimoRegistro.includes('T')) {
        const date = new Date(ultimoRegistro);
        if (!isNaN(date.getTime())) {
          const day = String(date.getUTCDate()).padStart(2, '0');
          const month = String(date.getUTCMonth() + 1).padStart(2, '0');
          const year = date.getUTCFullYear();
          fechaExtraida = `${day}/${month}/${year}`;
        }
      }

      // Si es formato DD/MM/YYYY o MM/DD/YYYY
      else if (
        typeof ultimoRegistro === 'string' &&
        /\d{1,2}\/\d{1,2}\/\d{4}/.test(ultimoRegistro)
      ) {
        const match = ultimoRegistro.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (match) {
          const part1 = parseInt(match[1], 10);
          const part2 = parseInt(match[2], 10);
          const year = match[3];

          let day: number;
          let month: number;

          if (part2 > 12 && part1 <= 12) {
            // Formato MM/DD/YYYY detectado
            day = part2;
            month = part1;
          } else {
            // Formato DD/MM/YYYY
            day = part1;
            month = part2;
          }

          fechaExtraida = `${String(day).padStart(2, '0')}/${String(
            month,
          ).padStart(2, '0')}/${year}`;
        }
      }

      // Si es formato "16 Dec 2025" o "16 Dec 2025"
      else if (typeof ultimoRegistro === 'string') {
        const meses: { [key: string]: string } = {
          jan: '01',
          feb: '02',
          mar: '03',
          apr: '04',
          may: '05',
          jun: '06',
          jul: '07',
          aug: '08',
          sep: '09',
          oct: '10',
          nov: '11',
          dec: '12',
        };

        const match = ultimoRegistro.match(
          /(\d{1,2})\s+([a-zA-Z]{3})\s+(\d{4})/,
        );
        if (match) {
          const day = match[1].padStart(2, '0');
          const monthStr = match[2].toLowerCase();
          const year = match[3];
          const month = meses[monthStr];

          if (month) {
            fechaExtraida = `${day}/${month}/${year}`;
          }
        }
      }
    }

    const isRappiClient = (cambio.demandados || '')
      .toLowerCase()
      .includes('rappi');

    // Inferir departamento desde la ciudad
    const inferirDepartamento = (city: string): string => {
      const cityToDepartment: { [key: string]: string } = {
        Medellín: 'Antioquia',
        Medellin: 'Antioquia',
        Bogotá: 'Bogotá D.C.',
        Bogota: 'Bogotá D.C.',
        'Bogotá D.C.': 'Bogotá D.C.',
        Cali: 'Valle del Cauca',
        Barranquilla: 'Atlántico',
        Cartagena: 'Bolívar',
        Bucaramanga: 'Santander',
        Cúcuta: 'Norte de Santander',
        Cucuta: 'Norte de Santander',
        Pereira: 'Risaralda',
        Manizales: 'Caldas',
        'Santa Marta': 'Magdalena',
        Ibagué: 'Tolima',
        Ibague: 'Tolima',
        Villavicencio: 'Meta',
        Pasto: 'Nariño',
        Montería: 'Córdoba',
        Monteria: 'Córdoba',
        Neiva: 'Huila',
        Armenia: 'Quindío',
        Popayán: 'Cauca',
        Popayan: 'Cauca',
        Sincelejo: 'Sucre',
        Valledupar: 'Cesar',
        Tunja: 'Boyacá',
        Riohacha: 'La Guajira',
        Quibdó: 'Chocó',
        Florencia: 'Caquetá',
        Yopal: 'Casanare',
        Mocoa: 'Putumayo',
      };

      // Buscar coincidencia exacta o parcial
      for (const [cityName, dept] of Object.entries(cityToDepartment)) {
        if (city.toLowerCase().includes(cityName.toLowerCase())) {
          return dept;
        }
      }
      return '';
    };

    const departmentValue = inferirDepartamento(ciudad);

    const recordData = {
      radicado: radicado,
      despachoJudicial: despachoNormalizado,
      city: ciudad,
      department: departmentValue,
      location: ubicacion,
      idProcesoMonolegal: idProcesoMonolegal,
      idProcesoPublicaciones: idProcesoPublicaciones,
      etapaProcesal: '',
      ultimaActuacion: cambio.ultimaActuacion?.trim() || '',
      ultimaAnotacion: cambio.ultimaAnotacion?.trim() || '',
      fechaUltimaActuacion: fechaExtraida || fechaUltimaActuacionTexto,
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
      internalCode: '',
      processType: isRappiClient ? 'Ordinario' : '',
      jurisdiction: isRappiClient ? 'Laboral circuito' : '',
      ...(cambio.etiqueta &&
        cambio.etiqueta.trim() !== '' && {
          etiqueta: cambio.etiqueta.replace(/\s+/g, ''),
        }),
    };
    return recordData;
  }

  private async buildInternalCode(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.recordModel.countDocuments({
      internalCode: { $regex: `^ML-${year}-` },
    });
    return `ML-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async processApiChange(
    cambio: any,
    userId: string,
  ): Promise<ProcessResult> {
    const radicado = cambio.numero?.trim();

    if (!radicado) {
      return {
        radicado: 'Sin radicado',
        status: 'skipped',
        message: 'No tiene número de proceso',
      };
    }

    const recordData = await this.prepareRecordData(cambio);
    const record = await this.recordModel.findOne({ radicado: radicado });

    let internalCode = record?.internalCode;

    if (!internalCode) {
      internalCode = await this.buildInternalCode();
    }

    recordData.internalCode = internalCode;

    if (record) {
      Object.assign(record, recordData);
      record.clientType = normalizeClientType(
        record.clientType || cambio.demandados,
      );
      await record.save();

      await this.updateOrCreateProceduralParts(record._id, {
        demandantes: cambio.demandantes || '',
        demandados: cambio.demandados || '',
      });

      if (cambio.ultimaActuacion) {
        await this.createOrUpdatePerformance(record._id, {
          ultimaActuacion: cambio.ultimaActuacion,
          etapaProcesal: '',
          ultimaAnotacion: cambio.ultimaAnotacion,
        });
      }

      await this.createAudience(
        cambio.ultimaActuacion,
        cambio.ultimaAnotacion,
        record._id,
      );

      return {
        radicado,
        status: 'updated',
        message: 'Registro actualizado desde API',
        details: {
          despachoJudicial: recordData.despachoJudicial,
          city: recordData.city,
          ultimaActuacion: recordData.ultimaActuacion,
          fechaUltimaActuacion: recordData.fechaUltimaActuacion,
        },
      };
    } else {
      const newRecord = new this.recordModel({
        user: userId,
        ...recordData,
        clientType: normalizeClientType(cambio.demandados),
        country: 'Colombia',
      });

      await newRecord.save();

      await this.createProceduralParts(newRecord._id, {
        demandantes: cambio.demandantes || '',
        demandados: cambio.demandados || '',
      });

      if (cambio.ultimaActuacion) {
        await this.createOrUpdatePerformance(newRecord._id, {
          ultimaActuacion: cambio.ultimaActuacion,
          etapaProcesal: '',
          ultimaAnotacion: cambio.ultimaAnotacion,
        });
      }

      await this.createAudience(
        cambio.ultimaActuacion,
        cambio.ultimaAnotacion,
        newRecord._id,
      );

      return {
        radicado,
        status: 'created',
        message: '',
      };
    }
  }

  private async getApiChange(cambio: any): Promise<ProcessResult> {
    const radicado = cambio.numero?.trim();

    if (!radicado) {
      return {
        radicado: 'Sin radicado',
        status: 'skipped',
        message: 'No tiene número de proceso',
      };
    }

    const recordData = await this.prepareRecordData(cambio);
    const record = await this.recordModel.findOne({ radicado: radicado });

    let internalCode = record?.internalCode;

    if (!internalCode) {
      internalCode = await this.buildInternalCode();
    }

    if (record) {
      Object.assign(record, recordData);
      return {
        radicado,
        status: 'updated',
        message: 'Registro actualizado desde API',
        details: {
          despachoJudicial: recordData.despachoJudicial,
          city: recordData.city,
          ultimaActuacion: recordData.ultimaActuacion,
          ultimaAnotacion: recordData.ultimaAnotacion,
        },
      };
    } else {
      return {
        radicado,
        status: 'created',
        message: '',
      };
    }
  }

  async renormalizeAllJuzgados(): Promise<any> {
    try {
      const records = await this.recordModel
        .find({
          sincronizadoMonolegal: true,
        })
        .exec();

      if (records.length === 0) {
        return {
          success: true,
          message: 'No hay registros para normalizar',
          summary: {
            total: 0,
            updated: 0,
            unchanged: 0,
            errors: 0,
          },
        };
      }

      let updated = 0;
      let unchanged = 0;
      let errors = 0;

      for (const record of records) {
        try {
          if (
            !record.despachoJudicial ||
            record.despachoJudicial.trim() === ''
          ) {
            this.logger.warn(`${record.radicado}: Sin despacho judicial`);
            unchanged++;
            continue;
          }

          const despachoOriginal = record.despachoJudicial;
          const ciudad = record.city || '';

          const despachoNormalizado = this.normalizeDespacho(
            despachoOriginal,
            ciudad,
          );

          if (despachoNormalizado !== despachoOriginal) {
            record.despachoJudicial = despachoNormalizado;
            await record.save();
            updated++;
          } else {
            unchanged++;
          }
        } catch (error) {
          errors++;
          this.logger.error(
            `Error en ${record.radicado}: ${(error as any).message}`,
          );
        }
      }

      return {
        success: true,
        message: 'Re-normalización completada',
        summary: {
          total: records.length,
          updated,
          unchanged,
          errors,
        },
      };
    } catch (error) {
      this.logger.error(`Error en re-normalización: ${(error as any).message}`);
      throw new BadRequestException(
        `Error al re-normalizar juzgados: ${(error as any).message}`,
      );
    }
  }

  /**
   * Sincroniza TODOS los expedientes desde una fecha inicial hasta hoy
   * Itera por cada día y cada página
   */
  async syncAllFromApi(
    userId: string,
    fechaInicio?: string,
  ): Promise<SyncResponse> {
    const startDate = fechaInicio
      ? new Date(fechaInicio)
      : new Date('2024-01-01');
    const endDate = new Date();

    const results: ProcessResult[] = [];
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalSkipped = 0;
    let totalErrors = 0;
    let diasProcesados = 0;
    let expedientesProcesados = 0;

    // Iterar por cada día
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const fechaFormateada =
        this.monolegalApiService.formatearFechaMonolegal(currentDate);

      try {
        // Primero verificar si hay cambios en ese día
        const resumen = await this.monolegalApiService.getResumenCambios(
          fechaFormateada,
        );

        if (resumen.tieneCambios) {
          // Obtener todos los cambios de ese día (todas las páginas)
          const cambios = await this.monolegalApiService.getTodosCambios(
            fechaFormateada,
          );

          for (const cambio of cambios) {
            try {
              const result = await this.processApiChange(cambio, userId);
              results.push(result);
              expedientesProcesados++;

              if (result.status === 'created') totalCreated++;
              else if (result.status === 'updated') totalUpdated++;
              else if (result.status === 'skipped') totalSkipped++;
              else if (result.status === 'error') totalErrors++;
            } catch (error) {
              totalErrors++;
              results.push({
                radicado: cambio.numero || 'Desconocido',
                status: 'error',
                message: (error as any).message,
              });
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `[SYNC ALL] Error en fecha ${fechaFormateada}: ${
            (error as any).message
          }`,
        );
      }

      diasProcesados++;

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);

      // Pausa para no sobrecargar la API (100ms entre días)
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    return {
      success: true,
      message: `Sincronización completa: ${diasProcesados} días procesados`,
      summary: {
        total: expedientesProcesados,
        created: totalCreated,
        updated: totalUpdated,
        skipped: totalSkipped,
        errors: totalErrors,
      },
      details: results.slice(0, 100),
      updatedRecords: [],
    };
  }

  async getActuacionesProceso(idProceso: string): Promise<any[]> {
    return this.monolegalApiService.getActuacionesPorIdProceso(idProceso);
  }

  private contieneAudienciaOConciliacion(
    texto1: string,
    texto2: string,
  ): boolean {
    const normalizarTexto = (texto: string): string => {
      return (texto || '')
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
    };

    const textoNormalizado1 = normalizarTexto(texto1);
    const textoNormalizado2 = normalizarTexto(texto2);

    const palabrasClave = ['audiencia'];

    return palabrasClave.some(
      (palabra) =>
        textoNormalizado1.includes(palabra) ||
        textoNormalizado2.includes(palabra),
    );
  }

  private async createAudience(actuacion, anotacion, idRecord) {
    const isAudienceActuacion = this.contieneAudienciaOConciliacion(
      actuacion || '',
      anotacion || '',
    );
    if (isAudienceActuacion) {
      const audience = this.orchestratorService.createAudienceFromMonolegal(
        idRecord,
        anotacion,
      );
      return audience;
    }

    return {};
  }

  async getActuacionesPorRadicado(radicado: string): Promise<any[]> {
    // 1. Primero buscar en la BD local
    const record = await this.recordModel.findOne({ radicado: radicado });

    // 2. Si tiene idExpedienteMonolegal, usar ese
    if (record?.idExpedienteMonolegal) {
      try {
        this.logger.log(
          `[ACTUACIONES] Usando idExpedienteMonolegal: ${record.idExpedienteMonolegal}`,
        );
        const resultado =
          await this.monolegalApiService.getActuacionesTodasLasFuentes(
            record.idExpedienteMonolegal,
          );
        return resultado.combinadas || [];
      } catch (error: any) {
        this.logger.error(`Error con idExpedienteMonolegal: ${error.message}`);
      }
    }

    // 3. Si no tiene, buscar el expediente por radicado en la API
    const expediente =
      await this.monolegalApiService.buscarExpedientePorRadicado(radicado);

    if (expediente?.id) {
      this.logger.log(`[ACTUACIONES] Expediente encontrado: ${expediente.id}`);

      // ACTUALIZAR TODA LA INFO DEL RECORD

      if (record) {
        await this.actualizarRecordConExpediente(record, expediente);
      }

      try {
        const resultado =
          await this.monolegalApiService.getActuacionesTodasLasFuentes(
            expediente.id,
          );
        return resultado.combinadas || [];
      } catch (error: any) {
        this.logger.error(`Error obteniendo actuaciones: ${error.message}`);
      }
    }

    // 4. Fallback: intentar con el método antiguo
    this.logger.warn(
      `[ACTUACIONES] Fallback a método antiguo para ${radicado}`,
    );
    return this.monolegalApiService.getActuacionesPorRadicado(radicado);
  }

  /**
   * Actualiza el record local con TODA la info del expediente de Monolegal
   * (Igual que sincronizarIdsFuentes)
   */
  private async actualizarRecordConExpediente(
    record: any,
    expediente: any,
  ): Promise<void> {
    try {
      this.logger.log(
        `[SYNC] Actualizando record ${record.radicado} con expediente ${expediente.id}`,
      );

      // Extraer IDs de las fuentes
      let idProcesoMonolegal = '';
      let idProcesoPublicaciones = '';

      if (expediente.procesosEnFuentesDatos?.length > 0) {
        for (const fuente of expediente.procesosEnFuentesDatos) {
          if (!fuente.activo || !fuente.idProceso) continue;

          const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

          if (tipoFuente === 'unificada') {
            idProcesoMonolegal = fuente.idProceso;
          } else if (tipoFuente === 'publicacionesprocesales') {
            idProcesoPublicaciones = fuente.idProceso;
          }
        }
      }

      // Extraer ciudad
      let ciudad = expediente.ciudad || '';
      if (!ciudad || ciudad.trim() === '') {
        ciudad = this.extractCityFromDespacho(expediente.despacho || '');
      }

      // Inferir departamento
      const department = this.inferirDepartamento(ciudad);

      // Normalizar despacho - SOLO si está en la lista de válidos
      let despachoFinal = expediente.despacho || '';
      if (expediente.despacho && expediente.despacho.trim() !== '') {
        const despachoNormalizado = this.juzgadoNormalizer.normalizeJuzgado(
          expediente.despacho,
          ciudad,
        );

        // SOLO usar el normalizado si el normalizador lo cambió Y está en la lista válida, Si el normalizador devuelve algo inventado, usar el original
        if (
          despachoNormalizado &&
          despachoNormalizado !== expediente.despacho
        ) {
          // Verificar si realmente es un juzgado válido conocido
          const esJuzgadoValido =
            despachoNormalizado.startsWith('Juzgado') &&
            (despachoNormalizado.includes('Laboral del Circuito') ||
              despachoNormalizado.includes('Civil del Circuito') ||
              despachoNormalizado.includes('Civil Municipal') ||
              despachoNormalizado.includes('de Familia') ||
              despachoNormalizado.includes('Administrativo') ||
              despachoNormalizado.includes('Pequeñas Causas'));

          // Solo usar si el tipo en el normalizado coincide con el tipo en el original
          const tipoOriginal = expediente.despacho.toUpperCase();
          const tipoNormalizado = despachoNormalizado.toUpperCase();

          const coincideTipo =
            (tipoOriginal.includes('LABORAL') &&
              tipoNormalizado.includes('LABORAL')) ||
            (tipoOriginal.includes('CIVIL') &&
              tipoNormalizado.includes('CIVIL')) ||
            (tipoOriginal.includes('PENAL') &&
              tipoNormalizado.includes('PENAL')) ||
            (tipoOriginal.includes('FAMILIA') &&
              tipoNormalizado.includes('FAMILIA')) ||
            (tipoOriginal.includes('ADMINISTRATIV') &&
              tipoNormalizado.includes('ADMINISTRATIV'));

          if (esJuzgadoValido && coincideTipo) {
            despachoFinal = despachoNormalizado;
          } else {
            // No coincide el tipo, guardar original
            despachoFinal = expediente.despacho;
            this.logger.warn(
              `[SYNC] Despacho no normalizado (tipo no coincide): ${expediente.despacho}`,
            );
          }
        } else {
          despachoFinal = expediente.despacho;
        }
      }

      // Extraer ubicación
      let ubicacion = expediente.ubicacion || '';
      if (!ubicacion && expediente.procesosEnFuentesDatos?.length > 0) {
        const fuenteActiva = expediente.procesosEnFuentesDatos.find(
          (f: any) => f.activo === true || f.estado === 2,
        );
        if (fuenteActiva) {
          ubicacion = fuenteActiva.tipoFuente || '';
        }
      }

      // Obtener última actuación de las fuentes
      const ultimaActuacionData =
        this.obtenerUltimaActuacionDeExpediente(expediente);
      const ultimaAnotacionData =
        this.obtenerUltimaAnotacionDeExpediente(expediente);
      const fechaUltimaActuacionData =
        this.obtenerFechaUltimaActuacionDeExpediente(expediente);

      // Detectar si es cliente Rappi
      const isRappiClient = (expediente.demandados || '')
        .toLowerCase()
        .includes('rappi');

      // Preparar datos para actualizar
      const updateData: any = {
        idExpedienteMonolegal: expediente.id,
        idProcesoMonolegal:
          idProcesoMonolegal || record.idProcesoMonolegal || '',
        idProcesoPublicaciones:
          idProcesoPublicaciones || record.idProcesoPublicaciones || '',
        sincronizadoMonolegal: true,
        fechaSincronizacion: new Date(),
        pendienteSincronizacionMonolegal: false,
        errorSincronizacionMonolegal: null,
      };

      // Actualizar ciudad si hay dato y no existe
      if (ciudad && ciudad.trim() !== '') {
        updateData.city = ciudad;
      }

      // Actualizar departamento si hay dato
      if (department && department.trim() !== '') {
        updateData.department = department;
      }

      // Actualizar despacho si hay dato
      if (despachoFinal && despachoFinal.trim() !== '') {
        updateData.despachoJudicial = despachoFinal;
      }

      // Actualizar ubicación si hay dato
      if (ubicacion && ubicacion.trim() !== '') {
        updateData.location = ubicacion;
      }

      // Actualizar última actuación
      if (ultimaActuacionData && ultimaActuacionData.trim() !== '') {
        updateData.ultimaActuacion = ultimaActuacionData;
      }

      // Actualizar última anotación
      if (ultimaAnotacionData && ultimaAnotacionData.trim() !== '') {
        updateData.ultimaAnotacion = ultimaAnotacionData;
      }

      // Actualizar fecha última actuación
      if (fechaUltimaActuacionData && fechaUltimaActuacionData.trim() !== '') {
        updateData.fechaUltimaActuacion = fechaUltimaActuacionData;
      }

      // Actualizar etiqueta si viene de Monolegal y no está vacía
      if (expediente.etiqueta && expediente.etiqueta.trim() !== '') {
        updateData.etiqueta = expediente.etiqueta.replace(/\s+/g, '');
      }

      // Si es Rappi y no tiene processType/jurisdiction, asignarlos
      if (isRappiClient) {
        if (!record.processType || record.processType === '') {
          updateData.processType = 'Ordinario';
        }
        if (!record.jurisdiction || record.jurisdiction === '') {
          updateData.jurisdiction = 'Laboral circuito';
        }
        if (!record.clientType || record.clientType === '') {
          updateData.clientType = 'Rappi';
        }
      }

      // Actualizar el record
      await this.recordModel.findByIdAndUpdate(record._id, updateData);
      this.logger.log(
        `[SYNC] Record actualizado - ciudad: ${ciudad}, dept: ${department}, despacho: ${despachoFinal}`,
      );

      // CREAR/ACTUALIZAR PARTES PROCESALES

      if (expediente.demandantes || expediente.demandados) {
        await this.updateOrCreateProceduralParts(record._id, {
          demandantes: expediente.demandantes || '',
          demandados: expediente.demandados || '',
        });
        this.logger.log(`[SYNC] Partes procesales creadas/actualizadas`);
      }

      // CREAR PERFORMANCE

      if (ultimaActuacionData) {
        await this.createOrUpdatePerformance(record._id, {
          ultimaActuacion: ultimaActuacionData,
          etapaProcesal: '',
          ultimaAnotacion: ultimaAnotacionData || '',
        });
        this.logger.log(`[SYNC] Performance creado/actualizado`);
      }

      // CREAR AUDIENCIA SI APLICA

      await this.createAudience(
        ultimaActuacionData,
        ultimaAnotacionData,
        record._id,
      );
    } catch (error: any) {
      this.logger.error(`[SYNC] Error actualizando record: ${error.message}`);
    }
  }

  /**
   * Infiere el departamento desde la ciudad
   */
  private inferirDepartamento(city: string): string {
    const cityToDepartment: { [key: string]: string } = {
      Medellín: 'Antioquia',
      Medellin: 'Antioquia',
      Bogotá: 'Bogotá D.C.',
      Bogota: 'Bogotá D.C.',
      'Bogotá D.C.': 'Bogotá D.C.',
      Cali: 'Valle del Cauca',
      Barranquilla: 'Atlántico',
      Cartagena: 'Bolívar',
      Bucaramanga: 'Santander',
      Cúcuta: 'Norte de Santander',
      Cucuta: 'Norte de Santander',
      Pereira: 'Risaralda',
      Manizales: 'Caldas',
      'Santa Marta': 'Magdalena',
      Ibagué: 'Tolima',
      Ibague: 'Tolima',
      Villavicencio: 'Meta',
      Pasto: 'Nariño',
      Montería: 'Córdoba',
      Monteria: 'Córdoba',
      Neiva: 'Huila',
      Armenia: 'Quindío',
      Popayán: 'Cauca',
      Popayan: 'Cauca',
      Sincelejo: 'Sucre',
      Valledupar: 'Cesar',
      Tunja: 'Boyacá',
      Riohacha: 'La Guajira',
      Quibdó: 'Chocó',
      Florencia: 'Caquetá',
      Yopal: 'Casanare',
      Mocoa: 'Putumayo',
    };

    for (const [cityName, dept] of Object.entries(cityToDepartment)) {
      if (city.toLowerCase().includes(cityName.toLowerCase())) {
        return dept;
      }
    }
    return '';
  }

  /**
   * Sincroniza los idProceso de todas las fuentes para todos los expedientes
   */

  async sincronizarIdsFuentes(userId: string): Promise<any> {
    this.logger.log(
      '[SYNC IDS] Obteniendo todos los expedientes de Monolegal...',
    );

    // 1. Obtener TODOS los expedientes de la API
    const expedientes = await this.monolegalApiService.getTodosExpedientes();

    if (expedientes.length === 0) {
      return {
        success: true,
        message: 'No hay expedientes en Monolegal',
        summary: { total: 0, updated: 0, created: 0, errors: 0 },
      };
    }

    let updated = 0;
    let created = 0;
    const notFound = 0;
    let errors = 0;

    this.logger.log(`[SYNC IDS] Procesando ${expedientes.length} expedientes`);

    for (const expediente of expedientes) {
      try {
        const radicado = expediente.numero?.trim();
        if (!radicado) continue;

        // Buscar el record local por radicado
        const record = await this.recordModel.findOne({ radicado });

        // Extraer IDs de las fuentes
        let idProcesoMonolegal = '';
        let idProcesoPublicaciones = '';

        if (expediente.procesosEnFuentesDatos?.length > 0) {
          for (const fuente of expediente.procesosEnFuentesDatos) {
            if (!fuente.activo || !fuente.idProceso) continue;

            const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

            if (tipoFuente === 'unificada') {
              idProcesoMonolegal = fuente.idProceso;
            } else if (tipoFuente === 'publicacionesprocesales') {
              idProcesoPublicaciones = fuente.idProceso;
            }
          }
        }

        const cambioSimulado = {
          id: expediente.id,
          numero: expediente.numero,
          demandantes: expediente.demandantes,
          demandados: expediente.demandados,
          despacho: expediente.despacho,
          ultimaActuacion: this.obtenerUltimaActuacionDeExpediente(expediente),
          ultimaAnotacion: this.obtenerUltimaAnotacionDeExpediente(expediente),
          fechaUltimaActuacion:
            this.obtenerFechaUltimaActuacionDeExpediente(expediente),
          ultimoRegistro: expediente.fechaUltimoCambioEnFuente,
          etiqueta: expediente.etiqueta,
        };

        const recordData = await this.prepareRecordData(cambioSimulado);

        recordData.idExpedienteMonolegal = expediente.id;
        recordData.idProcesoMonolegal =
          idProcesoMonolegal || recordData.idProcesoMonolegal || '';
        recordData.idProcesoPublicaciones = idProcesoPublicaciones;

        if (record) {
          Object.assign(record, recordData);

          record.clientType = normalizeClientType(
            record.clientType || cambioSimulado.demandados,
          );

          await record.save();

          await this.updateOrCreateProceduralParts(record._id, {
            demandantes: cambioSimulado.demandantes || '',
            demandados: cambioSimulado.demandados || '',
          });

          if (cambioSimulado.ultimaActuacion) {
            await this.createOrUpdatePerformance(record._id, {
              ultimaActuacion: cambioSimulado.ultimaActuacion,
              etapaProcesal: '',
              ultimaAnotacion: cambioSimulado.ultimaAnotacion,
            });
          }

          await this.createAudience(
            cambioSimulado.ultimaActuacion,
            cambioSimulado.ultimaAnotacion,
            record._id,
          );

          updated++;
        } else {
          const internalCode = await this.buildInternalCode();
          recordData.internalCode = internalCode;

          const newRecord = new this.recordModel({
            user: userId,
            ...recordData,
            clientType: normalizeClientType(cambioSimulado.demandados),
            country: 'Colombia',
          });

          await newRecord.save();

          // Crear partes procesales
          await this.createProceduralParts(newRecord._id, {
            demandantes: cambioSimulado.demandantes || '',
            demandados: cambioSimulado.demandados || '',
          });

          // Crear performance
          if (cambioSimulado.ultimaActuacion) {
            await this.createOrUpdatePerformance(newRecord._id, {
              ultimaActuacion: cambioSimulado.ultimaActuacion,
              etapaProcesal: '',
              ultimaAnotacion: cambioSimulado.ultimaAnotacion,
            });
          }

          await this.createAudience(
            cambioSimulado.ultimaActuacion,
            cambioSimulado.ultimaAnotacion,
            newRecord._id,
          );

          created++;
        }

        if ((updated + created) % 50 === 0) {
          this.logger.log(
            `[SYNC IDS] Progreso: ${updated} actualizados, ${created} creados`,
          );
        }
      } catch (error) {
        errors++;
        this.logger.error(`[SYNC IDS] Error: ${(error as any).message}`);
      }
    }

    this.logger.log(
      `[SYNC IDS] Finalizado: ${updated} actualizados, ${created} creados, ${notFound} no encontrados, ${errors} errores`,
    );

    return {
      success: true,
      message: 'Sincronización de IDs y datos completada',
      summary: {
        totalExpedientes: expedientes.length,
        updated,
        created,
        notFound,
        errors,
      },
    };
  }

  /**
   * Métodos auxiliares para extraer datos del expediente
   */
  private obtenerUltimaActuacionDeExpediente(expediente: any): string {
    if (!expediente.procesosEnFuentesDatos?.length) return '';

    const fuenteActiva = expediente.procesosEnFuentesDatos.find(
      (f: any) => f.activo === true,
    );

    return fuenteActiva?.ultimaActuacion || '';
  }

  private obtenerUltimaAnotacionDeExpediente(expediente: any): string {
    if (!expediente.procesosEnFuentesDatos?.length) return '';

    const fuenteActiva = expediente.procesosEnFuentesDatos.find(
      (f: any) => f.activo === true,
    );

    return fuenteActiva?.descripcionUltimaActuacion || '';
  }

  /**
   * Obtiene la fecha de última actuación más reciente de Unificada o PublicacionesProcesales
   */
  private obtenerFechaUltimaActuacionDeExpediente(expediente: any): string {
    if (!expediente.procesosEnFuentesDatos?.length) return '';

    let fechaMasReciente: Date | null = null;
    let fechaString = '';

    for (const fuente of expediente.procesosEnFuentesDatos) {
      const tipoFuente = (fuente.tipoFuente || '').toLowerCase();

      // Solo considerar Unificada y PublicacionesProcesales
      if (
        tipoFuente !== 'unificada' &&
        tipoFuente !== 'publicacionesprocesales'
      ) {
        continue;
      }

      if (
        fuente.fechaUltimaActuacion &&
        fuente.fechaUltimaActuacion.trim() !== ''
      ) {
        const fechaParsed = this.parsearFechaEnServicio(
          fuente.fechaUltimaActuacion,
        );

        if (
          fechaParsed &&
          (!fechaMasReciente ||
            fechaParsed.getTime() > fechaMasReciente.getTime())
        ) {
          fechaMasReciente = fechaParsed;
          fechaString = fuente.fechaUltimaActuacion;
        }
      }
    }

    return fechaString;
  }

  /**
   * Parsea fecha en el servicio (copia simplificada del método en MonolegalApiService)
   */
  private parsearFechaEnServicio(fecha: any): Date | null {
    if (!fecha) return null;

    if (fecha instanceof Date) {
      return isNaN(fecha.getTime()) ? null : fecha;
    }

    if (typeof fecha === 'string') {
      // Formato ISO: "2025-10-10T00:00:00"
      if (fecha.includes('T')) {
        const parsed = new Date(fecha);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      // Formato "MM/DD/YYYY HH:MM:SS AM/PM"
      const usFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/;
      const usMatch = fecha.match(usFormat);
      if (usMatch) {
        const [, month, day, year] = usMatch;
        return new Date(
          parseInt(year),
          parseInt(month) - 1,
          parseInt(day),
          12,
          0,
          0,
        );
      }

      const parsed = new Date(fecha);
      return isNaN(parsed.getTime()) ? null : parsed;
    }

    return null;
  }

  async getActuacionesMonolegal(radicado: string): Promise<any> {
    // Buscar el record para obtener el idExpedienteMonolegal
    const record = await this.recordModel.findOne({ radicado });

    if (!record?.idExpedienteMonolegal) {
      throw new Error('Expediente no encontrado o sin idExpedienteMonolegal');
    }

    // Usar el método que ya tienes
    return this.monolegalApiService.getActuacionesTodasLasFuentes(
      record.idExpedienteMonolegal,
    );
  }

  /**
   * Sincroniza un expediente recién creado en Monolegal
   * Busca el expediente por radicado y trae toda su información
   */
  async sincronizarExpedienteRecienCreado(radicado: string): Promise<{
    success: boolean;
    message: string;
    data?: any;
  }> {
    this.logger.log(`[SYNC NUEVO] Intentando sync rápido para: ${radicado}`);

    try {
      // Solo un intento rápido (3 segundos)
      await new Promise((resolve) => setTimeout(resolve, 3000));

      const expediente =
        await this.monolegalApiService.buscarExpedientePorRadicado(radicado);

      if (!expediente?.id) {
        this.logger.log(
          `[SYNC NUEVO] Expediente no disponible aún. Se actualizará cuando consulten actuaciones.`,
        );
        return {
          success: false,
          message:
            'Expediente se sincronizará cuando se consulten las actuaciones.',
        };
      }

      // Si encontró el expediente, actualizar
      const record = await this.recordModel.findOne({ radicado });
      if (record) {
        await this.actualizarRecordConExpediente(record, expediente);
      }

      return {
        success: true,
        message: 'Expediente sincronizado',
        data: { idExpedienteMonolegal: expediente.id },
      };
    } catch (error: any) {
      this.logger.warn(`[SYNC NUEVO] ${error.message}`);
      return { success: false, message: error.message };
    }
  }
}
