/**
 * Configuración de variables de entorno
 * Para usar en desarrollo, crear un archivo .env en la raíz del proyecto
 */

export const config = {
  // API QP Alliance
  apiBaseUrl: process.env.API_BASE_URL || 'https://apiprod.qpalliance.co/api',
  apiKey: process.env.API_KEY || 'your-api-key-here',

  // Bot
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  // URLs para archivos estáticos
  baseUrl: process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`,

  // Números de contacto
  lawyerNumber: process.env.LAWYER_NUMBER, // Abogado para nuevos procesos
  lawyerNumberExisting: process.env.LAWYER_NUMBER_EXISTING, // Abogado para procesos en andamiento/finalizados

  // Endpoints de la API
  endpoints: {
    recordsByClient: '/records/by-client',
    recordsByInternalCode: '/records/by-internal-code',
    recordsDetailedByClient: '/records/detailed-by-client'
  }
} as const;

export type Config = typeof config;
