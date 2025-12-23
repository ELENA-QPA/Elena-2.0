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
  AudiencePopulated,
  AudienceResponse,
} from '../interfaces/audience.interfaces';

@Injectable()
export class AudienceService {
  private readonly logger = new Logger(AudienceService.name);

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

  private isValidMongoId(value: any): boolean {
    return value && Types.ObjectId.isValid(value);
  }

  private isValidDate(value: any): boolean {
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
    return {
      audience: {
        _id: audience._id.toString(),
        record: audience.record.toString(),
        lawyer: {
          _id: audience.lawyer._id,
          name: audience.lawyer.name + ' ' + audience.lawyer.lastname,
        },
        monto: audience.monto || 0,
        state: audience.state,
        start: audience.start,
        end: audience.end,
        link: audience.link,
        is_valid: audience.is_valid,
      },
    };
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
      throw new BadRequestException('error al crear audiencia');
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

      this.logger.log('ss ', audience.lawyer.name);
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
}
