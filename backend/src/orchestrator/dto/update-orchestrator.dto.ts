import { PartialType } from '@nestjs/swagger';
import { CreateOrchestratorDto } from './create-orchestrator.dto';

export class UpdateOrchestratorDto extends PartialType(CreateOrchestratorDto) {}
