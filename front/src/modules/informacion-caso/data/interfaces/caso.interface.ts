// Interfaces para el módulo de información de casos

// Documento
export interface Document {
  _id?: string;
  category: string;
  documentType: string;
  document: string;
  subdocument: string;
  settledDate: string;
  consecutive: string;
  responsibleType: string;
  responsible: string;
  url?: string;
  record?: string;
  createdAt?: string;
  observations?: string;
}

// Interviniente
export interface Intervener {
  _id?: string;
  record?: string;
  intervenerType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Parte Procesal
export interface ProceduralPart {
  _id?: string;
  record?: string;
  partType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Valor de Pago
export interface PaymentValue {
  _id?: string;
  value: number;
  causationDate: string;
  paymentDate: string;
}

// Pago
export interface Payment {
  _id?: string;
  record?: any;
  successBonus: boolean;
  bonusPercentage: number;
  bonusPrice: number;
  bonusCausationDate: string;
  bonusPaymentDate: string;
  notes: string;
  paymentValues: PaymentValue[];
}

// Usuario
export interface User {
  _id: string;
  name: string;
  lastname: string;
  email: string;
  phone: string;
}

// Caso principal
export interface Caso {
  _id?: string;
  internalCode?: string; // Puede no venir
  clientType: string;
  department?: string; // Puede no venir
  city?: string;
  responsible?: string;

  // Campos de radicado - TODOS LOS POSIBLES NOMBRES
  numeroRadicado?: string;
  radicado?: string; // ← Este es el que usa tu backend
  settled?: string; // ← Alternativo

  // Campos de despacho - TODOS LOS POSIBLES NOMBRES
  despachoJudicial?: string; // ← Este es el que usa tu backend
  office?: string; // ← Alternativo

  personType?: string; // Puede no venir
  jurisdiction?: string; // Puede no venir
  processType?: string; // Puede no venir
  country?: string;
  location?: string;
  estado?: string;
  type?: string;

  etiqueta?: string;
  etapaProcesal?: string;
  ultimaActuacion?: string;
  fechaUltimaActuacion?: string;
  sincronizadoMonolegal?: boolean;
  fechaSincronizacion?: string;
  idProcesoMonolegal?: string;

