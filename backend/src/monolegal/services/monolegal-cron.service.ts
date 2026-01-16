import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { MonolegalService } from './monolegal.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Record } from './../../records/entities/record.entity';
import { SyncLog } from '../entities/sync-log.entity';

@Injectable()
export class MonolegalCronService implements OnModuleInit {
  private readonly logger = new Logger(MonolegalCronService.name);

  constructor(
    private readonly monolegalService: MonolegalService,
    @InjectModel(Record.name) private recordModel: Model<Record>,
    @InjectModel(SyncLog.name) private syncLogModel: Model<SyncLog>,
  ) {}

  /**
   * Se ejecuta cuando el servidor arranca
   */
  async onModuleInit() {
    try {
      await new Promise((resolve) => setTimeout(resolve, 5000));
      await this.verificarYEjecutarSincronizacionPendiente();
    } catch (error) {
      this.logger.error(
        `Error al verificar sincronización pendiente: ${error.message}`,
      );
    }
  }

  /**
   * Verifica si ya se sincronizó hoy usando SyncLog
   */
  private async verificarYEjecutarSincronizacionPendiente() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    // Buscar en SyncLog si ya hubo sincronización exitosa hoy
    const sincronizacionHoy = await this.syncLogModel.findOne({
      type: 'monolegal',
      status: { $in: ['success', 'partial'] },
      startedAt: { $gte: hoy },
    });

