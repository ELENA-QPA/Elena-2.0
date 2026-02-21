import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { QUOTE_STATUS } from '../types/quote.types';

export class QueryQuoteDto {
  @ApiPropertyOptional({
    description: 'Filtrar por estado',
    enum: QUOTE_STATUS,
  })
  @IsOptional()
  @IsEnum(QUOTE_STATUS)
  status?: QUOTE_STATUS;

  @ApiPropertyOptional({ description: 'Buscar por nombre empresa o contacto' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por usuario creador (userId)' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Número de página', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Resultados por página', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
