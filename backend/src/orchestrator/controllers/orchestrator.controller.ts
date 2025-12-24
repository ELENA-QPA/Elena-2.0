import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
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
import { ApiKeyAuth, Auth } from 'src/auth/decorators';
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
  async bulkCreateAudiences(@Body() bulkCreateDto) {
    return await this.orchestratorService.bulkCreateAudiencesWithNotifications(
      bulkCreateDto.audiences,
    );
  }
}
