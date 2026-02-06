import { forwardRef, Module } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';
import { OrchestratorController } from './controllers/orchestrator.controller';
import { RecordsModule } from 'src/records/records.module';
import { RecordAdapter } from './adapters/record.adapter';
import { AudienceModule } from 'src/audience/audience.module';
import { AuthModule } from 'src/auth/auth.module';
import { NotificationModule } from 'src/notifications/notifications.module';
import { ReminderModule } from 'src/reminder/reminder.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    forwardRef(() => RecordsModule),   
    AudienceModule,
    forwardRef(() => AuthModule),
    NotificationModule,
    ReminderModule,
    CommonModule,
  ],
  controllers: [OrchestratorController],
  providers: [OrchestratorService, RecordAdapter],
  exports: [OrchestratorService],
})
export class OrchestratorModule {}
