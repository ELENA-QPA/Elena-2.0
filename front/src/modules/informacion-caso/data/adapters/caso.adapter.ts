import {
  Caso,
  Document,
  Intervener,
  ProceduralPart,
  Payment,
  PaymentValue,
  Parameter,
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
} from "../interfaces/caso.interface";
import {
  CreatePerformanceSuccessResponse,
  DeletePerformanceSuccessResponse,
  PerformanceData,
} from "../interfaces/caso.interface";

// Mapear documento de API a modelo
export function mapDocumentApiToModel(api: any): Document {
  return {
    _id: api._id,
    record: api.record || api.recordId || undefined,
    category: api.category,
    documentType: api.documentType,
    document: api.document,
    subdocument: api.subdocument,
    settledDate: api.settledDate,
    consecutive: api.consecutive,
    responsibleType: api.responsibleType,
    responsible: api.responsible,
    url: api.url,
    observations: api.observations,
  };
}

// Mapear interviniente de API a modelo
export function mapIntervenerApiToModel(api: any): Intervener {
  if (!api) {
    throw new Error("No se proporcionaron datos del interviniente para mapear");
  }

  return {
    _id: api._id || "",
    record: api.record || "",
    intervenerType: api.intervenerType || "",
    name: api.name || "",
    documentType: api.documentType || "",
    document: api.document || "",
    email: api.email || "",
    contact: api.contact || "",
  };
}

// Mapear parte procesal de API a modelo
export function mapProceduralPartApiToModel(api: any): ProceduralPart {
  return {
    _id: api._id,
    record: api.record,
    partType: api.partType,
    name: api.name,
    documentType: api.documentType,
    document: api.document,
    email: api.email,
    contact: api.contact,
  };
}

// Mapear valor de pago de API a modelo
export function mapPaymentValueApiToModel(api: any): PaymentValue {
  return {
    _id: api._id,
    value: api.value,
    causationDate: api.causationDate,
    paymentDate: api.paymentDate,
  };
}

// Mapear pago de API a modelo
export function mapPaymentApiToModel(api: any): Payment {
  return {
    _id: api._id,
    record: api.record,
    successBonus: api.successBonus,
    bonusPercentage: api.bonusPercentage,
    bonusPrice: api.bonusPrice,
    bonusCausationDate: api.bonusCausationDate,
    bonusPaymentDate: api.bonusPaymentDate,
    notes: api.notes,
    paymentValues: api.paymentValues?.map(mapPaymentValueApiToModel) || [],
  };
}

// Mapear parámetro de API a modelo
export function mapParameterApiToModel(api: any): Parameter {
  return {
    _id: api._id,
    parameterType: api.parameterType,
    parameter: api.parameter,
    parentParameter: api.parentParameter,
    description: api.description,
  };
}

// Mapear caso de API a modelo
export function mapCasoApiToModel(api: any): Caso {
  if (!api || typeof api !== "object" || !api._id) {
    // Si la respuesta no es válida, retorna un objeto vacío con la estructura de Caso
    return {
      _id: "",
      clientType: "",
      department: "",
      city: "",
      personType: "",
      jurisdiction: "",
      processType: "",
      despachoJudicial: "",
      radicado: "",
      country: "",
      location: "",
      estado: "",
      type: "",
      isActive: api.isActive, 
      user: undefined,
      createdAt: "",
      updatedAt: "",
      documents: [],
      interveners: [],
      proceduralParts: [],
      payments: [],
    };
  }

  console.log("[ADAPTER][mapCasoApiToModel] API data:", {
    location: api.location,
    despachoJudicial: api.despachoJudicial,
    radicado: api.radicado,
    _id: api._id,
  });

  return {
    _id: api._id,
    clientType: api.clientType,
    department: api.department,
    personType: api.personType,
    city: api.city || undefined,
    responsible: api.responsible || api.user || undefined,
    jurisdiction: api.jurisdiction,
    processType: api.processType,
    radicado: api.radicado,
    country: api.country,
    location: api.location || undefined,
    estado: api.estado,
    type: api.type,
    isActive: api.isActive,
    numeroRadicado:
      api.numeroRadicado || api.radicado || api.internalCode || "",
    despachoJudicial: api.despachoJudicial || api.office || "",
    etiqueta: api.etiqueta || api.label || undefined,
    etapaProcesal: api.etapaProcesal,
    ultimaActuacion: api.ultimaActuacion,
    fechaUltimaActuacion: api.fechaUltimaActuacion,
    sincronizadoMonolegal: api.sincronizadoMonolegal,
    fechaSincronizacion: api.fechaSincronizacion,
    idProcesoMonolegal: api.idProcesoMonolegal,

    user:
      api.user && typeof api.user === "object"
        ? {
            _id: api.user._id,
            name: api.user.name,
            lastname: api.user.lastname,
            email: api.user.email,
            phone: api.user.phone,
          }
        : undefined,

    createdAt: api.createdAt,
    updatedAt: api.updatedAt,

    documents: api.documents?.map(mapDocumentApiToModel) || [],
    interveners: api.interveners?.map(mapIntervenerApiToModel) || [],
    proceduralParts: Array.isArray(api.proceduralParts)
      ? api.proceduralParts.map(mapProceduralPartApiToModel)
      : Object.values(api.proceduralParts || {})
          .flat()
          .map(mapProceduralPartApiToModel),
    payments: api.payments?.map(mapPaymentApiToModel) || [],

    // Mapear actuaciones si vienen en la respuesta
    performances:
      api.performances?.map(mapPerformanceApiToModel) ||
      api.actuaciones?.map(mapPerformanceApiToModel) ||
      [],
  };
}

