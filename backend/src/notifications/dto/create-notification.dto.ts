import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ObjectId } from 'mongoose';

export class CreateNotificationDto {
  @IsNotEmpty({ message: 'El campo audience es requerido' })
  @IsMongoId({ message: 'El campo audience debe ser un MongoId válido' })
  audience: ObjectId;
}
