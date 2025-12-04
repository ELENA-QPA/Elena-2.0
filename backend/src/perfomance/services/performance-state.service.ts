import { Injectable, BadRequestException } from '@nestjs/common';
import { PerformanceType } from '../dto/create-perfomance.dto';
import { Estado } from '../../records/dto/create-record.dto';

export interface StateTransition {
    from: PerformanceType[];
    to: PerformanceType;
    description: string;
}

@Injectable()
export class PerformanceStateService {

    // Definición de las transiciones válidas de estado
    private readonly stateTransitions: StateTransition[] = [
        // Paso 1: Radicado (estado inicial)
        {
            from: [],
            to: Estado.RADICADO,
            description: 'Primer estado - Radicación de la demanda'
        },

        // Paso 2: Inadmitido (solo después de radicado)
        {
            from: [Estado.RADICADO],
            to: Estado.INADMITIDO,
            description: 'Solo después de radicado'
        },

        // Paso 2.1: Subsanación (solo después de inadmitida)
        {
            from: [Estado.INADMITIDO],
            to: Estado.SUBSANACION,
            description: 'Solo después de inadmitida la demanda'
        },

        // Paso 2: Admite (después de radicado o subsanación)
        {
            from: [Estado.RADICADO, Estado.SUBSANACION],
            to: Estado.ADMITE,
            description: 'Solo después de radicado o subsanada la demanda'
        },

        // Paso 3: Notificación personal (solo después de admitida)
        {
            from: [Estado.ADMITE],
            to: Estado.NOTIFICACION_PERSONAL,
            description: 'Solo después de admitida la demanda'
        },

        // Paso 4: Contestación (solo después de notificación)
        {
            from: [Estado.NOTIFICACION_PERSONAL],
            to: Estado.CONTESTACION_DEMANDA,
            description: 'Solo después de la notificación personal'
        },

        // Paso 4.1: Inadmite contestación (después de contestada)
        {
            from: [Estado.CONTESTACION_DEMANDA],
            to: Estado.INADMITE_CONTESTACION,
            description: 'Puede ocurrir después de contestada la demanda'
        },

        // Paso 5: Admisión de contestación (después de contestación o inadmisión)
        {
            from: [Estado.CONTESTACION_DEMANDA, Estado.INADMITE_CONTESTACION],
            to: Estado.ADMISION_CONTESTACION,
            description: 'Ocurre después de la contestación o inadmisión de la misma'
        },

        // Paso 6: Fija audiencia (después de admisión de contestación)
        {
            from: [Estado.ADMISION_CONTESTACION],
            to: Estado.FIJA_AUDIENCIA,
            description: 'Ocurre después de la admisión de la contestación'
        },

        // Paso 6.1: Celebra audiencia (después de fijar audiencia)
        {
            from: [Estado.FIJA_AUDIENCIA],
            to: Estado.CELEBRA_AUDIENCIA,
            description: 'Ocurre después de fijar audiencia'
        },

        // Paso 7: Conciliado (después de celebrar audiencia)
        {
            from: [Estado.CELEBRA_AUDIENCIA],
            to: Estado.CONCILIADO,
            description: 'Después de celebrar audiencia'
        },

        // Paso 8: Finalizado por sentencia (después de celebrar audiencia)
        {
            from: [Estado.CELEBRA_AUDIENCIA],
            to: Estado.FINALIZADO_SENTENCIA,
            description: 'Después de celebrar audiencia'
        },

        // Estados especiales que pueden ocurrir en varios momentos

        // Archivado (en cualquier momento después de radicado)
        {
            from: [
                Estado.RADICADO,
                Estado.INADMITIDO,
                Estado.SUBSANACION,
                Estado.ADMITE,
                Estado.NOTIFICACION_PERSONAL,
                Estado.CONTESTACION_DEMANDA,
                Estado.INADMITE_CONTESTACION,
                Estado.ADMISION_CONTESTACION,
                Estado.FIJA_AUDIENCIA,
                Estado.CONCILIADO
            ],
            to: Estado.ARCHIVADO,
            description: 'En cualquier momento después de radicado'
        },

        // Retiro de demanda (en cualquier momento después de radicado)
        {
            from: [
                Estado.RADICADO,
                Estado.INADMITIDO,
                Estado.SUBSANACION,
                Estado.ADMITE,
                Estado.NOTIFICACION_PERSONAL,
                Estado.CONTESTACION_DEMANDA,
                Estado.INADMITE_CONTESTACION,
                Estado.ADMISION_CONTESTACION,
                Estado.FIJA_AUDIENCIA,
                Estado.CONCILIADO
            ],
            to: Estado.RETIRO_DEMANDA,
            description: 'En cualquier momento después de radicado'
        },

        // Finalizado por rechazo (después de radicado o subsanación incorrecta)
        {
            from: [Estado.RADICADO, Estado.SUBSANACION],
            to: Estado.FINALIZADO_RECHAZO,
            description: 'Después de radicado o subsanación incorrecta'
        }
    ];

