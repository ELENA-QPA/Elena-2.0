import { injectable } from "inversify/lib/annotation/injectable";
import {
  Evento,
  AudienceCreate,
  AudienceUpdate,
  EventoForm,
  AudienceOrchestratorResponse,
} from "../interfaces/audiencias.interface";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import {
  HttpClient,
  HttpStatusCode,
} from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import { inject } from "inversify/lib/annotation/inject";
import {
  mapAudiencesToEvents,
  mapRecordToEvent,
} from "../adapters/audience.adapter";

export abstract class AudienceRepository {
  abstract getAll(token?: string): Promise<Evento[]>;

  abstract getAllByLawyer(lawyerId: string): Promise<Evento[]>;

  abstract getRecordByEtiqueta(etiqueta: string): Promise<EventoForm>;

  abstract createAudience(body: AudienceCreate): Promise<AudienceCreate>;

  abstract updateAudience(
    id: string,
    body: AudienceUpdate,
  ): Promise<AudienceUpdate>;

  abstract updateAudienceWithValidation(
    id: string,
    body: AudienceUpdate,
  ): Promise<AudienceUpdate>;

  abstract getAudienceById(
    AudienceId: string,
  ): Promise<AudienceOrchestratorResponse>;

  abstract deleteAudience(AudienceId: string): Promise<void>;

  abstract archiveFile(recordId: string): Promise<void>;
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
      method: "get",
      token,
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body.map(mapAudiencesToEvents);
    }

    throw new CustomError(response.body?.message || "Error fetching audiences");
  }

  async getAudienceById(
    AudienceId: string,
  ): Promise<AudienceOrchestratorResponse> {
    const response = await this.httpClient.request({
      url: apiUrls.orchestrator.getAudience,
      method: "post",
      body: JSON.stringify({ id: AudienceId }),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body;
    }

    throw new CustomError(response.body?.message || "Error fetching audiences");
  }

  async getAllByLawyer(lawyerId: string): Promise<Evento[]> {
    const response = await this.httpClient.request({
      url: apiUrls.orchestrator.getByLawyer,
      method: "post",
      body: JSON.stringify({ lawyer: lawyerId }),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.created) {
      return response.body.map(mapAudiencesToEvents);
    }

    throw new CustomError(
      response.body?.message || "Error fetching audiences by lawyer",
    );
  }

  async getRecordByEtiqueta(etiqueta: string): Promise<EventoForm> {
    const response = await this.httpClient.request({
      url: apiUrls.orchestrator.getRecordByInternal,
      method: "post",
      body: JSON.stringify({ etiqueta: etiqueta }),
      isAuth: true,
    });
    console.log("Response repository:", response.body);
    if (response.statusCode === HttpStatusCode.ok) {
      return mapRecordToEvent(response.body);
    }

    throw new CustomError(
      response.body?.message || "Error fetching by InternalCode",
    );
  }

  async createAudience(audience: AudienceCreate): Promise<AudienceCreate> {
    const response = await this.httpClient.request({
      url: apiUrls.audiencias.updateAudience,
      method: "post",
      body: JSON.stringify(audience),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.created) {
      return response.body;
    }

    throw new CustomError(response.body?.message || "Error creating audience");
  }

  async updateAudience(
    id: string,
    audience: AudienceUpdate,
  ): Promise<AudienceUpdate> {
    const response = await this.httpClient.request({
      url: `${apiUrls.audiencias.updateAudience}${id}`,
      method: "put",
      body: JSON.stringify(audience),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body;
    }

    throw new CustomError(response.body?.message || "Error updating audience");
  }

  async updateAudienceWithValidation(
    id: string,
    audience: AudienceUpdate,
  ): Promise<AudienceUpdate> {
    const response = await this.httpClient.request({
      url: `${apiUrls.audiencias.updateAudienceWithValidation}${id}`,
      method: "put",
      body: JSON.stringify(audience),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return response.body;
    }

    throw new CustomError(response.body?.message || "Error updating audience");
  }

  async deleteAudience(id: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `${apiUrls.audiencias.deleteAudience}${id}`,
      method: "delete",
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return;
    }

    throw new CustomError(response.body?.message || "Error updating audience");
  }

  async archiveFile(recordId: string): Promise<void> {
    const response = await this.httpClient.request({
      url: `${apiUrls.orchestrator.archiveFile}`,
      method: "put",
      body: JSON.stringify({ id: recordId }),
      isAuth: true,
    });

    if (response.statusCode === HttpStatusCode.ok) {
      return;
    }

    throw new CustomError(
      response.body?.message || "Error archivando el record",
    );
  }
}
