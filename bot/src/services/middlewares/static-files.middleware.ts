/**
 * Middleware para servir archivos estáticos
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */

import { join } from 'path';
import { existsSync, createReadStream, readdirSync } from 'fs';

export function staticFilesMiddleware(req: any, res: any, next: any) {
  // Solo procesar rutas que empiecen con /public
  if (!req.url.startsWith('/public/')) {
    return next();
  }

  try {
    // Remover /public del path
    const filePath = req.url.replace('/public/', '');
    
    // Construir la ruta completa del archivo
    const fullPath = join(process.cwd(), 'dist', 'public', filePath);
    
    console.log('🌐 [STATIC_MIDDLEWARE] Solicitando archivo:', filePath);
    console.log('🌐 [STATIC_MIDDLEWARE] Ruta completa:', fullPath);
    console.log('🌐 [STATIC_MIDDLEWARE] Directorio de trabajo:', process.cwd());
    
    // Verificar que el archivo existe
    if (!existsSync(fullPath)) {
      console.log('🌐 [STATIC_MIDDLEWARE] Archivo no encontrado:', fullPath);
      
      // Listar archivos en dist/public para debugging
      const publicDir = join(process.cwd(), 'dist', 'public');
      if (existsSync(publicDir)) {
        const files = readdirSync(publicDir);
        console.log('📁 [STATIC_MIDDLEWARE] Archivos en dist/public:', files);
      } else {
        console.log('📁 [STATIC_MIDDLEWARE] La carpeta dist/public no existe');
      }
      
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>Archivo no encontrado</title></head>
        <body>
          <h1>Archivo no encontrado</h1>
          <p>El archivo <code>${filePath}</code> no existe en el servidor.</p>
          <p><a href="/info">← Ver información del servidor</a></p>
        </body>
        </html>
      `);
      return;
    }
    
    // Determinar el tipo de contenido basado en la extensión
    const ext = filePath.split('.').pop()?.toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case 'pdf':
        contentType = 'application/pdf';
        break;
      case 'png':
        contentType = 'image/png';
        break;
      case 'jpg':
      case 'jpeg':
        contentType = 'image/jpeg';
        break;
      case 'gif':
        contentType = 'image/gif';
        break;
      case 'txt':
        contentType = 'text/plain';
        break;
      case 'html':
        contentType = 'text/html';
        break;
      case 'css':
        contentType = 'text/css';
        break;
      case 'js':
        contentType = 'application/javascript';
        break;
    }
    
    // Configurar headers
    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=3600', // Cache por 1 hora
      'Access-Control-Allow-Origin': '*'
    });
    
    // Crear stream del archivo y enviarlo
    const fileStream = createReadStream(fullPath);
    fileStream.pipe(res);
    
    console.log('🌐 [STATIC_MIDDLEWARE] Archivo enviado exitosamente:', filePath);
    
  } catch (error) {
    console.error('🌐 [STATIC_MIDDLEWARE] Error sirviendo archivo:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
}
