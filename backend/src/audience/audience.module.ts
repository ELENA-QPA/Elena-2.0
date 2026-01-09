import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AudienceService } from './services/audience.service';
import { AudienceController } from './controllers/audience.controller';
import { Audience, AudienceSchema } from './entities/audience.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Audience.name,
        schema: AudienceSchema,
      },
    ]),
    CommonModule,
  ],
  controllers: [AudienceController],
  providers: [AudienceService],
  exports: [AudienceService],
})
export class AudienceModule {}
