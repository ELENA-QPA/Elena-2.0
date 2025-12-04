import { LoginResponse } from "../interfaces/login.response.interface";

export const loginResponseAdapter = (response: any): LoginResponse => ({
    // user: response.user,
    // email: response.email,
    role: response.role,
    accessToken: response.accessToken,
});