    if (sincronizacionHoy) {
      const horaSync =
        sincronizacionHoy.completedAt?.toLocaleTimeString('es-CO');
      this.logger.log(
        `Ya existe sincronización del día de hoy a las ${horaSync}`,
      );
      return;
    }
  }

  /**
   * Se ejecuta todos los días a las 6:00 AM
   */
  @Cron('0 6 * * *', {
    name: 'sincronizacion-monolegal-diaria',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria() {
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * Método central que ejecuta la sincronización y guarda el log
   */
  private async ejecutarSincronizacionConLog(
    triggeredBy: 'cron' | 'manual' | 'startup',
  ) {
    
    // Crear registro de sincronización en estado pending
    const syncLog = await this.syncLogModel.create({
      type: 'monolegal',
      startedAt: new Date(),
      status: 'pending',
      triggeredBy,
    });

    try {
      const userId = await this.obtenerUserIdParaSincronizacion();

      if (!userId) {
        throw new Error(
          'No se encontró userId para la sincronización automática',
        );
      }

      // Actualizar log con el userId
      await this.syncLogModel.findByIdAndUpdate(syncLog._id, { userId });

      // Ejecutar la sincronización
      const resultado = await this.monolegalService.syncFromApi(userId);

      // Loguear errores específicos si los hay
      if (resultado.summary.errors > 0 && resultado.details) {
        const errores = resultado.details.filter(
          (d: any) => d.status === 'error',
        );
        this.logger.error('Detalle de errores:');
        errores.forEach((error: any, index: number) => {
          this.logger.error(
            `   ${index + 1}. Radicado: ${error.radicado} - ${error.message}`,
          );
        });
      }

      // Actualizar log con éxito
      await this.syncLogModel.findByIdAndUpdate(syncLog._id, {
        completedAt: new Date(),
        status: resultado.summary.errors > 0 ? 'partial' : 'success',
        summary: {
          total: resultado.summary.total,
          created: resultado.summary.created,
          updated: resultado.summary.updated,
          skipped: resultado.summary.skipped || 0,
          errors: resultado.summary.errors,
        },
        // Guardar los primeros 5 errores en la BD
        errorDetails:
          resultado.details
            ?.filter((d: any) => d.status === 'error')
            ?.slice(0, 5)
            ?.map((e: any) => ({ radicado: e.radicado, message: e.message })) ||
          [],
      });
      
      if (resultado.summary.errors > 0) {
        this.logger.error(
          `Se encontraron ${resultado.summary.errors} errores durante la sincronización`,
        );
      }

      return resultado;
    } catch (error) {
      // Actualizar log con error
      await this.syncLogModel.findByIdAndUpdate(syncLog._id, {
        completedAt: new Date(),
        status: 'error',
        errorMessage: error.message,
      });

      this.logger.error(
        `Error en la sincronización automática: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
  /**
   * Obtiene un userId válido para la sincronización
   */
  private async obtenerUserIdParaSincronizacion(): Promise<string | null> {
    try {
      const ADMIN_USER_ID = process.env.MONOLEGAL_SYNC_USER_ID || null;

      if (ADMIN_USER_ID) {        
        return ADMIN_USER_ID;
      }
      
      const record = await this.recordModel
        .findOne({ sincronizadoMonolegal: true })
        .sort({ fechaSincronizacion: -1 })
        .exec();

      if (record?.user) {        
        return record.user.toString();
      }
      
      const anyRecord = await this.recordModel
        .findOne({ user: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .exec();

      if (anyRecord?.user) {        
        return anyRecord.user.toString();
      }

      return null;
    } catch (error) {
      this.logger.error(`Error al obtener userId: ${error.message}`);
      return null;
    }
  }

  /**
   * Método manual para ejecutar la sincronización
   */
  /**
   * Método manual para ejecutar la sincronización
   */
  async ejecutarSincronizacionManual(userId: string) {
    const syncLog = await this.syncLogModel.create({
      type: 'monolegal',
      startedAt: new Date(),
      status: 'pending',
      triggeredBy: 'manual',
      userId,
    });

    try {
      const resultado = await this.monolegalService.syncFromApi(userId);      

      // Ver los primeros 5 errores si existen
      const erroresEnDetails =
        resultado.details?.filter((d: any) => d.status === 'error') || [];      
      if (erroresEnDetails.length > 0) {
        this.logger.error('Primeros 5 errores:');
        erroresEnDetails.slice(0, 5).forEach((e: any, i: number) => {
          this.logger.error(`   ${i + 1}. ${JSON.stringify(e)}`);
        });
      }

      // Loguear errores específicos si los hay
      if (resultado.summary.errors > 0 && resultado.details) {
        const errores = resultado.details.filter(
          (d: any) => d.status === 'error',
        );
        this.logger.error('Detalle de errores:');
        errores.forEach((error: any, index: number) => {
          this.logger.error(
            `   ${index + 1}. Radicado: ${error.radicado} - ${error.message}`,
          );
        });
      }

      await this.syncLogModel.findByIdAndUpdate(syncLog._id, {
        completedAt: new Date(),
        status: resultado.summary.errors > 0 ? 'partial' : 'success',
        summary: {
          total: resultado.summary.total,
          created: resultado.summary.created,
          updated: resultado.summary.updated,
          skipped: resultado.summary.skipped || 0,
          errors: resultado.summary.errors,
        },
        errorDetails:
          resultado.details
            ?.filter((d: any) => d.status === 'error')
            ?.slice(0, 50)
            ?.map((e: any) => ({ radicado: e.radicado, message: e.message })) ||
          [],
      });      

      return resultado;
    } catch (error) {
      await this.syncLogModel.findByIdAndUpdate(syncLog._id, {
        completedAt: new Date(),
        status: 'error',
        errorMessage: error.message,
      });
      throw error;
    }
  }

  /**
   * Obtiene la última sincronización exitosa
   */
  async getLastSync() {
    const lastSync = await this.syncLogModel
      .findOne({
        type: 'monolegal',
        status: 'success',
      })
      .sort({ completedAt: -1 })
      .exec();

    return {
      lastSync: lastSync?.completedAt || null,
      hasSync: !!lastSync,
      summary: lastSync?.summary || null,
      triggeredBy: lastSync?.triggeredBy || null,
      status: lastSync?.status || null,
      errorDetails: lastSync?.errorDetails || [],
    };
  }
}
