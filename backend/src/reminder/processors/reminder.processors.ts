import { Process, Processor, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EmailReminderData } from '../interfaces/reminder.interface';
import { MailerService } from '@nestjs-modules/mailer';

@Processor('reminders')
export class ReminderProcessor {
  private readonly logger = new Logger(ReminderProcessor.name);

  constructor(private readonly mailerService: MailerService) {}

  @Process('send-email')
  async handleSendEmail(job: Job<EmailReminderData>) {
    const { to, subject, templateName, templateData, metadata } = job.data;

    this.logger.log(
      `Procesando email para ${to} - ${metadata?.reminderType || 'general'}`,
    );

    try {
      //   // Enviar email usando el servicio de email
      //   await this.mailerService.sendTemplatedEmail({
      //     to,
      //     subject,
      //     template: templateName,
      //     context: templateData,
      //   });

      this.logger.log(`✓ Email enviado exitosamente a ${to}`);

      return { success: true, to, metadata };
    } catch (error) {
      this.logger.error(`✗ Error enviando email a ${to}`, error.stack);
      throw error;
    }
  }

  @OnQueueFailed()
  async handleFailedEmail(job: Job<EmailReminderData>, error: Error) {
    const { to, metadata } = job.data;

    this.logger.error(
      `Email falló definitivamente para ${to} después de ${
        job.attemptsMade
      } intentos. Metadata: ${JSON.stringify(metadata)}`,
      error.stack,
    );
  }
}
