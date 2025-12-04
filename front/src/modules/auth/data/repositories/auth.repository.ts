import { injectable } from "inversify/lib/annotation/injectable";
import { inject } from "inversify/lib/annotation/inject";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import { HttpClient, HttpStatusCode } from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import {
  AuthResponse,
  ErrorResponse,
  RegisterSuccessResponse,
  LoginSuccessResponse,
  ForgotPasswordSuccessResponse,
  VerifyCodeSuccessResponse,
  SendActivationCodeSuccessResponse,
  InviteUserSuccessResponse,
  AcceptInvitationSuccessResponse,
  RegisterByActivationCodeSuccessResponse,
} from "../interfaces/auth-responses";

export abstract class AuthRepository {
  abstract login(data: any): Promise<LoginSuccessResponse | ErrorResponse>;
  abstract register(data: any): Promise<RegisterSuccessResponse | ErrorResponse>;
  abstract acceptInvitation(token: string): Promise<AcceptInvitationSuccessResponse | ErrorResponse>;
  abstract forgotPassword(data: { email: string }): Promise<ForgotPasswordSuccessResponse | ErrorResponse>;
  abstract sendActivationCodeToEmail(data: { email: string }): Promise<SendActivationCodeSuccessResponse | ErrorResponse>;
  abstract inviteUser(data: { name: string; lastname: string; email: string; phone: string; roles: string[] }): Promise<InviteUserSuccessResponse | ErrorResponse>;
  abstract registerByActivationCode(data: { name: string; lastname: string; email: string; phone: string; password: string; activationCode: string; roles: string[]; he_leido: boolean }): Promise<RegisterByActivationCodeSuccessResponse | ErrorResponse>;
  abstract registerByInvitation(data: { id?: string; token: string; email: string; name: string; lastname: string; phone: string; password: string; registro?: string; entidad?: string[]; he_leido: boolean }): Promise<RegisterByActivationCodeSuccessResponse | ErrorResponse>;
  abstract verifyCodeAndUpdatePassword(data: { email: string; verificationCode: string; password: string }): Promise<VerifyCodeSuccessResponse | ErrorResponse>;
}

@injectable()
export class AuthRepositoryImpl implements AuthRepository {
  constructor(@inject(HttpClient) private httpClient: AxiosHttpClient) {}

  async login(data: { email: string; password: string; entidad?: string[] }): Promise<LoginSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.login,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][login][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: axiosRequest.body.message || "Login exitoso",
          user: axiosRequest.body,
          token: axiosRequest.body.token,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al iniciar sesión",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][login][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async register(data: { email: string; phone: string; password: string; roles: string[]; name: string; lastname: string; he_leido: boolean }): Promise<RegisterSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.register,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][register][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: axiosRequest.body.message || "Usuario registrado exitosamente",
          user: axiosRequest.body.user,
          token: axiosRequest.body.token,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al registrar usuario",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][register][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async acceptInvitation(token: string): Promise<AcceptInvitationSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.auth.acceptInvitation}/${token}`,
        method: "get",
      });

      console.log("[AUTH][acceptInvitation][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return {
          _id: axiosRequest.body._id,
          name: axiosRequest.body.name,
          lastname: axiosRequest.body.lastname,
          email: axiosRequest.body.email,
          phone: axiosRequest.body.phone,
          isActive: axiosRequest.body.isActive,
          roles: axiosRequest.body.roles,
          entidad: axiosRequest.body.entidad,
          group_admin: axiosRequest.body.group_admin,
          createdAt: axiosRequest.body.createdAt,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al aceptar invitación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][acceptInvitation][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async forgotPassword(data: { email: string }): Promise<ForgotPasswordSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.forgotPassword,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][forgotPassword][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: typeof axiosRequest.body === 'string' ? axiosRequest.body : axiosRequest.body.message || "Código de verificación enviado al email",
          email: data.email,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al enviar código",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][forgotPassword][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async sendActivationCodeToEmail(data: { email: string }): Promise<SendActivationCodeSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.sendActivationCodeToEmail,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][sendActivationCodeToEmail][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return {
          message: axiosRequest.body.message || "Código de activación enviado al email",
          email: axiosRequest.body.email || data.email,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al enviar código de activación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][sendActivationCodeToEmail][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async inviteUser(data: { name: string; lastname: string; email: string; phone: string; roles: string[] }): Promise<InviteUserSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.inviteUser,
        method: "post",
        body: JSON.stringify(data),
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });

      console.log("[AUTH][inviteUser][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        // Para código 201, el mensaje viene directamente en el body como string
        // Para código 200, el mensaje viene en body.message
        const message = axiosRequest.statusCode === HttpStatusCode.created 
          ? (typeof axiosRequest.body === 'string' ? axiosRequest.body : axiosRequest.body.message || "Invitación enviada exitosamente")
          : (axiosRequest.body.message || "Invitación enviada exitosamente");
          
        return {
          message: message,
          invitation: axiosRequest.body.invitation,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al invitar usuario",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][inviteUser][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async registerByActivationCode(data: { name: string; lastname: string; email: string; phone: string; password: string; activationCode: string; roles: string[]; registro_medico?: string; entidad_de_salud?: string[]; central_de_mezclas?: string; he_leido: boolean }): Promise<RegisterByActivationCodeSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.registerByActivationCode,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][registerByActivationCode][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: axiosRequest.body.message || "Usuario registrado exitosamente",
          user: axiosRequest.body.user,
          token: axiosRequest.body.token,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al registrar por activación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][registerByActivationCode][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async registerByInvitation(data: { id?: string; token: string; email: string; name: string; lastname: string; phone: string; password: string; registro?: string; entidad?: string[]; he_leido: boolean }): Promise<RegisterByActivationCodeSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.registerByInvitation,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][registerByInvitation][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: axiosRequest.body.message || "Usuario registrado por invitación exitosamente",
          user: axiosRequest.body.user,
          token: axiosRequest.body.token,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al registrar por invitación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][registerByInvitation][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }

  async verifyCodeAndUpdatePassword(data: { email: string; verificationCode: string; password: string }): Promise<VerifyCodeSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.auth.verifyCodeAndUpdatePassword,
        method: "post",
        body: JSON.stringify(data),
      });

      console.log("[AUTH][verifyCodeAndUpdatePassword][Response]:", {
        statusCode: axiosRequest.statusCode,
        body: axiosRequest.body,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        return {
          message: axiosRequest.body.message || "Contraseña actualizada exitosamente",
          success: true,
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al actualizar contraseña",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[AUTH][verifyCodeAndUpdatePassword][Error]:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      return {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
    }
  }
}