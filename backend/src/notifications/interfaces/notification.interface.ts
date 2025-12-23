import { ObjectId } from 'mongoose';

export interface INotification {
  _id?: ObjectId;
  audience: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}
