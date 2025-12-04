import { inject } from "inversify/lib/annotation/inject";
import { injectable } from "inversify/lib/annotation/injectable";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import { HttpClient, HttpStatusCode } from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import { Team } from "../interface/team.interface";
import { mapTeamApiToModel } from "../adapters/team.adapter";

export abstract class TeamRepository {
  abstract getMyGroup(token?: string): Promise<Team | null>;
  abstract updateMyGroup(body: any): Promise<any>;
  abstract removeMember(body: any): Promise<any>;
  abstract searchUserByTeam(query: string): Promise<any>;
}

@injectable()
export class TeamRepositoryImpl implements TeamRepository {
  private httpClient: AxiosHttpClient;

  constructor(@inject(HttpClient) httpClient: AxiosHttpClient) {
    this.httpClient = httpClient;
  }

  async getMyGroup(token?: string): Promise<Team | null> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.team.getMyGroup,
        method: "get",
        token,
        isAuth: true,
      });
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return mapTeamApiToModel(axiosRequest.body);
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al obtener el equipo");
      }
    } catch (error) {
      console.error("Error in getMyGroup:", error);
      throw error;
    }
  }

  async updateMyGroup(body: any): Promise<any> {
    try {
      console.log('[TEAM_REPOSITORY] updateMyGroup request:', body);
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.team.updateMyGroup,
        method: "patch", // ✅ CORREGIDO: PATCH según la documentación
        body: JSON.stringify(body),
        isAuth: true,
      });
      console.log('[TEAM_REPOSITORY] updateMyGroup response:', axiosRequest);
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al actualizar el equipo");
      }
    } catch (error) {
      console.error("Error in updateMyGroup:", error);
      throw error;
    }
  }

  async removeMember(body: any): Promise<any> {
    try {
      console.log('[TEAM_REPOSITORY] removeMember request:', body);
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.team.removeMember,
        method: "patch", // ✅ CORREGIDO: PATCH según la documentación
        body: JSON.stringify(body),
        isAuth: true,
      });
      console.log('[TEAM_REPOSITORY] removeMember response:', axiosRequest);
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al remover miembro");
      }
    } catch (error) {
      console.error("Error in removeMember:", error);
      throw error;
    }
  }

  async searchUserByTeam(query: string): Promise<any> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.team.searchUserByTeam}?query=${query}`,
        method: "get",
        isAuth: true,
      });
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        throw new CustomError(axiosRequest.body?.message || "Error al buscar usuario");
      }
    } catch (error) {
      console.error("Error in searchUserByTeam:", error);
      throw error;
    }
  }
}
