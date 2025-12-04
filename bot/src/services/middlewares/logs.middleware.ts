/**
 * Middleware para acceder y visualizar logs del bot
 * Proporciona endpoints para consultar logs por usuario, flujo, fecha, etc.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export function logsMiddleware(req: any, res: any, next: any) {
  // Endpoint principal de logs
  if (req.url === '/logs') {
    return handleLogsList(req, res);
  }
  
  // Endpoint para logs específicos por usuario
  if (req.url.startsWith('/logs/user/')) {
    const userId = req.url.split('/logs/user/')[1];
    if (userId === 'all') {
      return handleAllUsersLogs(req, res);
    }
    return handleUserLogs(req, res, userId);
  }
  
  // Endpoint para logs por flujo
  if (req.url.startsWith('/logs/flow/')) {
    const flow = req.url.split('/logs/flow/')[1];
    return handleFlowLogs(req, res, flow);
  }
  
  // Endpoint para logs por fecha
  if (req.url.startsWith('/logs/date/')) {
    const date = req.url.split('/logs/date/')[1];
    return handleDateLogs(req, res, date);
  }
  
  // Endpoint para logs en tiempo real (WebSocket o Server-Sent Events)
  if (req.url === '/logs/live') {
    return handleLiveLogs(req, res);
  }
  
  // Endpoint para listar usuarios
  if (req.url === '/logs/users') {
    return handleUsersList(req, res);
  }
  
  // Endpoint para ver logs específicos
  if (req.url.startsWith('/logs/view/')) {
    const filename = req.url.split('/logs/view/')[1];
    return handleViewLogs(req, res, filename);
  }
  
  // Endpoint para descargar logs
  if (req.url.startsWith('/logs/download/')) {
    const filename = req.url.split('/logs/download/')[1];
    return handleDownloadLogs(req, res, filename);
  }
  
  next();
}

/**
 * Lista todos los archivos de logs disponibles
 */
