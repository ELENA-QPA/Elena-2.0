import { UpdateUserBody, User } from "./user.interface";

export interface AuthResponse {
  message: string;
  token?: string;
  user?: UpdateUserBody;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
