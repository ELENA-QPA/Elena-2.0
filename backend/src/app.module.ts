import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { EnvConfiguration } from './config/env.config';
import { RecordsModule } from './records/records.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { PerfomanceModule } from './perfomance/perfomance.module';
import { ProceduralPartModule } from './procedural-part/procedural-part.module';
import { IntervenerModule } from './intervener/intervener.module';
import { DocumentModule } from './document/document.module';
import { PaymentModule } from './payment/payment.module';
import { ParametersModule } from './parameters/parameters.module';
import { CommonModule } from './common/common.module';
import { MonolegalModule } from './monolegal/monolegal.module';
import { OrchestratorModule } from './orchestrator/orchestrator.module';
import { AudienceModule } from './audience/audience.module';
import { NotificationModule } from './notifications/notifications.module';
import { ReminderModule } from './reminder/reminder.module';
import { BullModule } from '@nestjs/bull';
@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      isGlobal: true,
      envFilePath: '.env',
    }),
    ServeStaticModule.forRoot({
      rootPath: path.join(__dirname, '..', 'public'),
    }),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
      },
    }),
    AuthModule,
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('SMTP_HOST'),
          port: Number(configService.get('SMTP_PORT')),
          secure: false,
          auth: {
            user: configService.get('SMTP_USER'),
            pass: configService.get('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"Tu Aplicación" <jramos@qpalliance.co>`,
        },
        template: {
          dir: path.join(process.cwd(), 'src', 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: false,
          },
        },
      }),
      inject: [ConfigService],
    }),
    RecordsModule,
    PerfomanceModule,
    ProceduralPartModule,
    IntervenerModule,
    DocumentModule,
    PaymentModule,
    ParametersModule,
    CommonModule,
    MonolegalModule,
    OrchestratorModule,
    AudienceModule,
    NotificationModule,
    ReminderModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
