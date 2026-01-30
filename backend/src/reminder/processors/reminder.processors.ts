import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Job } from 'bull';
import { EmailReminderData } from '../interfaces/reminder.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('reminders')
export class ReminderProcessor {
  constructor(private readonly mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailReminderData>) {
    const data = job.data;

    try {
      await this.mailerService.sendMail(data);

      return { success: true, to: data.to };
    } catch (error) {
      throw error;
    }
  }

  @OnQueueFailed()
  async handleFailedEmail(job: Job<EmailReminderData>, error: Error) {
    const { to } = job.data;
  }
}
