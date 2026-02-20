import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class HubspotSearchDto {
  @ApiPropertyOptional({ description: 'Término de búsqueda (nombre, email, etc.)' })
  @IsString()
  query: string;

  @ApiPropertyOptional({ description: 'Límite de resultados', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}