import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsEnum } from 'class-validator';
import { SubdocumentDto } from './create-document.dto';

export class UpdateDocumentWithFileDto {
    @ApiProperty({ description: 'Categoría del documento', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'category' debe ser un string" })
    category?: string;

    @ApiProperty({ description: 'Tipo de documento', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'documentType' debe ser un string" })
    documentType?: string;

    @ApiProperty({ description: 'Documento', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'document' debe ser un string" })
    document?: string;

    @ApiProperty({ description: 'Subdocumento', required: false, enum: SubdocumentDto })
    @IsOptional()
    @IsEnum(SubdocumentDto, { message: "El campo 'subdocument' debe ser un valor válido del enum SubdocumentDto" })
    subdocument?: SubdocumentDto;

    @ApiProperty({ description: 'Fecha de asentamiento', required: false })
    @IsOptional()
    @IsDateString({}, { message: "El campo 'settledDate' debe ser una fecha válida" })
    settledDate?: string;

    @ApiProperty({ description: 'Consecutivo único', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'consecutive' debe ser un string" })
    consecutive?: string;

    @ApiProperty({ description: 'Tipo de responsable', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'responsibleType' debe ser un string" })
    responsibleType?: string;

    @ApiProperty({ description: 'Responsable', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'responsible' debe ser un string" })
    responsible?: string;

    @ApiProperty({ description: 'Observaciones', required: false })
    @IsOptional()
    @IsString({ message: "El campo 'observations' debe ser un string" })
    observations?: string;

    @ApiProperty({
        description: 'Archivo del documento (opcional)',
        type: 'string',
        format: 'binary',
        required: false
    })
    file?: any;
}
