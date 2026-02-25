import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/auth/entities/user.entity';
import { Quote, QuoteSchema } from './entities/quote.entity';
import { QuoteMailService } from './mail/quote-mail.service';
import { QuotePdfService } from './pdf/quote-pdf.service';
import { PipedriveModule } from './pipedrive/pipedrive.module';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: User.name, schema: UserSchema },
    ]),
    PipedriveModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, QuotePdfService, QuoteMailService],
  exports: [QuoteService],
})
export class QuoteModule {}
