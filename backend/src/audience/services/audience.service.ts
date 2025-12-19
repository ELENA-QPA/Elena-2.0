
import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Audience } from '../entities/audience.entity';
import { CreateAudienceDto } from '../dto/create-audience.dto';
import { UpdateAudienceDto } from '../dto/update-audience.dto';
import { QueryAudienceDto } from '../dto/query-audience.dto';
import { AudienceResponse } from '../interfaces/audience.interfaces';

@Injectable()
export class AudienceService {
  private readonly logger = new Logger(AudienceService.name);

  private transformAudienceToResponse(audience: any): AudienceResponse {
    return { 
      audience:{
        _id: audience._id.toString(),
        record: audience.record.toString(),
        lawyer: audience.lawyer.toString(),
        state: audience.state,
        start: audience.start,
        end: audience.end,
        link: audience.link,
        is_valid: audience.is_valid
      }
    };
  }

  constructor(
    @InjectModel(Audience.name)
    private readonly audienceModel: Model<Audience>,
  ) {}

  async create(createAudienceDto: CreateAudienceDto): Promise<Audience> {
    try {
      const start = new Date(createAudienceDto.start);
      const end = new Date(createAudienceDto.end);

      if (end <= start) {
        throw new BadRequestException(
          'La fecha de fin debe ser posterior a la fecha de inicio',
        );
      }

      const audience = new this.audienceModel(createAudienceDto);
      const savedAudience = await audience.save();

      this.logger.log(`Audiencia creada con ID: ${savedAudience._id}`);
      
      return savedAudience;
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Error al crear audiencia', error.stack);
      throw new BadRequestException('Error al crear la audiencia');
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

      if(queryDto.is_valid){
        this.logger.log("estamos en is valid");
        filter.is_valid = queryDto.is_valid;
      }
      this.logger.log("salimoooos");

      const audiences = await this.audienceModel
        .find(filter)
        .sort({ start: -1 })
        .lean();

      return audiences.map(audience => this.transformAudienceToResponse(audience));
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
        .lean();

      if (!audience) {
        throw new NotFoundException(
          `No se encontró la audiencia con id: ${id}`,
        );
      }

      return this.transformAudienceToResponse(audience);
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al obtener audiencia con id ${id}`, error.stack);
      throw new BadRequestException('Error al obtener la audiencia');
    }
  }

  async update(id: string, updateAudienceDto: UpdateAudienceDto): Promise<AudienceResponse> {
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al actualizar audiencia con id ${id}`, error.stack);
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
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(`Error al eliminar audiencia con id ${id}`, error.stack);
      throw new BadRequestException('Error al eliminar la audiencia');
    }
  }

}