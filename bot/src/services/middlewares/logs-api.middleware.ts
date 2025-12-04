/**
 * Middleware API para logs - Endpoints JSON para consultas programáticas
 */

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';

export function logsApiMiddleware(req: any, res: any, next: any) {
  // API para obtener logs más recientes
  if (req.url === '/logs/api/latest') {
    return handleLatestLogs(req, res);
  }
  
  // API para buscar logs por criterios
  if (req.url.startsWith('/logs/api/search')) {
    return handleSearchLogs(req, res);
  }
  
  // API para estadísticas de logs
  if (req.url === '/logs/api/stats') {
    return handleLogsStats(req, res);
  }
  
  // API para logs por usuario específico
  if (req.url.startsWith('/logs/api/user/')) {
    const userId = req.url.split('/logs/api/user/')[1];
    return handleUserLogsApi(req, res, userId);
  }
  
  // API para logs por flujo específico
  if (req.url.startsWith('/logs/api/flow/')) {
    const flow = req.url.split('/logs/api/flow/')[1];
    return handleFlowLogsApi(req, res, flow);
  }
  
  // API para logs por rango de fechas
  if (req.url.startsWith('/logs/api/date-range')) {
    return handleDateRangeLogs(req, res);
  }
  
  next();
}

/**
 * Obtiene los logs más recientes
 */
function handleLatestLogs(req: any, res: any) {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const logs = getLatestLogs(limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: logs.length,
      logs: logs
    }));
  } catch (error) {
    console.error('Error obteniendo logs más recientes:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Busca logs por criterios
 */
function handleSearchLogs(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const query = url.searchParams.get('q') || '';
    const level = url.searchParams.get('level') || '';
    const userId = url.searchParams.get('userId') || '';
    const flow = url.searchParams.get('flow') || '';
    const limit = parseInt(url.searchParams.get('limit') || '100');
    
    const logs = searchLogs({ query, level, userId, flow, limit });
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      count: logs.length,
      filters: { query, level, userId, flow, limit },
      logs: logs
    }));
  } catch (error) {
    console.error('Error buscando logs:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Obtiene estadísticas de logs
 */
function handleLogsStats(req: any, res: any) {
  try {
    const stats = getLogsStats();
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      stats: stats
    }));
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Logs por usuario (API)
 */
function handleUserLogsApi(req: any, res: any, userId: string) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = getLogsByFilter('userId', userId, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      userId: userId,
      count: logs.length,
      logs: logs
    }));
  } catch (error) {
    console.error('Error obteniendo logs de usuario:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Logs por flujo (API)
 */
function handleFlowLogsApi(req: any, res: any, flow: string) {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = getLogsByFilter('flow', flow, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      flow: flow,
      count: logs.length,
      logs: logs
    }));
  } catch (error) {
    console.error('Error obteniendo logs de flujo:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Logs por rango de fechas
 */
function handleDateRangeLogs(req: any, res: any) {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    const startDate = url.searchParams.get('start') || '';
    const endDate = url.searchParams.get('end') || '';
    const limit = parseInt(url.searchParams.get('limit') || '1000');
    
    if (!startDate || !endDate) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: false,
        error: 'Se requieren parámetros start y end'
      }));
      return;
    }
    
    const logs = getLogsByDateRange(startDate, endDate, limit);
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: true,
      startDate: startDate,
      endDate: endDate,
      count: logs.length,
      logs: logs
    }));
  } catch (error) {
    console.error('Error obteniendo logs por rango de fechas:', error);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      success: false,
      error: 'Error interno del servidor'
    }));
  }
}

/**
 * Obtiene los logs más recientes
 */
function getLatestLogs(limit: number = 50) {
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
        // Formato de texto plano (.log) - por ahora solo JSON
        logs = [];
      }
      
      allLogs.push(...logs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Busca logs por criterios
 */
function searchLogs(filters: {
  query?: string;
  level?: string;
  userId?: string;
  flow?: string;
  limit?: number;
}) {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      const logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      allLogs.push(...logs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  let filteredLogs = allLogs;
  
  // Filtrar por nivel
  if (filters.level) {
    filteredLogs = filteredLogs.filter(log => log.level === filters.level);
  }
  
  // Filtrar por usuario
  if (filters.userId) {
    filteredLogs = filteredLogs.filter(log => 
      log.context && log.context.userId === filters.userId
    );
  }
  
  // Filtrar por flujo
  if (filters.flow) {
    filteredLogs = filteredLogs.filter(log => 
      log.context && log.context.flow === filters.flow
    );
  }
  
  // Filtrar por texto
  if (filters.query) {
    const query = filters.query.toLowerCase();
    filteredLogs = filteredLogs.filter(log => 
      log.message.toLowerCase().includes(query) ||
      (log.context && JSON.stringify(log.context).toLowerCase().includes(query))
    );
  }
  
  return filteredLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, filters.limit || 100);
}

/**
 * Obtiene estadísticas de logs
 */
function getLogsStats() {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      const logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      allLogs.push(...logs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  const stats = {
    totalLogs: allLogs.length,
    totalFiles: files.length,
    levelCounts: {
      DEBUG: 0,
      INFO: 0,
      WARN: 0,
      ERROR: 0
    },
    userCounts: {} as Record<string, number>,
    flowCounts: {} as Record<string, number>,
    recentActivity: allLogs
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  };
  
  // Contar por nivel
  allLogs.forEach(log => {
    stats.levelCounts[log.level] = (stats.levelCounts[log.level] || 0) + 1;
  });
  
  // Contar por usuario
  allLogs.forEach(log => {
    if (log.context && log.context.userId) {
      stats.userCounts[log.context.userId] = (stats.userCounts[log.context.userId] || 0) + 1;
    }
  });
  
  // Contar por flujo
  allLogs.forEach(log => {
    if (log.context && log.context.flow) {
      stats.flowCounts[log.context.flow] = (stats.flowCounts[log.context.flow] || 0) + 1;
    }
  });
  
  return stats;
}

/**
 * Obtiene logs por filtro específico
 */
function getLogsByFilter(filterType: string, filterValue: string, limit: number = 100) {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.json'));
  const allLogs = [];
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      const logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      
      const filteredLogs = logs.filter(log => 
        log.context && log.context[filterType] === filterValue
      );
      
      allLogs.push(...filteredLogs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}

/**
 * Obtiene logs por rango de fechas
 */
function getLogsByDateRange(startDate: string, endDate: string, limit: number = 1000) {
  const logsDir = join(process.cwd(), 'logs');
  const files = readdirSync(logsDir).filter(file => file.endsWith('.json'));
  const allLogs = [];
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  for (const file of files) {
    try {
      const filePath = join(logsDir, file);
      const content = readFileSync(filePath, 'utf8');
      const logs = content.split('\n').filter(line => line.trim()).map(line => JSON.parse(line));
      
      const filteredLogs = logs.filter(log => {
        const logDate = new Date(log.timestamp);
        return logDate >= start && logDate <= end;
      });
      
      allLogs.push(...filteredLogs);
    } catch (error) {
      console.error(`Error leyendo archivo ${file}:`, error);
    }
  }
  
  return allLogs
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
}
