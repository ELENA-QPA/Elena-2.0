import { Injectable, Logger } from '@nestjs/common';
import { PerformanceType } from '../dto/create-perfomance.dto';

export interface StateChangeLog {
    recordId: string;
    fromState: PerformanceType | null;
    toState: PerformanceType;
    responsible: string;
    observation?: string;
    timestamp: Date;
    userId?: string;
}

@Injectable()
export class PerformanceAuditService {
    private readonly logger = new Logger(PerformanceAuditService.name);

    /**
     * Registra un cambio de estado en los logs
     * @param stateChange Información del cambio de estado
     */
    logStateChange(stateChange: StateChangeLog): void {
        const logMessage = `Estado cambiado en expediente ${stateChange.recordId}: ` +
            `${stateChange.fromState || 'INICIAL'} → ${stateChange.toState} ` +
            `por ${stateChange.responsible}`;

        this.logger.log(logMessage, {
            recordId: stateChange.recordId,
            fromState: stateChange.fromState,
            toState: stateChange.toState,
            responsible: stateChange.responsible,
            observation: stateChange.observation,
            timestamp: stateChange.timestamp,
            userId: stateChange.userId,
            action: 'STATE_CHANGE'
        });
    }

    /**
     * Registra un intento de transición inválida
     * @param recordId ID del expediente
     * @param currentStates Estados actuales
     * @param attemptedState Estado que se intentó aplicar
     * @param responsible Responsable del intento
     */
    logInvalidTransition(
        recordId: string,
        currentStates: PerformanceType[],
        attemptedState: PerformanceType,
        responsible: string
    ): void {
        const logMessage = `Intento de transición inválida en expediente ${recordId}: ` +
            `Estados actuales [${currentStates.join(', ')}] → ${attemptedState} ` +
            `por ${responsible}`;

        this.logger.warn(logMessage, {
            recordId,
            currentStates,
            attemptedState,
            responsible,
            timestamp: new Date(),
            action: 'INVALID_TRANSITION_ATTEMPT'
        });
    }

    /**
     * Registra un acceso a información de estados
     * @param recordId ID del expediente
     * @param action Acción realizada
     * @param userId ID del usuario (opcional)
     */
    logStateAccess(recordId: string, action: string, userId?: string): void {
        const logMessage = `Acceso a estados del expediente ${recordId}: ${action}`;

        this.logger.log(logMessage, {
            recordId,
            action,
            userId,
            timestamp: new Date(),
            type: 'STATE_ACCESS'
        });
    }

    /**
     * Obtiene métricas de cambios de estado
     * @param recordId ID del expediente (opcional)
     * @returns Información de métricas
     */
    getStateChangeMetrics(recordId?: string): any {
        // Aquí podrías implementar lógica para obtener métricas de una base de datos
        // Por ahora, retorna información básica
        return {
            recordId,
            message: 'Métricas de auditoría disponibles en los logs del sistema',
            timestamp: new Date()
        };
    }
}
