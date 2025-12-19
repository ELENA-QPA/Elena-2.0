import { Module } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';
import { OrchestratorController } from './controllers/orchestrator.controller';
import { RecordsModule } from 'src/records/records.module';
import { RecordAdapter } from './adapters/record.adapter';
import { AudienceModule } from 'src/audience/audience.module';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [RecordsModule, 
            AudienceModule,
            AuthModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService,
              RecordAdapter],
})
export class OrchestratorModule {}
