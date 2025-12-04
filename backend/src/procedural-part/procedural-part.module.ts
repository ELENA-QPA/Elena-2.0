import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProceduralPartService } from './procedural-part.service';
import { ProceduralPartController } from './procedural-part.controller';
import { ProceduralPart, ProceduralPartSchema } from './entities/procedural-part.entity';
import { Performance, PerfomanceSchema } from 'src/perfomance/entities/perfomance.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProceduralPart.name, schema: ProceduralPartSchema },
      { name: Performance.name, schema: PerfomanceSchema }
    ])
  ],
  controllers: [ProceduralPartController],
  providers: [ProceduralPartService],
  exports: [ProceduralPartService],
})
export class ProceduralPartModule { }
