import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsMongoId, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateDocumentDto } from './create-document.dto';

export class CreateDocumentWithRecordDto {
    @ApiProperty({ description: 'ID del expediente al que pertenece el documento' })
    @IsString({ message: "El campo 'recordId' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'recordId' es requerido" })
    @IsMongoId({ message: "El campo 'recordId' debe ser un ID de MongoDB válido" })
    recordId: string;

    @ApiProperty({ description: 'Datos del documento', type: CreateDocumentDto })
    @ValidateNested()
    @Type(() => CreateDocumentDto)
    documentData: CreateDocumentDto;
}
