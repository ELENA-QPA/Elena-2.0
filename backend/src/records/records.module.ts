import { Module, forwardRef } from '@nestjs/common';
import { RecordsService } from './records.service';
import { RecordsController } from './records.controller';
import { Record, RecordSchema } from './entities/record.entity';
import {
  ProceduralPart,
  ProceduralPartSchema,
} from '../procedural-part/entities/procedural-part.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from 'src/auth/auth.module';
import { MailerModule } from '@nestjs-modules/mailer';
import { DocumentModule } from 'src/document/document.module';
import { IntervenerModule } from 'src/intervener/intervener.module';
import { ProceduralPartModule } from 'src/procedural-part/procedural-part.module';
import { PaymentModule } from 'src/payment/payment.module';
import { PerfomanceModule } from 'src/perfomance/perfomance.module';
//import { FileService } from 'src/common/services/file.service';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [RecordsController],
  providers: [RecordsService],
  imports: [
    ConfigModule,
    CommonModule,
    forwardRef(() => AuthModule),
    // AuthModule,
    MongooseModule.forFeature([
      {
        name: Record.name,
        schema: RecordSchema,
      },
      {
        name: ProceduralPart.name,
        schema: ProceduralPartSchema,
      },
    ]),
    MailerModule,
    DocumentModule,
    IntervenerModule,
    ProceduralPartModule,
    PaymentModule,
    PerfomanceModule,
    DocumentModule,
  ],
  exports: [RecordsService],
})
export class RecordsModule {}
