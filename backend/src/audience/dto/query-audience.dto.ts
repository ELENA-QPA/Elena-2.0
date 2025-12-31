import {
  IsOptional,
  IsMongoId,
  IsEnum,
  IsBoolean,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoAudiencia } from '../interfaces/audience.interfaces';
import { Transform } from 'class-transformer';

export class QueryAudienceDto {
  @ApiPropertyOptional({
    description: 'Filtrar por ID de record',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del record debe ser válido' })
  record?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por ID de abogado',
  })
  @IsOptional()
  @IsMongoId({ message: 'El ID del abogado debe ser válido' })
  lawyer?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: EstadoAudiencia,
  })
  @IsOptional()
  @IsEnum(EstadoAudiencia, { message: 'El estado debe ser válido' })
  state?: EstadoAudiencia;

  @ApiPropertyOptional({
    description: 'Si la audiencia tiene todo lo necesario',
  })
  @IsOptional()
  @IsString()
  is_valid?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  notificationOneMonthSent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  notificationFifteenDaysSent?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  notificationOneDaySent?: boolean;
}
