import { IsNotEmpty, IsString } from 'class-validator';

export class EtiquetaDto {
  @IsNotEmpty({ message: 'La etiqueta es requerida' })
  @IsString({ message: 'La etiqueta debe ser una cadena de texto' })
  etiqueta: string;
}

export class IdRecordDto {
  @IsNotEmpty({ message: 'El id es requerido' })
  @IsString({ message: 'El id debe ser una cadena de texto' })
  id: string;
}

export class IdAudienceDto {
  @IsNotEmpty({ message: 'El id es requerido' })
  @IsString({ message: 'El id debe ser una cadena de texto' })
  id: string;
}

export class IdLawyerDto {
  @IsNotEmpty({ message: 'El id del abogado es requerido' })
  @IsString({ message: 'El id del abogado debe ser una cadena de texto' })
  lawyer: string;
}
