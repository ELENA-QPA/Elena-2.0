import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, Logger } from '@nestjs/common';
import { OrchestratorService } from '../services/orchestrator.service';
import { InternalCodeDto, IdRecordDto, IdLawyerDto } from '../dto/records-service.dto';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from 'src/auth/decorators';
import { AudienceService } from 'src/audience/services/audience.service';

@ApiTags('Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService,
              private readonly audienceService: AudienceService
            ) {}

   private readonly logger = new Logger(OrchestratorService.name);

  @ApiKeyAuth()
  @Post('record')
  @HttpCode(HttpStatus.OK)
  async getRecord(@Body() body: IdRecordDto): Promise<RecordAdaptedResponse> {
    const internalCodeDto: InternalCodeDto = await this.orchestratorService.getInternalCodeById(body);
    return this.orchestratorService.getRecordByInternalCode(internalCodeDto);
  }

  @Get("audience/all")
  findAll() {
    return this.orchestratorService.getAllAudiences();
  }

  @Post('audience')
  findOne(@Body() body: IdLawyerDto) {
    return this.orchestratorService.getAudienceByLawyer(body);
  }


  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orchestratorService.remove(+id);
  }


}