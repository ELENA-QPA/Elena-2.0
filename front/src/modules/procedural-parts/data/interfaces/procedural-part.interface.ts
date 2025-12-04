// Interfaces para el manejo de partes procesales
export interface ProceduralPartData {
  id?: string;
  record: string;
  partType: string;
  name: string;
  documentType: string;
  document: string;
  email: string;
  contact: string;
}

export interface CreateProceduralPartResponse {
  success: boolean;
  message: string;
  proceduralPart: ProceduralPartData;
}

export interface UpdateProceduralPartResponse {
  success: boolean;
  message: string;
  proceduralPart: ProceduralPartData;
}

export interface DeleteProceduralPartResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
