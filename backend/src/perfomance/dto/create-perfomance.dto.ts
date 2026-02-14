import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsMongoId, IsEnum, IsDateString } from 'class-validator';
import { Estado } from '../../records/dto/create-record.dto';

// Re-exportamos el enum Estado como PerformanceType para mantener compatibilidad
export const PerformanceType = Estado;
export type PerformanceType = Estado;

export class CreatePerfomanceDto {
    // @ApiProperty({
    //     description: 'ID del usuario asociado a la actuación',
    //     example: '507f1f77bcf86cd799439011'
    // })
    // @IsMongoId()
    // user: string;

    @ApiProperty({
        description: 'ID del expediente asociado a la actuación',
        example: '507f1f77bcf86cd799439012'
    })
    @IsMongoId()
    record: string;

    @ApiProperty({
        description: 'Tipo de actuación',
        enum: PerformanceType,
        example: PerformanceType.RADICADO,
        required: false
    })
    @IsOptional()
    //@IsEnum(PerformanceType, { message: "El campo 'performanceType' debe ser un valor válido del enum PerformanceType" })
    @IsString()
    performanceType?: PerformanceType;

    @ApiProperty({
        description: 'Responsable de la actuación',
        example: 'Juan Pérez'
    })
    @IsString()
    responsible: string;

    @ApiProperty({
        description: 'Observaciones de la actuación',
        example: 'Se realizó audiencia de conciliación',
        required: false
    })
    @IsOptional()
    @IsString()
    observation?: string;

    @ApiProperty({
        description: 'ID del documento asociado a la actuación',
        example: '507f1f77bcf86cd799439013',
        required: false
    })
    @IsOptional()
    @IsMongoId()
    document?: string;

    @IsOptional()
    @IsDateString()
    performanceDate?: string;
}
