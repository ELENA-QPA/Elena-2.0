// Interfaces para el manejo de parámetros
export interface ParameterData {
  id?: string;
  parameterType: string;
  parameter: string;
  parentParameter: string;
  description: string;
}

export interface ParameterSearchRequest {
  parameterType: string;
}

export interface CreateParameterResponse {
  success: boolean;
  message: string;
  parameter: ParameterData;
}

export interface SearchParametersResponse {
  success: boolean;
  message: string;
  parameters: ParameterData[];
  total: number;
  offset: number;
  limit: number;
}

export interface DeleteParameterResponse {
  success: boolean;
  message: string;
}

export interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
