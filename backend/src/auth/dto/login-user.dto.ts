import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';


export class LoginUserDto {
    @ApiProperty()
    @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    email: string;


    @ApiProperty()
    @IsString({ message: "El campo 'password' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'password' es requerido" })
    @MinLength(6)
    @MaxLength(50)
    @Matches(
        /(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
        message: 'La contraseña debe contener letras mayúsculas y minúsculas,números y un mínimo de 6 caracteres'
    })
    password: string;

    @ApiProperty()
    @IsArray(({ message: "El campo 'entidad de salud' debe ser un array" }))
    @IsOptional()
    // @IsNotEmpty({ message: "El campo 'entidad de salud' es requerido" })
    entidad: string[]

    // @ApiProperty()
    // @IsString()
    // @IsOptional()
    // central_de_mezclas: string
}