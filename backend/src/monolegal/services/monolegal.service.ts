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
  UltimoCambioFuente,
} from '../dto/import-monolegal.dto';
import { MonolegalApiService } from './monolegal-api.service';
import { JuzgadoNormalizerService } from './juzgado-normalizer.service';
import { normalizeClientType } from '../constants/normalize-client-type';
import { OrchestratorService } from 'src/orchestrator/services/orchestrator.service';
import internal from 'stream';
import { UtilitiesService } from 'src/common/services/utilities.service';

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
    private readonly utilitiesService: UtilitiesService,
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
            message: error.message,
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
        `Error al procesar el archivo: ${error.message}`,
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
        await this.createPerformance(record._id, {
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
        await this.createPerformance(newRecord._id, {
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
      return nombre.toLowerCase().includes('rappi');
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
            documentType: 'Nit',
            document: '900843898-9',
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

  private isValidPerformance(value?: string): boolean {
    if (!value) return false;

    const normalized = value.trim().toLowerCase();

    return (
      normalized !== '' &&
      normalized !== 'sin cambios' &&
      normalized !== 'no activa'
    );
  }

  private async processUltimosCambiosPerformances(
    record_id: any,
    ultimosCambiosEnFuentes: UltimoCambioFuente[],
  ): Promise<void> {
    for (const cambio of ultimosCambiosEnFuentes) {
      const { ultimaActuacion, ultimaAnotacion, fuente, ultimoRegistro } =
        cambio;
      if (
        this.isValidPerformance(ultimaActuacion) ||
        this.isValidPerformance(ultimaAnotacion)
      ) {
        await this.createPerformance(record_id, {
          ultimaActuacion: ultimaActuacion.trim(),
          etapaProcesal: '',
          ultimaAnotacion: ultimaAnotacion.trim(),
          fuente,
          date: ultimoRegistro,
        });
      }
    }
  }

  private async createPerformance(
    recordId: any,
    data: {
      ultimaActuacion: string;
      etapaProcesal: string;
      ultimaAnotacion?: string;
      fuente?: string;
      date?: string;
    },
  ): Promise<void> {
    const actuacion = data.ultimaActuacion?.trim();

    if (!actuacion || actuacion === '---') return;

    const existingPerformance = await this.performanceModel.findOne({
      record: recordId,
      performanceType: actuacion,
    });

    if (!existingPerformance) {
      const validDate = this.utilitiesService.getValidDate(data.date);

      await this.performanceModel.create({
        record: recordId,
        performanceType: actuacion,
        responsible: 'Monolegal',
        fuente: data.fuente || 'Monolegal',
        fecha: validDate,
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
            message: error.message,
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
        `Error al sincronizar con Monolegal: ${error.message}`,
      );
    }
  }

  async syncFromApi(userId: string, fecha?: Date): Promise<SyncResponse> {
    return this.syncFromApiAbstract(true, fecha, userId);
  }

  async syncHistoryFromApi(fecha?: Date): Promise<SyncResponse> {
    return this.syncFromApiAbstract(false, fecha);
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

    const regex = /(\d{1,2}\/\d{1,2}\/\d{4})/;
    const match = fechaUltimaActuacion.match(regex);

    if (match && match[1]) {
      return match[1];
    }

    return null;
  }

  private async prepareRecordData(cambio: any): Promise<MonolegalRecordData> {
    const radicado = cambio.numero?.trim();

    let ciudad = '';
    let ubicacion = '';
    let idProcesoMonolegal = '';

    try {
      if (cambio.id) {
        const expedienteDetalle = await this.monolegalApiService.getExpediente(
          cambio.id,
        );

        if (
          cambio.ultimosCambiosEnFuentes &&
          cambio.ultimosCambiosEnFuentes.length > 0
        ) {
          const fuenteUnificada = cambio.ultimosCambiosEnFuentes.find(
            (f: any) => f.fuente?.toLowerCase() === 'unificada' && f.idProceso,
          );

          if (fuenteUnificada) {
            idProcesoMonolegal = fuenteUnificada.idProceso;
          } else {
            this.logger.warn(
              `No hay fuente Unificada en ultimosCambiosEnFuentes para ${radicado}`,
            );
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
        `Error al obtener detalles del expediente para ${radicado}: ${error.message}`,
      );
    }

    const despachoOriginal = cambio.despacho?.trim() || '';
    const despachoNormalizado = this.normalizeDespacho(
      despachoOriginal,
      ciudad,
    );

    const record = await this.recordModel.findOne({ radicado: radicado });

    let internalCode = record?.internalCode;

    if (!internalCode) {
      const year = new Date().getFullYear();
      const count = await this.recordModel.countDocuments({
        internalCode: { $regex: `^ML-${year}-` },
      });
      internalCode = `ML-${year}-${String(count + 1).padStart(4, '0')}`;
    }

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
      // Si es formato DD/MM/YYYY
      else if (
        typeof ultimoRegistro === 'string' &&
        /\d{1,2}\/\d{1,2}\/\d{4}/.test(ultimoRegistro)
      ) {
        const match = ultimoRegistro.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (match) {
          fechaExtraida = match[1];
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
    const recordData = {
      radicado: radicado,
      despachoJudicial: despachoNormalizado,
      city: ciudad,
      location: ubicacion,
      idProcesoMonolegal: idProcesoMonolegal,
      etapaProcesal: '',
      ultimaActuacion: cambio.ultimaActuacion?.trim() || '',
      ultimaAnotacion: cambio.ultimaAnotacion?.trim() || '',
      fechaUltimaActuacion: fechaExtraida || fechaUltimaActuacionTexto,
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
      etiqueta: (cambio.etiqueta || '').replace(/\s+/g, ''),
      internalCode: '',
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

      if (
        cambio.ultimosCambiosEnFuentes &&
        cambio.ultimosCambiosEnFuentes.length > 0
      ) {
        await this.processUltimosCambiosPerformances(
          record._id,
          cambio.ultimosCambiosEnFuentes,
        );
      }

      // await this.createAudience(
      //   cambio.ultimaActuacion,
      //   cambio.ultimaAnotacion,
      //   record._id,
      // );

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

      if (
        cambio.ultimosCambiosEnFuentes &&
        cambio.ultimosCambiosEnFuentes.length > 0
      ) {
        await this.processUltimosCambiosPerformances(
          newRecord._id,
          cambio.ultimosCambiosEnFuentes,
        );
      }

      // await this.createAudience(
      //   cambio.ultimaActuacion,
      //   cambio.ultimaAnotacion,
      //   newRecord._id,
      // );

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
          this.logger.error(`Error en ${record.radicado}: ${error.message}`);
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
      this.logger.error(`Error en re-normalización: ${error.message}`);
      throw new BadRequestException(
        `Error al re-normalizar juzgados: ${error.message}`,
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

    this.logger.log(
      `[SYNC ALL] Iniciando sincronización desde ${
        startDate.toISOString().split('T')[0]
      } hasta ${endDate.toISOString().split('T')[0]}`,
    );

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
          this.logger.log(
            `[SYNC ALL] Procesando fecha ${fechaFormateada} - ${
              resumen.estadisticas?.numeroExpedientes || '?'
            } expedientes`,
          );

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

              // Log de progreso cada 50 expedientes
              if (expedientesProcesados % 50 === 0) {
                this.logger.log(
                  `[SYNC ALL] Progreso: ${expedientesProcesados} expedientes procesados`,
                );
              }
            } catch (error) {
              totalErrors++;
              results.push({
                radicado: cambio.numero || 'Desconocido',
                status: 'error',
                message: error.message,
              });
            }
          }
        }
      } catch (error) {
        this.logger.error(
          `[SYNC ALL] Error en fecha ${fechaFormateada}: ${error.message}`,
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
      return texto
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
      actuacion,
      anotacion,
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
}
