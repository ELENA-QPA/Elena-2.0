import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsMongoId, IsNotEmpty, IsEnum } from 'class-validator';
import { SubdocumentDto } from './create-document.dto';

export class CreateDocumentMultipartDto {
    @ApiProperty({ description: 'ID del expediente al que pertenece el documento' })
    @IsString({ message: "El campo 'recordId' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'recordId' es requerido" })
    @IsMongoId({ message: "El campo 'recordId' debe ser un ID de MongoDB válido" })
    recordId: string;

    @ApiProperty({ description: 'Categoría del documento' })
    @IsString({ message: "El campo 'category' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'category' es requerido" })
    category: string;

    @ApiProperty({ description: 'Tipo de documento' })
    @IsString({ message: "El campo 'documentType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'documentType' es requerido" })
    documentType: string;

    @ApiProperty({ description: 'Documento' })
    @IsString({ message: "El campo 'document' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'document' es requerido" })
    document: string;

    @ApiProperty({ description: 'Subdocumento', enum: SubdocumentDto })
    @IsEnum(SubdocumentDto, { message: "El campo 'subdocument' debe ser un valor válido del enum SubdocumentDto" })
    @IsNotEmpty({ message: "El campo 'subdocument' es requerido" })
    subdocument: SubdocumentDto;

    @ApiProperty({ description: 'Fecha de asentamiento' })
    @IsDateString({}, { message: "El campo 'settledDate' debe ser una fecha válida" })
    @IsNotEmpty({ message: "El campo 'settledDate' es requerido" })
    settledDate: string;

    @ApiProperty({ description: 'Consecutivo único' })
    @IsString({ message: "El campo 'consecutive' debe ser un string" })
    @IsOptional()
    consecutive: string;

    @ApiProperty({ description: 'Tipo de responsable' })
    @IsString({ message: "El campo 'responsibleType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'responsibleType' es requerido" })
    responsibleType: string;

    @ApiProperty({ description: 'Responsable' })
    @IsString({ message: "El campo 'responsible' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'responsible' es requerido" })
    responsible: string;

    @ApiProperty({ description: 'Observaciones', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'observations' debe ser un string" })
    observations?: string;

    @ApiProperty({
        type: 'string',
        format: 'binary',
        description: 'Archivo del documento (obligatorio)'
    })
    file: any;
}
