/**
 * Servicio para servir archivos estáticos usando el servidor de BuilderBot
 * Extiende el servidor Polka de BuilderBot para servir archivos estáticos
 */

import { config } from '../config/env.js';
import { 
  staticFilesMiddleware,
  qrCodeMiddleware,
  serverInfoMiddleware,
  listFilesMiddleware,
  deleteFileMiddleware,
  logsMiddleware,
  logsApiMiddleware
} from './middlewares/index.js';

/**
 * Configura el servidor de archivos estáticos
 * @param server - Instancia de Polka del servidor de BuilderBot
 */
export function configureStaticServer(server: any) {
  console.log('🌐 [STATIC_SERVER] Configurando servidor de archivos estáticos...');
  
  // Agregar middleware para QR Code
  server.use(qrCodeMiddleware);
  
  // Agregar middleware para información del servidor
  server.use(serverInfoMiddleware);
  
  // Agregar middleware para listar archivos
  server.use(listFilesMiddleware);
  
  // Agregar middleware para eliminar archivos
  server.use(deleteFileMiddleware);
  
  // Agregar middleware para logs
  server.use(logsMiddleware);
  
  // Agregar middleware para API de logs
  server.use(logsApiMiddleware);
  
  // Agregar middleware para archivos estáticos
  server.use(staticFilesMiddleware);
  
  console.log('🌐 [STATIC_SERVER] Servidor configurado exitosamente');
  console.log(`🌐 [STATIC_SERVER] Archivos disponibles en: ${config.baseUrl}/public/`);
  console.log(`🌐 [STATIC_SERVER] Información del servidor: ${config.baseUrl}/info`);
  console.log(`🌐 [STATIC_SERVER] Lista de archivos PDF: ${config.baseUrl}/files`);
  console.log(`🌐 [STATIC_SERVER] QR Code disponible en: ${config.baseUrl}/qr`);
  console.log(`🌐 [STATIC_SERVER] Logs del bot: ${config.baseUrl}/logs`);
  console.log(`🌐 [STATIC_SERVER] API de logs: ${config.baseUrl}/logs/api/`);
}