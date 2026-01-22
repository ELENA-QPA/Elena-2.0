import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsIn,
  IsEnum,
  IsNumber,
} from 'class-validator';
import { secondConsecutivePart } from '../../common/constants/second-consecutive-part.constant';

export enum DocumentDto {
  DEMANDA = 'Demanda',
  MEMORIAL = 'Memorial',
  CONCEPTO = 'Concepto',
  DERECHO_DE_PETICION = 'Derecho de petición',
  NOTIFICACION_PERSONAL = 'Notificación personal',
  PODER = 'Poder',
  TUTELA = 'Tutela',
  ACTA_DE_CONCILIACION = 'Acta de Conciliación',
}

export enum SubdocumentDto {
  IMPULSO_PROCESAL = 'Impulso procesal',
  SUBSANACION = 'Subsanación',
  SOLICITUD_ACCESO_EXPEDIENTE = 'Solicitud de acceso a expediente',
  INDICIO_GRAVE = 'Indicio grave',
  SUSTITUCION_DESIGNACION_PODER = 'Sustitución -Designación de poder',
  SOLICITUD_INFORMACION = 'Solicitud de información',
  OTROS = 'Otros',
}
export class CreateDocumentDto {
  @ApiProperty({ description: 'Categoría del documento' })
  @IsString({ message: "El campo 'category' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'category' es requerido" })
  category: string;

  @ApiProperty({ description: 'Tipo de documento' })
  @IsString({ message: "El campo 'documentType' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'documentType' es requerido" })
  documentType: string;

  @ApiProperty({ description: 'Documento' })
  @IsNotEmpty({ message: "El campo 'document' es requerido" })
  document: DocumentDto;

  @ApiProperty({ description: 'Subdocumento', enum: SubdocumentDto })
  @IsEnum(SubdocumentDto, {
    message:
      "El campo 'subdocument' debe ser un valor válido del enum SubdocumentDto",
  })
  @IsNotEmpty({ message: "El campo 'subdocument' es requerido" })
  subdocument: SubdocumentDto;

  @ApiProperty({ description: 'Fecha de asentamiento' })
  @IsDateString(
    {},
    { message: "El campo 'settledDate' debe ser una fecha válida" },
  )
  @IsNotEmpty({ message: "El campo 'settledDate' es requerido" })
  settledDate: string;

  // @ApiProperty({ description: 'Consecutivo único' })
  // @IsString({ message: "El campo 'consecutive' debe ser un string" })
  // @IsNotEmpty({ message: "El campo 'consecutive' es requerido" })
  consecutive: string;

  @ApiProperty({ description: 'Tipo de responsable' })
  @IsString({ message: "El campo 'responsibleType' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'responsibleType' es requerido" })
  responsibleType: string;

  @ApiProperty({ description: 'Responsable' })
  @IsString({ message: "El campo 'responsible' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'responsible' es requerido" })
  responsible: string;

  // @ApiProperty({ description: 'URL del documento', required: false })
  // @IsOptional()
  // @IsString({ message: "El campo 'url' debe ser un string" })
  url?: string;

  @ApiProperty({ description: 'Observaciones', required: false })
  @IsOptional()
  @IsString({ message: "El campo 'observations' debe ser un string" })
  observations?: string;

  @ApiProperty({ description: 'consecutivo mayor', required: false })
  @IsOptional()
  @IsNumber()
  consecutiveNumber?: number;
}
