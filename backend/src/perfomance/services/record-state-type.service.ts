import { Injectable } from '@nestjs/common';
import { Estado, TipoEstado } from '../../records/dto/create-record.dto';

@Injectable()
export class RecordStateTypeService {

    /**
     * Mapeo de estados a tipos de estado
     */
    private readonly stateTypeMapping: Record<Estado, TipoEstado> = {
        [Estado.RADICADO]: TipoEstado.ACTIVO,
        [Estado.INADMITIDO]: TipoEstado.ACTIVO,
        [Estado.SUBSANACION]: TipoEstado.ACTIVO,
        [Estado.ADMITE]: TipoEstado.ACTIVO,
        [Estado.NOTIFICACION_PERSONAL]: TipoEstado.ACTIVO,
        [Estado.CONTESTACION_DEMANDA]: TipoEstado.ACTIVO,
        [Estado.INADMITE_CONTESTACION]: TipoEstado.ACTIVO,
        [Estado.ADMISION_CONTESTACION]: TipoEstado.ACTIVO,
        [Estado.FIJA_AUDIENCIA]: TipoEstado.ACTIVO,
        [Estado.CELEBRA_AUDIENCIA]: TipoEstado.ACTIVO,
        [Estado.CONCILIADO]: TipoEstado.FINALIZADO,
        [Estado.ARCHIVADO]: TipoEstado.FINALIZADO,
        [Estado.RETIRO_DEMANDA]: TipoEstado.FINALIZADO,
        [Estado.FINALIZADO_SENTENCIA]: TipoEstado.FINALIZADO,
        [Estado.FINALIZADO_RECHAZO]: TipoEstado.FINALIZADO,
        [Estado.RADICA_IMPULSO_PROCESAL]: TipoEstado.ACTIVO,
    };

    /**
     * Determina el tipo de estado basado en el estado actual
     * @param estado Estado actual del record
     * @returns Tipo de estado correspondiente
     */
    getTipoEstadoFromEstado(estado: Estado): TipoEstado {
        return this.stateTypeMapping[estado] || TipoEstado.ACTIVO;
    }

    /**
     * Verifica si un estado es de tipo activo
     * @param estado Estado a verificar
     * @returns true si el estado es activo
     */
    isEstadoActivo(estado: Estado): boolean {
        return this.getTipoEstadoFromEstado(estado) === TipoEstado.ACTIVO;
    }

    /**
     * Verifica si un estado es de tipo finalizado
     * @param estado Estado a verificar
     * @returns true si el estado es finalizado
     */
    isEstadoFinalizado(estado: Estado): boolean {
        return this.getTipoEstadoFromEstado(estado) === TipoEstado.FINALIZADO;
    }

    /**
     * Obtiene todos los estados de un tipo específico
     * @param tipo Tipo de estado (ACTIVO o FINALIZADO)
     * @returns Array de estados del tipo especificado
     */
    getEstadosByTipo(tipo: TipoEstado): Estado[] {
        return Object.entries(this.stateTypeMapping)
            .filter(([_, tipoEstado]) => tipoEstado === tipo)
            .map(([estado, _]) => estado as Estado);
    }

    /**
     * Obtiene el mapeo completo de estados a tipos
     * @returns Mapeo completo
     */
    getStateTypeMapping(): Record<Estado, TipoEstado> {
        return { ...this.stateTypeMapping };
    }

    /**
     * Obtiene estadísticas de tipos de estado
     * @returns Estadísticas con conteos por tipo
     */
    getStateTypeStatistics(): {
        activos: Estado[];
        finalizados: Estado[];
        totalActivos: number;
        totalFinalizados: number;
    } {
        const activos = this.getEstadosByTipo(TipoEstado.ACTIVO);
        const finalizados = this.getEstadosByTipo(TipoEstado.FINALIZADO);

        return {
            activos,
            finalizados,
            totalActivos: activos.length,
            totalFinalizados: finalizados.length
        };
    }
}
