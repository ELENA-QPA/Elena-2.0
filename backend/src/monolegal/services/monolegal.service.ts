import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Record } from './../../records/entities/record.entity';
import {
  ProceduralPart,
  PartType,
} from '../../procedural-part/entities/procedural-part.entity';
import { Performance } from '../../perfomance/entities/perfomance.entity';
import { MonolegalRow, ProcessResult } from '../dto/import-monolegal.dto';
import { MonolegalApiService } from './monolegal-api.service';

@Injectable()
export class MonolegalService {
  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(ProceduralPart.name)
    private proceduralPartModel: Model<ProceduralPart>,
    @InjectModel(Performance.name) private performanceModel: Model<Performance>,
    private readonly monolegalApiService: MonolegalApiService,
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
    const fechaRegistro =
      row['Fecha de último Registro'] ||
      row['Fecha de ultimo Registro'] ||
      row['fecha registro'] ||
      '';

    if (!radicado || radicado.trim() === '') {
      return {
        radicado: 'Sin radicado',
        status: 'skipped',
        message: 'No tiene número de proceso',
      };
    }

    let record = await this.recordModel.findOne({ radicado: radicado.trim() });

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
      despachoJudicial: despacho.trim(),
      etiqueta: etiqueta.trim(),
      etapaProcesal: etapaProcesal.trim(),
      ultimaActuacion: ultimaActuacion.trim(),
      fechaUltimaActuacion: this.parseDate(fechaRegistro),
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
    };

    if (record) {
      Object.assign(record, recordData);
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
        clientType: 'Otro',
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

    for (const nombre of demandados) {
      if (nombre) {
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

  private async createOrUpdatePerformance(
    recordId: any,
    data: { ultimaActuacion: string; etapaProcesal: string },
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
        observation: `Sincronizado desde Monolegal - ${
          data.etapaProcesal || 'Sin etapa'
        }`,
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

  async syncFromApi(userId: string, fecha?: Date): Promise<any> {
    const fechaConsulta = fecha || new Date();
    const fechaFormateada =
      this.monolegalApiService.formatearFechaMonolegal(fechaConsulta);

    try {
      console.log('📡 Iniciando sincronización desde API Monolegal...');
      console.log('📅 Fecha:', fechaFormateada);

      // 1. Verificar si hay cambios
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
        };
      }

      console.log(
        `📊 Hay ${resumen.estadisticas.numeroExpedientes} expedientes con cambios`,
      );

      // 2. Obtener todos los cambios
      const cambios = await this.monolegalApiService.getTodosCambios(
        fechaFormateada,
      );

      const results: ProcessResult[] = [];
      let created = 0;
      let updated = 0;
      let skipped = 0;
      let errors = 0;

      // 3. Procesar cada cambio
      for (const cambio of cambios) {
        try {
          const result = await this.processApiChange(cambio, userId);
          results.push(result);

          if (result.status === 'created') created++;
          else if (result.status === 'updated') updated++;
          else if (result.status === 'skipped') skipped++;
          else if (result.status === 'error') errors++;
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
      };
    } catch (error) {
      console.error('❌ Error en sincronización API:', error);
      throw new BadRequestException(
        `Error al sincronizar con Monolegal: ${error.message}`,
      );
    }
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

    console.log('🔍 Procesando:', radicado);

    // Buscar si ya existe el registro
    let record = await this.recordModel.findOne({ radicado: radicado });

    // Generar internalCode si no existe
    let internalCode = record?.internalCode;

    if (!internalCode) {
      const year = new Date().getFullYear();
      const count = await this.recordModel.countDocuments({
        internalCode: { $regex: `^ML-${year}-` },
      });
      internalCode = `ML-${year}-${String(count + 1).padStart(4, '0')}`;
    }

    const recordData = {
      radicado: radicado,
      internalCode,
      despachoJudicial: cambio.despacho?.trim() || '',
      etapaProcesal: '',
      ultimaActuacion: cambio.ultimaActuacion?.trim() || '',
      fechaUltimaActuacion: this.parseDate(cambio.ultimoRegistro),
      sincronizadoMonolegal: true,
      fechaSincronizacion: new Date(),
      etiqueta: cambio.etiqueta || '',
    };

    if (record) {
      // Actualizar registro existente
      Object.assign(record, recordData);
      await record.save();

      // Actualizar actuación
      if (cambio.ultimaActuacion) {
        await this.createOrUpdatePerformance(record._id, {
          ultimaActuacion: cambio.ultimaActuacion,
          etapaProcesal: '',
        });
      }

      return {
        radicado,
        status: 'updated',
        message: 'Registro actualizado desde API',
      };
    } else {
      // Crear nuevo registro
      const newRecord = new this.recordModel({
        user: userId,
        ...recordData,
        clientType: 'Otro',
        country: 'Colombia',
      });

      await newRecord.save();

      // Crear partes procesales
      await this.createProceduralParts(newRecord._id, {
        demandantes: cambio.demandantes || '',
        demandados: cambio.demandados || '',
      });

      // Crear actuación
      if (cambio.ultimaActuacion) {
        await this.createOrUpdatePerformance(newRecord._id, {
          ultimaActuacion: cambio.ultimaActuacion,
          etapaProcesal: '',
        });
      }

      return {
        radicado,
        status: 'created',
        message: 'Registro creado desde API',
      };
    }
  }
}
