import { Module, forwardRef  } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SyncLog, SyncLogSchema } from './entities/sync-log.entity';
import { HttpModule } from '@nestjs/axios';
import { MonolegalController } from './Controllers/monolegal.controller';
import { MonolegalService } from './services/monolegal.service';
import { MonolegalApiService } from './services/monolegal-api.service';
import { JuzgadoNormalizerService } from './services/juzgado-normalizer.service';
import { Record, RecordSchema } from '../records/entities/record.entity';
import {
  ProceduralPart,
  ProceduralPartSchema,
} from '../procedural-part/entities/procedural-part.entity';
import {
  Performance,
  PerfomanceSchema,
} from '../perfomance/entities/perfomance.entity';
import { AuthModule } from '../auth/auth.module';
import * as https from 'https';
import { ConfigModule } from '@nestjs/config';
import { OrchestratorModule } from 'src/orchestrator/orchestrator.module';
import { CustomExcelImportService } from './services/custom-excel-import.service';
import { ScheduleModule } from '@nestjs/schedule';
import { MonolegalCronService } from './services/monolegal-cron.service';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
      httpsAgent: new https.Agent({
        rejectUnauthorized: false,
      }),
    }),
    ConfigModule,
    MongooseModule.forFeature([
      { name: Record.name, schema: RecordSchema },
      { name: ProceduralPart.name, schema: ProceduralPartSchema },
      { name: Performance.name, schema: PerfomanceSchema },
      { name: SyncLog.name, schema: SyncLogSchema },
    ]),
    forwardRef(() => AuthModule),        
    forwardRef(() => OrchestratorModule), 
  ],
  controllers: [MonolegalController],
  providers: [
    MonolegalService,
    MonolegalApiService,
    JuzgadoNormalizerService,
    CustomExcelImportService,
    MonolegalCronService,
  ],
  exports: [MonolegalService, MonolegalApiService, MonolegalCronService],
})
export class MonolegalModule {}
