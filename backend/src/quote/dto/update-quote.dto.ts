import { PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CreateQuoteDto } from './create-quote.dto';
import { QuoteStatus } from '../entities/quote.entity';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {
  @ApiPropertyOptional({
    description: 'Estado de la cotización',
    enum: QuoteStatus,
  })
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}