import { IsOptional, IsPositive, Min, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationDto {
  @ApiProperty({
    description: 'Número de registros a mostrar por página',
    minimum: 1,
    default: 10,
    example: 10,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  limit?: number;

  @ApiProperty({
    description: 'Número de registros a omitir (para paginación)',
    minimum: 0,
    default: 0,
    example: 0,
    required: false
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}