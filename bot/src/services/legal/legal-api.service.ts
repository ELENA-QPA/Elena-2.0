/**
 * Servicios para APIs legales de QP Alliance
 */

import { HttpClient } from "../http/http-client.js";
import {
  CasesResponse,
  ProcessDetailsResponse,
  DetailedCasesResponse,
  TransformedDetailedCasesResponse,
} from "../../interfaces/legal.js";
import { config } from "../../config/env.js";
import {
  ProcessNotFoundError,
  NoProcessesFoundError,
  ApiConnectionError,
  InvalidApiResponseError,
} from "../../interfaces/errors.js";
import { logger, createLogContext } from "../logger.service.js";

export interface LegalApiService {
  getCasesByDocument(documentNumber: string): Promise<CasesResponse>;
  getProcessDetails(etiqueta: string): Promise<ProcessDetailsResponse>;
  getAllCasesWithDetails(
    documentNumber: string
  ): Promise<TransformedDetailedCasesResponse>;
  getActuaciones(idProceso: string): Promise<any[]>;
}

/**
 * Implementación real del servicio de API legal usando QP Alliance
 */
export class QpAllianceLegalApiService implements LegalApiService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient(config.apiBaseUrl, config.apiKey);
  }

  /**
   * Obtiene casos por número de documento usando la API real
   */
  async getCasesByDocument(documentNumber: string): Promise<CasesResponse> {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "QP_ALLIANCE_API",
      "GET_CASES"
    );

    logger.info(
      `Consultando procesos por documento: "${documentNumber}"`,
      logContext
    );

    const request = {
      document: documentNumber.trim(),
    };

    try {
      const response = await this.httpClient.post<any>(
        config.endpoints.recordsByClient,
        request
      );

      logger.debug("Respuesta recibida de la API", logContext);

      // Transformar respuesta de QP Alliance a nuestro formato
      return this.transformCasesResponse(response);
    } catch (error) {
      logger.error(
        "Error al consultar procesos en la API",
        logContext,
        error as Error
      );

      // Verificar si es un error HTTP específico
      if (error instanceof Error && error.message.includes("HTTP Error")) {
        throw new ApiConnectionError(config.endpoints.recordsByClient, error);
      }

      throw new ApiConnectionError(config.endpoints.recordsByClient, error);
    }
  }

  async getActuaciones(radicado: string): Promise<any[]> {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "QP_ALLIANCE_API",
      "GET_ACTUACIONES"
    );

    logger.info(
      `Consultando actuaciones del proceso: "${radicado}"`,
      logContext
    );

    try {
      // Llamar al endpoint GET /monolegal/actuaciones/:idProceso
      const response = await this.httpClient.get<any[]>(
         `/monolegal/actuaciones-por-radicado/${radicado}`,
        true
      );

      logger.debug("Actuaciones recibidas de la API", logContext);
      return response || [];
    } catch (error) {
      logger.error(
        "Error al consultar actuaciones",
        logContext,
        error as Error
      );
      return [];
    }
  }

  /**
   * Obtiene detalles de un proceso específico usando la API real
   */
  async getProcessDetails(etiqueta: string): Promise<ProcessDetailsResponse> {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "QP_ALLIANCE_API",
      "GET_PROCESS_DETAILS"
    );

    logger.info(`Consultando detalles del proceso: "${etiqueta}"`, logContext);

    const request = {
      etiqueta: etiqueta.trim(),
    };

    try {
      const response = await this.httpClient.post<any>(
        config.endpoints.recordsByInternalCode,
        request
      );

      // Transformar respuesta de QP Alliance a nuestro formato
      return this.transformProcessDetailsResponse(response);
    } catch (error) {
      logger.error(
        "Error al consultar detalles del proceso en la API",
        logContext,
        error as Error
      );

      // Verificar si es un error 404 específico
      if (error instanceof Error && error.message.includes("404")) {
        throw new ProcessNotFoundError(etiqueta);
      }

      // Otros errores de conexión
      if (error instanceof Error && error.message.includes("HTTP Error")) {
        throw new ApiConnectionError(
          config.endpoints.recordsByInternalCode,
          error
        );
      }

      throw new ApiConnectionError(
        config.endpoints.recordsByInternalCode,
        error
      );
    }
  }

  /**
   * Obtiene todos los casos con detalles completos por número de documento usando la API real
   */
  async getAllCasesWithDetails(
    documentNumber: string
  ): Promise<TransformedDetailedCasesResponse> {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "QP_ALLIANCE_API",
      "GET_ALL_CASES_DETAILS"
    );

    logger.info(
      `Consultando todos los casos con detalles por documento: "${documentNumber}"`,
      logContext
    );

    const request = {
      document: documentNumber.trim(),
    };

    try {
      const response = await this.httpClient.post<DetailedCasesResponse>(
        config.endpoints.recordsDetailedByClient,
        request
      );     

      if (response.activeRecords?.[0]) {
        console.log("🔍 Campos del primer registro activo:", Object.keys(response.activeRecords[0]));
        console.log("🔍 Primer registro completo:", JSON.stringify(response.activeRecords[0], null, 2));
      }

      // Transformar la respuesta de la API real al formato esperado por el bot
      const transformedResponse = this.transformDetailedCasesResponse(response);

      logger.info(
        "Casos con detalles obtenidos y transformados exitosamente",
        logContext
      );
      return transformedResponse;
    } catch (error) {
      logger.error(
        "Error al consultar casos con detalles en la API",
        logContext,
        error as Error
      );

      // Verificar si es un error HTTP específico
      if (error instanceof Error && error.message.includes("HTTP Error")) {
        throw new ApiConnectionError(
          config.endpoints.recordsDetailedByClient,
          error
        );
      }

      throw new ApiConnectionError(
        config.endpoints.recordsDetailedByClient,
        error
      );
    }
  }

  /**
   * Transforma la respuesta de casos con detalles de QP Alliance a nuestro formato
   */
  private transformDetailedCasesResponse(
    apiResponse: DetailedCasesResponse
  ): TransformedDetailedCasesResponse {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "TRANSFORM",
      "DETAILED_CASES_RESPONSE"
    );

    // La API real retorna activeRecords y finalizedRecords
    const activeRecords = apiResponse.activeRecords || [];
    const finalizedRecords = apiResponse.finalizedRecords || [];

    // Si no hay procesos, retornar respuesta vacía
    if (activeRecords.length === 0 && finalizedRecords.length === 0) {
      logger.info(
        "No se encontraron procesos en la respuesta de la API",
        logContext
      );
      return {
        message: apiResponse.message || "No se encontraron procesos",
        active: [],
        finalized: [],
      };
    }

    const result: TransformedDetailedCasesResponse = {
      message: apiResponse.message || "Casos obtenidos exitosamente",
      active: activeRecords,
      finalized: finalizedRecords,
    };

    logger.info(
      "Respuesta de casos con detalles transformada exitosamente",
      logContext
    );
    return result;
  }

  /**
   * Transforma la respuesta de casos de QP Alliance a nuestro formato
   */
  private transformCasesResponse(apiResponse: any): CasesResponse {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "TRANSFORM",
      "CASES_RESPONSE"
    );    

    // Verificar si hay procesos (la API puede usar diferentes nombres de campos)
    const active = apiResponse.active || apiResponse.activeRecords || [];
    const finalized =
      apiResponse.finalized || apiResponse.finalizedRecords || [];

    // Si no hay procesos, retornar respuesta vacía
    if (active.length === 0 && finalized.length === 0) {
      logger.info(
        "No se encontraron procesos en la respuesta de la API",
        logContext
      );
      return {
        message: apiResponse.message || "No se encontraron procesos",
        active: [],
        finalized: [],
        totalActive: 0,
        totalFinalized: 0,
        totalRecords: 0,
      };
    }

    const result = {
      message: apiResponse.message || "Casos obtenidos exitosamente",
      active: active.map((process: any) => ({
        internalCode: process.internalCode,
        state: process.state,
        updatedAt: process.updatedAt,
      })),
      finalized: finalized.map((process: any) => ({
        internalCode: process.internalCode,
        state: process.state,
        updatedAt: process.updatedAt,
      })),
      totalActive: apiResponse.totalActive || active.length,
      totalFinalized: apiResponse.totalFinalized || finalized.length,
      totalRecords:
        apiResponse.totalRecords || active.length + finalized.length,
    };

    logger.info("Respuesta transformada exitosamente", logContext);
    return result;
  }

  /**
   * Transforma la respuesta de detalles de proceso de QP Alliance a nuestro formato
   */
  private transformProcessDetailsResponse(
    apiResponse: any
  ): ProcessDetailsResponse {
    const logContext = createLogContext(
      { from: "API_SERVICE" },
      "TRANSFORM",
      "PROCESS_DETAILS"
    );   

    // La API de QP Alliance retorna directamente el record
    if (!apiResponse.record) {
      logger.error(
        "No se encontró el record en la respuesta de la API",
        logContext
      );
      throw new InvalidApiResponseError(
        config.endpoints.recordsByInternalCode,
        "record"
      );
    }

    const record = apiResponse.record;

    const result = {
      message: apiResponse.message || "Caso obtenido exitosamente",
      record: {
        _id: record._id,
        internalCode: record.internalCode || "No especificado",
        jurisdiction: record.jurisdiction || "No especificada",
        processType: record.processType || "No especificado",
        settled: record.settled || record._id,
        proceduralParts: {
          plaintiffs: record.proceduralParts?.plaintiffs || [],
          defendants: record.proceduralParts?.defendants || [],
        },
        performances: record.performances || [],
        idProcesoMonolegal: record.idProcesoMonolegal || null,
        idExpedienteMonolegal: record.idExpedienteMonolegal || null,  
      },
    };    
    return result;
  }
}