  user?: User;
  createdAt?: string;
  updatedAt?: string;
  documents?: Document[];
  interveners?: Intervener[];
  proceduralParts?: ProceduralPart[];
  payments?: Payment[];
  performances?: PerformanceData[];
}

// Body para crear caso
export interface CreateCasoBody {
  clientType: string;
  responsible: string;
  department: string;
  city?: string;
  numeroRadicado?: string;
  personType: string;
  jurisdiction: string;
  processType: string;
  office: string;
  settled: string;
  country: string;
  location?: string;
  documents: CreateDocumentData[];
  interveners: CreateIntervenerData[];
  proceduralParts: CreateProceduralPartData[];
  payments: CreatePaymentData[];
  files?: File[] | string[];
  fechaUltimaActuacion?: string;
  filesMetadata?: string;
}

// Body para actualizar solo la información general del caso (PATCH /api/records/{id})
export interface UpdateCasoBody {
  clientType?: string;
  responsible?: string;
  department?: string;
  personType?: string;
  jurisdiction?: string;
  processType?: string;
  office?: string;
  settled?: string;
  city?: string;
  country?: string;
  fechaUltimaActuacion?: string;
  location?: string;
  type?: string;
}

// Datos para crear documento (sin _id ni record)
export interface CreateDocumentData {
  category: string;
  documentType: string;
  document: string;
  subdocument: string;
  settledDate: string;
  consecutive: string;
  responsibleType: string;
  responsible: string;
  url?: string;
  observations?: string;
}

// Datos para crear interviniente (sin _id ni record)
export interface CreateIntervenerData {
  intervenerType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Datos para crear parte procesal (sin _id ni record)
export interface CreateProceduralPartData {
  partType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Datos para crear pago (sin _id ni record)
export interface CreatePaymentData {
  successBonus: boolean;
  bonusPercentage: number;
  bonusPrice: number;
  bonusCausationDate: string;
  bonusPaymentDate: string;
  notes: string;
  paymentValues: PaymentValueData[];
}

// Datos para valor de pago (sin _id)
export interface PaymentValueData {
  value: number;
  causationDate: string;
  paymentDate: string;
}

// Body para actualizar documento - según API PATCH /api/document/{id}
export interface UpdateDocumentBody {
  category: string;
  documentType: string;
  document: string;
  subdocument: string;
  settledDate: string;
  responsibleType: string;
  responsible: string;
  observations: string;
}

// Body para crear documento
export interface CreateDocumentBody {
  // ID del expediente al que pertenece el documento
  recordId: string;
  category: string;
  documentType: string;
  document: string;
  subdocument: string;
  settledDate: string;
  consecutive: string;
  responsibleType: string;
  responsible: string;
  observations?: string;
  // Archivo adjunto (OPCIONAL - se puede crear documento solo con metadata)
  file?: File | string;
}

// Body para crear interviniente
export interface CreateIntervenerBody {
  record: string;
  intervenerType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Body para crear parte procesal
export interface CreateProceduralPartBody {
  record: string;
  partType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

// Body para crear pago
export interface CreatePaymentBody {
  record: any;
  successBonus: boolean;
  bonusPercentage: number;
  bonusPrice: number;
  bonusCausationDate: string;
  bonusPaymentDate: string;
  notes: string;
  paymentValues: PaymentValue[];
}

// Parámetro
export interface Parameter {
  _id?: string;
  parameterType: string;
  parameter: string;
  parentParameter: string;
  description: string;
}

// Body para crear parámetro
export interface CreateParameterBody {
  parameterType: string;
  parameter: string;
  parentParameter: string;
  description: string;
}

// Body para buscar parámetros
export interface SearchParametersBody {
  parameterType: string;
}

// Respuesta de casos paginada
export interface CasosPaginatedResponse {
  records: Caso[];
  total: number;
  page: number;
  limit: number;
}

// Respuesta de parámetros paginada
export interface ParametersPaginatedResponse {
  parameters: Parameter[];
  total: number;
  page: number;
  limit: number;
}

export interface FileUploadResponse {
  success: boolean;
  message: string;
  data: {
    originalName: string;
    filename: string;
    size: number;
    mimetype: string;
    url: string;
    s3Key: string;
  };
}

export interface MultipleFileUploadResponse {
  success: boolean;
  message: string;
  data: FileUploadResponse["data"][];
  count: number;
}

// Información de archivos
export interface FileInfoResponse {
  allowedMimeTypes: string[];
  maxFileSize: string;
  maxFiles: number;
}

// Actuaciones / Performances
export interface PerformanceData {
  _id?: string;
  user?: string;
  record: string;
  performanceType: string;
  responsible: string;
  observation: string;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
}

export interface CreatePerformanceBody {
  record: string;
  performanceType: string;
  responsible: string;
  observation?: string;
  forceTransition?: boolean;
}

export interface CreatePerformanceSuccessResponse {
  message: string;
  performance: PerformanceData;
}

export interface DeletePerformanceSuccessResponse {
  message: string;
}

// Respuestas de éxito
export interface CreateCasoSuccessResponse {
  message: string;
  record: Caso;
}

export interface GetCasoSuccessResponse {
  record: Caso;
}

export interface CreateDocumentSuccessResponse {
  message: string;
  document: Document;
}

export interface CreateIntervenerSuccessResponse {
  message: string;
  intervener: Intervener;
}

export interface CreateProceduralPartSuccessResponse {
  message: string;
  proceduralPart: ProceduralPart;
}

export interface CreatePaymentSuccessResponse {
  message: string;
  payment: Payment;
}

export interface CreateParameterSuccessResponse {
  message: string;
  parameter: Parameter;
}

// Respuestas de error
export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}

// Union de respuestas exitosas
export type CasoSuccessResponse =
  | CreateCasoSuccessResponse
  | GetCasoSuccessResponse
  | CasosPaginatedResponse
  | CreateIntervenerSuccessResponse
  | CreateProceduralPartSuccessResponse
  | CreatePaymentSuccessResponse
  | CreateParameterSuccessResponse
  | ParametersPaginatedResponse
  | FileUploadResponse
  | MultipleFileUploadResponse
  | FileInfoResponse;

// Union de todas las respuestas
export type CasoResponse = CasoSuccessResponse | ErrorResponse;
