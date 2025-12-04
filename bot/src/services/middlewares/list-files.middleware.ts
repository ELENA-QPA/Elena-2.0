/**
 * Middleware para listar archivos PDF guardados en /files
 * @param req - Request object de Polka
 * @param res - Response object de Polka
 * @param next - Next function de Polka
 */

import { join } from 'path';
import { existsSync, readdirSync, statSync } from 'fs';
import { config } from '../../config/env.js';

export function listFilesMiddleware(req: any, res: any, next: any) {
  // Solo procesar la ruta /files
  if (req.url !== '/files') {
    return next();
  }
  
  try {
    const reportsDir = join(process.cwd(), 'dist', 'public', 'reports');
    
    console.log('🌐 [FILES_MIDDLEWARE] Listando archivos en:', reportsDir);
    
    let files: Array<{name: string, size: string, date: string, url: string}> = [];
    
    if (existsSync(reportsDir)) {
      const fileList = readdirSync(reportsDir);
      
      files = fileList
        .filter(file => file.endsWith('.pdf'))
        .map(file => {
          const filePath = join(reportsDir, file);
          const stats = statSync(filePath);
          const sizeInKB = Math.round(stats.size / 1024);
          
          return {
            name: file,
            size: `${sizeInKB} KB`,
            date: stats.mtime.toLocaleString('es-CO'),
            url: `${config.baseUrl}/public/reports/${file}`
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Más recientes primero
    }
    
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Archivos PDF - QP Alliance Bot</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            max-width: 1000px; 
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
          .file-item { 
            background: #ecf0f1; 
            padding: 15px; 
            margin: 10px 0; 
            border-radius: 5px; 
            border-left: 4px solid #3498db;
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .file-info {
            flex: 1;
          }
          .file-name {
            font-weight: bold;
            color: #2c3e50;
            margin-bottom: 5px;
          }
          .file-details {
            font-size: 0.9em;
            color: #7f8c8d;
          }
          .file-actions {
            margin-left: 20px;
          }
          .btn {
            background: #3498db;
            color: white;
            padding: 8px 16px;
            text-decoration: none;
            border-radius: 4px;
            margin-left: 10px;
            font-size: 0.9em;
          }
          .btn:hover {
            background: #2980b9;
          }
          .btn-danger {
            background: #e74c3c;
          }
          .btn-danger:hover {
            background: #c0392b;
          }
          .no-files {
            text-align: center;
            color: #7f8c8d;
            font-style: italic;
            padding: 40px;
          }
          .stats {
            background: #27ae60;
            color: white;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
            text-align: center;
          }
          button.btn {
            border: none;
            cursor: pointer;
          }
        </style>
        <script>
          function deleteFile(filename) {
            if (confirm('¿Estás seguro de que quieres eliminar este archivo?')) {
              // Hacer petición AJAX para eliminar
              fetch('/delete/' + filename, {
                method: 'DELETE'
              })
              .then(response => response.json())
              .then(data => {
                if (data.success) {
                  // Eliminar el elemento de la lista
                  const fileElement = document.querySelector('[data-filename="' + filename + '"]');
                  if (fileElement) {
                    fileElement.remove();
                  }
                  // Actualizar contador
                  updateFileCount();
                  alert('Archivo eliminado exitosamente');
                } else {
                  alert('Error: ' + data.error);
                }
              })
              .catch(error => {
                console.error('Error:', error);
                alert('Error al eliminar el archivo');
              });
            }
          }
          
          function updateFileCount() {
            const fileItems = document.querySelectorAll('.file-item');
            const count = fileItems.length;
            const statsElement = document.querySelector('.stats strong');
            if (statsElement) {
              statsElement.textContent = 'Total de archivos: ' + count + ' PDF(s)';
            }
            
            // Si no hay archivos, mostrar mensaje de no archivos
            if (count === 0) {
              const container = document.querySelector('.container');
              const fileList = container.querySelector('.file-list') || container;
              const noFilesDiv = document.querySelector('.no-files');
              
              if (!noFilesDiv) {
                const noFilesElement = document.createElement('div');
                noFilesElement.className = 'no-files';
                noFilesElement.textContent = 'No hay archivos PDF guardados';
                fileList.appendChild(noFilesElement);
              }
            } else {
              const noFilesDiv = document.querySelector('.no-files');
              if (noFilesDiv) {
                noFilesDiv.remove();
              }
            }
          }
        </script>
      </head>
      <body>
        <div class="container">
          <h1>📁 Archivos PDF Guardados</h1>
          
          <div class="stats">
            <strong>Total de archivos: ${files.length} PDF(s)</strong>
          </div>
          
          ${files.length === 0 ? 
            '<div class="no-files">No hay archivos PDF guardados</div>' :
            files.map(file => `
              <div class="file-item" data-filename="${file.name}">
                <div class="file-info">
                  <div class="file-name">${file.name}</div>
                  <div class="file-details">
                    📅 ${file.date} | 📏 ${file.size}
                  </div>
                </div>
                <div class="file-actions">
                  <a href="${file.url}" class="btn" target="_blank">Ver PDF</a>
                  <a href="${file.url}" class="btn" download>Descargar</a>
                  <button class="btn btn-danger" onclick="deleteFile('${file.name}')">Eliminar</button>
                </div>
              </div>
            `).join('')
          }
          
          <div style="margin-top: 30px; text-align: center;">
            <a href="/info" class="btn">← Volver a información del servidor</a>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
    
  } catch (error) {
    console.error('🌐 [FILES_MIDDLEWARE] Error listando archivos:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Internal server error');
  }
}
