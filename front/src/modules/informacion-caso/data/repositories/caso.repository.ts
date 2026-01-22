import { inject } from "inversify/lib/annotation/inject";
import { injectable } from "inversify/lib/annotation/injectable";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import {
  HttpClient,
  HttpStatusCode,
} from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import { CustomError } from "@/data/errors/custom-error";
import {
  Caso,
  CreateCasoBody,
  UpdateCasoBody,
  UpdateDocumentBody,
  CreateDocumentBody,
  CreateIntervenerBody,
  CreateProceduralPartBody,
  CreatePaymentBody,
  CreateParameterBody,
  CreatePerformanceBody,
  SearchParametersBody,
  CasoResponse,
  CreateCasoSuccessResponse,
  GetCasoSuccessResponse,
  CasosPaginatedResponse,
  CreateDocumentSuccessResponse,
  CreateIntervenerSuccessResponse,
  CreateProceduralPartSuccessResponse,
  CreatePaymentSuccessResponse,
  CreateParameterSuccessResponse,
  ParametersPaginatedResponse,
  FileUploadResponse,
  MultipleFileUploadResponse,
  FileInfoResponse,
  CreatePerformanceSuccessResponse,
  DeletePerformanceSuccessResponse,
  ErrorResponse,
} from "../interfaces/caso.interface";
import {
  mapCreateCasoResponse,
  mapGetCasoResponse,
  mapCasosPaginatedResponse,
  mapCreateDocumentResponse,
  mapCreateIntervenerResponse,
  mapCreateProceduralPartResponse,
  mapCreatePaymentResponse,
  mapCreateParameterResponse,
  mapParametersPaginatedResponse,
  mapFileUploadResponse,
  mapMultipleFileUploadResponse,
  mapFileInfoResponse,
  mapCreatePerformanceResponse,
  mapDeletePerformanceResponse,
} from "../adapters/caso.adapter";

export abstract class CasoRepository {
  // Casos
  abstract createCaso(
    data: CreateCasoBody,
    token?: string,
  ): Promise<CreateCasoSuccessResponse | ErrorResponse>;
  abstract getAllCasos(
    limit?: number,
    offset?: number,
    token?: string,
  ): Promise<CasosPaginatedResponse | ErrorResponse>;
  abstract getCasoById(
    id: string,
    token?: string,
  ): Promise<GetCasoSuccessResponse | ErrorResponse>;
  // Actualiza solamente la información general del caso
  abstract updateCaso(
    id: string,
    data: UpdateCasoBody,
    token?: string,
  ): Promise<GetCasoSuccessResponse | ErrorResponse>;
  // Elimina el caso y todas sus relaciones
  abstract deleteCaso(
    id: string,
    token?: string,
  ): Promise<{ message: string } | ErrorResponse>;

  // Documentos
  abstract createDocument(
    data: CreateDocumentBody,
    token?: string,
  ): Promise<CreateDocumentSuccessResponse | ErrorResponse>;
  abstract updateDocument(
    id: string,
    data: UpdateDocumentBody,
    token?: string,
  ): Promise<any>;
  abstract deleteDocument(id: string, token?: string): Promise<any>;

  // Intervinientes
  abstract createIntervener(
    data: CreateIntervenerBody,
    token?: string,
  ): Promise<CreateIntervenerSuccessResponse | ErrorResponse>;
  abstract updateIntervener(
    id: string,
    data: CreateIntervenerBody,
    token?: string,
  ): Promise<any>;
  abstract deleteIntervener(id: string, token?: string): Promise<any>;

  // Partes Procesales
  abstract createProceduralPart(
    data: CreateProceduralPartBody,
    token?: string,
  ): Promise<CreateProceduralPartSuccessResponse | ErrorResponse>;
  abstract updateProceduralPart(
    id: string,
    data: CreateProceduralPartBody,
    token?: string,
  ): Promise<any>;
  abstract deleteProceduralPart(id: string, token?: string): Promise<any>;

