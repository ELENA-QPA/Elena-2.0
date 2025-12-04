import { ObjectId } from "mongoose";

export interface IUser {
  id: ObjectId;
  email: string;
  roles: string[]

}