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
   */
  @Cron('0 6 * * *', {
    name: 'sincronizacion-monolegal-6am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria6am() {
    await this.ejecutarSincronizacionConLog('cron');
  }

  /**
   * Reintento: 7:00 AM - Solo si no hubo cambios a las 6am
   */
  @Cron('0 7 * * *', {
    name: 'sincronizacion-monolegal-7am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria7am() {
    if (await this.necesitaReintento()) {
      this.logger.log('Reintentando sincronización (7am)...');
      await this.ejecutarSincronizacionConLog('cron');
    }
  }

  /**
   * Reintento final: 8:00 AM
   */
  @Cron('0 8 * * *', {
    name: 'sincronizacion-monolegal-8am',
    timeZone: 'America/Bogota',
  })
  async sincronizacionDiaria8am() {
    if (await this.necesitaReintento()) {
      this.logger.log('Último reintento sincronización (8am)...');
      await this.ejecutarSincronizacionConLog('cron');
    }
  }

  /**
   * Verifica si necesita reintentar:
   * - No hubo sync hoy, O
   * - La sync de hoy tuvo 0 registros procesados
   */
  private async necesitaReintento(): Promise<boolean> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const syncHoy = await this.syncLogModel
      .findOne({
        type: 'monolegal',
        status: { $in: ['success', 'partial'] },
        startedAt: { $gte: hoy },
      })
      .sort({ startedAt: -1 });

    if (!syncHoy) {
      return true;
    }

    if (syncHoy.summary?.total === 0) {
      this.logger.log('Sync anterior sin cambios, reintentando...');
      return true;
    }

    this.logger.log(
      `Ya hay sync exitosa con ${syncHoy.summary?.total} registros`,
    );
    return false;
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

      await this.syncLogModel.findByIdAndUpdate(syncLog._id, { userId });

      const resultado = await this.monolegalService.syncFromApi(userId);

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
        status: { $in: ['success', 'partial'] }, // ✅ ASÍ
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
