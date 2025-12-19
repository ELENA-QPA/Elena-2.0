import { injectable } from "inversify/lib/annotation/injectable";
import { Evento } from "../interfaces/audiencias.interface";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import { HttpClient, HttpStatusCode } from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import { inject } from "inversify/lib/annotation/inject";
import { mapAudienceToEvento } from "../adapters/audience.adapter";


export abstract class AudienceRepository {
  abstract getAll(token?: string): Promise<Evento[]>;
  abstract getAllByLawyer(
    lawyerId: string
  ): Promise<Evento[]>;
}

@injectable()
export class AudienceRepositoryImpl implements AudienceRepository {
  private httpClient: AxiosHttpClient;

  constructor(@inject(HttpClient) httpClient: AxiosHttpClient) {
    this.httpClient = httpClient;
  }

  async getAll(token?: string): Promise<Evento[]> {
    const response = await this.httpClient.request({
      url: apiUrls.orchestrator.getAll,
      method: 'get',
      token,
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body.map(mapAudienceToEvento);
    }

    throw new CustomError(
      response.body?.message || 'Error fetching audiences'
    );
  }

  async getAllByLawyer(
    lawyerId: string,
  ): Promise<Evento[]> {
    const response = await this.httpClient.request({
      url: apiUrls.orchestrator.getByLawyer,
      method: 'post',
      body: JSON.stringify({ lawyer: lawyerId }),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body.map(mapAudienceToEvento);
    }

    throw new CustomError(
      response.body?.message || 'Error fetching audiences by lawyer'
    );
  }
}