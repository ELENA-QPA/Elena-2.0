/**
 * Servicio de logging avanzado para el bot de WhatsApp
 * Permite diferenciar logs por usuario y flujo
 */

import { writeFileSync, appendFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogContext {
  userId?: string;
  flow?: string;
  action?: string;
  data?: any;
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context: LogContext;
  stack?: string;
}

class LoggerService {
  private logLevel: LogLevel;
  private logDir: string;
  private enableFileLogging: boolean;

  constructor() {
    this.logLevel = LogLevel.INFO;
    this.logDir = join(process.cwd(), 'logs');
    this.enableFileLogging = true;
    
    // Crear directorio de logs si no existe
    this.ensureLogDirectory();
  }

  private ensureLogDirectory(): void {
    if (!existsSync(this.logDir)) {
      mkdirSync(this.logDir, { recursive: true });
    }
  }

  private getLogFileName(): string {
    const today = new Date().toISOString().split('T')[0];
    return join(this.logDir, `bot-${today}.log`);
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private getLevelColor(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '\x1b[36m'; // Cyan
      case LogLevel.INFO: return '\x1b[32m';  // Green
      case LogLevel.WARN: return '\x1b[33m';  // Yellow
      case LogLevel.ERROR: return '\x1b[31m'; // Red
      default: return '\x1b[0m'; // Reset
    }
  }

  private getLevelName(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return 'DEBUG';
      case LogLevel.INFO: return 'INFO';
      case LogLevel.WARN: return 'WARN';
      case LogLevel.ERROR: return 'ERROR';
      default: return 'UNKNOWN';
    }
  }

  private getEmoji(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG: return '🔍';
      case LogLevel.INFO: return 'ℹ️';
      case LogLevel.WARN: return '⚠️';
      case LogLevel.ERROR: return '❌';
      default: return '📝';
    }
  }

  private formatUserContext(context: LogContext): string {
    const parts: string[] = [];
    
    if (context.userId) {
      // Formatear número de teléfono para mejor legibilidad
      const phone = context.userId.replace('@c.us', '');
      parts.push(`👤 ${phone}`);
    }
    
    if (context.flow) {
      parts.push(`🔄 ${context.flow}`);
    }
    
    if (context.action) {
      parts.push(`⚡ ${context.action}`);
    }
    
    return parts.length > 0 ? `[${parts.join(' | ')}]` : '';
  }

  private log(level: LogLevel, message: string, context: LogContext = {}, error?: Error): void {
    // Verificar si el nivel de log está habilitado
    if (level < this.logLevel) {
      return;
    }

    const timestamp = this.formatTimestamp();
    const userContext = this.formatUserContext(context);
    const emoji = this.getEmoji(level);
    const levelName = this.getLevelName(level);
    const color = this.getLevelColor(level);
    const reset = '\x1b[0m';

    // Formatear mensaje para consola
    const consoleMessage = `${color}${emoji} [${levelName}]${reset} ${userContext} ${message}`;
    
    // Formatear mensaje para archivo
    const logEntry: LogEntry = {
      timestamp,
      level,
      message,
      context,
      stack: error?.stack
    };

    const fileMessage = `${timestamp} [${levelName}] ${userContext} ${message}${error?.stack ? '\n' + error.stack : ''}`;

    // Log a consola
    console.log(consoleMessage);

    // Log a archivo si está habilitado
    if (this.enableFileLogging) {
      try {
        const logFile = this.getLogFileName();
        appendFileSync(logFile, fileMessage + '\n', 'utf8');
      } catch (error) {
        console.error('Error escribiendo log a archivo:', error);
      }
    }
  }

  // Métodos públicos para diferentes niveles de log
  public debug(message: string, context: LogContext = {}): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context: LogContext = {}): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context: LogContext = {}): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context: LogContext = {}, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Métodos específicos para flujos del bot
  public flowStart(flowName: string, userId: string, data?: any): void {
    this.info(`Iniciando flujo: ${flowName}`, {
      userId,
      flow: flowName,
      action: 'FLOW_START',
      data
    });
  }

  public flowEnd(flowName: string, userId: string, success: boolean = true, data?: any): void {
    this.info(`Finalizando flujo: ${flowName} - ${success ? 'Éxito' : 'Error'}`, {
      userId,
      flow: flowName,
      action: 'FLOW_END',
      data
    });
  }

  public userAction(action: string, userId: string, flow?: string, data?: any): void {
    this.info(`Acción del usuario: ${action}`, {
      userId,
      flow,
      action,
      data
    });
  }

  public botResponse(message: string, userId: string, flow?: string): void {
    this.info(`Bot responde: ${message}`, {
      userId,
      flow,
      action: 'BOT_RESPONSE'
    });
  }

  public apiCall(endpoint: string, userId: string, success: boolean, data?: any): void {
    const status = success ? 'Éxito' : 'Error';
    const params = data ? ` | Parámetros: ${JSON.stringify(data)}` : '';
    this.info(`Llamada API: ${endpoint} - ${status}${params}`, {
      userId,
      action: 'API_CALL',
      data: { endpoint, success, ...data }
    });
  }

  // Configuración
  public setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  public setFileLogging(enabled: boolean): void {
    this.enableFileLogging = enabled;
  }

  public setLogDirectory(dir: string): void {
    this.logDir = dir;
    this.ensureLogDirectory();
  }
}

// Instancia singleton del logger
export const logger = new LoggerService();

// Helper para extraer información del contexto de BuilderBot
export function createLogContext(ctx: any, flow?: string, action?: string, data?: any): LogContext {
  return {
    userId: ctx?.from || 'unknown',
    flow,
    action,
    data
  };
}
