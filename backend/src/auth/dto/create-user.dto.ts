import { ApiProperty } from '@nestjs/swagger';
import {
  Allow,
  IsArray,
  IsBoolean,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty()
  @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
  @IsNotEmpty({ message: "El campo 'email' es requerido" })
  email: string;

  @ApiProperty()
  @IsString({ message: "El campo 'teléfono' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'teléfono' es requerido" })
  phone: string;

  @ApiProperty()
  @IsString({ message: "El campo 'password' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'password' es requerido" })
  @MinLength(6)
  @MaxLength(50)
  @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'La contraseña debe contener letras mayúsculas y minúsculas,números y un mínimo de 6 caracteres',
  })
  password: string;

  @ApiProperty()
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  roles: string[];

  // @ApiProperty()
  // @IsString({ message: "El campo 'registro médico' debe ser un string" })
  // @IsNotEmpty({ message: "El campo 'registro médico' es requerido" })
  // registro_medico: string

  @ApiProperty()
  @IsString({ message: "El campo 'nombre' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'nombre' es requerido" })
  name: string;

  @ApiProperty()
  @IsString({ message: "El campo 'apellido' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'apellido' es requerido" })
  lastname: string;

  // @ApiProperty()
  // @IsArray({ message: "El campo 'entidad de salud' debe ser un array" })
  // @IsOptional()
  // entidad_de_salud: string[]

  // @ApiProperty()
  // @IsString({ message: "El campo 'central de mezclas' debe ser un string" })
  // @IsNotEmpty({ message: "El campo 'central de mezclas' es requerido" })
  // central_de_mezclas: string

  @ApiProperty()
  @IsBoolean({ message: "El campo 'He leido' es boolean" })
  @IsNotEmpty({ message: "El campo 'He leido' es requerido" })
  he_leido: boolean;
}
