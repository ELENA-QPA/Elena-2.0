import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ReminderService } from './services/reminder.services';
import { MailerModule } from '@nestjs-modules/mailer';
import { ReminderProcessor } from './processors/reminder.processors';
import { ConfigModule } from '@nestjs/config';
import { DaptaProcessor } from './processors/dapta.processors';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'reminders',
    }),
    BullModule.registerQueue({
      name: 'dapta-calls',
    }),
    MailerModule,
    ConfigModule,
  ],
  providers: [ReminderService, ReminderProcessor, DaptaProcessor],
  exports: [ReminderService],
})
export class ReminderModule {}
