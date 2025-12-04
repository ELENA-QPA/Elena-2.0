/**
 * Utilidades para manejo de archivos estáticos
 * Funciona tanto en desarrollo como en producción
 */

import { fileURLToPath } from 'url';
import path, { join, dirname } from 'path';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const isProduction = config.nodeEnv === 'production';

/**
 * Obtiene la ruta de un archivo estático
 * @param fileName - Nombre del archivo
 * @param subfolder - Subcarpeta opcional
 * @returns URL HTTP del archivo (siempre URL para BuilderBot)
 */
export function getFilePath(fileName: string, subfolder?: string): string {
  // Siempre usar URL HTTP porque BuilderBot necesita URLs para enviar archivos
  const publicPath = subfolder ? `/public/${subfolder}/${fileName}` : `/public/${fileName}`;
  return `${config.baseUrl}${publicPath}`;
}

/**
 * Obtiene la ruta de un archivo PDF
 * @param fileName - Nombre del archivo PDF
 * @returns URL del archivo PDF
 */
export function getPdfPath(fileName: string): string {
  return getFilePath(fileName); // Sin subcarpeta, directamente en /public/
}

/**
 * Obtiene la ruta de una imagen
 * @param fileName - Nombre del archivo de imagen
 * @returns Ruta del archivo de imagen
 */
export function getImagePath(fileName: string): string {
  return getFilePath(fileName, 'images');
}

/**
 * Obtiene la ruta de un documento genérico
 * @param fileName - Nombre del archivo
 * @returns Ruta del archivo
 */
export function getDocumentPath(fileName: string): string {
  return getFilePath(fileName, 'documents');
}

/**
 * Logs para debugging
 * @param context - Contexto del log
 */
export function logEnvironment(context: string): void {
  console.log(`🔧 [${context}] Entorno de ejecución:`, isProduction ? 'Producción' : 'Desarrollo');
}

/**
 * Logs para debugging de rutas
 * @param context - Contexto del log
 * @param filePath - Ruta del archivo
 */
export function logFilePath(context: string, filePath: string): void {
  console.log(`🔧 [${context}] Ruta del archivo resuelta:`, filePath);
}
