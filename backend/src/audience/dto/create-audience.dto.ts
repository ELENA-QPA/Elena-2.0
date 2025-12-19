import { IsNotEmpty, IsMongoId, IsEnum, IsDateString, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EstadoAudiencia } from '../interfaces/audience.interfaces';

export class CreateAudienceDto {
  @ApiProperty({
    description: 'ID del record asociado',
    example: '69437141d9601556f5054512',
  })
  @IsNotEmpty({ message: 'El ID del record es requerido' })
  @IsMongoId({ message: 'El ID del record debe ser un ObjectId válido' })
  record: string;

  @ApiProperty({
    description: 'ID del abogado asignado',
    example: '69437141d9601556f5054513',
  })
  @IsNotEmpty({ message: 'El ID del abogado es requerido' })
  @IsMongoId({ message: 'El ID del abogado debe ser un ObjectId válido' })
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
  })
  @IsNotEmpty({ message: 'La fecha de inicio es requerida' })
  @IsDateString({}, { message: 'La fecha de inicio debe ser una fecha válida en formato' })
  start: string;

  @ApiProperty({
    description: 'Fecha y hora de fin de la audiencia',
    example: '2025-01-15T12:00:00Z',
  })
  @IsNotEmpty({ message: 'La fecha de fin es requerida' })
  @IsDateString({}, { message: 'La fecha de fin debe ser una fecha válida en formato' })
  end: string;

  @ApiProperty({
    description: 'Link de la audiencia virtual (opcional)',
    required: false,
  })
  @IsOptional()
  @IsUrl({}, { message: 'El link debe ser una URL válida' })
  link?: string;

  @ApiProperty({
    description: 'Indica si la audiencia es válida',
    default: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'is_valid debe ser un valor booleano' })
  is_valid?: boolean;
}