function handleLogsList(req: any, res: any) {
  try {
    const logsDir = join(process.cwd(), 'logs');
    const files = readdirSync(logsDir)
      .filter(file => file.endsWith('.log') || file.endsWith('.json'))
      .map(file => {
        const filePath = join(logsDir, file);
        const stats = statSync(filePath);
        return {
          filename: file,
          size: formatFileSize(stats.size),
          date: stats.mtime.toISOString(),
          path: `/logs/download/${file}`
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>📊 Logs del Bot - QP Alliance</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
          .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          h1 { color: #2c3e50; margin-bottom: 30px; text-align: center; }
          .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
          .stat-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; }
          .stat-number { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
          .stat-label { font-size: 0.9em; opacity: 0.9; }
          .search-box { margin-bottom: 20px; }
          .search-box input { width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px; }
          .logs-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .logs-table th, .logs-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .logs-table th { background: #f8f9fa; font-weight: bold; color: #495057; }
          .logs-table tr:hover { background: #f8f9fa; }
          .btn { display: inline-block; padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 2px; }
          .btn:hover { background: #0056b3; }
          .btn-success { background: #28a745; }
          .btn-info { background: #17a2b8; }
          .btn-warning { background: #ffc107; color: #212529; }
          .btn-danger { background: #dc3545; }
          .no-logs { text-align: center; color: #6c757d; padding: 40px; font-size: 1.1em; }
          .quick-actions { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
          .level-badge { padding: 4px 8px; border-radius: 4px; font-size: 0.8em; font-weight: bold; }
          .level-debug { background: #e9ecef; color: #495057; }
          .level-info { background: #d1ecf1; color: #0c5460; }
          .level-warn { background: #fff3cd; color: #856404; }
          .level-error { background: #f8d7da; color: #721c24; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>📊 Logs del Bot - QP Alliance</h1>
          
          <div class="stats">
            <div class="stat-card">
              <div class="stat-number">${files.length}</div>
              <div class="stat-label">Archivos de Log</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${files.reduce((sum, file) => sum + parseInt(file.size), 0)} KB</div>
              <div class="stat-label">Tamaño Total</div>
            </div>
            <div class="stat-card">
              <div class="stat-number">${files.length > 0 ? formatDate(new Date(files[0].date)) : 'N/A'}</div>
              <div class="stat-label">Último Log</div>
            </div>
          </div>
          
          <div class="quick-actions">
            <a href="/logs/live" class="btn btn-info">🔴 Logs en Tiempo Real</a>
            <a href="/logs/users" class="btn btn-success">👥 Ver Usuarios</a>
            <a href="/logs/user/all" class="btn btn-success">📋 Todos los Logs</a>
            <a href="/logs/flow/all" class="btn btn-warning">🔄 Todos los Flujos</a>
            <a href="/info" class="btn">🏠 Volver al Inicio</a>
          </div>
          
          <div class="search-box">
            <input type="text" id="searchInput" placeholder="🔍 Buscar en logs..." onkeyup="filterLogs()">
          </div>
          
          ${files.length === 0 ? 
            '<div class="no-logs">No hay archivos de log disponibles</div>' :
            `
              <table class="logs-table">
                <thead>
                  <tr>
                    <th>📁 Archivo</th>
                    <th>📏 Tamaño</th>
                    <th>📅 Fecha</th>
                    <th>⚡ Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  ${files.map(file => `
                    <tr>
                      <td><strong>${file.filename}</strong></td>
                      <td>${file.size}</td>
                      <td>${formatDateTime(new Date(file.date))}</td>
                      <td>
                        <a href="${file.path}" class="btn btn-success">📥 Descargar</a>
                        <a href="/logs/view/${file.filename}" class="btn btn-info">👁️ Ver</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            `
          }
        </div>
        
        <script>
          function filterLogs() {
            const input = document.getElementById('searchInput');
            const filter = input.value.toLowerCase();
            const table = document.querySelector('.logs-table tbody');
            if (!table) return;
            
            const rows = table.getElementsByTagName('tr');
            for (let i = 0; i < rows.length; i++) {
              const text = rows[i].textContent.toLowerCase();
              rows[i].style.display = text.includes(filter) ? '' : 'none';
            }
          }
        </script>
      </body>
      </html>
    `;
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error en logs middleware:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Lista todos los usuarios que tienen logs
 */
function handleUsersList(req: any, res: any) {
  try {
    const users = getUsersWithLogs();
    const html = generateUsersListHTML(users);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error obteniendo lista de usuarios:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Logs de todos los usuarios
 */
function handleAllUsersLogs(req: any, res: any) {
  try {
    const logs = getAllLogs();
    const html = generateLogsHTML(logs, 'Logs de Todos los Usuarios');
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error obteniendo logs de todos los usuarios:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Logs específicos por usuario
 */
function handleUserLogs(req: any, res: any, userId: string) {
  try {
    const logs = getLogsByFilter('userId', userId);
    const html = generateLogsHTML(logs, `Logs del Usuario: ${userId}`);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error obteniendo logs de usuario:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Logs específicos por flujo
 */
function handleFlowLogs(req: any, res: any, flow: string) {
  try {
    const logs = getLogsByFilter('flow', flow);
    const html = generateLogsHTML(logs, `Logs del Flujo: ${flow}`);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error obteniendo logs de flujo:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Logs por fecha específica
 */
function handleDateLogs(req: any, res: any, date: string) {
  try {
    const logs = getLogsByDate(date);
    const html = generateLogsHTML(logs, `Logs del ${date}`);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error obteniendo logs por fecha:', error);
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Error interno del servidor');
  }
}

/**
 * Logs en tiempo real (simulado con refresh automático)
 */
function handleLiveLogs(req: any, res: any) {
  const html = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🔴 Logs en Tiempo Real - QP Alliance</title>
      <style>
        body { font-family: 'Courier New', monospace; margin: 0; padding: 20px; background: #1a1a1a; color: #00ff00; }
        .container { max-width: 1200px; margin: 0 auto; }
        .log-entry { margin-bottom: 5px; padding: 5px; border-left: 3px solid #00ff00; }
        .log-timestamp { color: #888; }
        .log-level { font-weight: bold; }
        .log-debug { color: #888; }
        .log-info { color: #00ff00; }
        .log-warn { color: #ffff00; }
        .log-error { color: #ff0000; }
        .controls { margin-bottom: 20px; }
        .btn { padding: 10px 20px; margin: 5px; background: #333; color: #00ff00; border: 1px solid #00ff00; cursor: pointer; }
        .btn:hover { background: #00ff00; color: #000; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🔴 Logs en Tiempo Real</h1>
        <div class="controls">
          <button class="btn" onclick="startLiveLogs()">▶️ Iniciar</button>
          <button class="btn" onclick="stopLiveLogs()">⏹️ Detener</button>
          <button class="btn" onclick="clearLogs()">🗑️ Limpiar</button>
          <a href="/logs" class="btn">📊 Ver Todos</a>
        </div>
        <div id="liveLogs"></div>
      </div>
      
      <script>
        let liveInterval;
        let isRunning = false;
        
        function startLiveLogs() {
          if (isRunning) return;
          isRunning = true;
          liveInterval = setInterval(loadLatestLogs, 2000);
        }
        
        function stopLiveLogs() {
          isRunning = false;
          clearInterval(liveInterval);
        }
        
        function clearLogs() {
          document.getElementById('liveLogs').innerHTML = '';
        }
        
        function loadLatestLogs() {
          fetch('/logs/api/latest')
            .then(response => response.json())
            .then(logs => {
              const container = document.getElementById('liveLogs');
              logs.forEach(log => {
                const div = document.createElement('div');
                div.className = 'log-entry';
                div.innerHTML = \`
                  <span class="log-timestamp">[\${log.timestamp}]</span>
                  <span class="log-level log-\${log.level.toLowerCase()}">[\${log.level}]</span>
                  <span>[\${log.context.userId || 'SYSTEM'}]</span>
                  <span>[\${log.context.flow || 'UNKNOWN'}]</span>
                  <span>\${log.message}</span>
                \`;
                container.appendChild(div);
              });
              container.scrollTop = container.scrollHeight;
            })
            .catch(error => console.error('Error cargando logs:', error));
        }
        
        // Auto-iniciar
        startLiveLogs();
      </script>
    </body>
    </html>
  `;
  
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(html);
}

/**
 * Ver logs específicos de un archivo
 */
function handleViewLogs(req: any, res: any, filename: string) {
  try {
    const filePath = join(process.cwd(), 'logs', filename);
    const fileContent = readFileSync(filePath, 'utf8');
    
    let logs = [];
    if (filename.endsWith('.json')) {
      // Formato JSON (líneas separadas)
      logs = fileContent.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
    } else {
      // Formato de texto plano (.log)
      logs = parseTextLogs(fileContent);
    }
    
    const html = generateLogsHTML(logs, `Logs del archivo: ${filename}`);
    
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(html);
  } catch (error) {
    console.error('Error viendo logs:', error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Archivo no encontrado');
  }
}

/**
 * Descargar archivo de logs
 */
function handleDownloadLogs(req: any, res: any, filename: string) {
  try {
    const filePath = join(process.cwd(), 'logs', filename);
    const fileContent = readFileSync(filePath, 'utf8');
    
    res.writeHead(200, {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="${filename}"`
    });
    res.end(fileContent);
  } catch (error) {
    console.error('Error descargando logs:', error);
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Archivo no encontrado');
  }
}

/**
 * Obtiene todos los logs
 */
function getAllLogs() {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.log') || file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      let logs = [];
      if (file.endsWith('.json')) {
        // Formato JSON (líneas separadas)
        logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      } else {
        // Formato de texto plano (.log)
        logs = parseTextLogs(content);
      }
      
      allLogs.push(...logs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Obtiene lista de usuarios con estadísticas de logs y sesiones
 */
function getUsersWithLogs() {
  const allLogs = getAllLogs();
  const userStats = {};
  
  // Agrupar logs por usuario
  allLogs.forEach(log => {
    if (log.context && log.context.userId) {
      const userId = log.context.userId;
      if (!userStats[userId]) {
        userStats[userId] = {
          userId: userId,
          totalLogs: 0,
          flows: new Set(),
          levels: {},
          firstLog: null,
          lastLog: null,
          sessions: [], // Array para almacenar sesiones
          currentSession: null // Sesión actual (si no ha terminado)
        };
      }
      
      const stats = userStats[userId];
      stats.totalLogs++;
      
      if (log.context.flow) {
        stats.flows.add(log.context.flow);
      }
      
      if (log.level) {
        stats.levels[log.level] = (stats.levels[log.level] || 0) + 1;
      }
      
      const logTime = new Date(log.timestamp);
      if (!stats.firstLog || logTime < stats.firstLog) {
        stats.firstLog = logTime;
      }
      if (!stats.lastLog || logTime > stats.lastLog) {
        stats.lastLog = logTime;
      }
      
      // Analizar sesiones basado en CONVERSATION_START y CONVERSATION_END
      if (log.context.flow === 'CONVERSATION_START') {
        // Inicio de nueva sesión
        if (stats.currentSession) {
          // Si hay una sesión abierta, cerrarla sin CONVERSATION_END
          stats.currentSession.endTime = logTime;
          stats.currentSession.duration = Math.round((logTime.getTime() - stats.currentSession.startTime.getTime()) / (1000 * 60));
          stats.currentSession.status = 'incomplete';
          stats.sessions.push(stats.currentSession);
        }
        // Crear nueva sesión
        stats.currentSession = {
          startTime: logTime,
          endTime: null,
          duration: 0,
          status: 'active',
          logsCount: 0
        };
      } else if (log.context.flow === 'CONVERSATION_END') {
        // Fin de sesión
        if (stats.currentSession) {
          stats.currentSession.endTime = logTime;
          stats.currentSession.duration = Math.round((logTime.getTime() - stats.currentSession.startTime.getTime()) / (1000 * 60));
          stats.currentSession.status = 'completed';
          stats.sessions.push(stats.currentSession);
          stats.currentSession = null;
        }
      } else if (stats.currentSession) {
        // Incrementar contador de logs en sesión actual
        stats.currentSession.logsCount++;
      }
    }
  });
  
  // Cerrar sesiones abiertas (sin CONVERSATION_END)
  Object.values(userStats).forEach((stats: any) => {
    if (stats.currentSession) {
      stats.currentSession.endTime = stats.lastLog;
      stats.currentSession.duration = Math.round((stats.lastLog.getTime() - stats.currentSession.startTime.getTime()) / (1000 * 60));
      stats.currentSession.status = 'incomplete';
      stats.sessions.push(stats.currentSession);
      stats.currentSession = null;
    }
  });
  
  // Convertir a array y formatear
  return Object.values(userStats).map((stats: any) => {
    const completedSessions = stats.sessions.filter(s => s.status === 'completed');
    const incompleteSessions = stats.sessions.filter(s => s.status === 'incomplete');
    const avgSessionDuration = completedSessions.length > 0 ? 
      Math.round(completedSessions.reduce((sum, s) => sum + s.duration, 0) / completedSessions.length) : 0;
    
    return {
      userId: stats.userId,
      totalLogs: stats.totalLogs,
      flows: Array.from(stats.flows),
      flowsCount: stats.flows.size,
      levels: stats.levels,
      firstLog: stats.firstLog,
      lastLog: stats.lastLog,
      duration: stats.lastLog && stats.firstLog ? 
        Math.round((stats.lastLog - stats.firstLog) / (1000 * 60)) : 0, // minutos
      // Nuevas estadísticas de sesiones
      totalSessions: stats.sessions.length,
      completedSessions: completedSessions.length,
      incompleteSessions: incompleteSessions.length,
      avgSessionDuration: avgSessionDuration,
      lastSessionStart: stats.sessions.length > 0 ? stats.sessions[stats.sessions.length - 1].startTime : null,
      lastSessionEnd: stats.sessions.length > 0 ? stats.sessions[stats.sessions.length - 1].endTime : null,
      sessions: stats.sessions // Para análisis detallado
    };
  }).sort((a: any, b: any) => b.totalLogs - a.totalLogs);
}

/**
 * Obtiene logs filtrados por criterio
 */
function getLogsByFilter(filterType: string, filterValue: string) {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.log') || file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      let logs = [];
      if (file.endsWith('.json')) {
        // Formato JSON (líneas separadas)
        logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      } else {
        // Formato de texto plano (.log)
        logs = parseTextLogs(content);
      }
      
      const filteredLogs = logs.filter(log => 
        log.context && log.context[filterType] === filterValue
      );
      
      allLogs.push(...filteredLogs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Obtiene logs por fecha
 */
function getLogsByDate(date: string) {
  const logsDir = join(process.cwd(), 'logs');
  const targetDate = new Date(date);
  const files = readdirSync(logsDir).filter(file => file.endsWith('.log') || file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      
      let logs = [];
      if (file.endsWith('.json')) {
        // Formato JSON (líneas separadas)
        logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      } else {
        // Formato de texto plano (.log)
        logs = parseTextLogs(content);
      }
      
      const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate.toDateString() === targetDate.toDateString();
      });
      
      allLogs.push(...filteredLogs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

/**
 * Genera HTML para mostrar logs
 */
function generateLogsHTML(logs: any[], title: string) {
  const levelColors = {
    'DEBUG': '#6c757d',
    'INFO': '#17a2b8',
    'WARN': '#ffc107',
    'ERROR': '#dc3545'
  };
  
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title} - QP Alliance</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
          margin: 0; 
          padding: 20px; 
          background: #0d1117; 
          color: #c9d1d9; 
          line-height: 1.6;
        }
        .container { 
          max-width: 1400px; 
          margin: 0 auto; 
          background: #161b22; 
          padding: 30px; 
          border-radius: 12px; 
          border: 1px solid #30363d;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
          color: #58a6ff; 
          margin-bottom: 30px; 
          font-size: 2.2em;
          text-align: center;
          text-shadow: 0 0 10px rgba(88, 166, 255, 0.3);
        }
        .log-entry { 
          margin-bottom: 15px; 
          padding: 20px; 
          border-left: 4px solid #30363d; 
          background: #21262d; 
          border-radius: 8px; 
          border: 1px solid #30363d;
          transition: all 0.3s ease;
          position: relative;
        }
        .log-entry:hover {
          border-left-color: #58a6ff;
          background: #1c2128;
          transform: translateX(5px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.4);
        }
        .log-timestamp { 
          color: #7c3aed; 
          font-size: 0.85em; 
          font-weight: bold;
          margin-bottom: 8px;
          font-family: 'Consolas', monospace;
        }
        .log-level { 
          font-weight: bold; 
          padding: 4px 12px; 
          border-radius: 6px; 
          color: white; 
          display: inline-block;
          margin-bottom: 10px;
          font-size: 0.9em;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .log-message { 
          margin: 10px 0; 
          font-size: 1.1em;
          color: #e6edf3;
          word-wrap: break-word;
        }
        .log-context { 
          font-size: 0.9em; 
          color: #8b949e; 
          margin-top: 10px;
          padding: 10px;
          background: #0d1117;
          border-radius: 6px;
          border: 1px solid #30363d;
        }
        .log-context strong {
          color: #58a6ff;
        }
        .log-data { 
          background: #0d1117; 
          padding: 15px; 
          border-radius: 6px; 
          margin-top: 10px; 
          font-family: 'Consolas', monospace; 
          font-size: 0.85em; 
          border: 1px solid #30363d;
          color: #e6edf3;
          overflow-x: auto;
        }
        .no-logs { 
          text-align: center; 
          color: #8b949e; 
          padding: 60px; 
          font-size: 1.2em; 
          background: #21262d;
          border-radius: 8px;
          border: 1px solid #30363d;
        }
        .btn { 
          display: inline-block; 
          padding: 12px 24px; 
          background: linear-gradient(135deg, #238636, #2ea043); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 5px; 
          font-weight: bold;
          transition: all 0.3s ease;
          border: 1px solid #238636;
        }
        .btn:hover { 
          background: linear-gradient(135deg, #2ea043, #238636); 
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(35, 134, 54, 0.4);
        }
        .stats-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 15px;
          background: #21262d;
          border-radius: 8px;
          border: 1px solid #30363d;
        }
        .log-count {
          color: #58a6ff;
          font-weight: bold;
          font-size: 1.1em;
        }
        .scroll-indicator {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #21262d;
          color: #58a6ff;
          padding: 10px 15px;
          border-radius: 6px;
          border: 1px solid #30363d;
          font-size: 0.9em;
          z-index: 1000;
        }
        .level-debug { background: linear-gradient(135deg, #6c757d, #495057); }
        .level-info { background: linear-gradient(135deg, #17a2b8, #138496); }
        .level-warn { background: linear-gradient(135deg, #ffc107, #e0a800); color: #000; }
        .level-error { background: linear-gradient(135deg, #dc3545, #c82333); }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${title}</h1>
        
        <div class="stats-bar">
          <div class="log-count">📊 Total de logs: ${logs.length}</div>
          <a href="/logs" class="btn">📊 Volver a Logs</a>
        </div>
        
        ${logs.length === 0 ? 
          '<div class="no-logs">🔍 No se encontraron logs con los criterios especificados</div>' :
          logs.map(log => `
            <div class="log-entry">
              <div class="log-timestamp">⏰ ${formatDateTimeWithMs(new Date(log.timestamp))}</div>
              <div class="log-level level-${log.level.toLowerCase()}" style="background: ${levelColors[log.level] || '#6c757d'}">${log.level}</div>
              <div class="log-message">${log.message}</div>
              <div class="log-context">
                <strong>👤 Usuario:</strong> ${log.context.userId || 'N/A'} | 
                <strong>🔄 Flujo:</strong> ${log.context.flow || 'N/A'} | 
                <strong>⚡ Acción:</strong> ${log.context.action || 'N/A'}
              </div>
              ${log.context.data ? `<div class="log-data">${JSON.stringify(log.context.data, null, 2)}</div>` : ''}
            </div>
          `).join('')
        }
      </div>
      
      <div class="scroll-indicator" id="scrollIndicator">
        📍 Scroll para ver más logs
      </div>
      
      <script>
        // Indicador de scroll
        window.addEventListener('scroll', function() {
          const indicator = document.getElementById('scrollIndicator');
          const scrolled = window.pageYOffset;
          const maxHeight = document.body.scrollHeight - window.innerHeight;
          const percentage = Math.round((scrolled / maxHeight) * 100);
          
          if (percentage > 80) {
            indicator.textContent = '🎯 Casi al final';
            indicator.style.background = '#238636';
          } else if (percentage > 50) {
            indicator.textContent = '📊 ' + percentage + '% leído';
            indicator.style.background = '#21262d';
          } else {
            indicator.textContent = '📍 Scroll para ver más logs';
            indicator.style.background = '#21262d';
          }
        });
        
        // Auto-scroll suave al hacer clic en un log
        document.querySelectorAll('.log-entry').forEach(entry => {
          entry.addEventListener('click', function() {
            this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            this.style.borderLeftColor = '#58a6ff';
            setTimeout(() => {
              this.style.borderLeftColor = '#30363d';
            }, 2000);
          });
        });
      </script>
    </body>
    </html>
  `;
}

/**
 * Formatea el tamaño de archivo
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Formatea una fecha en formato dd/MM/yyyy
 */
function formatDate(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Formatea una fecha y hora en formato dd/MM/yyyy HH:mm:ss
 */
function formatDateTime(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
}

/**
 * Formatea una fecha y hora con milisegundos en formato dd/MM/yyyy HH:mm:ss.SSS
 */
function formatDateTimeWithMs(date: Date): string {
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const milliseconds = date.getMilliseconds().toString().padStart(3, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

/**
 * Parsea logs de texto plano a formato JSON
 */
function parseTextLogs(content: string) {
  const lines = content.split('\n').filter(line => line.trim());
  const logs = [];
  
  for (const line of lines) {
    try {
      // Formato: timestamp [LEVEL] [context] message
      // Ejemplo: 2025-09-25T15:44:23.119Z [INFO] [👤 559581157865 | 🔵 LEGAL_DOCUMENT_HANDLER | ⚡ Usuario escribió: "1"] Acción del usuario: Usuario escribió: "1"
      
      const timestampMatch = line.match(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)/);
      if (!timestampMatch) continue;
      
      const timestamp = timestampMatch[1];
      const remaining = line.substring(timestamp.length + 1);
      
      const levelMatch = remaining.match(/^\[([A-Z]+)\]/);
      if (!levelMatch) continue;
      
      const level = levelMatch[1];
      const afterLevel = remaining.substring(levelMatch[0].length + 1);
      
      const contextMatch = afterLevel.match(/^\[([^\]]+)\]/);
      if (!contextMatch) continue;
      
      const contextStr = contextMatch[1];
      const message = afterLevel.substring(contextMatch[0].length + 1).trim();
      
      // Parsear contexto: userId | flow | action
      // El formato real es: ðŸ'¤ userId | ðŸ"„ flow | âš¡ action
      const contextParts = contextStr.split(' | ');
      const context = {
        userId: null,
        flow: null,
        action: null
      };
      
      for (let i = 0; i < contextParts.length; i++) {
        const part = contextParts[i].trim();
        
        // Detectar por posición y contenido
        if (i === 0 && part.match(/^\d+$/)) {
          // Primera parte que contiene solo números = userId
          context.userId = part;
        } else if (i === 1 && part.match(/^(LEGAL_[A-Z_]+|CONVERSATION_[A-Z_]+)$/)) {
          // Segunda parte que contiene flujos válidos = flow
          context.flow = part;
        } else if (i === 2) {
          // Tercera parte = action
          context.action = part;
        }
      }
      
      // Fallback: intentar extraer por patrones si la detección por posición falla
      if (!context.userId || !context.flow) {
        const userIdMatch = contextStr.match(/(\d{10,15})/);
        const flowMatch = contextStr.match(/(LEGAL_[A-Z_]+|CONVERSATION_[A-Z_]+)/);
        const actionMatch = contextStr.match(/([A-Z_]+)$/);
        
        if (userIdMatch) context.userId = userIdMatch[1];
        if (flowMatch) context.flow = flowMatch[1];
        if (actionMatch) context.action = actionMatch[1];
      }
      
      logs.push({
        timestamp: timestamp,
        level: level,
        message: message,
        context: context
      });
    } catch (error) {
      console.error('Error parseando línea de log:', line, error);
    }
  }
  
  return logs;
}

/**
 * Genera HTML para mostrar lista de usuarios
 */
function generateUsersListHTML(users: any[]) {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>👥 Usuarios con Logs - QP Alliance</title>
      <style>
        * { box-sizing: border-box; }
        body { 
          font-family: 'Consolas', 'Monaco', 'Courier New', monospace; 
          margin: 0; 
          padding: 20px; 
          background: #0d1117; 
          color: #c9d1d9; 
          line-height: 1.6;
        }
        .container { 
          max-width: 1400px; 
          margin: 0 auto; 
          background: #161b22; 
          padding: 30px; 
          border-radius: 12px; 
          border: 1px solid #30363d;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        }
        h1 { 
          color: #58a6ff; 
          margin-bottom: 30px; 
          font-size: 2.2em;
          text-align: center;
          text-shadow: 0 0 10px rgba(88, 166, 255, 0.3);
        }
        .stats-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding: 15px;
          background: #21262d;
          border-radius: 8px;
          border: 1px solid #30363d;
        }
        .log-count {
          color: #58a6ff;
          font-weight: bold;
          font-size: 1.1em;
        }
        .btn { 
          display: inline-block; 
          padding: 12px 24px; 
          background: linear-gradient(135deg, #238636, #2ea043); 
          color: white; 
          text-decoration: none; 
          border-radius: 8px; 
          margin: 5px; 
          font-weight: bold;
          transition: all 0.3s ease;
          border: 1px solid #238636;
        }
        .btn:hover { 
          background: linear-gradient(135deg, #2ea043, #238636); 
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(35, 134, 54, 0.4);
        }
        .btn-secondary {
          background: linear-gradient(135deg, #6c757d, #495057);
          border-color: #6c757d;
        }
        .btn-secondary:hover {
          background: linear-gradient(135deg, #495057, #6c757d);
        }
        .users-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .user-card {
          background: #21262d;
          border: 1px solid #30363d;
          border-radius: 12px;
          padding: 20px;
          transition: all 0.3s ease;
          position: relative;
          overflow: hidden;
        }
        .user-card:hover {
          border-color: #58a6ff;
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(88, 166, 255, 0.2);
        }
        .user-id {
          color: #58a6ff;
          font-size: 1.3em;
          font-weight: bold;
          margin-bottom: 15px;
          word-break: break-all;
        }
        .user-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        .stat-item {
          background: #0d1117;
          padding: 10px;
          border-radius: 6px;
          border: 1px solid #30363d;
        }
        .stat-label {
          color: #8b949e;
          font-size: 0.9em;
          margin-bottom: 5px;
        }
        .stat-value {
          color: #e6edf3;
          font-weight: bold;
          font-size: 1.1em;
        }
        .flows-list {
          margin-top: 15px;
        }
        .flows-title {
          color: #8b949e;
          font-size: 0.9em;
          margin-bottom: 8px;
        }
        .flow-tag {
          display: inline-block;
          background: #238636;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.8em;
          margin: 2px;
        }
        .levels-bar {
          margin-top: 15px;
        }
        .level-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 5px;
          font-size: 0.9em;
        }
        .level-debug { color: #6c757d; }
        .level-info { color: #17a2b8; }
        .level-warn { color: #ffc107; }
        .level-error { color: #dc3545; }
        .no-users {
          text-align: center;
          color: #8b949e;
          padding: 60px;
          font-size: 1.2em;
          background: #21262d;
          border-radius: 8px;
          border: 1px solid #30363d;
        }
        .user-actions {
          margin-top: 15px;
          display: flex;
          gap: 10px;
        }
        .btn-small {
          padding: 8px 16px;
          font-size: 0.9em;
        }
        .sessions-info {
          margin-top: 15px;
          background: #0d1117;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #30363d;
        }
        .sessions-list {
          margin-top: 10px;
        }
        .session-item {
          background: #21262d;
          padding: 12px;
          margin-bottom: 8px;
          border-radius: 6px;
          border-left: 4px solid #30363d;
          transition: all 0.3s ease;
        }
        .session-item.completed {
          border-left-color: #238636;
        }
        .session-item.incomplete {
          border-left-color: #ffc107;
        }
        .session-item:hover {
          background: #30363d;
          transform: translateX(5px);
        }
        .session-time {
          color: #8b949e;
          font-size: 0.9em;
          margin-bottom: 5px;
        }
        .session-details {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.85em;
        }
        .session-duration {
          color: #58a6ff;
          font-weight: bold;
        }
        .session-status {
          font-weight: bold;
        }
        .session-status.completed {
          color: #238636;
        }
        .session-status.incomplete {
          color: #ffc107;
        }
        .session-logs {
          color: #8b949e;
        }
        .more-sessions {
          text-align: center;
          color: #8b949e;
          font-style: italic;
          margin-top: 10px;
          padding: 8px;
          background: #21262d;
          border-radius: 4px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>👥 Usuarios con Logs</h1>
        
        <div class="stats-bar">
          <div class="log-count">👥 Total de usuarios: ${users.length}</div>
          <div>
            <a href="/logs" class="btn btn-secondary">📊 Volver a Logs</a>
            <a href="/logs/user/all" class="btn">📋 Ver Todos los Logs</a>
          </div>
        </div>
        
        ${users.length === 0 ? 
          '<div class="no-users">🔍 No se encontraron usuarios con logs</div>' :
          `
            <div class="users-grid">
              ${users.map(user => `
                <div class="user-card">
                  <div class="user-id">👤 ${user.userId}</div>
                  
                  <div class="user-stats">
                    <div class="stat-item">
                      <div class="stat-label">📊 Total Logs</div>
                      <div class="stat-value">${user.totalLogs}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">🔄 Flujos</div>
                      <div class="stat-value">${user.flowsCount}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">💬 Sesiones</div>
                      <div class="stat-value">${user.totalSessions}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">✅ Completadas</div>
                      <div class="stat-value">${user.completedSessions}</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">⏱️ Duración Promedio</div>
                      <div class="stat-value">${user.avgSessionDuration} min</div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-label">📅 Última Sesión</div>
                      <div class="stat-value">${user.lastSessionStart ? formatDateTime(user.lastSessionStart) : 'N/A'}</div>
                    </div>
                  </div>
                  
                  <div class="flows-list">
                    <div class="flows-title">🔄 Flujos utilizados:</div>
                    ${user.flows.map(flow => `<span class="flow-tag">${flow}</span>`).join('')}
                  </div>
                  
                  <div class="levels-bar">
                    <div class="flows-title">📊 Niveles de log:</div>
                    ${Object.entries(user.levels).map(([level, count]) => `
                      <div class="level-item">
                        <span class="level-${level.toLowerCase()}">${level}</span>
                        <span>${count}</span>
                      </div>
                    `).join('')}
                  </div>
                  
                  ${user.sessions.length > 0 ? `
                    <div class="sessions-info">
                      <div class="flows-title">💬 Historial de Sesiones:</div>
                      <div class="sessions-list">
                        ${user.sessions.slice(-3).reverse().map(session => `
                          <div class="session-item ${session.status}">
                            <div class="session-time">
                              ${formatDateTime(session.startTime)} - 
                              ${session.endTime ? formatDateTime(session.endTime) : 'En curso'}
                            </div>
                            <div class="session-details">
                              <span class="session-duration">${session.duration} min</span>
                              <span class="session-status ${session.status}">${session.status === 'completed' ? '✅' : '⏳'}</span>
                              <span class="session-logs">${session.logsCount} logs</span>
                            </div>
                          </div>
                        `).join('')}
                        ${user.sessions.length > 3 ? `<div class="more-sessions">... y ${user.sessions.length - 3} sesiones más</div>` : ''}
                      </div>
                    </div>
                  ` : ''}
                  
                  <div class="user-actions">
                    <a href="/logs/user/${user.userId}" class="btn btn-small">📋 Ver Logs</a>
                    <a href="/logs/api/user/${user.userId}" class="btn btn-small btn-secondary">📄 JSON</a>
                  </div>
                </div>
              `).join('')}
            </div>
          `
        }
      </div>
    </body>
    </html>
  `;
}
