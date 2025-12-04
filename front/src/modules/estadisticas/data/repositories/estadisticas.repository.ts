import { inject } from "inversify/lib/annotation/inject";
import { injectable } from "inversify/lib/annotation/injectable";
import { AxiosHttpClient } from "@/config/protocols/http/axios-http-client";
import { HttpClient, HttpStatusCode } from "@/config/protocols/http/http_utilities";
import { apiUrls } from "@/config/protocols/http/api_urls";
import {
  ActiveInactiveByMonthBody,
  LawsuitsHearingsByMonthBody,
  ProcessesByStateBody,
  ProcessesByStateYearBody,
  FinishedProcessesByStateYearBody,
  FiledLawsuitsByUserBody,
  DocumentationMonthlyBody,
  ProcessTrackingBody,
  ActiveInactiveByMonthSuccessResponse,
  LawsuitsHearingsByMonthSuccessResponse,
  ProcessesByStateSuccessResponse,
  ProcessesByStateYearSuccessResponse,
  FinishedProcessesByStateYearSuccessResponse,
  DepartmentCitySuccessResponse,
  PercentageByDepartmentSuccessResponse,
  FiledLawsuitsByUserSuccessResponse,
  DocumentationSuccessResponse,
  DocumentationMonthlySuccessResponse,
  ProcessTrackingSuccessResponse,
  EstadisticasErrorResponse,
} from "../interfaces/estadisticas.interface";
import {
  mapActiveInactiveByMonthResponse,
  mapLawsuitsHearingsByMonthResponse,
  mapProcessesByStateResponse,
  mapProcessesByStateYearResponse,
  mapFinishedProcessesByStateYearResponse,
} from "../adapters/estadisticas.adapter";

export abstract class EstadisticasRepository {
  abstract getActiveInactiveByMonth(
    data: ActiveInactiveByMonthBody,
    token?: string
  ): Promise<ActiveInactiveByMonthSuccessResponse | EstadisticasErrorResponse>;

  abstract getLawsuitsHearingsByMonth(
    data: LawsuitsHearingsByMonthBody,
    token?: string
  ): Promise<LawsuitsHearingsByMonthSuccessResponse | EstadisticasErrorResponse>;

  abstract getProcessesByState(
    data: ProcessesByStateBody,
    token?: string
  ): Promise<ProcessesByStateSuccessResponse | EstadisticasErrorResponse>;

  abstract getProcessesByStateYear(
    data: ProcessesByStateYearBody,
    token?: string
  ): Promise<ProcessesByStateYearSuccessResponse | EstadisticasErrorResponse>;

  abstract getFinishedProcessesByStateYear(
    data: FinishedProcessesByStateYearBody,
    token?: string
  ): Promise<FinishedProcessesByStateYearSuccessResponse | EstadisticasErrorResponse>;

  abstract getDepartmentCityMetrics(
    token?: string
  ): Promise<DepartmentCitySuccessResponse | EstadisticasErrorResponse>;

  abstract getPercentageByDepartment(
    token?: string
  ): Promise<PercentageByDepartmentSuccessResponse | EstadisticasErrorResponse>;

  abstract getFiledLawsuitsByUser(
    data: FiledLawsuitsByUserBody,
    token?: string
  ): Promise<FiledLawsuitsByUserSuccessResponse | EstadisticasErrorResponse>;

  abstract getDocumentationStatistics(
    token?: string
  ): Promise<DocumentationSuccessResponse | EstadisticasErrorResponse>;

  abstract getDocumentationMonthly(
    data: DocumentationMonthlyBody,
    token?: string
  ): Promise<DocumentationMonthlySuccessResponse | EstadisticasErrorResponse>;

  abstract getProcessTracking(
    data: ProcessTrackingBody,
    token?: string
  ): Promise<ProcessTrackingSuccessResponse | EstadisticasErrorResponse>;
}

@injectable()
export class EstadisticasRepositoryImpl implements EstadisticasRepository {
  constructor(@inject(HttpClient) private httpClient: AxiosHttpClient) {}

