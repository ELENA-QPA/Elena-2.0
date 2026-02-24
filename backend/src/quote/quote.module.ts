import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Quote, QuoteSchema } from './entities/quote.entity';
import { QuoteController } from './quote.controller';
import { QuoteService } from './quote.service';
import { HubspotModule } from './hubspot/hubspot.module';
import { User, UserSchema } from 'src/auth/entities/user.entity';
import { QuotePdfService } from './pdf/quote-pdf.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Quote.name, schema: QuoteSchema },
      { name: User.name, schema: UserSchema },
    ]),
    HubspotModule,
  ],
  controllers: [QuoteController],
  providers: [QuoteService, QuotePdfService],
  exports: [QuoteService],
})
export class QuoteModule {}