/**
 * Implementación mock del servicio de API legal (para desarrollo/testing)
 */
export class MockLegalApiService implements LegalApiService {
  private httpClient: HttpClient;

  constructor() {
    this.httpClient = new HttpClient();
  }

  async getActuaciones(idProceso: string): Promise<any[]> {
    await new Promise((resolve) => setTimeout(resolve, 300));
    return [
      {
        fecha: "16/12/2025",
        actuacion: "Recepción memorial",
        anotacion: "Se recibe memorial de contestación",
      },
      {
        fecha: "10/12/2025",
        actuacion: "Auto que ordena requerimiento",
        anotacion: "Se ordena requerir al demandante",
      },
    ];
  }

  /**
   * Obtiene casos por número de documento (mock)
   */
  async getCasesByDocument(documentNumber: string): Promise<CasesResponse> {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Datos mock basados en el documento del proyecto depreciado
    return {
      message: "Casos obtenidos exitosamente",
      active: [
        {
          internalCode: "U003",
          state: "ADMITE",
          updatedAt: "2025-08-27T18:16:23.272Z",
        },
        {
          internalCode: "D002",
          state: "RADICADO",
          updatedAt: "2025-08-28T05:27:14.661Z",
        },
        {
          internalCode: "R014",
          state: "RADICADO",
          updatedAt: "2025-08-28T17:01:05.109Z",
        },
        {
          internalCode: "D003",
          state: "RADICADO",
          updatedAt: "2025-09-01T10:54:56.739Z",
        },
        {
          internalCode: "D004",
          state: "RADICADO",
          updatedAt: "2025-09-01T10:55:02.494Z",
        },
        {
          internalCode: "D005",
          state: "RADICADO",
          updatedAt: "2025-09-02T05:52:46.690Z",
        },
        {
          internalCode: "D006",
          state: "RADICADO",
          updatedAt: "2025-09-02T05:53:06.144Z",
        },
        {
          internalCode: "D007",
          state: "NOTIFICACION_PERSONAL",
          updatedAt: "2025-09-10T03:12:27.230Z",
        },
        {
          internalCode: "D010",
          state: "ADMITE",
          updatedAt: "2025-09-08T01:15:54.003Z",
        },
      ],
      finalized: [
        {
          internalCode: "D009",
          state: "ARCHIVADO",
          updatedAt: "2025-09-05T17:10:59.243Z",
        },
      ],
      totalActive: 9,
      totalFinalized: 1,
      totalRecords: 14,
    };
  }

