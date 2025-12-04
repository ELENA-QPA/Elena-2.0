import { PartialType } from '@nestjs/swagger';
import { CreateProceduralPartForRecordDto } from './create-procedural-part-for-record.dto';

export class UpdateProceduralPartDto extends PartialType(CreateProceduralPartForRecordDto) { }
