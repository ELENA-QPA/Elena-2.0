// Interfaces para el manejo de intervinientes
export interface IntervenerData {
  id?: string;
  record: string;
  intervenerType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

export interface CreateIntervenerResponse {
  success: boolean;
  message: string;
  intervener: IntervenerData;
}

export interface UpdateIntervenerResponse {
  success: boolean;
  message: string;
  intervener: IntervenerData;
}

export interface DeleteIntervenerResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
