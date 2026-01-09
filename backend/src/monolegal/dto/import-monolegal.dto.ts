import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';
import internal from 'stream';

export class ImportMonolegalDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Archivo Excel de Monolegal (.xlsx)',
  })
  @IsNotEmpty({ message: 'El archivo es requerido' })
  file: any;
}

export interface MonolegalRow {
  'Número Proceso': string;
  Demandantes: string;
  Demandados: string;
  Despacho: string;
  'Etapa Procesal': string;
  'Última Actuación': string;
  'Fecha de último Registro': string;
  'Fuentes Activas': string;
  Etiqueta: string;
}

export interface ProcessResult {
  radicado: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
  details?: {
    despachoJudicial?: string;
    city?: string;
    etapaProcesal?: string;
    ultimaActuacion?: string;
    ultimaAnotacion?: Date;
  };
}

export interface SyncResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details: ProcessResult[];
  updatedRecords?: Array<{
    radicado: string;
    despachoJudicial: string;
    city: string;
    ultimaActuacion: string;
  }>;
}

export interface MonolegalRecordData {
  radicado: string;
  despachoJudicial: string;
  city: string;
  location: string;
  idProcesoMonolegal: string;
  etapaProcesal: string;
  ultimaActuacion: string;
  ultimaAnotacion: Date | null;
  sincronizadoMonolegal: boolean;
  fechaSincronizacion: Date;
  etiqueta: string;
  internalCode: string;
}
