export interface ProcessResult {
  radicado: string;
  status: 'created' | 'updated' | 'skipped' | 'error';
  message: string;
  details?: {
    despachoJudicial?: string;
    city?: string;
    etapaProcesal?: string;
    ultimaActuacion?: string;
    fechaUltimaActuacion?: Date;
    ultimaAnotacion?:Date;
  };
}

export interface SyncResponse {
  success: boolean;
  message: string;
  summary: {
    total: number;
    created: number;
    updated: number;
    skipped: number;
    errors: number;
  };
  details: ProcessResult[];
  updatedRecords?: Array<{
    radicado: string;
    despachoJudicial: string;
    city: string;
    ultimaActuacion: string;
  }>;
}