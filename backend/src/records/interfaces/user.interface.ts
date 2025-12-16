import { ObjectId } from 'mongoose';

export interface IUser {
  _id: any;
  id: ObjectId;
  email: string;
  roles: string[];
}
