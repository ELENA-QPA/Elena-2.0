import { IsNotEmpty, IsString } from 'class-validator';

export class InternalCodeDto {
  @IsNotEmpty({ message: 'El código interno es requerido' })
  @IsString({ message: 'El código interno debe ser una cadena de texto' })
  internalCode: string;
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
