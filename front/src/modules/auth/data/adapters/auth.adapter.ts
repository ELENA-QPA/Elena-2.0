import { AuthResponse } from "../interfaces/auth.interface";

export function mapAuthApiToModel(api: any): AuthResponse {
  return {
    message: api.message,
    token: api.token,
    user: api.user ? {
      email: api.user.email,
      name: api.user.name,
      lastname: api.user.lastname,
      roles: api.user.roles,
    } : undefined,
  };
}
