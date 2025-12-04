/**
 * Middleware para mostrar información del servidor en /info
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */

import { config } from '../../config/env.js';

export function serverInfoMiddleware(req: any, res: any, next: any) {
  // Solo procesar la ruta /info
  if (req.url !== '/info') {
    return next();
  }
  
  try {
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>QP Alliance Bot</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 20px; 
            background: #f5f5f5;
          }
          .container { 
            background: white; 
            padding: 30px; 
            border-radius: 10px; 
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          h1 { color: #2c3e50; }
          .status { 
            background: #27ae60; 
            color: white; 
            padding: 10px; 
            border-radius: 5px; 
            margin: 20px 0;
          }
          .endpoint { 
            background: #ecf0f1; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            border-left: 4px solid #3498db;
          }
          code { 
            background: #2c3e50; 
            color: #ecf0f1; 
            padding: 2px 6px; 
            border-radius: 3px;
          }
          a { 
            color:rgb(8, 71, 112); 
            text-decoration: none; 
            font-family: monospace;
            background: #ecf0f1;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;
          }
          a:hover { 
            color: #2980b9; 
            background: #d5dbdb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>🤖 QP Alliance Bot</h1>
          <div class="status">✅ Servidor funcionando correctamente</div>
          
          <h2>🔗 Rutas</h2>
          <div class="endpoint">
            <strong>QR Code:</strong> <a href="${config.baseUrl}/qr" target="_blank">${config.baseUrl}/qr</a>
          </div>
          <div class="endpoint">
            <strong>Información:</strong> <a href="${config.baseUrl}/info">${config.baseUrl}/info</a>
          </div>
          <div class="endpoint">
            <strong>Archivos PDF:</strong> <a href="${config.baseUrl}/files">${config.baseUrl}/files</a>
          </div>
          
          <h2>ℹ️ Información</h2>
          <p><strong>Entorno:</strong> ${config.nodeEnv}</p>
          <p><strong>Puerto:</strong> ${config.port}</p>
          <p><strong>Base URL:</strong> ${config.baseUrl}</p>
        </div>
      </body>
      </html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    
  } catch (error) {
    console.error('🌐 [SERVER_INFO] Error generando página de información:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
}