  // Pagos
  abstract createPayment(
    data: CreatePaymentBody,
    token?: string,
  ): Promise<CreatePaymentSuccessResponse | ErrorResponse>;
  abstract updatePayment(
    id: string,
    data: CreatePaymentBody,
    token?: string,
  ): Promise<any>;
  abstract deletePayment(id: string, token?: string): Promise<any>;

  // Parámetros
  abstract createParameter(
    data: CreateParameterBody,
    token?: string,
  ): Promise<CreateParameterSuccessResponse | ErrorResponse>;
  abstract searchParameters(
    data: SearchParametersBody,
    limit?: number,
    offset?: number,
    token?: string,
  ): Promise<ParametersPaginatedResponse | ErrorResponse>;
  abstract deleteParameter(id: string, token?: string): Promise<any>;

  // Archivos
  abstract uploadSingleFile(
    file: File,
    token?: string,
  ): Promise<FileUploadResponse | ErrorResponse>;
  abstract uploadMultipleFiles(
    files: File[],
    token?: string,
  ): Promise<MultipleFileUploadResponse | ErrorResponse>;
  abstract deleteFile(s3Key: string, token?: string): Promise<any>;
  abstract getFileInfo(
    token?: string,
  ): Promise<FileInfoResponse | ErrorResponse>;

  // Actuaciones / Performances
  abstract createPerformance(
    data: CreatePerformanceBody,
    token?: string,
  ): Promise<CreatePerformanceSuccessResponse | ErrorResponse>;
  abstract deletePerformance(
    id: string,
    token?: string,
  ): Promise<DeletePerformanceSuccessResponse | ErrorResponse>;

  // Actuaciones de Monolegal
  abstract getActuacionesMonolegal(
    radicado: string,
    token?: string,
  ): Promise<any[]>;
}

@injectable()
export class CasoRepositoryImpl implements CasoRepository {
  constructor(@inject(HttpClient) private httpClient: AxiosHttpClient) {}

