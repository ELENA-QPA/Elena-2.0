/**
 * Middleware para eliminar archivos PDF en /delete/[filename]
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */

import { join } from 'path';
import { existsSync, readdirSync, unlinkSync } from 'fs';

export function deleteFileMiddleware(req: any, res: any, next: any) {
  // Solo procesar rutas que empiecen con /delete/
  if (!req.url.startsWith('/delete/')) {
    return next();
  }
  
  // Solo procesar métodos GET, POST y DELETE
  if (req.method !== 'GET' && req.method !== 'POST' && req.method !== 'DELETE') {
    return next();
  }
  
  try {
    // Extraer el nombre del archivo de la URL
    const filename = req.url.replace('/delete/', '');
    
    // Validar que sea un archivo PDF
    if (!filename.endsWith('.pdf')) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Solo se pueden eliminar archivos PDF' }));
      return;
    }
    
    const reportsDir = join(process.cwd(), 'dist', 'public', 'reports');
    const filePath = join(reportsDir, filename);
    
    console.log('🗑️ [DELETE_MIDDLEWARE] Intentando eliminar archivo:', filename);
    console.log('🗑️ [DELETE_MIDDLEWARE] Ruta completa:', filePath);
    console.log('🗑️ [DELETE_MIDDLEWARE] Directorio de trabajo:', process.cwd());
    console.log('🗑️ [DELETE_MIDDLEWARE] ¿Existe el directorio?', existsSync(reportsDir));
    
    // Listar archivos en el directorio para debugging
    if (existsSync(reportsDir)) {
      const files = readdirSync(reportsDir);
      console.log('🗑️ [DELETE_MIDDLEWARE] Archivos en el directorio:', files);
    }
    
    // Verificar que el archivo existe
    if (!existsSync(filePath)) {
      console.log('🗑️ [DELETE_MIDDLEWARE] Archivo no encontrado:', filePath);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: 'Archivo no encontrado' }));
      return;
    }
    
    // Eliminar el archivo
    unlinkSync(filePath);
    
    console.log('✅ [DELETE_MIDDLEWARE] Archivo eliminado exitosamente:', filename);
    
    // Devolver respuesta JSON
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: true, message: 'Archivo eliminado exitosamente' }));
    
  } catch (error) {
    console.error('❌ [DELETE_MIDDLEWARE] Error eliminando archivo:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ success: false, error: 'Error interno del servidor' }));
  }
}
