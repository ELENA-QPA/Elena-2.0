import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as XLSX from 'xlsx';
import { Record } from './../../records/entities/record.entity';
import {
  ProceduralPart,
  PartType,
} from '../../procedural-part/entities/procedural-part.entity';

interface ExcelRow {
  [key: string]: any;
}

interface ImportResult {
  etiqueta: string;
  radicado: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
  updatedFields?: string[];
}

@Injectable()
export class CustomExcelImportService {
  private readonly logger = new Logger(CustomExcelImportService.name);

  constructor(
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(ProceduralPart.name)
    private proceduralPartModel: Model<ProceduralPart>,
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

      let data: ExcelRow[] = [];
      let foundHeaders = false;

      for (const sheetName of workbook.SheetNames) {
        if (foundHeaders) break;

        const worksheet = workbook.Sheets[sheetName];

        for (let startRow = 0; startRow <= 5 && !foundHeaders; startRow++) {
          const testData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet, {
            range: startRow,
            defval: '',
            raw: false,
          });

          if (testData.length > 0) {
            const columns = Object.keys(testData[0]);

            const hasCod = columns.some(
              (col) => col.toLowerCase().trim() === 'cod',
            );
            const hasNumero = columns.some((col) => col.trim() === '#');
            const hasConsecutivo = columns.some(
              (col) =>
                col.toLowerCase().includes('consecutivo') ||
                col.toLowerCase().includes('radicado'),
            );
            const hasDemandante = columns.some((col) =>
              col.toLowerCase().includes('demandante'),
            );

            if ((hasCod || hasNumero) && hasDemandante) {
              data = testData;
              foundHeaders = true;
              break;
            }
          }
        }
      }

      if (!foundHeaders || data.length === 0) {
        throw new BadRequestException(
          'No se pudieron encontrar los encabezados del Excel. Asegúrate de que el archivo tenga las columnas: #, Consecutivo, Demandante, etc.',
        );
      }

