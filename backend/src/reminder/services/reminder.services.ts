import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DaptaData, EmailReminderData } from '../interfaces/reminder.interface';
import * as fs from 'fs';
import * as Handlebars from 'handlebars';

@Injectable()
export class ReminderService {
  private readonly logger = new Logger(ReminderService.name);
  constructor(
    @InjectQueue('reminders') private reminderQueue: Queue,
    @InjectQueue('dapta-calls') private daptaQueue: Queue,
  ) {}

  async sendEmail(emailData: EmailReminderData): Promise<void> {
    await this.reminderQueue.add('send-email', emailData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
      },
      removeOnComplete: true,
      removeOnFail: false,
    });
  }

  async getEmailQueueStats() {
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

  async enqueueDaptaCall(callData: DaptaData): Promise<void> {
    this.logger.log('make-call ' + JSON.stringify(callData));
    await this.daptaQueue.add('make-call', callData, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: true,
      removeOnFail: false,
      timeout: 3000,
    });
  }

  async getDaptaQueueStats() {
    const waiting = await this.daptaQueue.getWaitingCount();
    const active = await this.daptaQueue.getActiveCount();
    const completed = await this.daptaQueue.getCompletedCount();
    const failed = await this.daptaQueue.getFailedCount();
    const delayed = await this.daptaQueue.getDelayedCount();

    return {
      calls: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      },
    };
  }

  async cleanQueue(olderThanMs: number = 24 * 60 * 60 * 1000): Promise<void> {
    await this.reminderQueue.clean(olderThanMs);
    await this.daptaQueue.clean(olderThanMs);
  }

  async getFailedJobs() {
    const failedEmails = await this.reminderQueue.getFailed();
    const failedCalls = await this.daptaQueue.getFailed();

    return {
      emails: failedEmails,
      calls: failedCalls,
    };
  }

  async retryFailedJob(
    jobId: string,
    queueType: 'email' | 'call',
  ): Promise<void> {
    const queue = queueType === 'email' ? this.reminderQueue : this.daptaQueue;
    const job = await queue.getJob(jobId);
    if (job) {
      await job.retry();
    }
  }

  render(templatePath: string, data: any): string {
    const html = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(html);
    return template(data);
  }

  private utcToColombia(dateString: string): Date {
    const date = new Date(dateString);
    return new Date(date.getTime() - 5 * 60 * 60 * 1000);
  }

  buildAudienceContext(audience) {
    const startCol = this.utcToColombia(audience.start);
    const endCol = this.utcToColombia(audience.end);

    const formatTime = (date: Date): string => {
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    return {
      ...audience,
      month: startCol.toLocaleString('es-CO', { month: 'long' }).toUpperCase(),
      day: startCol.getDate().toString(),
      year: startCol.getFullYear().toString(),
      start_time: formatTime(startCol),
      end_time: formatTime(endCol),
    };
  }
}
