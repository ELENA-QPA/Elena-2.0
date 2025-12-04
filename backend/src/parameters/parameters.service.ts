import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { FilterParameterDto } from './dto/filter-parameter.dto';
import { Parameter } from './entities/parameter.entity';
import { PaginationDto } from 'src/common/dto/paginaton.dto';

@Injectable()
export class ParametersService {
  constructor(
    @InjectModel(Parameter.name) private parameterModel: Model<Parameter>,
  ) { }

  async create(createParameterDto: CreateParameterDto): Promise<Parameter> {
    try {
      const newParameter = new this.parameterModel(createParameterDto);
      return await newParameter.save();
    } catch (error) {
      throw new BadRequestException('Error al crear el parámetro');
    }
  }

  async findAll(paginationDto: PaginationDto, filterDto: FilterParameterDto): Promise<{ data: Parameter[], total: number, limit: number, offset: number }> {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      const { parameterType } = filterDto;

      // Construir filtros
      const filters: any = {
        $or: [
          { deletedAt: { $exists: false } },
          { deletedAt: null }
        ]
      };
      if (parameterType) {
        filters.parameterType = parameterType;
      }

      // Ejecutar consultas en paralelo
      const [data, total] = await Promise.all([
        this.parameterModel
          .find(filters)
          .limit(limit)
          .skip(offset)
          .exec(),
        this.parameterModel.countDocuments(filters).exec()
      ]);

      return {
        data,
        total,
        limit,
        offset
      };
    } catch (error) {
      throw new BadRequestException('Error al obtener los parámetros');
    }
  }

  async findOne(id: number): Promise<Parameter> {
    try {
      const parameter = await this.parameterModel.findById(id).exec();
      if (!parameter) {
        throw new NotFoundException(`Parámetro con ID ${id} no encontrado`);
      }
      return parameter;
    } catch (error) {
      throw new NotFoundException(`Parámetro con ID ${id} no encontrado`);
    }
  }

  async update(id: number, updateParameterDto: UpdateParameterDto): Promise<Parameter> {
    try {
      const updatedParameter = await this.parameterModel
        .findByIdAndUpdate(id, updateParameterDto, { new: true })
        .exec();

      if (!updatedParameter) {
        throw new NotFoundException(`Parámetro con ID ${id} no encontrado`);
      }

      return updatedParameter;
    } catch (error) {
      throw new BadRequestException('Error al actualizar el parámetro');
    }
  }
  // -----------------------------------------------------

  async remove(id: number): Promise<void> {
    try {
      const result = await this.parameterModel
        .findByIdAndUpdate(id, { deletedAt: new Date() }, { new: true })
        .exec();

      if (!result) {
        throw new NotFoundException(`Parámetro con ID ${id} no encontrado`);
      }
    } catch (error) {
      throw new BadRequestException('Error al eliminar el parámetro');
    }
  }
}
