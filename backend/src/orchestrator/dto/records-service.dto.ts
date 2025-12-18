
import { IsNotEmpty, IsString } from 'class-validator';

export class InternalCodeDto {
  @IsNotEmpty({ message: 'El código interno es requerido' })
  @IsString({ message: 'El código interno debe ser una cadena de texto' })
  internalCode: string;
}

export class IdRecordDto{
  @IsNotEmpty({ message: 'El código interno es requerido' })
  @IsString({ message: 'El código interno debe ser una cadena de texto' })
  id: string;
}

