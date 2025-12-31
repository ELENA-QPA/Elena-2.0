import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EmailReminderData } from '../interfaces/reminder.interface';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);

  constructor(@InjectQueue('reminders') private reminderQueue: Queue) {
    this.logger.log('[INIT] ReminderService initialized');
  }

  async sendEmail(emailData: EmailReminderData): Promise<void> {
    this.logger.log('[QUEUE] Adding send-email job');
    await this.reminderQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async getQueueStats() {
    const waiting = await this.reminderQueue.getWaitingCount();
    const active = await this.reminderQueue.getActiveCount();
    const completed = await this.reminderQueue.getCompletedCount();
    const failed = await this.reminderQueue.getFailedCount();
    const delayed = await this.reminderQueue.getDelayedCount();

    return {
      waiting,
      active,
      completed,
      failed,
      delayed,
      total: waiting + active + completed + failed + delayed,
    };
  }

  async cleanQueue(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.reminderQueue.clean(olderThanMs);
    this.logger.log('Cola de recordatorios limpiada');
  }

  async getFailedJobs() {
    return this.reminderQueue.getFailed();
  }

  async retryFailedJob(jobId: string): Promise<void> {
    const job = await this.reminderQueue.getJob(jobId);
    if (job) {
      await job.retry();
      this.logger.log(`Job ${jobId} reencolado para reintento`);
    }
  }
}
