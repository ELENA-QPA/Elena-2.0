import {
  IsNotEmpty,
  IsMongoId,
  IsEnum,
  IsDateString,
  IsOptional,
  IsBoolean,
  IsUrl,
  IsNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoAudiencia } from '../interfaces/audience.interfaces';

export class CreateAudienceDto {
  @ApiProperty({
    description: 'ID del record asociado',
    example: '69437141d9601556f5054512',
    required: false,
  })
  record: string;

  @ApiProperty({
    description: 'ID del abogado asignado',
    example: '69437141d9601556f5054513',
    required: false,
  })
  lawyer: string;

  @ApiProperty({
    description: 'Estado de la audiencia',
    enum: EstadoAudiencia,
    default: EstadoAudiencia.PROGRAMADA,
  })
  @IsOptional()
  @IsEnum(EstadoAudiencia, { message: 'El estado debe ser un valor válido' })
  state?: EstadoAudiencia;

  @ApiProperty({
    description: 'Fecha y hora de inicio de la audiencia',
    example: '2025-01-15T10:00:00Z',
    required: false,
  })
  start: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la audiencia',
    example: '2025-01-15T12:00:00Z',
    required: false,
  })
  end: string;

  @ApiProperty({
    description: 'Link de la audiencia virtual (opcional)',
    required: false,
  })
  @IsOptional()
  link?: string;

  @ApiProperty({
    description: 'Indica si la audiencia es válida',
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_valid debe ser un valor booleano' })
  is_valid?: boolean;

  @ApiProperty({
    description: 'Monto asociado a la audiencia',
    required: false,
  })
  @IsOptional()
  @IsNumber({}, { message: 'monto debe ser un número' })
  monto?: number;
}
