import { ObjectId } from 'mongoose';

export interface INotification {
  _id?: ObjectId;
  audience: ObjectId;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}
