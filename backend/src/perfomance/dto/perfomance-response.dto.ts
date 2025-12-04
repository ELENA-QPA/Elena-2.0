import { ApiProperty } from '@nestjs/swagger';

export class PerfomanceResponseDto {
    @ApiProperty({
        description: 'ID único de la actuación',
        example: '507f1f77bcf86cd799439013'
    })
    _id: string;

    @ApiProperty({
        description: 'ID del usuario asociado a la actuación',
        example: '507f1f77bcf86cd799439011'
    })
    user: string;

    @ApiProperty({
        description: 'ID del expediente asociado a la actuación',
        example: '507f1f77bcf86cd799439012'
    })
    record: string;

    @ApiProperty({
        description: 'Tipo de actuación',
        example: 'Audiencia',
        required: false
    })
    performanceType?: string;

    @ApiProperty({
        description: 'Responsable de la actuación',
        example: 'Juan Pérez',
        required: false
    })
    responsible?: string;

    @ApiProperty({
        description: 'Observaciones de la actuación',
        example: 'Se realizó audiencia de conciliación',
        required: false
    })
    observation?: string;

    @ApiProperty({
        description: 'Fecha de creación del registro',
        example: '2023-12-01T10:30:00.000Z'
    })
    createdAt: Date;

    @ApiProperty({
        description: 'Fecha de última actualización del registro',
        example: '2023-12-01T10:30:00.000Z'
    })
    updatedAt: Date;

    @ApiProperty({
        description: 'Fecha de eliminación (soft delete)',
        example: '2023-12-01T10:30:00.000Z',
        required: false
    })
    deletedAt?: Date;
}
