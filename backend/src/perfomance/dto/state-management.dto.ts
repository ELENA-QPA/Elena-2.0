import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';
import { PerformanceType } from './create-perfomance.dto';
import { TipoEstado } from '../../records/dto/create-record.dto';

export class ValidateTransitionDto {
    @ApiProperty({
        description: 'ID del expediente',
        example: '507f1f77bcf86cd799439012'
    })
    @IsMongoId()
    recordId: string;

    @ApiProperty({
        description: 'Nuevo estado al que se quiere transicionar',
        enum: PerformanceType,
        example: PerformanceType.ADMITE
    })
    @IsEnum(PerformanceType)
    newState: PerformanceType;
}

export class CreatePerformanceWithValidationDto {
    @ApiProperty({
        description: 'ID del expediente asociado a la actuación',
        example: '507f1f77bcf86cd799439012'
    })
    @IsMongoId()
    record: string;

    @ApiProperty({
        description: 'Tipo de actuación (será validado contra el flujo de estados)',
        enum: PerformanceType,
        example: PerformanceType.RADICADO
    })
    @IsEnum(PerformanceType)
    performanceType: PerformanceType;

    @ApiProperty({
        description: 'Responsable de la actuación',
        example: 'Juan Pérez'
    })
    @IsString()
    responsible: string;

    @ApiProperty({
        description: 'Observaciones de la actuación',
        example: 'Se realizó la radicación de la demanda correctamente',
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

    @ApiProperty({
        description: 'Forzar la transición sin validar (solo para administradores)',
        example: false,
        required: false,
        default: false
    })
    @IsOptional()
    forceTransition?: boolean;
}

export class StateFlowResponseDto {
    @ApiProperty({
        description: 'Lista de todos los estados disponibles',
        type: [String],
        enum: PerformanceType
    })
    states: PerformanceType[];

    @ApiProperty({
        description: 'Lista de transiciones válidas',
        type: 'array',
        items: {
            type: 'object',
            properties: {
                from: { type: 'array', items: { type: 'string' } },
                to: { type: 'string' },
                description: { type: 'string' }
            }
        }
    })
    transitions: Array<{
        from: PerformanceType[];
        to: PerformanceType;
        description: string;
    }>;
}

export class StateHistoryItemDto {
    @ApiProperty({
        description: 'ID de la actuación',
        example: '507f1f77bcf86cd799439013'
    })
    id: string;

    @ApiProperty({
        description: 'Estado de la actuación',
        enum: PerformanceType,
        example: PerformanceType.RADICADO
    })
    state: PerformanceType;

    @ApiProperty({
        description: 'Responsable de la actuación',
        example: 'Juan Pérez'
    })
    responsible: string;

    @ApiProperty({
        description: 'Observaciones de la actuación',
        example: 'Demanda radicada correctamente'
    })
    observation: string;

    @ApiProperty({
        description: 'Fecha de creación',
        example: '2024-01-15T10:30:00.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Descripción de la transición',
        example: 'Primer estado - Radicación de la demanda'
    })
    description: string;

    @ApiProperty({
        description: 'Indica si es un estado final',
        example: false
    })
    isFinalState: boolean;
}

export class RecordStateTypeDto {
    @ApiProperty({
        description: 'ID del expediente',
        example: '507f1f77bcf86cd799439012'
    })
    recordId: string;

    @ApiProperty({
        description: 'Estado actual del expediente',
        enum: PerformanceType,
        example: PerformanceType.RADICADO
    })
    currentState: PerformanceType;

    @ApiProperty({
        description: 'Tipo de estado actual',
        enum: TipoEstado,
        example: TipoEstado.ACTIVO
    })
    currentType: TipoEstado;

    @ApiProperty({
        description: 'Indica si el expediente está activo',
        example: true
    })
    isActive: boolean;

    @ApiProperty({
        description: 'Indica si el expediente está finalizado',
        example: false
    })
    isFinalizado: boolean;
}
