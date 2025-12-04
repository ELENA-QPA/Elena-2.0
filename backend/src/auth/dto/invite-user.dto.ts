import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsNotEmpty, IsString } from "class-validator";

export class InviteUserDto {

    @ApiProperty()
    @IsString({ message: "El campo 'nombre' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'nombre' es requerido" })
    name: string

    @ApiProperty()
    @IsString({ message: "El campo 'apellido' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'apellido' es requerido" })
    lastname: string

    @ApiProperty()
    @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    email: string;

    @ApiProperty()
    @IsString({ message: "El campo 'teléfono' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'teléfono' es requerido" })
    phone: string;

    @ApiProperty()
    @IsArray()
    roles: string[]
}