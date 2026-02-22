import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { QUOTE_STATUS } from '../types/quote.types';
import { CreateQuoteDto } from './create-quote.dto';

export class UpdateQuoteDto extends PartialType(CreateQuoteDto) {
  @ApiPropertyOptional({
    description: 'Estado de la cotización',
    enum: QUOTE_STATUS,
  })
  @IsOptional()
  @IsEnum(QUOTE_STATUS)
  quoteStatus?: QUOTE_STATUS;
}
