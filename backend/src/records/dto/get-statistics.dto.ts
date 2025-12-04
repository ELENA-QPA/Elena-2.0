import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TipoEstado } from './create-record.dto';

export class GetStatisticsDto {
    @ApiProperty({
        description: 'Year to get statistics for',
        example: 2024,
        required: false,
        minimum: 2000,
        maximum: 2100
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Year must be an integer' })
    @Min(2000, { message: 'Year must be at least 2000' })
    @Max(2100, { message: 'Year must be at most 2100' })
    year?: number;

    @ApiProperty({
        description: 'Month to get statistics for (1-12)',
        example: 9,
        required: false,
        minimum: 1,
        maximum: 12
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'Month must be an integer' })
    @Min(1, { message: 'Month must be at least 1' })
    @Max(12, { message: 'Month must be at most 12' })
    month?: number;

    @ApiProperty({
        description: 'Type of process to filter by (ACTIVO or FINALIZADO). If not provided, returns both types',
        example: 'ACTIVO',
        required: false,
        enum: TipoEstado
    })
    @IsOptional()
    @IsEnum(TipoEstado, { message: 'Type must be either ACTIVO or FINALIZADO' })
    type?: TipoEstado;
}
