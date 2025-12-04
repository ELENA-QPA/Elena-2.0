import { ApiProperty } from '@nestjs/swagger/dist';
import { IsEmail, IsString, MinLength, MaxLength, IsOptional, IsArray, IsBoolean, IsNotEmpty } from 'class-validator';

export class CreateUserByEmailDto {

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
  phone: string

  @ApiProperty()
  @IsString()
  @MinLength(6)
  @MaxLength(50)
  // @Matches(/(?:(?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
  //   message:
  //     'The password must have a Uppercase, lowercase letter and a number',
  // })
  password: string

  @ApiProperty()
  @IsString({ message: "El campo 'activationCode' debe ser un array" })
  activationCode: string

  @ApiProperty()
  @IsArray({ message: "El campo 'roles' debe ser un array" })
  roles: string[]

  @ApiProperty()
  @IsString({ message: "El campo 'registro médico' debe ser un string" })
  @IsNotEmpty({ message: "El campo 'registro médico' es requerido" })
  registro_medico: string



  @ApiProperty()
  @IsArray({ message: "El campo 'entidad de salud' debe ser un array" })
  @IsOptional()
  entidad_de_salud: string[]

  @ApiProperty()
  @IsString({ message: "El campo 'central de mezclas' debe ser un string" })
  @IsOptional()
  central_de_mezclas: string

  @ApiProperty()
  @IsBoolean({ message: "El campo 'He leido' es boolean" })
  @IsNotEmpty({ message: "El campo 'He leido' es requerido" })
  he_leido: boolean
}