    /**
     * Valida si una transición de estado es válida
     * @param currentStates Array de estados actuales del expediente
     * @param newState Nuevo estado que se quiere establecer
     * @returns boolean indicando si la transición es válida
     */
    isValidTransition(currentStates: PerformanceType[], newState: PerformanceType): boolean {
        // Si es el primer estado (RADICADO), permitir siempre
        if (newState === Estado.RADICADO && currentStates.length === 0) {
            return true;
        }

        // Buscar la regla de transición para el nuevo estado
        const transitionRule = this.stateTransitions.find(rule => rule.to === newState);

        if (!transitionRule) {
            return false;
        }

        // Si no hay estados previos requeridos (estado inicial)
        if (transitionRule.from.length === 0) {
            return currentStates.length === 0;
        }

        // Verificar si alguno de los estados actuales permite la transición
        return transitionRule.from.some(allowedState =>
            currentStates.includes(allowedState)
        );
    }

    /**
     * Obtiene los próximos estados válidos basados en los estados actuales
     * @param currentStates Array de estados actuales del expediente
     * @returns Array de estados válidos para la siguiente transición
     */
    getValidNextStates(currentStates: PerformanceType[]): PerformanceType[] {
        const validNextStates: PerformanceType[] = [];

        for (const transition of this.stateTransitions) {
            if (this.isValidTransition(currentStates, transition.to)) {
                // Evitar duplicados
                if (!validNextStates.includes(transition.to)) {
                    validNextStates.push(transition.to);
                }
            }
        }

        return validNextStates;
    }

    /**
     * Valida una transición y lanza excepción si no es válida
     * @param currentStates Estados actuales del expediente
     * @param newState Nuevo estado que se quiere establecer
     * @throws BadRequestException si la transición no es válida
     */
    validateTransition(currentStates: PerformanceType[], newState: PerformanceType): void {
        // Si no hay estados previos, permitir cualquier estado como primer estado
        if (currentStates.length === 0) {
            return;
        }
        if (!this.isValidTransition(currentStates, newState)) {
            const validStates = this.getValidNextStates(currentStates);
            const currentStatesStr = currentStates.length > 0 ? currentStates.join(', ') : 'ninguno';
            const validStatesStr = validStates.length > 0 ? validStates.join(', ') : 'ninguno';

            throw new BadRequestException(
                `Transición de estado inválida. Estado actual: [${currentStatesStr}]. ` +
                `Estado solicitado: ${newState}. ` +
                `Estados válidos: [${validStatesStr}]`
            );
        }
    }

    /**
     * Obtiene la descripción de una transición específica
     * @param newState Estado de destino
     * @returns Descripción de la transición
     */
    getTransitionDescription(newState: PerformanceType): string {
        const transition = this.stateTransitions.find(rule => rule.to === newState);
        return transition ? transition.description : 'Transición no definida';
    }

    /**
     * Verifica si un estado es final (no tiene transiciones posteriores principales)
     * @param state Estado a verificar
     * @returns boolean indicando si es un estado final
     */
    isFinalState(state: PerformanceType): boolean {
        const finalStates = [
            Estado.ARCHIVADO,
            Estado.RETIRO_DEMANDA,
            Estado.FINALIZADO_SENTENCIA,
            Estado.FINALIZADO_RECHAZO,
            Estado.CONCILIADO
        ];

        return finalStates.includes(state);
    }

    /**
     * Obtiene el flujo completo de estados posibles
     * @returns Objeto con la información del flujo de estados
     */
    getStateFlow(): { states: PerformanceType[], transitions: StateTransition[] } {
        const allStates = Object.values(Estado);
        return {
            states: allStates,
            transitions: this.stateTransitions
        };
    }
}
