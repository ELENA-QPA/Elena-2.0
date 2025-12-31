import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  @IsNotEmpty({ message: 'El campo audience es requerido' })
  @IsMongoId({ message: 'El campo audience debe ser un MongoId válido' })
  audience: Types.ObjectId;

  message?: string;
}
