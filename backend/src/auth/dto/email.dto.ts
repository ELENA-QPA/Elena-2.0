import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class EmailDto {

  @ApiProperty()
  @IsEmail({}, { message: "El campo 'email' debe ser un email válido" })
  @IsNotEmpty({ message: "El campo 'email' es requerido" })
  email: string;

}
