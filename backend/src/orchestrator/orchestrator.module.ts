import { Module } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';
import { OrchestratorController } from './controllers/orchestrator.controller';
import { RecordsModule } from 'src/records/records.module';
import { RecordAdapter } from './adapters/record.adapter';
import { AudienceModule } from 'src/audience/audience.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notifications/notifications.module';
import { ReminderModule } from 'src/reminder/reminder.module';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    RecordsModule,
    AudienceModule,
    AuthModule,
    NotificationModule,
    ReminderModule,
    MailerModule,
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService, RecordAdapter],
})
export class OrchestratorModule {}
