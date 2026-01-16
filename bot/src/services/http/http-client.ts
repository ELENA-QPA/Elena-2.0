/**
 * Cliente HTTP centralizado para llamadas a APIs
 */

import { logger, createLogContext } from '../logger.service.js';
import { config } from '../../config/env.js';

export class HttpClient {
  private baseUrl: string;
  private apiKey: string;
  private jwtToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(baseUrl: string = '', apiKey: string = '') {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Obtiene un token JWT haciendo login
   */
  private async authenticate(): Promise<string> {
    const logContext = createLogContext({ from: 'HTTP_CLIENT' }, 'AUTH', 'LOGIN');
    
    // Si ya tenemos un token válido, usarlo
    if (this.jwtToken && Date.now() < this.tokenExpiry) {
      return this.jwtToken;
    }

    logger.info('Obteniendo nuevo token JWT...', logContext);

    try {
      const response = await fetch(`${this.baseUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: config.apiAuthEmail,
          password: config.apiAuthPassword,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error(`Error en login: ${response.status}`, logContext);
        throw new Error(`Login failed: ${errorText}`);
      }

      const result = await response.json();
      this.jwtToken = result.token;
      
      // Token válido por 23 horas 
      this.tokenExpiry = Date.now() + (23 * 60 * 60 * 1000);
      
      logger.info('Token JWT obtenido exitosamente', logContext);
      return this.jwtToken;
    } catch (error) {
      logger.error('Error obteniendo token JWT', logContext, error as Error);
      throw error;
    }
  }

  /**
   * Construye los headers para las peticiones
   */
  private async buildHeaders(requiresAuth: boolean = false): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'accept': '*/*',
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    // Si requiere autenticación JWT, obtener el token
    if (requiresAuth) {
      const token = await this.authenticate();
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  /**
   * Realiza una petición GET
   * @param endpoint - Endpoint a llamar
   * @param requiresAuth - Si requiere autenticación JWT (default: false)
   */
  async get<T>(endpoint: string, requiresAuth: boolean = false): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const logContext = createLogContext({ from: 'HTTP_CLIENT' }, 'HTTP_REQUEST', 'GET');
    
    logger.debug(`Realizando petición GET: ${endpoint}`, logContext);

    try {
      const headers = await this.buildHeaders(requiresAuth);

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
   * @param endpoint - Endpoint a llamar
   * @param data - Datos a enviar
   * @param requiresAuth - Si requiere autenticación JWT (default: false)
   */
  async post<T>(endpoint: string, data: any, requiresAuth: boolean = false): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const logContext = createLogContext({ from: 'HTTP_CLIENT' }, 'HTTP_REQUEST', 'POST');
    
    logger.debug(`Realizando petición POST: ${endpoint}`, logContext);

    try {
      const headers = await this.buildHeaders(requiresAuth);

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