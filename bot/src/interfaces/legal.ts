/**
 * Interfaces para el bot legal ELENA - QPAlliance
 */

// Respuesta de la API de casos
export interface CasesResponse {
  message: string;
  active: Array<{
    internalCode: string;
    state: string;
    updatedAt: string;
  }>;
  finalized: Array<{
    internalCode: string;
    state: string;
    updatedAt: string;
  }>;
  totalActive: number;
  totalFinalized: number;
  totalRecords: number;
}

// Registro base de proceso (reutilizable)
export interface ProcessRecord {
  _id: string;
  internalCode: string;
  jurisdiction: string;
  processType: string;
  settled: string;
  proceduralParts: {
    plaintiffs: Array<{ name: string }>;
    defendants: Array<{ name: string }>;
  };
  performances: Array<{
    _id: string;
    record: string;
    document: string | null;
    performanceType: string;
    responsible: string;
    observation: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

// Respuesta de la API de detalles de proceso
export interface ProcessDetailsResponse {
  message: string;
  record: ProcessRecord;
}

// Modelo de dominio para procesos del cliente
export interface ClientProcesses {
  documentNumber: string;
  activeProcesses: ProcessSummary[];
  finalizedProcesses: ProcessSummary[];
  totalActive: number;
  totalFinalized: number;
}

// Resumen de proceso
export interface ProcessSummary {
  internalCode: string;
  status: string;
  lastUpdate: string;
  responsible?: string;
  nextMilestone?: string;
  etiqueta?: string;
  radicado?: string;
  despachoJudicial?: string;
  city?: string;
  ultimaActuacion?: string;
  fechaUltimaActuacion?: string; 
}

// Detalles de proceso
export interface ProcessDetails {
  id: string;
  internalCode: string;
  clientName: string; 
  jurisdiction: string;
  processType: string;
  settled: string;
  status: string;
  responsible: string;
  nextMilestone: string;
  plaintiffs: string[];
  defendants: string[];
  performances: ProcessPerformance[];
  etiqueta?: string;
  radicado?: string;
  despachoJudicial?: string;
  city?: string;
  ultimaActuacion?: string;
  fechaUltimaActuacion?: string;
}

// Actuación de proceso
export interface ProcessPerformance {
  id: string;
  type: string;
  responsible: string;
  observation: string;
  createdAt: string;
  updatedAt: string;
}

// Respuesta de la API de casos con detalles completos
export interface DetailedCasesResponse {
  message: string;
  activeRecords: DetailedProcessRecord[];
  finalizedRecords?: DetailedProcessRecord[];
  totalActive: number;
  totalFinalized?: number;
  totalRecords: number;
}

// Registro de proceso con detalles completos (reutiliza ProcessRecord)
export interface DetailedProcessRecord extends ProcessRecord {
  state: string;
  updatedAt: string;
}

// Respuesta transformada para el bot (casos con detalles)
export interface TransformedDetailedCasesResponse {
  message: string;
  active: DetailedProcessRecord[];
  finalized: DetailedProcessRecord[];
}

// Estado del bot para mantener contexto
export interface LegalBotState {
  currentDocument?: string;
  currentProcesses?: ClientProcesses;
  selectedProcessType?: "active" | "finalized";
  selectedProcess?: ProcessDetails;
  currentFlow?: string;
}
