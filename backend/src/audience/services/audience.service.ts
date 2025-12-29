import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Audience } from '../entities/audience.entity';
import { CreateAudienceDto } from '../dto/create-audience.dto';
import { UpdateAudienceDto } from '../dto/update-audience.dto';
import { QueryAudienceDto } from '../dto/query-audience.dto';
import {
  AudienceBase,
  AudiencePopulated,
  AudienceResponse,
} from '../interfaces/audience.interfaces';

@Injectable()
export class AudienceService {
  private readonly logger = new Logger(AudienceService.name);

  private readonly colombianHolidays2025: Date[] = [
    new Date('2025-01-01'),
    new Date('2025-01-06'),
    new Date('2025-03-24'),
    new Date('2025-04-17'),
    new Date('2025-04-18'),
    new Date('2025-05-01'),
    new Date('2025-06-02'),
    new Date('2025-06-23'),
    new Date('2025-06-30'),
    new Date('2025-07-07'),
    new Date('2025-07-20'),
    new Date('2025-08-07'),
    new Date('2025-08-18'),
    new Date('2025-10-13'),
    new Date('2025-11-03'),
    new Date('2025-11-17'),
    new Date('2025-12-08'),
    new Date('2025-12-25'),
  ];

  constructor(
    @InjectModel(Audience.name)
    private readonly audienceModel: Model<Audience>,
  ) {}

  private readonly REQUIRED_FIELDS = [
    'record',
    'lawyer',
    'start',
    'end',
  ] as const;

  private isBusinessDay(date: Date): boolean {
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return false;

    const dateStr = date.toISOString().split('T')[0];
    return !this.colombianHolidays2025.some(
      (holiday) => holiday.toISOString().split('T')[0] === dateStr,
    );
  }

  private subtractBusinessDays(endDate: Date, businessDays: number): Date {
    let currentDate = new Date(endDate);
    let daysSubtracted = 0;

    while (daysSubtracted < businessDays) {
      currentDate.setDate(currentDate.getDate() - 1);

      if (this.isBusinessDay(currentDate)) {
        daysSubtracted++;
      }
    }

    return currentDate;
  }

  private isExactlyNBusinessDaysBefore(
    targetDate: Date,
    businessDays: number,
  ): boolean {
    const today = new Date('2025-12-29T08:00:00Z');
    today.setHours(0, 0, 0, 0);

    const notificationDate = this.subtractBusinessDays(
      targetDate,
      businessDays,
    );
    notificationDate.setHours(0, 0, 0, 0);

    this.logger.log(businessDays, ' n date ', notificationDate);

    return today.getTime() === notificationDate.getTime();
  }

  async resetNotificationsOnValidation(audienceId: string): Promise<void> {
    await this.audienceModel.updateOne(
      { _id: audienceId },
      {
        $set: {
          'notifications.oneMonth.sent': false,
          'notifications.oneMonth.sentAt': null,
          'notifications.fifteenDays.sent': false,
          'notifications.fifteenDays.sentAt': null,
          'notifications.oneDay.sent': false,
          'notifications.oneDay.sentAt': null,
        },
      },
    );
  }

  public isValidMongoId(value: any): boolean {
    return value && Types.ObjectId.isValid(value);
  }

