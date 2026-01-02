import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { DaptaData } from '../interfaces/reminder.interface';
import { ConfigService } from '@nestjs/config';

@Processor('dapta-calls')
export class DaptaProcessor {
  private readonly logger = new Logger(DaptaProcessor.name);
  private readonly daptaEndpoint: string;
  private readonly daptaApiKey: string;

  constructor(private configService: ConfigService) {
    this.daptaEndpoint = this.configService.get<string>('DAPTA_ENDPOINT');
    this.daptaApiKey = this.configService.get<string>('DAPTA_API_KEY');
  }

  @Process('make-call')
  async handleMakeCall(job: Job<DaptaData>) {
    const daptaData = job.data;

    this.logger.log(`Iniciando llamada para ${daptaData.plaintiff_name}`);

    try {
      const response = await fetch(this.daptaEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.daptaApiKey,
        },
        body: JSON.stringify(daptaData),
      });

      if (!response.ok) {
        throw new Error(
          `Dapta API error: ${response.status} ${response.statusText}`,
        );
      }

      const result = await response.json();

      return {
        success: true,
        callId: result.dapta_phone_call?.response?.call_id,
        plaintiff: daptaData.plaintiff_name,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error en llamada para ${daptaData.plaintiff_name}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @OnQueueFailed()
  async handleFailedCall(job: Job<DaptaData>, error: Error) {
    const daptaData = job.data;

    this.logger.error(
      `Llamada falló definitivamente para ${daptaData.plaintiff_name} después de ${job.attemptsMade} intentos.`,
      error.stack,
    );
  }
}
