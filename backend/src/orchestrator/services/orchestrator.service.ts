import { Injectable, Logger } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RecordAdapter } from '../adapters/record.adapter';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import {
  IdLawyerDto,
  IdRecordDto,
  InternalCodeDto,
} from '../dto/records-service.dto';
import { AudienceService } from 'src/audience/services/audience.service';
import { AudienceResponse } from 'src/audience/interfaces/audience.interfaces';
import {
  AudienceOrchestratorResponse,
  BulkCreateResult,
  FieldValidationResult,
} from '../interfaces/audience.interface';
import { NotificationService } from 'src/notifications/services/notification.service';
import { CreateAudienceDto } from 'src/audience/dto/create-audience.dto';

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);

  constructor(
    private readonly audienceService: AudienceService,
    private readonly recordsService: RecordsService,
    private readonly notificationService: NotificationService,
    private readonly recordAdapter: RecordAdapter,
  ) {}

  private getFields(dto: CreateAudienceDto): FieldValidationResult {
    const toDelete: string[] = [];
    const messages: string[] = [];

    if (!dto.record) {
      messages.push('record: faltante');
    } else if (!this.audienceService.isValidMongoId(dto.record)) {
      toDelete.push('record');
      messages.push(`record:(${dto.record})`);
    }

    if (!dto.lawyer) {
      messages.push('lawyer: faltante');
    } else if (!this.audienceService.isValidMongoId(dto.lawyer)) {
      toDelete.push('lawyer');
      messages.push(`lawyer:(${dto.lawyer})`);
    }

    if (!dto.start) {
      messages.push('start: faltante');
    } else if (!this.audienceService.isValidDate(dto.start)) {
      toDelete.push('start');
      messages.push(`start:(${dto.start})`);
    }

    if (!dto.end) {
      messages.push('end: faltante');
    } else if (!this.audienceService.isValidDate(dto.end)) {
      toDelete.push('end');
      messages.push(`end:(${dto.end})`);
    }

    return { toDelete, messages };
  }

  private sanitizeAudienceDto(
    dto: CreateAudienceDto,
    toDelete: string[],
  ): CreateAudienceDto {
    const sanitized: CreateAudienceDto = { ...dto };

    for (const field of toDelete) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }
    return sanitized;
  }

  async getRecordByInternalCode(
    dto: InternalCodeDto,
  ): Promise<RecordAdaptedResponse> {
    try {
      const recordResponse =
        await this.recordsService.getRecordDetailsByInternalCode(dto);

      const adaptedResponse = this.recordAdapter.adapt(recordResponse);

      return adaptedResponse;
    } catch (error) {
      this.logger.error(
        `Error en orquestación de record: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getInternalCodeById(dto: IdRecordDto): Promise<InternalCodeDto> {
    try {
      const result = await this.recordsService.getInternalCodeById(dto);
      return result;
    } catch (error) {
      this.logger.error(
        `Error en orquestación para obtener internalCode: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getRecordById(dto: IdRecordDto): Promise<RecordAdaptedResponse> {
    const internalCodeDto: InternalCodeDto = await this.getInternalCodeById(
      dto,
    );
    const record = await this.getRecordByInternalCode(internalCodeDto);
    return record;
  }
  async buildAudienceResponce(
    audienceResponse: AudienceResponse,
  ): Promise<AudienceOrchestratorResponse> {
    const recordIdDto: IdRecordDto = { id: audienceResponse.audience.record };
    const recordResponse: RecordAdaptedResponse = await this.getRecordById(
      recordIdDto,
    );
    return {
      ...audienceResponse,
      record: recordResponse.record,
    };
  }

  async getFilteresAudiences(query): Promise<AudienceOrchestratorResponse[]> {
    try {
      const audiences = await this.audienceService.findAll(query);

      const audiencesResponse = await Promise.all(
        audiences.map((audience) => this.buildAudienceResponce(audience)),
      );

      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }

  async getAllAudiences(): Promise<AudienceOrchestratorResponse[]> {
    try {
      const query = { is_valid: 'true' };
      const audiencesResponse = await this.getFilteresAudiences(query);
      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }

  async getAudienceByLawyer(
    lawyerDto: IdLawyerDto,
  ): Promise<AudienceOrchestratorResponse[]> {
    try {
      const query = {
        is_valid: true,
        lawyer: lawyerDto.lawyer,
      };
      const audiencesResponse = await this.getFilteresAudiences(query);
      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }

  async bulkCreateAudiencesWithNotifications(
    audienceDtos: CreateAudienceDto[],
  ): Promise<BulkCreateResult> {
    const result: BulkCreateResult = {
      success: 0,
      failed: 0,
      notifications_created: 0,
    };

    for (const dto of audienceDtos) {
      try {
        const { toDelete, messages } = this.getFields(dto);
        const sanitizedDto = this.sanitizeAudienceDto(dto, toDelete);

        const createdAudience = await this.audienceService.create(
          sanitizedDto,
          false,
        );

        result.success++;

        let notificationCreated = false;
        if (!createdAudience.is_valid) {
          try {
            await this.notificationService.create({
              audience: createdAudience._id,
              message: 'Faltantes' + messages.join(', '),
            });
            result.notifications_created++;
            notificationCreated = true;
          } catch (notificationError) {
            this.logger.error(
              `Error al crear notificación para audiencia ${createdAudience._id}`,
              notificationError,
            );
          }
        }
      } catch (error) {
        result.failed++;
        this.logger.error('Error al procesar audiencia', error);
      }
    }
    return result;
  }
}