      const results: ImportResult[] = [];
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
          const cod = this.getColumnValue(row, ['Cod', 'cod', 'COD']);
          const numero = this.getColumnValue(row, ['#']);
          const etiqueta =
            cod && numero ? `${cod}${numero}` : numero || cod || 'Desconocido';
          results.push({
            etiqueta: etiqueta,
            radicado: row.Consecutivo || 'Desconocido',
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

  private getColumnValue(row: any, possibleNames: string[]): string {
    for (const name of possibleNames) {
      if (row[name] !== undefined && row[name] !== null && row[name] !== '') {
        return String(row[name]).trim();
      }
      const key = Object.keys(row).find(
        (k) => k.toLowerCase().trim() === name.toLowerCase().trim(),
      );
      if (
        key &&
        row[key] !== undefined &&
        row[key] !== null &&
        row[key] !== ''
      ) {
        return String(row[key]).trim();
      }
    }
    return '';
  }

  private async processRow(
    row: ExcelRow,
    userId: string,
  ): Promise<ImportResult> {
    // ETIQUETA es la combinación de Cod + #
    const cod = this.getColumnValue(row, ['Cod', 'cod', 'COD']);
    const numero = this.getColumnValue(row, ['#']);
    const etiqueta = cod && numero ? `${cod}${numero}` : numero || cod || '';

    // Consecutivo es el RADICADO
    const radicado = this.getColumnValue(row, [
      'Consecutivo',
      'consecutivo',
      'Radicado',
      'radicado',
    ]);

    const demandante = this.getColumnValue(row, ['Demandante', 'demandante']);
    const tipoDocumento = this.getColumnValue(row, [
      'Tipo de documento',
      'tipo de documento',
    ]);
    const documento = this.getColumnValue(row, ['Documento', 'documento']);
    const contacto = this.getColumnValue(row, ['Contacto', 'contacto']);
    const email = this.getColumnValue(row, [
      'Dirección electrónica',
      'direccion electronica',
      'Email',
      'email',
    ]);

    const jurisdiccion = this.getColumnValue(row, [
      'Jurisdicción',
      'jurisdiccion',
    ]);
    const tipoProceso = this.getColumnValue(row, [
      'Tipo de proceso',
      'tipo de proceso',
    ]);
    const departamento = this.getColumnValue(row, [
      'Departamento',
      'departamento',
    ]);
    const ciudad = this.getColumnValue(row, ['Ciudad', 'ciudad']);
    const juzgado = this.getColumnValue(row, ['Juzgado', 'juzgado']);
    const fechaRadicadoStr = this.getColumnValue(row, [
      'Fecha radicado',
      'fecha radicado',
    ]);
    const archivadoStr = this.getColumnValue(row, [
      'Archivado/conciliado',
      'archivado',
    ]);
    const activoStr = this.getColumnValue(row, ['Activo', 'activo']);

    if (!etiqueta || etiqueta === '') {
      return {
        etiqueta: 'Sin etiqueta',
        radicado: radicado || 'Sin radicado',
        status: 'skipped',
        message: 'No tiene etiqueta (columna #)',
      };
    }

    const fechaRadicado = this.parseDate(fechaRadicadoStr);
    const activo =
      activoStr && activoStr.trim() !== ''
        ? activoStr.toLowerCase() === 'activo'
          ? 'Activo'
          : 'Inactivo'
        : undefined;
    const archivado =
      archivadoStr?.toLowerCase() === 'sí' ||
      archivadoStr?.toLowerCase() === 'si';
    const jurisdiccionNorm = this.normalizeJurisdiccion(jurisdiccion);
    const tipoProcesoNorm = tipoProceso
      ? tipoProceso.charAt(0).toUpperCase() + tipoProceso.slice(1).toLowerCase()
      : '';
    const ciudadNorm = this.normalizeCity(ciudad);
    const departamentoNorm = this.normalizeDepartment(departamento);

    let existingRecord = null;
    let foundBy = '';

    existingRecord = await this.recordModel.findOne({ etiqueta: etiqueta });
    if (existingRecord) {
      foundBy = 'etiqueta';
    }

    if (
      !existingRecord &&
      radicado &&
      radicado !== '' &&
      radicado.toLowerCase() !== 'na'
    ) {
      existingRecord = await this.recordModel.findOne({ radicado: radicado });
      if (existingRecord) {
        foundBy = 'radicado';
      }
    }

    if (existingRecord) {
      const updatedFields: string[] = [];

      if (etiqueta && existingRecord.etiqueta !== etiqueta) {
        existingRecord.etiqueta = etiqueta;
        updatedFields.push('etiqueta');
      }

      if (
        (!existingRecord.radicado ||
          existingRecord.radicado === '' ||
          existingRecord.radicado.toLowerCase() === 'na') &&
        radicado &&
        radicado !== '' &&
        radicado.toLowerCase() !== 'na'
      ) {
        existingRecord.radicado = radicado;
        updatedFields.push('radicado');
      }

      if (
        (!existingRecord.despachoJudicial ||
          existingRecord.despachoJudicial === '') &&
        juzgado &&
        juzgado.toLowerCase() !== 'na'
      ) {
        existingRecord.despachoJudicial = this.normalizeJuzgado(juzgado);
        updatedFields.push('despachoJudicial');
      }

      if (!existingRecord.city || existingRecord.city === '') {
        existingRecord.city = ciudadNorm;
        updatedFields.push('city');
      }

      if (!existingRecord.department || existingRecord.department === '') {
        existingRecord.department = departamentoNorm;
        updatedFields.push('department');
      }

      if (!existingRecord.jurisdiction || existingRecord.jurisdiction === '') {
        existingRecord.jurisdiction = jurisdiccionNorm;
        updatedFields.push('jurisdiction');
      }

      if (!existingRecord.processType || existingRecord.processType === '') {
        existingRecord.processType = tipoProcesoNorm;
        updatedFields.push('processType');
      }

      if (!existingRecord.filingDate && fechaRadicado) {
        existingRecord.filingDate = fechaRadicado;
        updatedFields.push('filingDate');
      }

      if (activo !== undefined) {
        existingRecord.isActive = activo;
      }
      existingRecord.isArchived = archivado;

      if (updatedFields.length > 0) {
        await existingRecord.save();
      }

      const demandanteUpdates = await this.updateProceduralPartIfNeeded(
        existingRecord._id,
        {
          demandante,
          tipoDocumento,
          documento,
          contacto,
          email,
        },
      );

      if (demandanteUpdates.length > 0) {
        updatedFields.push(...demandanteUpdates.map((f) => `demandante.${f}`));
      }

      return {
        etiqueta,
        radicado: radicado || existingRecord.radicado || 'Sin radicado',
        status: 'updated',
        message:
          updatedFields.length > 0
            ? `Actualizado (encontrado por ${foundBy})`
            : `Sin cambios (encontrado por ${foundBy})`,
        updatedFields,
      };
    }

    const radicadoValido =
      radicado && radicado !== '' && radicado.toLowerCase() !== 'na';

    if (radicadoValido) {
      const existeRadicado = await this.recordModel.findOne({
        radicado: radicado,
      });
      if (existeRadicado) {
        // Ya existe, actualizar en lugar de crear
        if (etiqueta && existeRadicado.etiqueta !== etiqueta) {
          existeRadicado.etiqueta = etiqueta;
          await existeRadicado.save();
          return {
            etiqueta,
            radicado,
            status: 'updated',
            message: 'Etiqueta actualizada (radicado ya existía)',
            updatedFields: ['etiqueta'],
          };
        }
        return {
          etiqueta,
          radicado,
          status: 'skipped',
          message: 'Radicado ya existe, sin cambios necesarios',
        };
      }
    }

    const year = new Date().getFullYear();
    const count = await this.recordModel.countDocuments({
      internalCode: { $regex: `^CE-${year}-` },
    });
    const internalCode = `CE-${year}-${String(count + 1).padStart(4, '0')}`;

    const recordData = {
      radicado,
      etiqueta,
      internalCode,
      despachoJudicial: this.normalizeJuzgado(juzgado),
      city: ciudadNorm,
      department: departamentoNorm,
      jurisdiction: jurisdiccionNorm,
      processType: tipoProcesoNorm,
      filingDate: fechaRadicado,
      country: 'Colombia',
      ...(activo !== undefined && { isActive: activo }),
      isArchived: archivado,
    };

    const newRecord = new this.recordModel({
      user: userId,
      ...recordData,
    });

    await newRecord.save();

    // Crear partes procesales
    await this.createProceduralPartFromRow(newRecord._id, {
      demandante,
      tipoDocumento,
      documento,
      contacto,
      email,
    });

    return {
      etiqueta,
      radicado: radicado || 'Sin radicado',
      status: 'created',
      message: 'Registro creado exitosamente',
    };
  }

  private async createProceduralPartFromRow(
    recordId: any,
    data: {
      demandante: string;
      tipoDocumento: string;
      documento: string;
      contacto: string;
      email: string;
    },
  ): Promise<void> {
    if (!data.demandante || data.demandante === '') {
      return;
    }

    const tipoDoc = data.tipoDocumento || 'Por verificar';
    const doc = data.documento || 'Por verificar';
    const cont = data.contacto || 'Por verificar';
    const em = data.email || 'por-verificar@temp.com';

    await this.proceduralPartModel.create({
      record: recordId,
      partType: PartType.demandante,
      name: data.demandante,
      documentType: tipoDoc,
      document: doc,
      email: em,
      contact: cont,
    });
  }

  private async updateProceduralPartIfNeeded(
    recordId: any,
    data: {
      demandante: string;
      tipoDocumento: string;
      documento: string;
      contacto: string;
      email: string;
    },
  ): Promise<string[]> {
    const updatedFields: string[] = [];

    const demandante = await this.proceduralPartModel.findOne({
      record: recordId,
      partType: PartType.demandante,
    });

    if (!demandante) {
      await this.createProceduralPartFromRow(recordId, data);
      return ['creado'];
    }

    if (
      data.demandante &&
      (!demandante.name ||
        demandante.name === '' ||
        demandante.name === 'Por verificar')
    ) {
      demandante.name = data.demandante;
      updatedFields.push('name');
    }

    if (
      data.tipoDocumento &&
      data.tipoDocumento !== '' &&
      (!demandante.documentType || demandante.documentType === 'Por verificar')
    ) {
      demandante.documentType = data.tipoDocumento;
      updatedFields.push('documentType');
    }

    if (
      data.documento &&
      data.documento !== '' &&
      (!demandante.document || demandante.document === 'Por verificar')
    ) {
      demandante.document = data.documento;
      updatedFields.push('document');
    }

    if (
      data.contacto &&
      data.contacto !== '' &&
      (!demandante.contact || demandante.contact === 'Por verificar')
    ) {
      demandante.contact = data.contacto;
      updatedFields.push('contact');
    }

    if (
      data.email &&
      data.email !== '' &&
      (!demandante.email || demandante.email === 'por-verificar@temp.com')
    ) {
      demandante.email = data.email;
      updatedFields.push('email');
    }

    if (updatedFields.length > 0) {
      await demandante.save();
    }

    return updatedFields;
  }

  private parseDate(dateString: any): Date | undefined {
    if (dateString instanceof Date && !isNaN(dateString.getTime())) {
      return dateString;
    }

    if (!dateString || dateString === '') {
      return undefined;
    }

    if (typeof dateString === 'number') {
      const days = Math.floor(dateString);
      const excelEpoch = new Date(1900, 0, days > 59 ? days - 1 : days);
      return excelEpoch;
    }

    const dateStr = String(dateString).trim();

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
      return new Date(isoString);
    }

    return undefined;
  }

  private normalizeJurisdiccion(jurisdiccion: string): string {
    if (!jurisdiccion) return '';

    const normalized = jurisdiccion.replace(/_/g, ' ').trim();
    return normalized
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  private normalizeCity(city: string): string {
    if (!city) return '';

    const cityMap: { [key: string]: string } = {
      'Bogotá_D.C.': 'Bogotá D.C.',
      BOGOTA: 'Bogotá D.C.',
      Bogota: 'Bogotá D.C.',
    };

    const normalized = city.replace(/_/g, ' ').trim();
    return (
      cityMap[city] ||
      normalized
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(' ')
    );
  }

  private normalizeDepartment(dept: string): string {
    if (!dept) return '';

    const deptMap: { [key: string]: string } = {
      'Bogotá_D.C.': 'Bogotá D.C.',
    };

    const normalized = dept.replace(/_/g, ' ').trim();
    return (
      deptMap[dept] ||
      normalized
        .split(' ')
        .map(
          (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
        )
        .join(' ')
    );
  }

  private normalizeJuzgado(juzgado: string): string {
    if (!juzgado || juzgado.toLowerCase() === 'na') {
      return '';
    }

    return juzgado.trim();
  }
}
