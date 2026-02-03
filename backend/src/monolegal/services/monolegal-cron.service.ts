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
   * Verifica si ya se sincronizó hoy y ejecuta si es necesario
   */
  private async verificarYEjecutarSincronizacionPendiente() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const sincronizacionHoy = await this.syncLogModel.findOne({
      type: 'monolegal',
      status: { $in: ['success', 'partial'] },
      startedAt: { $gte: hoy },
    });

    if (sincronizacionHoy) {
      if (sincronizacionHoy.summary?.total > 0) {
        this.logger.log(
          `Ya existe sync exitosa con ${sincronizacionHoy.summary.total} registros`,
        );
        return;
      }
      this.logger.log('Sync de hoy sin cambios, reintentando en startup...');
    }

    await this.ejecutarSincronizacionConLog('startup');
  }

  /**
   * Intento principal: 6:00 AM
   * Siempre ejecuta para capturar los primeros registros del día
   */
  @Cron('0 6 * * *', {
    name: 'sincronizacion-monolegal-6am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria6am() {
    this.logger.log('🔄 Ejecutando sincronización de las 6 AM...');
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * Reintento: 7:00 AM
   * Siempre ejecuta para capturar nuevos registros que la API agregó después de las 6 AM
   */
  @Cron('0 7 * * *', {
    name: 'sincronizacion-monolegal-7am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria7am() {
    this.logger.log('🔄 Ejecutando sincronización de las 7 AM...');
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * Reintento final: 8:00 AM
   * Siempre ejecuta para capturar todos los registros finales del día
   */
  @Cron('0 8 * * *', {
    name: 'sincronizacion-monolegal-8am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria8am() {
    this.logger.log('🔄 Ejecutando sincronización de las 8 AM...');
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * PRUEBA: 1:00 PM - Para validar que funciona correctamente en producción
   */
  @Cron('0 13 * * *', {
    name: 'sincronizacion-monolegal-1pm',
    timeZone: 'America/Bogota',
  })
  async sincronizacionPrueba1pm() {
    this.logger.log('🧪 [PRUEBA] Ejecutando sincronización de la 1:00 PM...');
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * Método central que ejecuta la sincronización y guarda el log
   */
  private async ejecutarSincronizacionConLog(
    triggeredBy: 'cron' | 'manual' | 'startup',
  ) {
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

      this.logger.log(`👤 Sincronizando con userId: ${userId}`);

      await this.syncLogModel.findByIdAndUpdate(syncLog._id, { userId });

      const resultado = await this.monolegalService.syncFromApi(userId);

      // Log del resumen
      this.logger.log(
        `📊 Resumen: ${resultado.summary.total} procesados (✅ ${
          resultado.summary.created
        } creados, 🔄 ${resultado.summary.updated} actualizados, ⏭️ ${
          resultado.summary.skipped || 0
        } omitidos, ❌ ${resultado.summary.errors} errores)`,
      );

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

      const erroresEnDetails =
        resultado.details?.filter((d: any) => d.status === 'error') || [];
      if (erroresEnDetails.length > 0) {
        this.logger.error('Primeros 5 errores:');
        erroresEnDetails.slice(0, 5).forEach((e: any, i: number) => {
          this.logger.error(`   ${i + 1}. ${JSON.stringify(e)}`);
        });
      }

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
        status: { $in: ['success', 'partial'] },
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
