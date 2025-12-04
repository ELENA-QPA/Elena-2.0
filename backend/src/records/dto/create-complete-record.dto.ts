import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsNotEmpty, ValidateNested } from 'class-validator';
import { CreateRecordDto } from './create-record.dto';
import { CreateDocumentDto } from '../../document/dto/create-document.dto';
import { CreateIntervenerForRecordDto } from '../../intervener/dto/create-intervener-for-record.dto';
import { CreateProceduralPartForRecordDto } from '../../procedural-part/dto/create-procedural-part-for-record.dto';
import { CreatePaymentForRecordDto } from '../../payment/dto/create-payment-for-record.dto';

export class CreateCompleteRecordDto extends CreateRecordDto {
    @ApiProperty({
        description: 'Documentos asociados al caso',
        type: [CreateDocumentDto],
        required: false
    })
    @IsOptional()
    @IsArray({ message: "El campo 'documents' debe ser un array" })
    @ValidateNested({ each: true })
    @Type(() => CreateDocumentDto)
    documents?: CreateDocumentDto[];

    @ApiProperty({
        description: 'Lista de intervinientes asociados al caso',
        type: [CreateIntervenerForRecordDto],
        required: false
    })
    @IsOptional()
    @IsArray({ message: "El campo 'interveners' debe ser un array" })
    @ValidateNested({ each: true })
    @Type(() => CreateIntervenerForRecordDto)
    interveners?: CreateIntervenerForRecordDto[];

    @ApiProperty({
        description: 'Lista de partes procesales asociadas al caso',
        type: [CreateProceduralPartForRecordDto],
        required: false
    })
    @IsOptional()
    @IsArray({ message: "El campo 'proceduralParts' debe ser un array" })
    @ValidateNested({ each: true })
    @Type(() => CreateProceduralPartForRecordDto)
    proceduralParts?: CreateProceduralPartForRecordDto[];

    @ApiProperty({
        description: 'Lista de pagos asociados al caso',
        type: [CreatePaymentForRecordDto],
        required: false
    })
    @IsOptional()
    @IsArray({ message: "El campo 'payments' debe ser un array" })
    @ValidateNested({ each: true })
    @Type(() => CreatePaymentForRecordDto)
    payments?: CreatePaymentForRecordDto[];
}