  // Casos
  async createCaso(
    data: CreateCasoBody,
    token?: string,
  ): Promise<CreateCasoSuccessResponse | ErrorResponse> {
    try {
      // Crear FormData para envío multipart
      const formData = new FormData();

      // Agregar campos básicos
      formData.append("clientType", data.clientType);
      // formData.append('consecutive', "");
      formData.append("responsible", data.responsible);
      formData.append("department", data.department);
      // Ciudad y número de radicado (si vienen)
      if (data.city) formData.append("city", data.city);
      if ((data as any).numeroRadicado)
        formData.append("numeroRadicado", (data as any).numeroRadicado);
      formData.append("personType", data.personType);
      formData.append("jurisdiction", data.jurisdiction);
      formData.append("processType", data.processType);
      formData.append("despachoJudicial", data.despachoJudicial);
      formData.append("radicado", data.radicado);
      formData.append("country", data.country);
      if (data.location) formData.append("location", data.location);
      // 'estado' no debe enviarse en la creación desde el frontend - lo maneja el backend

      // Agregar arrays como JSON strings
      formData.append("documents", JSON.stringify(data.documents));
      formData.append("interveners", JSON.stringify(data.interveners));
      formData.append("proceduralParts", JSON.stringify(data.proceduralParts));
      formData.append("payments", JSON.stringify(data.payments)); // Agregar archivos si existen
      if (data.files && data.files.length > 0) {
        data.files.forEach((file, index) => {
          if (file instanceof File) {
            formData.append("files", file);
          } else if (typeof file === "string") {
            formData.append("files", file);
          }
        });
      }

      // Agregar metadata de archivos
      if (data.filesMetadata) {
        formData.append("filesMetadata", data.filesMetadata);
      }

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.casos.create,
        method: "post",
        body: formData,
        // isAuth: true,
        token,
        isMultipart: true,
      });

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreateCasoResponse(axiosRequest.body);
        console.log("[CASOS][createCaso][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear caso",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[CASOS][createCaso][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[CASOS][createCaso][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[CASOS][createCaso][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getAllCasos(
    limit: number = 10,
    offset: number = 0,
    token?: string,
  ): Promise<CasosPaginatedResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.casos.getAll}?limit=${limit}&offset=${offset}`,
        method: "post",
        isAuth: true,
        token,
      });

      if (
        axiosRequest.statusCode === HttpStatusCode.ok ||
        axiosRequest.statusCode === HttpStatusCode.created
      ) {
        const response = mapCasosPaginatedResponse(axiosRequest.body);
        console.log("[CASOS][getAllCasos][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener casos",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[CASOS][getAllCasos][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[CASOS][getAllCasos][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[CASOS][getAllCasos][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getCasoById(
    id: string,
    token?: string,
  ): Promise<GetCasoSuccessResponse | ErrorResponse> {
    try {
      console.log("[CASOS][getCasoById][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.casos.getOne}/${id}`,
        method: "get",
        isAuth: true,
        token,
      });

      console.log("[CASOS][getCasoById][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const response = mapGetCasoResponse(axiosRequest.body);

        console.log("[CASOS][getCasoById][Mapped Response]:", response);
        return response;
      } else {
        return {
          error: true,
          message: `Error: Status code ${axiosRequest.statusCode}`,
          statusCode: axiosRequest.statusCode,
        } as unknown as ErrorResponse;
      }
    } catch (error: any) {
      console.error("[DEBUG] Error capturado en catch");
      console.error("[DEBUG] Error completo:", error);
      console.error("[DEBUG] Error.message:", error.message);
      console.error("[DEBUG] Error.stack:", error.stack);

      return {
        error: true,
        message: error.message || "Error desconocido",
        statusCode: error.statusCode || 500,
      } as unknown as ErrorResponse;
    }
  }

  async updateCaso(
    id: string,
    data: UpdateCasoBody,
    token?: string,
  ): Promise<GetCasoSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.casos.update}/${id}`,
        method: "patch",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const response = mapGetCasoResponse(axiosRequest.body);

        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al actualizar caso",
          error: axiosRequest.body.error || "Unknown Error",
        };
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[CASOS][updateCaso][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      return errorResponse;
    }
  }

  async deleteCaso(
    id: string,
    token?: string,
  ): Promise<{ message: string } | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.casos.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return {
          message: axiosRequest.body.message || "Caso eliminado exitosamente",
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body?.message || "Error al eliminar caso",
          error: axiosRequest.body?.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[CASOS][deleteCaso][Catch Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          "Error inesperado al eliminar caso",
        error: error.response?.data?.error || "Unknown Error",
      };
      return errorResponse;
    }
  }

  // Documentos
  async createDocument(
    data: CreateDocumentBody,
    token?: string,
  ): Promise<CreateDocumentSuccessResponse | ErrorResponse> {
    try {
      console.log("[DOCUMENT][llamando create document]");
      const formData = new FormData();
      formData.append("recordId", data.recordId);
      formData.append("category", data.category);
      formData.append("documentType", data.documentType);
      formData.append("document", data.document);
      formData.append("subdocument", data.subdocument);
      formData.append("settledDate", data.settledDate);
      formData.append("consecutive", data.consecutive);
      formData.append("responsibleType", data.responsibleType);
      formData.append("responsible", data.responsible);
      if (data.observations) formData.append("observations", data.observations);
      if ((data as any).file) {
        try {
          // Si es File, append directo
          if ((data as any).file instanceof File) {
            formData.append("file", (data as any).file);
          } else {
            // Si viene como string, enviarlo como field para que backend lo maneje
            formData.append("file", (data as any).file);
          }
        } catch (err) {
          console.warn("[DOCUMENT][createDocument] file append failed:", err);
        }
      }

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.document.create,
        method: "post",
        body: formData,
        isAuth: true,
        token,
        isMultipart: true,
      });

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreateDocumentResponse(axiosRequest.body);
        console.log("[DOCUMENT][createDocument][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear documento",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[DOCUMENT][createDocument][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error) {
      console.error("[DOCUMENT][createDocument][Catch Error]:", error);
      return {
        statusCode: 500,
        message: "Error inesperado al crear documento",
        error: "Internal Server Error",
      };
    }
  }

  async updateDocument(
    id: string,
    data: UpdateDocumentBody,
    token?: string,
  ): Promise<any> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.document.update}/${id}`,
        method: "patch",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        isMultipart: false,
      });

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al actualizar documento",
        );
        throw error;
      }
    } catch (error) {
      console.error("[DOCUMENT][updateDocument][Catch Error]:", error);
      throw error;
    }
  }

  async deleteDocument(id: string, token?: string): Promise<any> {
    try {
      console.log("[DOCUMENT][deleteDocument][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.document.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[DOCUMENT][deleteDocument][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log("[DOCUMENT][deleteDocument][Success]:", axiosRequest.body);
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar documento",
        );
        console.log("[DOCUMENT][deleteDocument][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[DOCUMENT][deleteDocument][Catch Error]:", error);
      throw error;
    }
  }

  // Intervinientes
  async createIntervener(
    data: CreateIntervenerBody,
    token?: string,
  ): Promise<CreateIntervenerSuccessResponse | ErrorResponse> {
    try {
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.intervener.create,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[INTERVENER][createIntervener][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        try {
          const response = mapCreateIntervenerResponse(axiosRequest.body);
          console.log(
            "[INTERVENER][createIntervener][Mapped Response]:",
            response,
          );
          return response;
        } catch (mappingError: any) {
          console.error(
            "[INTERVENER][createIntervener][Mapping Error]:",
            mappingError,
          );
          console.error(
            "[INTERVENER][createIntervener][Raw Response Body]:",
            axiosRequest.body,
          );
          const errorResponse = {
            statusCode: 500,
            message: `Error al procesar respuesta del servidor: ${mappingError.message}`,
            error: "Mapping Error",
          };
          return errorResponse;
        }
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear interviniente",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[INTERVENER][createIntervener][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[INTERVENER][createIntervener][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[INTERVENER][createIntervener][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async updateIntervener(
    id: string,
    data: CreateIntervenerBody,
    token?: string,
  ): Promise<any> {
    try {
      console.log("[INTERVENER][updateIntervener][Request]:", { id, data });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.intervener.update}/${id}`,
        method: "patch",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[INTERVENER][updateIntervener][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log(
          "[INTERVENER][updateIntervener][Success]:",
          axiosRequest.body,
        );
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al actualizar interviniente",
        );
        console.log("[INTERVENER][updateIntervener][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[INTERVENER][updateIntervener][Catch Error]:", error);
      throw error;
    }
  }

  async deleteIntervener(id: string, token?: string): Promise<any> {
    try {
      console.log("[INTERVENER][deleteIntervener][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.intervener.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[INTERVENER][deleteIntervener][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log(
          "[INTERVENER][deleteIntervener][Success]:",
          axiosRequest.body,
        );
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar interviniente",
        );
        console.log("[INTERVENER][deleteIntervener][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[INTERVENER][deleteIntervener][Catch Error]:", error);
      throw error;
    }
  }

  // Partes Procesales
  async createProceduralPart(
    data: CreateProceduralPartBody,
    token?: string,
  ): Promise<CreateProceduralPartSuccessResponse | ErrorResponse> {
    try {
      console.log("[PROCEDURAL_PART][createProceduralPart][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.proceduralPart.create,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log(
        "[PROCEDURAL_PART][createProceduralPart][Response]:",
        axiosRequest,
      );

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreateProceduralPartResponse(axiosRequest.body);
        console.log(
          "[PROCEDURAL_PART][createProceduralPart][Mapped Response]:",
          response,
        );
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear parte procesal",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[PROCEDURAL_PART][createProceduralPart][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[PROCEDURAL_PART][createProceduralPart][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[PROCEDURAL_PART][createProceduralPart][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async updateProceduralPart(
    id: string,
    data: CreateProceduralPartBody,
    token?: string,
  ): Promise<any> {
    try {
      console.log("[PROCEDURAL_PART][updateProceduralPart][Request]:", {
        id,
        data,
      });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.proceduralPart.update}/${id}`,
        method: "patch",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log(
        "[PROCEDURAL_PART][updateProceduralPart][Response]:",
        axiosRequest,
      );

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log(
          "[PROCEDURAL_PART][updateProceduralPart][Success]:",
          axiosRequest.body,
        );
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al actualizar parte procesal",
        );
        console.log("[PROCEDURAL_PART][updateProceduralPart][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error(
        "[PROCEDURAL_PART][updateProceduralPart][Catch Error]:",
        error,
      );
      throw error;
    }
  }

  async deleteProceduralPart(id: string, token?: string): Promise<any> {
    try {
      console.log("[PROCEDURAL_PART][deleteProceduralPart][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.proceduralPart.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log(
        "[PROCEDURAL_PART][deleteProceduralPart][Response]:",
        axiosRequest,
      );

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log(
          "[PROCEDURAL_PART][deleteProceduralPart][Success]:",
          axiosRequest.body,
        );
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar parte procesal",
        );
        console.log("[PROCEDURAL_PART][deleteProceduralPart][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error(
        "[PROCEDURAL_PART][deleteProceduralPart][Catch Error]:",
        error,
      );
      throw error;
    }
  }

  // Pagos
  async createPayment(
    data: CreatePaymentBody,
    token?: string,
  ): Promise<CreatePaymentSuccessResponse | ErrorResponse> {
    try {
      console.log("[PAYMENT][createPayment][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.payment.create,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[PAYMENT][createPayment][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreatePaymentResponse(axiosRequest.body);
        console.log("[PAYMENT][createPayment][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear pago",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[PAYMENT][createPayment][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[PAYMENT][createPayment][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[PAYMENT][createPayment][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async updatePayment(
    id: string,
    data: CreatePaymentBody,
    token?: string,
  ): Promise<any> {
    try {
      console.log("[PAYMENT][updatePayment][Request]:", { id, data });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.payment.update}/${id}`,
        method: "patch",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[PAYMENT][updatePayment][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log("[PAYMENT][updatePayment][Success]:", axiosRequest.body);
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al actualizar pago",
        );
        console.log("[PAYMENT][updatePayment][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[PAYMENT][updatePayment][Catch Error]:", error);
      throw error;
    }
  }

  async deletePayment(id: string, token?: string): Promise<any> {
    try {
      console.log("[PAYMENT][deletePayment][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.payment.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[PAYMENT][deletePayment][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log("[PAYMENT][deletePayment][Success]:", axiosRequest.body);
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar pago",
        );
        console.log("[PAYMENT][deletePayment][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[PAYMENT][deletePayment][Catch Error]:", error);
      throw error;
    }
  }

  // Parámetros
  async createParameter(
    data: CreateParameterBody,
    token?: string,
  ): Promise<CreateParameterSuccessResponse | ErrorResponse> {
    try {
      console.log("[PARAMETER][createParameter][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.parameter.create,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[PARAMETER][createParameter][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreateParameterResponse(axiosRequest.body);
        console.log("[PARAMETER][createParameter][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear parámetro",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[PARAMETER][createParameter][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[PARAMETER][createParameter][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[PARAMETER][createParameter][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async searchParameters(
    data: SearchParametersBody,
    limit: number = 10,
    offset: number = 0,
    token?: string,
  ): Promise<ParametersPaginatedResponse | ErrorResponse> {
    try {
      console.log("[PARAMETER][searchParameters][Request]:", {
        data,
        limit,
        offset,
      });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.parameter.search}?limit=${limit}&offset=${offset}`,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
      });

      console.log("[PARAMETER][searchParameters][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const response = mapParametersPaginatedResponse(axiosRequest.body);
        console.log(
          "[PARAMETER][searchParameters][Mapped Response]:",
          response,
        );
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al buscar parámetros",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[PARAMETER][searchParameters][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[PARAMETER][searchParameters][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[PARAMETER][searchParameters][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async deleteParameter(id: string, token?: string): Promise<any> {
    try {
      console.log("[PARAMETER][deleteParameter][Request]:", { id });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.parameter.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[PARAMETER][deleteParameter][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log(
          "[PARAMETER][deleteParameter][Success]:",
          axiosRequest.body,
        );
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar parámetro",
        );
        console.log("[PARAMETER][deleteParameter][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[PARAMETER][deleteParameter][Catch Error]:", error);
      throw error;
    }
  }

  // Archivos
  async uploadSingleFile(
    file: File,
    token?: string,
  ): Promise<FileUploadResponse | ErrorResponse> {
    try {
      console.log("[FILE_UPLOAD][uploadSingleFile][Request]:", {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      });

      const formData = new FormData();
      formData.append("file", file);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.fileUpload.single,
        method: "post",
        body: formData,
        isAuth: true,
        isMultipart: true,
        token,
      });

      console.log("[FILE_UPLOAD][uploadSingleFile][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapFileUploadResponse(axiosRequest.body);
        console.log(
          "[FILE_UPLOAD][uploadSingleFile][Mapped Response]:",
          response,
        );
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al subir archivo",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[FILE_UPLOAD][uploadSingleFile][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[FILE_UPLOAD][uploadSingleFile][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[FILE_UPLOAD][uploadSingleFile][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async uploadMultipleFiles(
    files: File[],
    token?: string,
  ): Promise<MultipleFileUploadResponse | ErrorResponse> {
    try {
      console.log("[FILE_UPLOAD][uploadMultipleFiles][Request]:", {
        fileCount: files.length,
        files: files.map((f) => ({ name: f.name, size: f.size, type: f.type })),
      });

      const formData = new FormData();
      files.forEach((file, index) => {
        formData.append("files", file);
      });

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.fileUpload.multiple,
        method: "post",
        body: formData,
        isAuth: true,
        isMultipart: true,
        token,
      });

      console.log(
        "[FILE_UPLOAD][uploadMultipleFiles][Response]:",
        axiosRequest,
      );

      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapMultipleFileUploadResponse(axiosRequest.body);
        console.log(
          "[FILE_UPLOAD][uploadMultipleFiles][Mapped Response]:",
          response,
        );
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al subir archivos",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[FILE_UPLOAD][uploadMultipleFiles][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[FILE_UPLOAD][uploadMultipleFiles][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[FILE_UPLOAD][uploadMultipleFiles][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  async deleteFile(s3Key: string, token?: string): Promise<any> {
    try {
      console.log("[FILE_UPLOAD][deleteFile][Request]:", { s3Key });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.fileUpload.delete}/${s3Key}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[FILE_UPLOAD][deleteFile][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        console.log("[FILE_UPLOAD][deleteFile][Success]:", axiosRequest.body);
        return axiosRequest.body;
      } else {
        const error = new CustomError(
          axiosRequest.body?.message || "Error al eliminar archivo",
        );
        console.log("[FILE_UPLOAD][deleteFile][Error]:", error);
        throw error;
      }
    } catch (error) {
      console.error("[FILE_UPLOAD][deleteFile][Catch Error]:", error);
      throw error;
    }
  }

  async getFileInfo(token?: string): Promise<FileInfoResponse | ErrorResponse> {
    try {
      console.log("[FILE_UPLOAD][getFileInfo][Request]:", {});

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.fileUpload.info,
        method: "post",
        isAuth: true,
        token,
      });

      console.log("[FILE_UPLOAD][getFileInfo][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const response = mapFileInfoResponse(axiosRequest.body);
        console.log("[FILE_UPLOAD][getFileInfo][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse = {
          statusCode: axiosRequest.statusCode,
          message:
            axiosRequest.body.message ||
            "Error al obtener información de archivos",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log(
          "[FILE_UPLOAD][getFileInfo][Error Response]:",
          errorResponse,
        );
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[FILE_UPLOAD][getFileInfo][Error]:", error);
      const errorResponse = {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log(
        "[FILE_UPLOAD][getFileInfo][Catch Error Response]:",
        errorResponse,
      );
      return errorResponse;
    }
  }

  // Actuaciones / Performances
  async createPerformance(
    data: CreatePerformanceBody,
    token?: string,
  ): Promise<CreatePerformanceSuccessResponse | ErrorResponse> {
    try {
      console.log("[PERFORMANCE][createPerformance][Request]:", data);
      const axiosRequest = await this.httpClient.request({
        url: apiUrls.performance.create,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[PERFORMANCE][createPerformance][Response]:", axiosRequest);
      if (axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapCreatePerformanceResponse(axiosRequest.body);
        console.log("[PERFORMANCE][createPerformance][Mapped]:", response);
        return response;
      } else if (axiosRequest.statusCode === HttpStatusCode.badRequest) {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Transición de estado inválida",
          error: axiosRequest.body.error || "Bad Request",
        };
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al crear actuación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[PERFORMANCE][createPerformance][Error]:", error);
      return {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          "Error inesperado al crear actuación",
        error: error.response?.data?.error || "Internal Server Error",
      };
    }
  }

  async deletePerformance(
    id: string,
    token?: string,
  ): Promise<DeletePerformanceSuccessResponse | ErrorResponse> {
    try {
      console.log("[PERFORMANCE][deletePerformance][Request]:", { id });
      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.performance.delete}/${id}`,
        method: "delete",
        isAuth: true,
        token,
      });

      console.log("[PERFORMANCE][deletePerformance][Response]:", axiosRequest);
      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const response = mapDeletePerformanceResponse(axiosRequest.body);
        console.log("[PERFORMANCE][deletePerformance][Mapped]:", response);
        return response;
      } else {
        return {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al eliminar actuación",
          error: axiosRequest.body.error || "Unknown Error",
        };
      }
    } catch (error: any) {
      console.error("[PERFORMANCE][deletePerformance][Error]:", error);
      return {
        statusCode: error.response?.status || 500,
        message:
          error.response?.data?.message ||
          error.message ||
          "Error inesperado al eliminar actuación",
        error: error.response?.data?.error || "Internal Server Error",
      };
    }
  }

  // Actuaciones de Monolegal
  async getActuacionesMonolegal(
    radicado: string,
    token?: string,
  ): Promise<any[]> {
    try {
      console.log("[MONOLEGAL][getActuacionesMonolegal][Request]:", {
        radicado,
      });

      const axiosRequest = await this.httpClient.request({
        url: `${apiUrls.monolegal.actuaciones}/${radicado}`,
        method: "get",
        isAuth: true,
        token,
      });

      console.log(
        "[MONOLEGAL][getActuacionesMonolegal][Response]:",
        axiosRequest,
      );

      if (axiosRequest.statusCode === HttpStatusCode.ok) {
        const actuaciones = axiosRequest.body || [];
        console.log(
          "[MONOLEGAL][getActuacionesMonolegal][Success]:",
          actuaciones.length,
          "actuaciones",
        );
        return actuaciones;
      } else {
        console.error(
          "[MONOLEGAL][getActuacionesMonolegal][Error]:",
          axiosRequest.body,
        );
        return [];
      }
    } catch (error: any) {
      console.error(
        "[MONOLEGAL][getActuacionesMonolegal][Catch Error]:",
        error,
      );
      return [];
    }
  }
}