  /**
   * Obtiene detalles de un proceso específico (mock)
   */
  async getProcessDetails(etiqueta: string): Promise<ProcessDetailsResponse> {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Datos mock basados en el documento del proyecto depreciado
    return {
      message: "Caso obtenido exitosamente",
      record: {
        _id: "68b68786c9ca124d3f7c142b",
        internalCode: "U003",
        jurisdiction: "PENAL CIRCUITO",
        processType: "Proceso Ejecutivo",
        settled: etiqueta,
        proceduralParts: {
          plaintiffs: [{ name: "Juan Pérez" }, { name: "María García" }],
          defendants: [{ name: "Empresa S.A." }, { name: "Corporación ABC" }],
        },
        performances: [
          {
            _id: "68b6f1f23c34da0d7963e15f",
            record: "68b68786c9ca124d3f7c142b",
            document: null,
            performanceType: "RADICADO",
            responsible: "Juan Pérez",
            observation: "Se realizó la radicación de la demanda correctamente",
            createdAt: "2025-09-02T13:32:34.786Z",
            updatedAt: "2025-09-02T13:32:34.786Z",
          },
          {
            _id: "68b6f301df0cf18fe6cb9bf2",
            record: "68b68786c9ca124d3f7c142b",
            document: null,
            performanceType: "ADMITE",
            responsible: "Juan Pérez",
            observation: "Se realizó la Admisión de la demanda correctamente",
            createdAt: "2025-09-02T13:37:05.199Z",
            updatedAt: "2025-09-02T13:37:05.199Z",
          },
        ],
      },
    };
  }