  public isValidDate(value: any): boolean {
    if (!value) return false;
    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private getInvalidFields(dto: CreateAudienceDto): string[] {
    const invalidFields: string[] = [];

    if (!dto.record || !this.isValidMongoId(dto.record)) {
      invalidFields.push('record');
    }

    if (!dto.lawyer || !this.isValidMongoId(dto.lawyer)) {
      invalidFields.push('lawyer');
    }

    if (!dto.start || !this.isValidDate(dto.start)) {
      invalidFields.push('start');
    }

    if (!dto.end || !this.isValidDate(dto.end)) {
      invalidFields.push('end');
    }

    return invalidFields;
  }
  private validateRequiredFields(dto: CreateAudienceDto): void {
    const invalid = this.getInvalidFields(dto);

    if (invalid.length > 0) {
      throw new BadRequestException(
        `Campos obligatorios faltantes o incorrectos: ${invalid.join(', ')}`,
      );
    }
  }

  private isValid(dto: CreateAudienceDto): boolean {
    return this.getInvalidFields(dto).length === 0;
  }

  private transformAudienceToResponse(audience: any): AudienceResponse {
    const response: any = {
      audience: {
        _id: audience._id.toString(),
        monto: audience.monto || 0,
        state: audience.state,
        link: audience.link,
        is_valid: audience.is_valid,
      },
    };

    if (audience.record) {
      response.audience.record = audience.record.toString();
    }

    if (audience.lawyer) {
      this.logger.log('Entro en tiene lawyer');
      response.audience.lawyer = {
        _id: audience.lawyer._id,
        name: audience.lawyer.name + ' ' + audience.lawyer.lastname,
      };
    }

    if (audience.start) {
      response.audience.start = audience.start;
    }

    if (audience.end) {
      response.audience.end = audience.end;
    }

    return response;
  }

  async create(
    createAudienceDto: CreateAudienceDto,
    strict: boolean,
  ): Promise<Audience> {
    try {
      if (strict) {
        const start = new Date(createAudienceDto.start);
        const end = new Date(createAudienceDto.end);

        if (end <= start) {
          throw new BadRequestException(
            'La fecha de fin debe ser posterior a la fecha de inicio',
          );
        }

        this.validateRequiredFields(createAudienceDto);
      }
      const is_valid = this.isValid(createAudienceDto);
      const audience = new this.audienceModel({
        ...createAudienceDto,
        is_valid,
      });
      const savedAudience = await audience.save();
      return savedAudience;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('error al crear audiencia ', error.message);
    }
  }

  async findAll(queryDto: QueryAudienceDto): Promise<AudienceResponse[]> {
    try {
      const filter: any = { deletedAt: { $exists: false } };

      if (queryDto.record) {
        filter.record = queryDto.record;
      }

      if (queryDto.lawyer) {
        filter.lawyer = queryDto.lawyer;
      }

      if (queryDto.state) {
        filter.state = queryDto.state;
      }

      if (queryDto.is_valid) {
        filter.is_valid = queryDto.is_valid;
      }

      const audiences = await this.audienceModel
        .find(filter)
        .sort({ start: -1 })
        .populate('lawyer', 'name lastname _id')
        .lean();

      return audiences.map((audience) =>
        this.transformAudienceToResponse(audience),
      );
    } catch (error) {
      this.logger.error('Error al obtener audiencias', error.stack);
      throw new BadRequestException('Error al obtener las audiencias');
    }
  }

  async findOne(id: string): Promise<AudienceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
          `El id proporcionado no es un ObjectId válido: ${id}`,
        );
      }

      const audience = await this.audienceModel
        .findOne({
          _id: id,
          deletedAt: { $exists: false },
        })
        .populate('lawyer', 'name lastname _id')
        .lean<AudiencePopulated>();

      if (!audience) {
        throw new NotFoundException(
          `No se encontró la audiencia con id: ${id}`,
        );
      }

      return this.transformAudienceToResponse(audience);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Error al obtener audiencia con id ${id}`, error.stack);
      throw new BadRequestException('Error al obtener la audiencia');
    }
  }

  async update(
    id: string,
    updateAudienceDto: UpdateAudienceDto,
  ): Promise<AudienceResponse> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
          `El id proporcionado no es un ObjectId válido: ${id}`,
        );
      }

      if (updateAudienceDto.start && updateAudienceDto.end) {
        const start = new Date(updateAudienceDto.start);
        const end = new Date(updateAudienceDto.end);

        if (end <= start) {
          throw new BadRequestException(
            'La fecha de fin debe ser posterior a la fecha de inicio',
          );
        }
      }

      if (updateAudienceDto.is_valid !== undefined) {
        const existingAudience = await this.audienceModel.findById(id);

        if (
          existingAudience &&
          !existingAudience.is_valid &&
          updateAudienceDto.is_valid
        ) {
          await this.resetNotificationsOnValidation(id);
        }
      }

      const updatedAudience = await this.audienceModel
        .findOneAndUpdate(
          {
            _id: id,
            deletedAt: { $exists: false },
          },
          updateAudienceDto,
          { new: true, runValidators: true },
        )
        .lean();

      if (!updatedAudience) {
        throw new NotFoundException(
          `No se encontró la audiencia con id: ${id}`,
        );
      }

      this.logger.log(`Audiencia actualizada con ID: ${id}`);

      return this.transformAudienceToResponse(updatedAudience);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error al actualizar audiencia con id ${id}`,
        error.stack,
      );
      throw new BadRequestException('Error al actualizar la audiencia');
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new BadRequestException(
          `El id proporcionado no es un ObjectId válido: ${id}`,
        );
      }

      const deletedAudience = await this.audienceModel
        .findOneAndUpdate(
          {
            _id: id,
            deletedAt: { $exists: false },
          },
          { deletedAt: new Date() },
          { new: true },
        )
        .lean();

      if (!deletedAudience) {
        throw new NotFoundException(
          `No se encontró la audiencia con id: ${id}`,
        );
      }

      this.logger.log(`Audiencia eliminada (soft delete) con ID: ${id}`);

      return {
        message: `Audiencia con id ${id} eliminada exitosamente`,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Error al eliminar audiencia con id ${id}`,
        error.stack,
      );
      throw new BadRequestException('Error al eliminar la audiencia');
    }
  }
  private async sendReminder(
    audience: any,
    type: 'oneMonth' | 'fifteenDays' | 'oneDay',
  ): Promise<void> {
    try {
      // await this.emailService.sendAudienceReminder({
      //   to: audience.lawyer.email,
      //   lawyerName: `${audience.lawyer.name} ${audience.lawyer.lastname}`,
      //   audienceDate: audience.start,
      //   reminderType: type,
      //   recordInfo: audience.record,
      // });

      // Marcar como enviado
      await this.audienceModel.updateOne(
        { _id: audience._id },
        {
          $set: {
            [`notifications.${type}.sent`]: true,
            [`notifications.${type}.sentAt`]: new Date(),
          },
        },
      );

      this.logger.log(
        `Recordatorio ${type} enviado para audiencia ${audience._id}`,
      );
    } catch (error) {}
  }

  // @Cron('0 8 * * 1-5')
  async processReminders(): Promise<void> {
    const today = new Date('2025-12-29T08:00:00Z');
    console.log('dia ', today.getDay());

    if (!this.isBusinessDay(today)) {
      this.logger.log('Hoy no es día hábil, saltando recordatorios');
      return;
    }

    try {
      const audiencesOneMonth = await this.audienceModel
        .find({
          is_valid: true,
          deletedAt: { $exists: false },
          'notifications.oneMonth.sent': false,
        })
        .lean<AudienceBase[]>();

      for (const audience of audiencesOneMonth) {
        const audienceStart = new Date(audience.start);
        if (this.isExactlyNBusinessDaysBefore(audienceStart, 22)) {
          await this.sendReminder(audience, 'oneMonth');
        }
      }

      const audiencesFifteenDays = await this.audienceModel
        .find({
          is_valid: true,
          deletedAt: { $exists: false },
          'notifications.fifteenDays.sent': false,
        })
        .lean<AudienceBase[]>();

      for (const audience of audiencesFifteenDays) {
        const audienceStart = new Date(audience.start);
        if (this.isExactlyNBusinessDaysBefore(audienceStart, 15)) {
          await this.sendReminder(audience, 'fifteenDays');
        }
      }

      const audiencesOneDay = await this.audienceModel
        .find({
          is_valid: true,
          deletedAt: { $exists: false },
          'notifications.oneDay.sent': false,
        })
        .lean<AudienceBase[]>();

      for (const audience of audiencesOneDay) {
        const audienceStart = new Date(audience.start);
        if (this.isExactlyNBusinessDaysBefore(audienceStart, 1)) {
          await this.sendReminder(audience, 'oneDay');
        }
      }
    } catch (error) {
      this.logger.error('Error procesando recordatorios', error.stack);
    }
  }
}
