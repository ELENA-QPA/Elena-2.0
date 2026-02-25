import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt } from 'class-validator';
import { PipedriveItemType } from './pipedrive-search.dto';

export class PipedriveDetailDto {
  @ApiProperty({ description: 'Id del item en Pipedrive', example: 1 })
  @IsInt()
  @Type(() => Number)
  id: number;

  @ApiProperty({
    description: 'Tipo del item en Pipedrive',
    enum: PipedriveItemType,
  })
  @IsEnum(PipedriveItemType)
  type: PipedriveItemType;
}