// Mapear respuesta de creación de caso
export function mapCreateCasoResponse(api: any): CreateCasoSuccessResponse {
  return {
    message: api.message,
    record: mapCasoApiToModel(api.record),
  };
}

// Mapear respuesta de creación de documento
export function mapCreateDocumentResponse(
  api: any
): CreateDocumentSuccessResponse {
  return {
    message: api.message,
    document: mapDocumentApiToModel(api.document),
  };
}

// Mapear respuesta de obtención de caso
export function mapGetCasoResponse(api: any): GetCasoSuccessResponse {
  return {
    record: mapCasoApiToModel(api.record),
  };
}

// Mapear respuesta de casos paginados
export function mapCasosPaginatedResponse(api: any): CasosPaginatedResponse {
  return {
    records: api.records?.map(mapCasoApiToModel) || [],
    total: api.count || api.total || 0, // La API devuelve 'count', no 'total'
    page: api.page,
    limit: api.limit,
  };
}

// Mapear respuesta de creación de interviniente
export function mapCreateIntervenerResponse(
  api: any
): CreateIntervenerSuccessResponse {
  let intervenerData = api?.intervener || api?.data || api?.body || api;

  if (!intervenerData || !intervenerData._id) {
    console.warn(
      "[ADAPTER][mapCreateIntervenerResponse] No se encontró intervener válido, intentando extraer de api:",
      api
    );

    if (api && typeof api === "object") {
      for (const [key, value] of Object.entries(api)) {
        if (value && typeof value === "object" && (value as any)._id) {
          console.log(
            `[ADAPTER][mapCreateIntervenerResponse] Encontrado interviniente en api.${key}:`,
            value
          );
          intervenerData = value;
          break;
        }
      }
    }
  }

  if (!intervenerData || !intervenerData._id) {
    console.error(
      "[ADAPTER][mapCreateIntervenerResponse] No se pudo mapear interviniente, datos insuficientes:",
      api
    );
    throw new Error(
      "Respuesta del servidor inválida: no se encontró información del interviniente creado"
    );
  }

  return {
    message: api.message || "Interviniente creado exitosamente",
    intervener: mapIntervenerApiToModel(intervenerData),
  };
}

// Mapear respuesta de creación de parte procesal
export function mapCreateProceduralPartResponse(
  api: any
): CreateProceduralPartSuccessResponse {
  let part = api?.proceduralPart || api?.data || api?.body || api;

  if (part && typeof part === "object" && part._id) {
    return {
      message: api.message || "Parte procesal creada exitosamente",
      proceduralPart: mapProceduralPartApiToModel(part),
    };
  }
  // Si la estructura no es válida, retorna proceduralPart vacío
  return {
    message: api.message || "Parte procesal creada exitosamente",
    proceduralPart: {
      _id: "",
      record: "",
      partType: "",
      name: "",
      documentType: "",
      document: "",
      email: "",
      contact: "",
    },
  };
}

// Mapear respuesta de creación de pago
export function mapCreatePaymentResponse(
  api: any
): CreatePaymentSuccessResponse {
  return {
    message: api.message,
    payment: mapPaymentApiToModel(api.payment),
  };
}

// Mapear respuesta de creación de parámetro
export function mapCreateParameterResponse(
  api: any
): CreateParameterSuccessResponse {
  return {
    message: api.message,
    parameter: mapParameterApiToModel(api.parameter),
  };
}

// Mapear respuesta de parámetros paginados
export function mapParametersPaginatedResponse(
  api: any
): ParametersPaginatedResponse {
  return {
    parameters: api.parameters?.map(mapParameterApiToModel) || [],
    total: api.total,
    page: api.page,
    limit: api.limit,
  };
}

// Mapear respuesta de archivo subido
export function mapFileUploadResponse(api: any): FileUploadResponse {
  return {
    success: api.success,
    message: api.message,
    data: {
      originalName: api.data.originalName,
      filename: api.data.filename,
      size: api.data.size,
      mimetype: api.data.mimetype,
      url: api.data.url,
      s3Key: api.data.s3Key,
    },
  };
}

// Mapear respuesta de múltiples archivos
export function mapMultipleFileUploadResponse(
  api: any
): MultipleFileUploadResponse {
  return {
    success: api.success,
    message: api.message,
    data:
      api.data?.map((file: any) => ({
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimetype: file.mimetype,
        url: file.url,
        s3Key: file.s3Key,
      })) || [],
    count: api.count,
  };
}

// Mapear información de archivos
export function mapFileInfoResponse(api: any): FileInfoResponse {
  return {
    allowedMimeTypes: api.allowedMimeTypes || [],
    maxFileSize: api.maxFileSize,
    maxFiles: api.maxFiles,
  };
}

// Mapear performance de API a modelo
export function mapPerformanceApiToModel(api: any): PerformanceData {
  return {
    _id: api._id || api.id,
    user: api.user,
    record: api.record,
    performanceType: api.performanceType,
    responsible: api.responsible,
    observation: api.observation || api.observations || "",
    createdAt: api.createdAt,
    updatedAt: api.updatedAt,
    deletedAt: api.deletedAt || null,
    performanceDate: api.performanceDate,
  };
}

export function mapCreatePerformanceResponse(
  api: any
): CreatePerformanceSuccessResponse {
  return {
    message: api.message,
    performance: mapPerformanceApiToModel(api.performance || api.record || api),
  };
}

export function mapDeletePerformanceResponse(
  api: any
): DeletePerformanceSuccessResponse {
  return {
    message: api.message,
  };
}
