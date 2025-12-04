import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PerfomanceService } from './perfomance.service';
import { PerfomanceController } from './perfomance.controller';
import { Performance, PerfomanceSchema } from './entities/perfomance.entity';
import { PerformanceStateService } from './services/performance-state.service';
import { PerformanceAuditService } from './services/performance-audit.service';
import { RecordStateTypeService } from './services/record-state-type.service';
import { Record, RecordSchema } from '../records/entities/record.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Performance.name, schema: PerfomanceSchema },
      { name: Record.name, schema: RecordSchema }
    ])
  ],
  controllers: [PerfomanceController],
  providers: [PerfomanceService, PerformanceStateService, PerformanceAuditService, RecordStateTypeService],
  exports: [PerfomanceService, PerformanceStateService, PerformanceAuditService, RecordStateTypeService]
})
export class PerfomanceModule { }
