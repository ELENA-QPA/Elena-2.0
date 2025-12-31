import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Estado } from './create-record.dto';

export class DraftRecordDto {
  @ApiProperty({ description: 'Número de orden único del expediente' })
  @IsNumber({}, { message: "El campo 'no_orden' debe ser un número." })
  @IsNotEmpty({ message: "El campo 'no_orden' es requerido" })
  no_orden: number;

  @ApiProperty({ description: 'Tipo de cliente' })
  @IsString({ message: "El campo 'clientType' debe ser un string" })
  @IsOptional()
  clientType: string;

  @ApiProperty({ description: 'Código interno' })
  @IsString({ message: "El campo 'internalCode' debe ser un string" })
  @IsOptional()
  internalCode: string;

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

  @ApiProperty({ description: 'Oficina' })
  @IsString({ message: "El campo 'office' debe ser un string" })
  @IsOptional()
  office: string;

  @ApiProperty({ description: 'Asentado' })
  @IsString({ message: "El campo 'settled' debe ser un string" })
  @IsOptional()
  settled: string;

  @ApiProperty({ description: 'País' })
  @IsString({ message: "El campo 'country' debe ser un string" })
  @IsOptional()
  country: string;

  @ApiProperty({
    description:
      'Responsable del caso (se usa para crear performance automáticamente)',
  })
  @IsString({ message: "El campo 'responsible' debe ser un string" })
  @IsOptional()
  responsible?: string;

  @ApiProperty({
    description: 'Estado del expediente',
    enum: Estado,
    default: Estado.RADICADO,
  })
  @IsEnum(Estado, {
    message: "El campo 'estado' debe ser un valor válido del enum Estado",
  })
  @IsOptional()
  estado: Estado;

  @ApiProperty({ description: 'Fecha del expediente' })
  @IsDate({ message: "El campo 'fecha' debe ser una fecha válida" })
  @IsOptional()
  fecha: Date;
}
