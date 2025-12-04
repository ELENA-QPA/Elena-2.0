/**
 * Middleware para mostrar el QR Code en /qr
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */

import { join } from 'path';
import { existsSync, createReadStream } from 'fs';

export function qrCodeMiddleware(req: any, res: any, next: any) {
  // Solo procesar la ruta /qr
  if (req.url !== '/qr') {
    return next();
  }
  
  try {
    const qrPath = join(process.cwd(), 'bot.qr.png');
    
    console.log('🌐 [QR_MIDDLEWARE] Solicitando QR Code');
    console.log('🌐 [QR_MIDDLEWARE] Ruta del QR:', qrPath);
    
    // Verificar que el archivo QR existe
    if (!existsSync(qrPath)) {
      console.log('🌐 [QR_MIDDLEWARE] QR no encontrado:', qrPath);
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head><title>QR No Encontrado</title></head>
        <body>
          <h1>QR Code no disponible</h1>
          <p>El código QR aún no ha sido generado. Conecta el bot primero.</p>
          <p><a href="/">← Volver al inicio</a></p>
        </body>
        </html>
      `);
      return;
    }
    
    // Configurar headers para imagen PNG
    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    
    // Crear stream del archivo QR y enviarlo
    const qrStream = createReadStream(qrPath);
    qrStream.pipe(res);
    
    console.log('🌐 [QR_MIDDLEWARE] QR Code enviado exitosamente');
    
  } catch (error) {
    console.error('🌐 [QR_MIDDLEWARE] Error sirviendo QR:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
}
