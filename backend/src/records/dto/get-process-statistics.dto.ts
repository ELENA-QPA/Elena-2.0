import { IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { TipoEstado } from './create-record.dto';

export class GetProcessStatisticsDto {
    @ApiProperty({
        description: 'Type of process to get statistics for (ACTIVO or FINALIZADO)',
        example: 'ACTIVO',
        required: true,
        enum: TipoEstado
    })
    @IsEnum(TipoEstado, { message: 'Type must be either ACTIVO or FINALIZADO' })
    type: TipoEstado;
}
