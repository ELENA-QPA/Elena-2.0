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
    AuthModule,
    MongooseModule.forRoot(process.env.MONGODB_URI),
    MailerModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        transport: {
          host: configService.get('EMAIL_HOST'),
          port: '465',
          secure: true,
          auth: {
            type: 'login',
            user: configService.get('EMAIL_USER'),
            pass: configService.get('EMAIL_PASSWORD'),
          },
        },
        template: {
          dir: path.join(__dirname, '../src/templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
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
    OrchestratorModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
