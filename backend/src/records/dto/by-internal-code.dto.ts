import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ByEtiquetaDto {
  @ApiProperty({
    description: 'Número de documento del cliente demandante',
    example: '12345678',
  })
  @IsString()
  @IsNotEmpty()
  etiqueta: string;
}
