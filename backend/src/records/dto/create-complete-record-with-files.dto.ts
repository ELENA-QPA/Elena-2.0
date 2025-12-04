import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested, IsString, IsNotEmpty, ArrayMinSize } from 'class-validator';
import { CreateCompleteRecordDto } from './create-complete-record.dto';

export class CreateCompleteRecordWithFilesDto extends CreateCompleteRecordDto {
    @ApiProperty({
        description: 'Metadata del documento (REQUERIDO para generar código interno). Contiene información como categoría, tipo, etc. El archivo físico se sube en files.',
        type: 'array',
        required: true,
        minItems: 1,
        maxItems: 1,
        example: [{ "category": "Demanda", "documentType": "Escrito", "document": "Demanda", "subdocument": "Impulso procesal", "settledDate": "2025-01-15T10:30:00.000Z", "consecutive": "DOC-2025-001", "responsibleType": "Abogado", "responsible": "Juan Pérez" }]
    })
    @IsNotEmpty({ message: "El campo 'documents' es requerido para generar el consecutivo" })
    @IsArray({ message: "El campo 'documents' debe ser un array" })
    @ArrayMinSize(1, { message: "Se requiere un documento para generar el consecutivo" })
    documents: any[];

    @ApiProperty({
        description: 'Archivo físico del documento a subir (corresponde a la metadata en documents)',
        type: 'array',
        items: {
            type: 'string',
            format: 'binary',
        },
        required: true
    })
    @IsNotEmpty({ message: "Se requiere subir el archivo físico del documento" })
    files: any[];

    @ApiProperty({
        description: 'Información adicional de los archivos en formato JSON string',
        required: false,
        example: '[{"index": 0}]'
    })
    @IsOptional()
    @IsString()
    filesMetadata?: string;
}
