import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { RecordsService } from 'src/records/records.service';
import { RecordAdapter } from '../adapters/record.adapter';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import {
  IdAudienceDto,
  IdLawyerDto,
  IdRecordDto,
  EtiquetaDto,
} from '../dto/records-service.dto';
import { AudienceService } from 'src/audience/services/audience.service';
import { AudienceResponse } from 'src/audience/interfaces/audience.interfaces';
import {
  AudienceOrchestratorResponse,
  BulkCreateResult,
  ExtractDateResponse,
  FieldValidationResult,
} from '../interfaces/audience.interface';
import { NotificationService } from 'src/notifications/services/notification.service';
import { CreateAudienceDto } from 'src/audience/dto/create-audience.dto';
import { Estado } from 'src/records/dto/create-record.dto';
import { AuthService } from 'src/auth/auth.service';
import { ReminderService } from 'src/reminder/services/reminder.services';
import {
  DaptaData,
  EmailReminderData,
} from 'src/reminder/interfaces/reminder.interface';
import OpenAI from 'openai';
import { BadRequestException } from '@nestjs/common';
import { UtilitiesService } from 'src/common/services/utilities.service';
import { Cron } from '@nestjs/schedule/dist/decorators/cron.decorator';

@Injectable()
export class OrchestratorService {
  private readonly openai: OpenAI;
  private readonly model: string;