  async getActiveInactiveByMonth(
    data: ActiveInactiveByMonthBody,
    token?: string
  ): Promise<ActiveInactiveByMonthSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getActiveInactiveByMonth][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.activeInactiveByMonth,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getActiveInactiveByMonth][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapActiveInactiveByMonthResponse(axiosRequest.body);
        console.log("[ESTADISTICAS][getActiveInactiveByMonth][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas activos/inactivos por mes",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getActiveInactiveByMonth][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getActiveInactiveByMonth][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getActiveInactiveByMonth][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getLawsuitsHearingsByMonth(
    data: LawsuitsHearingsByMonthBody,
    token?: string
  ): Promise<LawsuitsHearingsByMonthSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getLawsuitsHearingsByMonth][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.lawsuitsHearingsByMonth,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getLawsuitsHearingsByMonth][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapLawsuitsHearingsByMonthResponse(axiosRequest.body);
        console.log("[ESTADISTICAS][getLawsuitsHearingsByMonth][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas de demandas y audiencias por mes",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getLawsuitsHearingsByMonth][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getLawsuitsHearingsByMonth][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getLawsuitsHearingsByMonth][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getProcessesByState(
    data: ProcessesByStateBody,
    token?: string
  ): Promise<ProcessesByStateSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getProcessesByState][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.processesByState,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getProcessesByState][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapProcessesByStateResponse(axiosRequest.body);
        console.log("[ESTADISTICAS][getProcessesByState][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas de procesos por estado",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getProcessesByState][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getProcessesByState][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getProcessesByState][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getProcessesByStateYear(
    data: ProcessesByStateYearBody,
    token?: string
  ): Promise<ProcessesByStateYearSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getProcessesByStateYear][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.processesByStateYear,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getProcessesByStateYear][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapProcessesByStateYearResponse(axiosRequest.body);
        console.log("[ESTADISTICAS][getProcessesByStateYear][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas de procesos por estado y año",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getProcessesByStateYear][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getProcessesByStateYear][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getProcessesByStateYear][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getFinishedProcessesByStateYear(
    data: FinishedProcessesByStateYearBody,
    token?: string
  ): Promise<FinishedProcessesByStateYearSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getFinishedProcessesByStateYear][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.finishedProcessesByStateYear,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getFinishedProcessesByStateYear][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response = mapFinishedProcessesByStateYearResponse(axiosRequest.body);
        console.log("[ESTADISTICAS][getFinishedProcessesByStateYear][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas de procesos finalizados por estado y año",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getFinishedProcessesByStateYear][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getFinishedProcessesByStateYear][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getFinishedProcessesByStateYear][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getDepartmentCityMetrics(
    token?: string
  ): Promise<DepartmentCitySuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getDepartmentCityMetrics][Request]: GET department city metrics");

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.departmentCityMetrics,
        method: "get",
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getDepartmentCityMetrics][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: DepartmentCitySuccessResponse = {
          data: axiosRequest.body
        };
        console.log("[ESTADISTICAS][getDepartmentCityMetrics][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener métricas por departamento y ciudad",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getDepartmentCityMetrics][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getDepartmentCityMetrics][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getDepartmentCityMetrics][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getPercentageByDepartment(
    token?: string
  ): Promise<PercentageByDepartmentSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getPercentageByDepartment][Request]: GET percentage by department");

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.percentageByDepartment,
        method: "get",
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getPercentageByDepartment][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: PercentageByDepartmentSuccessResponse = {
          data: axiosRequest.body
        };
        console.log("[ESTADISTICAS][getPercentageByDepartment][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener porcentajes por departamento",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getPercentageByDepartment][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getPercentageByDepartment][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getPercentageByDepartment][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getFiledLawsuitsByUser(
    data: FiledLawsuitsByUserBody,
    token?: string
  ): Promise<FiledLawsuitsByUserSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getFiledLawsuitsByUser][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.filedLawsuitsByUser,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getFiledLawsuitsByUser][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: FiledLawsuitsByUserSuccessResponse = {
          data: axiosRequest.body
        };
        console.log("[ESTADISTICAS][getFiledLawsuitsByUser][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener demandas radicadas por usuario",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getFiledLawsuitsByUser][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getFiledLawsuitsByUser][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getFiledLawsuitsByUser][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getDocumentationStatistics(
    token?: string
  ): Promise<DocumentationSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getDocumentationStatistics][Request]: GET documentation statistics");

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.documentation,
        method: "get",
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getDocumentationStatistics][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: DocumentationSuccessResponse = {
          data: {
            statistics: axiosRequest.body
          }
        };
        console.log("[ESTADISTICAS][getDocumentationStatistics][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas de documentación",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getDocumentationStatistics][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getDocumentationStatistics][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getDocumentationStatistics][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getDocumentationMonthly(
    data: DocumentationMonthlyBody,
    token?: string
  ): Promise<DocumentationMonthlySuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getDocumentationMonthly][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.documentationMonthly,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getDocumentationMonthly][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: DocumentationMonthlySuccessResponse = {
          data: axiosRequest.body
        };
        console.log("[ESTADISTICAS][getDocumentationMonthly][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener estadísticas mensuales de documentación",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getDocumentationMonthly][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getDocumentationMonthly][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getDocumentationMonthly][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }

  async getProcessTracking(
    data: ProcessTrackingBody,
    token?: string
  ): Promise<ProcessTrackingSuccessResponse | EstadisticasErrorResponse> {
    try {
      console.log("[ESTADISTICAS][getProcessTracking][Request]:", data);

      const axiosRequest = await this.httpClient.request({
        url: apiUrls.statistics.processTracking,
        method: "post",
        body: JSON.stringify(data),
        isAuth: true,
        token,
        headers: { "Content-Type": "application/json" },
      });

      console.log("[ESTADISTICAS][getProcessTracking][Response]:", axiosRequest);

      if (axiosRequest.statusCode === HttpStatusCode.ok || axiosRequest.statusCode === HttpStatusCode.created) {
        const response: ProcessTrackingSuccessResponse = {
          data: axiosRequest.body
        };
        console.log("[ESTADISTICAS][getProcessTracking][Mapped Response]:", response);
        return response;
      } else {
        const errorResponse: EstadisticasErrorResponse = {
          statusCode: axiosRequest.statusCode,
          message: axiosRequest.body.message || "Error al obtener seguimiento de procesos",
          error: axiosRequest.body.error || "Unknown Error",
        };
        console.log("[ESTADISTICAS][getProcessTracking][Error Response]:", errorResponse);
        return errorResponse;
      }
    } catch (error: any) {
      console.error("[ESTADISTICAS][getProcessTracking][Error]:", error);
      const errorResponse: EstadisticasErrorResponse = {
        statusCode: error.response?.status || 500,
        message: error.response?.data?.message || error.message || "Error inesperado",
        error: error.response?.data?.error || "Unknown Error",
      };
      console.log("[ESTADISTICAS][getProcessTracking][Catch Error Response]:", errorResponse);
      return errorResponse;
    }
  }
}
