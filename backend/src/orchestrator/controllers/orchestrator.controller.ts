import { Controller, Get, Post, Body, Patch, Param, Delete, HttpCode, HttpStatus, Query, Logger } from '@nestjs/common';
import { OrchestratorService } from '../services/orchestrator.service';
import { CreateOrchestratorDto } from '../dto/create-orchestrator.dto';
import { UpdateOrchestratorDto } from '../dto/update-orchestrator.dto';
import { InternalCodeDto, IdRecordDto } from '../dto/records-service.dto';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { ApiTags } from '@nestjs/swagger';
import { ApiKeyAuth } from 'src/auth/decorators';

@ApiTags('Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

   private readonly logger = new Logger(OrchestratorService.name);

  @ApiKeyAuth()
  @Post('record')
  @HttpCode(HttpStatus.OK)
  async getRecord(@Body() body: IdRecordDto): Promise<RecordAdaptedResponse> {

    const internalCodeDto: InternalCodeDto = await this.orchestratorService.getInternalCodeById(body);
    return this.orchestratorService.getRecordByInternalCode(internalCodeDto);
  }

  @Get()
  findAll() {
    return this.orchestratorService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.orchestratorService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateOrchestratorDto: UpdateOrchestratorDto) {
    return this.orchestratorService.update(+id, updateOrchestratorDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.orchestratorService.remove(+id);
  }


}