  constructor(
    @Inject(forwardRef(() => AuthService))  
    private readonly authService: AuthService,
    private readonly audienceService: AudienceService,
    @Inject(forwardRef(() => RecordsService)) 
    private readonly recordsService: RecordsService,
    private readonly reminderService: ReminderService,
    private readonly notificationService: NotificationService,
    private readonly recordAdapter: RecordAdapter,
    private readonly utilitiesService: UtilitiesService,
  ) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    this.model = process.env.OPENAI_MODEL ?? 'gpt-5-nano';
  }

  private async callReminder(record, audienceData) {
    const daptaData: DaptaData = {
      phone_number: `+57${record.proceduralParts.plaintiff.contact}` || '',
      plaintiff_name: record.proceduralParts.plaintiff.name || '',
      defendant_name: record.proceduralParts.defendant.name || '',
      audience_day: audienceData.audience.day || '',
      audience_month: audienceData.audience.month || '',
      audience_year: audienceData.audience.year || '',
      audience_start_time: audienceData.audience.start_time || '',
    };

    await this.reminderService.enqueueDaptaCall(daptaData);
  }

  private async emailReminder(record, audienceData) {
    const emailData: EmailReminderData = {
      to: record.proceduralParts.plaintiff.email,
      subject: 'Notificación de audiencia',
      template: './audience-notification',
      context: audienceData,
    };

    await this.reminderService.sendEmail(emailData);
  }

  private async enqueueReminder(
    audienceData: AudienceOrchestratorResponse,
    type: 'oneMonth' | 'fifteenDays' | 'oneDay' | 'oneDayAfterCreation',
  ): Promise<void> {
    const { audience, record } = audienceData;
    audienceData.audience = this.reminderService.buildAudienceContext(audience);

    if (type === 'oneDay') {
      await this.callReminder(record, audienceData);
      await this.emailReminder(record, audienceData);
    } else {
      await this.emailReminder(record, audienceData);
    }

    await this.audienceService.markNotificationAsSent(audience._id, type);
  }

  // metodos auxiliares para procesar audiencias con campos faltantes
  private async getFields(
    dto: CreateAudienceDto,
  ): Promise<FieldValidationResult> {
    const toDelete: string[] = [];
    const messages: string[] = [];

    if (!dto.record) {
      messages.push('record: faltante');
    } else if (!this.audienceService.isValidMongoId(dto.record)) {
      toDelete.push('record');
      messages.push(`record:(${dto.record})`);
    } else {
      const recordExists = await this.recordsService.exists(dto.record);
      if (!recordExists) {
        toDelete.push('record');
        messages.push(`record: no encontrado`);
      }
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

  // metodos para obetenr records
  async getRecordByEtiqueta(dto: EtiquetaDto): Promise<RecordAdaptedResponse> {
    try {
      const recordResponse =
        await this.recordsService.getRecordDetailsByEtiqueta(dto);

      const adaptedResponse = this.recordAdapter.adapt(recordResponse);

      return adaptedResponse;
    } catch (error) {
      throw error;
    }
  }

  async getEtiquetaById(dto: IdRecordDto): Promise<EtiquetaDto> {
    try {
      const result = await this.recordsService.getEtiquetaCodeById(dto);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async getRecordById(dto: IdRecordDto): Promise<RecordAdaptedResponse> {
    try {
      const EtiquetaDto: EtiquetaDto = await this.getEtiquetaById(dto);

      const record = await this.getRecordByEtiqueta(EtiquetaDto);

      return record;
    } catch (error) {
      return {} as RecordAdaptedResponse;
    }
  }

  //metodos para componer audiencias con records
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

  async getFilteredAudiences(query): Promise<AudienceOrchestratorResponse[]> {
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
      const audiencesResponse = await this.getFilteredAudiences(query);
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
      const audiencesResponse = await this.getFilteredAudiences(query);
      return audiencesResponse;
    } catch (error) {
      throw error;
    }
  }

  async getAudienceById(
    dto: IdAudienceDto,
  ): Promise<AudienceOrchestratorResponse> {
    try {
      const audiencesResponse = await this.audienceService.findOne(dto.id);
      const response = await this.buildAudienceResponce(audiencesResponse);
      return response;
    } catch (error) {
      return {} as AudienceOrchestratorResponse;
    }
  }

  // metodos para procesar audiencias a notificaciones desde monolegal

  async createAudiencesWithNotifications(audienceDto: CreateAudienceDto) {
    try {
      const { toDelete, messages } = await this.getFields(audienceDto);
      const sanitizedDto = this.sanitizeAudienceDto(audienceDto, toDelete);

      const createdAudience = await this.audienceService.create(sanitizedDto);
      if (!createdAudience.is_valid) {
        try {
          await this.notificationService.create({
            audience: createdAudience._id,
            message: 'Faltantes ' + messages.join(', '),
          });
        } catch (notificationError) {}
      }
      return createdAudience;
    } catch (error) {
      return {};
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
        const { toDelete, messages } = await this.getFields(dto);
        const sanitizedDto = this.sanitizeAudienceDto(dto, toDelete);

        const createdAudience = await this.audienceService.create(sanitizedDto);

        result.success++;

        let notificationCreated = false;
        if (!createdAudience.is_valid) {
          try {
            await this.notificationService.create({
              audience: createdAudience._id,
              message: 'Faltantes ' + messages.join(', '),
            });
            result.notifications_created++;
            notificationCreated = true;
          } catch (notificationError) {}
        }
      } catch (error) {
        result.failed++;
      }
    }
    return result;
  }

  async createAudienceFromMonolegal(idProceso, anotacion) {
    const { start, end } = await this.extractDate(anotacion);
    const lawyer = await this.findAvailableLawyer(start, end);

    const audienceDto = {
      start: start,
      end: end,
      record: idProceso,
      lawyer: lawyer,
    };
    const audienceCreated = this.createAudiencesWithNotifications(audienceDto);
    return audienceCreated;
  }

  // metodos para obtener abogados disponibles
  private async checkLawyerAvailability(
    lawyerId: string,
    start: Date,
    end: Date,
  ): Promise<boolean> {
    const audiences: AudienceResponse[] = await this.audienceService.findAll({
      lawyer: lawyerId,
    });

    for (const audienceWrapper of audiences) {
      const audience = audienceWrapper.audience;
      const audienceStart = new Date(audience.start);
      const audienceEnd = new Date(audience.end);

      const hasConflict = start < audienceEnd && end > audienceStart;

      if (hasConflict) {
        return false;
      }
    }

    return true;
  }

  async findAvailableLawyer(start: string, end: string): Promise<string> {
    const lawyers = await this.authService.byRol('lawyer');

    if (lawyers.length === 0) {
      throw new Error('No hay abogados disponibles en el sistema');
    }
    const lawyerIds: string[] = lawyers.map((lawyer) => lawyer._id.toString());

    let lastCheckedId: string = lawyerIds[0];

    const startDate = this.utilitiesService.colombiaToUTC(start);
    const endDate = this.utilitiesService.colombiaToUTC(end);

    while (lawyerIds.length > 0) {
      const randomIndex = Math.floor(Math.random() * lawyerIds.length);
      const selectedLawyerId = lawyerIds[randomIndex];
      lastCheckedId = selectedLawyerId;

      const isAvailable = await this.checkLawyerAvailability(
        selectedLawyerId,
        startDate,
        endDate,
      );

      if (isAvailable) {
        return selectedLawyerId;
      }

      lawyerIds[randomIndex] = lawyerIds[lawyerIds.length - 1];
      lawyerIds.pop();
    }

    return lastCheckedId;
  }

  //Metodos para extraer fechas con OPEN AI

  async extractDate(text: string): Promise<ExtractDateResponse> {
    const prompt = `
    Extrae la fecha y hora del siguiente texto en español y responde ÚNICAMENTE con JSON sin explicaciones.
    Devuelve SOLO un JSON válido con las claves "start" y "end" en formato ISO 8601 UTC.
    "start" es la fecha y hora extraída del texto.
    "end" es exactamente "start" más 1 hora.
    Si no puedes determinar una fecha y hora claras, devuelve:
    {"start": null, "end": null}

    Texto:
    """
    ${text}
    """
    `.trim();

    try {
      const response = await this.openai.responses.create({
        model: this.model,
        input: prompt,
        top_p: 1,
        reasoning: {
          effort: 'low',
        },

        text: {
          verbosity: 'low',
        },
      });

      const content = response.output_text;
      if (!content) {
        return { start: null, end: null };
      }
      return this.safeParse(content);
    } catch (error) {
      return { start: null, end: null };
    }
  }

  private safeParse(content: string): ExtractDateResponse {
    try {
      const parsed = JSON.parse(content);

      if (!parsed.start || !parsed.end) {
        return { start: null, end: null };
      }

      const start = new Date(parsed.start);
      const end = new Date(parsed.end);

      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return { start: null, end: null };
      }

      if (end <= start) {
        return { start: null, end: null };
      }

      return {
        start: new Date(start.getTime() + 5 * 60 * 60 * 1000).toISOString(),
        end: new Date(end.getTime() + 5 * 60 * 60 * 1000).toISOString(),
      };
    } catch {
      return { start: null, end: null };
    }
  }

  //Metodos para emviar reocrdatorios de audiencias

  @Cron('0 18 * * *', {
    name: 'processReminders',
    timeZone: 'America/Bogota',
  })
  async processReminders(): Promise<void> {
    const today = new Date();

    if (!this.utilitiesService.isBusinessDay(today)) {
      return;
    }

    try {
      const queryOneMonth = {
        is_valid: 'true',
        notificationOneMonthSent: 'false',
      };
      const audiencesOneMonth = await this.getFilteredAudiences(queryOneMonth);

      for (const audienceData of audiencesOneMonth) {
        const audienceStart = new Date(audienceData.audience.start);
        if (
          this.utilitiesService.isExactlyNBusinessDaysBefore(audienceStart, 20)
        ) {
          await this.enqueueReminder(audienceData, 'oneMonth');
        }
      }

      const queryFifteenDays = {
        is_valid: 'true',
        notificationFifteenDaysSent: 'false',
      };
      const audiencesFifteenDays = await this.getFilteredAudiences(
        queryFifteenDays,
      );

      for (const audienceData of audiencesFifteenDays) {
        const audienceStart = new Date(audienceData.audience.start);
        if (
          this.utilitiesService.isExactlyNBusinessDaysBefore(audienceStart, 5)
        ) {
          await this.enqueueReminder(audienceData, 'fifteenDays');
        }
      }

      const queryOneDay = {
        is_valid: 'true',
        notificationOneDaySent: 'false',
      };
      const audiencesOneDay = await this.getFilteredAudiences(queryOneDay);

      for (const audienceData of audiencesOneDay) {
        const audienceStart = new Date(audienceData.audience.start);
        if (
          this.utilitiesService.isExactlyNBusinessDaysBefore(audienceStart, 1)
        ) {
          await this.enqueueReminder(audienceData, 'oneDay');
        }
      }

      const queryOneDayAfter = {
        is_valid: 'true',
        notificationOneDayAfter: 'false',
        notificationOneDayAfterDate: today,
      };

      const audiencesOneDayAfter = await this.getFilteredAudiences(
        queryOneDayAfter,
      );

      for (const audienceData of audiencesOneDayAfter) {
        await this.enqueueReminder(audienceData, 'oneDayAfterCreation');
      }
    } catch (error) {}
  }

  async getQueueStats() {
    return this.reminderService.getEmailQueueStats();
  }

  async cleanQueue() {
    return this.reminderService.cleanQueue();
  }

  //Relacionado al modulo de cartera

  async filePay(recordId: string) {
    try {
      const updatedRecordDto = { estado: Estado.ARCHIVADO_Y_PAGADO };
      return this.recordsService.updateRecord(recordId, updatedRecordDto);
    } catch {
      throw new BadRequestException(
        'Error al updatear el record con estado archivado',
      );
    }
  }
}
