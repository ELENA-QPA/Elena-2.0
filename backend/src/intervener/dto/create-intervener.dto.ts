import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateIntervenerDto {
    @ApiProperty({ description: 'ID del expediente' })
    @IsMongoId({ message: "El campo 'record' debe ser un ID de MongoDB válido" })
    @IsNotEmpty({ message: "El campo 'record' es requerido" })
    record: string;

    @ApiProperty({ description: 'Tipo de interviniente' })
    @IsString({ message: "El campo 'intervenerType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'intervenerType' es requerido" })
    intervenerType: string;

    @ApiProperty({ description: 'Nombre completo del interviniente' })
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
