import { PartialType } from '@nestjs/swagger';
import { CreatePaymentDto } from './create-payment.dto';
import { CreatePaymentForRecordDto } from './create-payment-for-record.dto';

export class UpdatePaymentDto extends PartialType(CreatePaymentForRecordDto) { }
