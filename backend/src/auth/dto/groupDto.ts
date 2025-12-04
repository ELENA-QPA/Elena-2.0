import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsEmail, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GroupDto {

    @ApiProperty()
    @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    @IsNotEmpty({ message: "El campo 'email' es requerido" })
    email: string;

    @ApiProperty()
    @IsArray({ message: "El campo 'roles' debe ser un array" })
    @IsOptional()
    roles: string[]

    @ApiProperty()
    @IsString({ message: "El campo group_admin debe ser un string" })
    @IsNotEmpty({ message: "El campo 'group_admin' es requerido" })
    group_admin: string
}