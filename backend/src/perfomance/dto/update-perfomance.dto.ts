import { PartialType } from '@nestjs/swagger';
import { CreatePerfomanceDto } from './create-perfomance.dto';

export class UpdatePerfomanceDto extends PartialType(CreatePerfomanceDto) {}
