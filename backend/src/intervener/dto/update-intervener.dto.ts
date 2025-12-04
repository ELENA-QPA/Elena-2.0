import { PartialType } from '@nestjs/swagger';
import { CreateIntervenerDto } from './create-intervener.dto';
import { CreateIntervenerForRecordDto } from './create-intervener-for-record.dto';

export class UpdateIntervenerDto extends PartialType(CreateIntervenerForRecordDto) { }
