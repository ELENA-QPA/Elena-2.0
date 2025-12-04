import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsNotEmpty } from 'class-validator';

export class CreateProceduralPartForRecordDto {
    @ApiProperty({ description: 'Tipo de parte procesal' })
    @IsString({ message: "El campo 'partType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'partType' es requerido" })
    partType: string;

    @ApiProperty({ description: 'Nombre completo de la parte procesal' })
    @IsString({ message: "El campo 'name' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'name' es requerido" })
    name: string;

    @ApiProperty({ description: 'Tipo de documento' })
    @IsString({ message: "El campo 'documentType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'documentType' es requerido" })
    documentType: string;

    @ApiProperty({ description: 'Número de documento' })
    @IsString({ message: "El campo 'document' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'document' es requerido" })
    document: string;

    @ApiProperty({ description: 'Correo electrónico' })
    @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    email: string;

    @ApiProperty({ description: 'Número de contacto' })
    @IsString({ message: "El campo 'contact' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'contact' es requerido" })
    contact: string;
}
