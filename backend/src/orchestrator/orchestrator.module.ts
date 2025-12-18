import { Module } from '@nestjs/common';
import { OrchestratorService } from './services/orchestrator.service';
import { OrchestratorController } from './controllers/orchestrator.controller';
import { RecordsModule } from 'src/records/records.module';
import { RecordAdapter } from './adapters/record.adapter';

@Module({
  imports: [RecordsModule],
  controllers: [OrchestratorController],
  providers: [OrchestratorService,
              RecordAdapter],
})
export class OrchestratorModule {}
