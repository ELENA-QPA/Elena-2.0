import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { HttpModule } from '@nestjs/axios';
import { MonolegalController } from './Controllers/monolegal.controller';
import { MonolegalService } from './services/monolegal.service';
import { MonolegalApiService } from './services/monolegal-api.service';
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

@Module({
  imports: [
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
    ]),
    AuthModule,
  ],
  controllers: [MonolegalController],
  providers: [MonolegalService, MonolegalApiService],
  exports: [MonolegalService, MonolegalApiService],
})
export class MonolegalModule {}
