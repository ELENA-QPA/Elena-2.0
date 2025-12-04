/**
 * Errores personalizados para el bot legal
 */

/**
 * Error base para errores de API legal
 */
export class LegalApiError extends Error {
  constructor(message: string, public readonly statusCode?: number) {
    super(message);
    this.name = 'LegalApiError';
  }
}

/**
 * Error específico cuando no se encuentra un proceso (404)
 */
export class ProcessNotFoundError extends LegalApiError {
  constructor(internalCode: string) {
    super(`No se encontró el proceso con código ${internalCode}. Verifica que el código sea correcto.`, 404);
    this.name = 'ProcessNotFoundError';
  }
}

/**
 * Error específico cuando no se encuentran procesos para un documento
 */
export class NoProcessesFoundError extends LegalApiError {
  constructor(documentNumber: string) {
    super(`No se encontraron procesos para el documento ${documentNumber}.`);
    this.name = 'NoProcessesFoundError';
  }
}

/**
 * Error específico para problemas de conectividad con la API
 */
export class ApiConnectionError extends LegalApiError {
  constructor(endpoint: string, originalError: any) {
    super(`Error de conexión con la API en ${endpoint}: ${originalError}`);
    this.name = 'ApiConnectionError';
  }
}

/**
 * Error específico para respuestas inválidas de la API
 */
export class InvalidApiResponseError extends LegalApiError {
  constructor(endpoint: string, expectedField: string) {
    super(`Respuesta inválida de la API en ${endpoint}: falta el campo ${expectedField}`);
    this.name = 'InvalidApiResponseError';
  }
}
