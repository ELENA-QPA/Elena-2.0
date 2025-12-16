import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty } from 'class-validator';

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
  'Demandantes': string;
  'Demandados': string;
  'Despacho': string;
  'Etapa Procesal': string;
  'Última Actuación': string;
  'Fecha de último Registro': string;
  'Fuentes Activas': string;
  'Etiqueta': string;
}

export interface ProcessResult {
  radicado: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
  despachoJudicial?: string;
  etapaProcesal?: string;
  ultimaActuacion?: string;
  fechaUltimaActuacion?: Date;
  fechaSincronizacion?: Date;
}
