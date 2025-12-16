import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MonolegalController } from './Controllers/monolegal.controller';
import { MonolegalService } from './services/monolegal.service';
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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Record.name, schema: RecordSchema },
      { name: ProceduralPart.name, schema: ProceduralPartSchema },
      { name: Performance.name, schema: PerfomanceSchema },
    ]),
    AuthModule,
  ],
  controllers: [MonolegalController],
  providers: [MonolegalService],
  exports: [MonolegalService],
})
export class MonolegalModule {}