  /**
   * Obtiene todos los casos con detalles completos por número de documento (mock)
   */
  async getAllCasesWithDetails(
    documentNumber: string
  ): Promise<TransformedDetailedCasesResponse> {
    // Simular delay de API
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Datos mock con detalles completos
    return {
      message: "Casos obtenidos exitosamente",
      active: [
        {
          _id: "689f48a812c4effbc9db88dd",
          internalCode: "U003",
          jurisdiction: "CIVIL CIRCUITO",
          processType: "Proceso Verbal",
          settled: "NO",
          proceduralParts: {
            plaintiffs: [
              {
                name: "Juan Pérez",
              },
            ],
            defendants: [
              {
                name: "Empresa S.A.",
              },
            ],
          },
          performances: [
            {
              _id: "689f48a812c4effbc9db88eb",
              record: "689f48a812c4effbc9db88dd",
              performanceType: "RADICADO",
              responsible: "Juan Pérez",
              observation: "Radicación de demanda",
              createdAt: "2025-08-15T14:48:08.689Z",
              updatedAt: "2025-09-02T13:22:06.227Z",
              document: null,
            },
          ],
          state: "ADMITE",
          updatedAt: "2025-08-27T18:16:23.272Z",
        },
        {
          _id: "68afe8b2efb86ad2ad70e0de",
          internalCode: "D002",
          jurisdiction: "PENAL CIRCUITO",
          processType: "Proceso Ejecutivo",
          settled: "",
          proceduralParts: {
            plaintiffs: [
              {
                name: "Juan Pérez",
              },
            ],
            defendants: [
              {
                name: "Empresa S.A.",
              },
            ],
          },
          performances: [
            {
              _id: "68afe8b2efb86ad2ad70e0ec",
              record: "68afe8b2efb86ad2ad70e0de",
              performanceType: "RADICADO",
              responsible: "Juan Pérez",
              observation: "Radicación de demanda",
              createdAt: "2025-08-28T05:27:14.711Z",
              updatedAt: "2025-09-02T13:22:06.227Z",
              document: null,
            },
          ],
          state: "RADICADO",
          updatedAt: "2025-08-28T05:27:14.661Z",
        },
      ],
      finalized: [
        {
          _id: "68b83576dac75187caa00af8",
          internalCode: "D009",
          jurisdiction: "LABORAL CIRCUITO",
          processType: "Proceso Ejecutivo",
          settled: "11111111111111111",
          proceduralParts: {
            plaintiffs: [
              {
                name: "Juan Pérez",
              },
              {
                name: "Michelle Ojeda",
              },
            ],
            defendants: [
              {
                name: "Empresa S.A.",
              },
              {
                name: "Empresa S.A.",
              },
            ],
          },
          performances: [
            {
              _id: "68b83612dac75187caa00b30",
              record: "68b83576dac75187caa00af8",
              performanceType: "ARCHIVADO",
              responsible: "Juzgado",
              observation: "AAAA | Documento relacionado: Memorial",
              createdAt: "2025-09-03T12:35:30.766Z",
              updatedAt: "2025-09-03T12:35:30.766Z",
              document: null,
            },
          ],
          state: "ARCHIVADO",
          updatedAt: "2025-09-05T17:10:59.243Z",
        },
      ],
    };
  }
}

/**
 * Factory para crear instancias del servicio de API legal
 */
export class LegalApiServiceFactory {
  static create(): LegalApiService {
    const logContext = createLogContext(
      { from: "FACTORY" },
      "LEGAL_API_FACTORY",
      "CREATE_SERVICE"
    );

    // Usar API real si las variables de entorno están configuradas
    if (process.env.API_KEY && process.env.API_KEY !== "your-api-key-here") {    
      return new QpAllianceLegalApiService();
    } else {      
      return new MockLegalApiService();
    }
  }

  static createWithCredentials(
    baseUrl: string,
    apiKey: string
  ): LegalApiService {
    const logContext = createLogContext(
      { from: "FACTORY" },
      "LEGAL_API_FACTORY",
      "CREATE_WITH_CREDENTIALS"
    );
    logger.info("Creando servicio con credenciales personalizadas", logContext);
    const httpClient = new HttpClient(baseUrl, apiKey);
    return new QpAllianceLegalApiService();
  }
}
