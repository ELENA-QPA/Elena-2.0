import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IntervenerService } from './intervener.service';
import { IntervenerController } from './intervener.controller';
import { Intervener, IntervenerSchema } from './entities/intervener.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Intervener.name, schema: IntervenerSchema }
    ])
  ],
  controllers: [IntervenerController],
  providers: [IntervenerService],
  exports: [IntervenerService],
})
export class IntervenerModule { }
