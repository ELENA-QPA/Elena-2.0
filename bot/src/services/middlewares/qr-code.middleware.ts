import { join } from "path";
import { existsSync, createReadStream } from "fs";

/**
 * Middleware para mostrar el QR Code en /qr
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */
export function qrCodeMiddleware(req: any, res: any, next: any) {
  // Solo procesar la ruta /qr
  if (req.url !== "/qr") {
    return next();
  }

  try {
    const qrPath = join(process.cwd(), "bot.qr.png");

    // Verificar que el archivo QR existe
    if (!existsSync(qrPath)) {      
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Esperando QR - ELENA Bot</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
              background: rgba(255,255,255,0.1);
              padding: 3rem;
              border-radius: 20px;
              backdrop-filter: blur(10px);
              box-shadow: 0 8px 32px rgba(0,0,0,0.3);
            }
            .spinner {
              width: 50px;
              height: 50px;
              border: 5px solid rgba(255,255,255,0.3);
              border-top-color: white;
              border-radius: 50%;
              animation: spin 1s linear infinite;
              margin: 2rem auto;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
            h1 { margin: 0 0 1rem; font-size: 2rem; }
            p { margin: 0.5rem 0; opacity: 0.9; }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>⏳ Generando Código QR...</h1>
            <div class="spinner"></div>
            <p>El bot se está conectando a WhatsApp</p>
            <p>La página se actualizará automáticamente</p>
          </div>
          <script>
            // Recargar cada 2 segundos hasta que aparezca el QR
            setTimeout(() => location.reload(), 2000);
          </script>
        </body>
        </html>
      `);
      return;
    }

    // Configurar headers para imagen PNG
    res.writeHead(200, {
      "Content-Type": "image/png",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Crear stream del archivo QR y enviarlo
    const qrStream = createReadStream(qrPath);
    qrStream.pipe(res);
    
  } catch (error) {
    console.error("❌ [QR_MIDDLEWARE] Error sirviendo QR:", error);
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Internal server error");
  }
}
