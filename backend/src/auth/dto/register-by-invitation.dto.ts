import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsEmail, IsMongoId, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ObjectId } from 'mongoose';


export class RegisterByInvitationDto {


    @ApiProperty()
    @IsMongoId()
    id: ObjectId;

    @ApiProperty()
    @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    email: string;

    @ApiProperty()
    @IsString({ message: "El campo 'nombre' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'nombre' es requerido" })
    name: string

    @ApiProperty()
    @IsString({ message: "El campo 'apellido' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'apellido' es requerido" })
    lastname: string

    @ApiProperty()
    @IsString({ message: "El campo 'teléfono' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'teléfono' es requerido" })
    phone: string;

    @ApiProperty()
    @IsString()
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'The password must have a Uppercase, lowercase letter and a number'
    })
    password: string;

    @ApiProperty()
    @IsString({ message: "El campo 'registro ' debe ser un string" })
    @IsOptional()
    registro: string

    @ApiProperty()
    @IsArray({ message: "El campo 'entidad de salud' debe ser un array" })
    @IsOptional()
    entidad: string[]

    @ApiProperty()
    @IsBoolean({ message: "El campo 'He leido' es boolean" })
    @IsNotEmpty({ message: "El campo 'He leido' es requerido" })
    he_leido: boolean
}