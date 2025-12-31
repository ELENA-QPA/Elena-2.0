import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReminderService } from './services/reminder.services';
import { MailerModule } from '@nestjs-modules/mailer';
import { ReminderProcessor } from './processors/reminder.processors';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reminders',
    }),
    MailerModule,
  ],
  providers: [ReminderService, ReminderProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}
