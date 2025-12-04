/**
 * Cliente HTTP centralizado para llamadas a APIs
 */

import { logger, createLogContext } from '../logger.service.js';

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = '', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Realiza una petición GET
   */
  async get<T>(endpoint: string): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const logContext = createLogContext({ from: 'HTTP_CLIENT' }, 'HTTP_REQUEST', 'GET');
    
    logger.debug(`Realizando petición GET: ${endpoint}`, logContext);

    try {
      const headers: Record<string, string> = {
        'accept': '*/*',
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Error HTTP ${response.status} en GET ${endpoint}`, logContext);
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.debug(`GET ${endpoint} exitoso (${response.status})`, logContext);
      
      return result;
    } catch (error) {
      logger.error(`Error en petición GET ${endpoint}`, logContext, error as Error);
      throw error;
    }
  }

  /**
   * Realiza una petición POST
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const logContext = createLogContext({ from: 'HTTP_CLIENT' }, 'HTTP_REQUEST', 'POST');
    
    logger.debug(`Realizando petición POST: ${endpoint}`, logContext);

    try {
      const headers: Record<string, string> = {
        'accept': '*/*',
        'Content-Type': 'application/json',
      };

      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Error HTTP ${response.status} en POST ${endpoint}`, logContext);
        throw new Error(`HTTP Error ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      logger.debug(`POST ${endpoint} exitoso (${response.status})`, logContext);
      
      return result;
    } catch (error) {
      logger.error(`Error en petición POST ${endpoint}`, logContext, error as Error);
      throw error;
    }
  }
}
