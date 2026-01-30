import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { ObjectId } from 'mongoose';

export enum Estado {
  RADICADO = 'RADICADO',
  INADMITIDO = 'INADMITIDO',
  SUBSANACION = 'SUBSANACION',
  ADMITE = 'ADMITE',
  NOTIFICACION_PERSONAL = 'NOTIFICACION_PERSONAL',
  CONTESTACION_DEMANDA = 'CONTESTACION_DEMANDA',
  INADMITE_CONTESTACION = 'INADMITE_CONTESTACION',
  ADMISION_CONTESTACION = 'ADMISION_CONTESTACION',
  FIJA_AUDIENCIA = 'FIJA_AUDIENCIA',
  CELEBRA_AUDIENCIA = 'CELEBRA_AUDIENCIA',
  CONCILIADO = 'CONCILIADO',
  ARCHIVADO = 'ARCHIVADO',
  RETIRO_DEMANDA = 'RETIRO_DEMANDA',
  FINALIZADO_SENTENCIA = 'FINALIZADO_SENTENCIA',
  FINALIZADO_RECHAZO = 'FINALIZADO_RECHAZO',
  RADICA_IMPULSO_PROCESAL = 'RADICA_IMPULSO_PROCESAL',
  ARCHIVADO_Y_PAGADO = 'ARCHIVADO_Y_PAGADO',
}

export enum TipoEstado {
  ACTIVO = 'ACTIVO',
  FINALIZADO = 'FINALIZADO',
}

export enum ClientType {
  RAPPI = 'Rappi SAS',
  UBBER = 'Uber',
  DIDI = 'Didi',
  OTRO = 'Otro',
}

export class CreateRecordDto {
  @ApiProperty({
    description: 'Tipo de cliente (REQUERIDO)',
    enum: ClientType,
    example: ClientType.RAPPI,
  })
  @IsEnum(ClientType, {
    message:
      "El campo 'clientType' debe ser un valor válido del enum ClientType",
  })
  @IsNotEmpty({ message: "El campo 'clientType' es requerido" })
  clientType: ClientType;

  @ApiProperty({ description: 'Responsable del caso' })
  @IsString({ message: "El campo 'responsible' debe ser un string" })
  @IsOptional()
  responsible?: string;

  @ApiProperty({ description: 'Departamento' })
  @IsString({ message: "El campo 'department' debe ser un string" })
  @IsOptional()
  department: string;

  @ApiProperty({ description: 'Tipo de persona' })
  @IsString({ message: "El campo 'personType' debe ser un string" })
  @IsOptional()
  personType: string;

  @ApiProperty({ description: 'Jurisdicción' })
  @IsString({ message: "El campo 'jurisdiction' debe ser un string" })
  @IsOptional()
  jurisdiction: string;

  @ApiProperty({ description: 'Ubicación' })
  @IsString({ message: "El campo 'location' debe ser un string" })
  @IsOptional()
  location: string;

  @ApiProperty({ description: 'Tipo de proceso' })
  @IsString({ message: "El campo 'processType' debe ser un string" })
  @IsOptional()
  processType: string;

  @ApiProperty({ description: 'Ciudad' })
  @IsString({ message: "El campo 'city' debe ser un string" })
  @IsOptional()
  city: string;

  @ApiProperty({ description: 'País' })
  @IsString({ message: "El campo 'country' debe ser un string" })
  @IsOptional()
  country: string;

  @ApiProperty({
    description: 'Número de radicado judicial (23 caracteres)',
    example: '11001310300120250012300',
    required: false,
  })
  @IsString({ message: "El campo 'radicado' debe ser un string" })
  @IsOptional()
  radicado?: string;

  @ApiProperty({
    description: 'Despacho judicial',
    example: 'Juzgado Primero Laboral del Circuito de Bogotá',
    required: false,
  })
  @IsString({ message: "El campo 'despachoJudicial' debe ser un string" })
  @IsOptional()
  despachoJudicial?: string;

  @ApiProperty({
    description: 'Etapa procesal actual',
    example: 'Primera Instancia',
    required: false,
  })
  @IsString({ message: "El campo 'etapaProcesal' debe ser un string" })
  @IsOptional()
  etapaProcesal?: string;

  @ApiProperty({
    description: 'Última actuación registrada',
    example: 'Auto admisorio de demanda',
    required: false,
  })
  @IsString({ message: "El campo 'ultimaActuacion' debe ser un string" })
  @IsOptional()
  ultimaActuacion?: string;

  @ApiProperty({
    description: 'Fecha de última actuación',
    example: '2025-12-10T00:00:00.000Z',
    required: false,
  })
  @IsDate({
    message: "El campo 'fechaUltimaActuacion' debe ser una fecha válida",
  })
  @Type(() => Date)
  @IsOptional()
  fechaUltimaActuacion?: string;

  // @ApiProperty({
  //     description: 'Estado del expediente',
  //     enum: Estado,
  //     default: Estado.RADICADO
  // })
  // @IsEnum(Estado, { message: "El campo 'estado' debe ser un valor válido del enum Estado" })
  // @IsOptional()
  estado: Estado;
}
