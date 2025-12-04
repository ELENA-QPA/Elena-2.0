import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreateIntervenerDto } from './dto/create-intervener.dto';
import { UpdateIntervenerDto } from './dto/update-intervener.dto';
import { Intervener } from './entities/intervener.entity';

@Injectable()
export class IntervenerService {
  constructor(
    @InjectModel(Intervener.name)
    private readonly intervenerModel: Model<Intervener>,
  ) { }

  async create(createIntervenerDto: CreateIntervenerDto) {
    try {
      const intervener = new this.intervenerModel(createIntervenerDto);
      return await intervener.save();
    } catch (error) {
      throw new BadRequestException('Error al crear el interviniente');
    }
  }

  async createMany(createIntervenerDtos: CreateIntervenerDto[], session?: any) {
    try {
      const options = session ? { session } : {};
      return await this.intervenerModel.insertMany(createIntervenerDtos, options);
    } catch (error) {
      throw new BadRequestException('Error al crear los intervinientes');
    }
  }

  async findAll() {
    return await this.intervenerModel.find({ deletedAt: { $exists: false } }).populate('record');
  }

  async findByRecord(recordId: string) {
    return await this.intervenerModel.find({
      record: recordId,
      deletedAt: { $exists: false }
    });
  }

  async findOne(id: string) {
    const intervener = await this.intervenerModel.findById(id).populate('record');
    if (!intervener || intervener.deletedAt) {
      throw new NotFoundException('Interviniente no encontrado');
    }
    return intervener;
  }

  async update(id: string, updateIntervenerDto: UpdateIntervenerDto) {
    try {
      const intervener = await this.intervenerModel.findByIdAndUpdate(
        id,
        updateIntervenerDto,
        { new: true }
      );
      if (!intervener || intervener.deletedAt) {
        throw new NotFoundException('Interviniente no encontrado');
      }
      return intervener;
    } catch (error) {
      throw new BadRequestException('Error al actualizar el interviniente');
    }
  }

  async remove(id: string) {
    const intervener = await this.intervenerModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true }
    );
    if (!intervener) {
      throw new NotFoundException('Interviniente no encontrado');
    }
    return { message: 'Interviniente eliminado correctamente' };
  }
}
