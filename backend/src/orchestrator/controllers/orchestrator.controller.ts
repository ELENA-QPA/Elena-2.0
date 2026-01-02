import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { OrchestratorService } from '../services/orchestrator.service';
import {
  InternalCodeDto,
  IdRecordDto,
  IdLawyerDto,
  IdAudienceDto,
} from '../dto/records-service.dto';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators';
import { AudienceService } from 'src/audience/services/audience.service';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly audienceService: AudienceService,
  ) {}

  private readonly logger = new Logger(OrchestratorService.name);

  @Post('record')
  @HttpCode(HttpStatus.OK)
  async getRecord(@Body() body: IdRecordDto): Promise<RecordAdaptedResponse> {
    const internalCodeDto: InternalCodeDto =
      await this.orchestratorService.getInternalCodeById(body);
    return this.orchestratorService.getRecordByInternalCode(internalCodeDto);
  }

  @Post('record/internalCode')
  @HttpCode(HttpStatus.OK)
  async getRecordByInternalCode(
    @Body() body: InternalCodeDto,
  ): Promise<RecordAdaptedResponse> {
    return this.orchestratorService.getRecordByInternalCode(body);
  }

  @Auth(ValidRoles.admin)
  @Get('audience/all')
  findAll() {
    return this.orchestratorService.getAllAudiences();
  }

  @Post('audience')
  findOne(@Body() body: IdLawyerDto) {
    return this.orchestratorService.getAudienceByLawyer(body);
  }

  @Post('audience/fix')
  @HttpCode(HttpStatus.OK)
  findAudience(@Body() body: IdAudienceDto) {
    return this.orchestratorService.getAudienceById(body);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  async bulkCreateAudiences(@Body() body) {
    return await this.orchestratorService.bulkCreateAudiencesWithNotifications(
      body.audiences,
    );
  }

  @Post('singlebulk')
  @HttpCode(HttpStatus.CREATED)
  async CreateAudiences(@Body() body) {
    return await this.orchestratorService.createAudiencesWithNotifications(
      body,
    );
  }

  @Post('availablelawyer')
  @HttpCode(HttpStatus.CREATED)
  async getAvailableLawyer(@Body() body) {
    return await this.orchestratorService.findAvailableLawyer(
      body.start,
      body.end,
    );
  }

  @Post('reminders/process')
  async processReminders() {
    await this.orchestratorService.processReminders();
    return { message: 'Recordatorios encolados para procesamiento asíncrono' };
  }

  @Get('reminders/queue/stats')
  async getQueueStats() {
    return this.orchestratorService.getQueueStats();
  }

  @Post('reminders/queue/clean')
  async cleanQueue() {
    await this.orchestratorService.cleanQueue();
    return { message: 'Cola limpiada exitosamente' };
  }

  @Post('extractdate')
  extractRange(@Body() dto) {
    return this.orchestratorService.extractDate(dto.text);
  }
}
