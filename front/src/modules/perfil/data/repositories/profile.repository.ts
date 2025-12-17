import { inject } from "inversify/lib/annotation/inject";
import { injectable } from "inversify/lib/annotation/injectable";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import { HttpClient, HttpStatusCode } from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import { Profile } from "../interface/profile.interface";
import { mapProfileApiToModel } from "../adapters/profile.adapter";

export abstract class ProfileRepository {
  abstract getMe(token?: string): Promise<Profile | null>;
  abstract updateMe(body: any): Promise<any>;
  abstract getUsersByRol(rol: string, token?: string): Promise<any>;
}

@injectable()
export class ProfileRepositoryImpl implements ProfileRepository {
  private httpClient: AxiosHttpClient;

  constructor(@inject(HttpClient) httpClient: AxiosHttpClient) {
    this.httpClient = httpClient;
  }

  async getMe(token?: string): Promise<Profile | null> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.profile.getMe,
        method: "get",
        token,
        isAuth: true,
      });
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
  // Log de depuración de la respuesta cruda
  // eslint-disable-next-line no-console
  console.log('[PROFILE_REPOSITORY][getMe] raw response keys:', axiosRequest.body ? Object.keys(axiosRequest.body) : 'body=null');
  // eslint-disable-next-line no-console
  console.log('[PROFILE_REPOSITORY][getMe] raw response sample:', axiosRequest.body);
  return mapProfileApiToModel(axiosRequest.body);
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al obtener el perfil");
      }
    } catch (error) {
      console.error("Error in getMe:", error);
      throw error;
    }
  }

  async updateMe(body: any): Promise<any> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.profile.updateMe,
  method: "patch",
        body: JSON.stringify(body),
        isAuth: true,
      });
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al actualizar el perfil");
      }
    } catch (error) {
      console.error("Error in updateMe:", error);
      throw error;
    }
  }

  async getUsersByRol(rol: string, token?: string): Promise<any> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.profile.getUsersByRol}/${rol}`,
        method: "get",
        token,
        isAuth: true,
      });
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al obtener usuarios por rol");
      }
    } catch (error) {
      console.error("Error in getUsersByRol:", error);
      throw error;
    }
  }
}
