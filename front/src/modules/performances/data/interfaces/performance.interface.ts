// Interfaces para el manejo de actuaciones
export interface PerformanceData {
  id?: string;
  record: string;
  performanceType: string;
  responsible: string;
  observation: string;
}

export interface CreatePerformanceResponse {
  success: boolean;
  message: string;
  performance: PerformanceData;
}

export interface GetPerformancesByCaseResponse {
  success: boolean;
  message: string;
  performances: PerformanceData[];
}

export interface DeletePerformanceResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
