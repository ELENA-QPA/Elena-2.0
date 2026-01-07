import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ObjectId } from 'mongoose';
import { CreateProceduralPartDto } from './dto/create-procedural-part.dto';
import { UpdateProceduralPartDto } from './dto/update-procedural-part.dto';
import { ProceduralPart, PartType } from './entities/procedural-part.entity';
import { Performance } from 'src/perfomance/entities/perfomance.entity';
import { ByClientDto } from 'src/records/dto/by-client-document.dto';

@Injectable()
export class ProceduralPartService {
  constructor(
    @InjectModel(ProceduralPart.name)
    private readonly proceduralPartModel: Model<ProceduralPart>,
    @InjectModel(Performance.name)
    private readonly performanceModel: Model<Performance>,
  ) {}

  async create(createProceduralPartDto: CreateProceduralPartDto) {
    try {
      const proceduralPart = new this.proceduralPartModel(
        createProceduralPartDto,
      );
      return await proceduralPart.save();
    } catch (error) {
      throw new BadRequestException('Error al crear la parte procesal');
    }
  }

  async createMany(
    createProceduralPartDtos: CreateProceduralPartDto[],
    session?: any,
  ) {
    try {
      const options = session ? { session } : {};
      return await this.proceduralPartModel.insertMany(
        createProceduralPartDtos,
        options,
      );
    } catch (error) {
      throw new BadRequestException('Error al crear las partes procesales');
    }
  }

  async findAll() {
    return await this.proceduralPartModel
      .find({ deletedAt: { $exists: false } })
      .populate('record');
  }

  async findByRecord(recordId: string) {
    return await this.proceduralPartModel
      .find({
        record: recordId,
        deletedAt: { $exists: false },
      })
      .sort({ createdAt: 1 });
  }

  async findOne(id: string) {
    const proceduralPart = await this.proceduralPartModel
      .findById(id)
      .populate('record');
    if (!proceduralPart || proceduralPart.deletedAt) {
      throw new NotFoundException('Parte procesal no encontrada');
    }
    return proceduralPart;
  }

  async update(id: string, updateProceduralPartDto: UpdateProceduralPartDto) {
    try {
      const proceduralPart = await this.proceduralPartModel.findByIdAndUpdate(
        id,
        updateProceduralPartDto,
        { new: true },
      );
      if (!proceduralPart || proceduralPart.deletedAt) {
        throw new NotFoundException('Parte procesal no encontrada');
      }
      return proceduralPart;
    } catch (error) {
      throw new BadRequestException('Error al actualizar la parte procesal');
    }
  }

  async remove(id: string) {
    const proceduralPart = await this.proceduralPartModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    );
    if (!proceduralPart) {
      throw new NotFoundException('Parte procesal no encontrada');
    }
    return { message: 'Parte procesal eliminada correctamente' };
  }
  // -----------------------------------------------------
  async getRecordsByClient(body: ByClientDto) {
    const { document } = body;
    try {
      // Buscar todas las partes procesales que coincidan con el documento
      const parts = await this.proceduralPartModel
        .find({
          document,
          partType: PartType.demandante,
          deletedAt: { $exists: false },
        })
        .populate({
          path: 'record',
          select: 'etiqueta type estado updatedAt createdAt ',
          match: { deletedAt: { $exists: false } }, // Solo registros no eliminados
        });

      // Filtrar las partes que tienen record válido (no nulo después del populate)
      const validParts = parts.filter((part) => part.record);

      if (validParts.length === 0) {
        return {
          message: 'No se encontraron casos para el documento proporcionado',
          activeRecords: [],
          finalizedRecords: [],
          totalActive: 0,
          totalFinalized: 0,
        };
      }

      // Obtener los casos únicos para evitar duplicados
      const uniqueRecords = validParts
        .map((part) => part.record as any)
        .filter(
          (record, index, self) =>
            index === self.findIndex((r) => r.etiqueta === record.etiqueta),
        );
      // Separar por tipo (ACTIVO/FINALIZADO)
      const active = uniqueRecords
        .filter((record) => record.type === 'ACTIVO')
        .map((record) => ({
          etiqueta: record.etiqueta,
          state: record.estado,
          updatedAt: record.updatedAt ? record.updatedAt : record.createdAt,
        }));

      const finalized = uniqueRecords
        .filter((record) => record.type === 'FINALIZADO')
        .map((record) => ({
          etiqueta: record.etiqueta,
          state: record.estado,
          updatedAt: record.updatedAt ? record.updatedAt : record.createdAt,
        }));
      return {
        message: 'Casos obtenidos exitosamente',
        active,
        finalized,
        totalActive: active.length,
        totalFinalized: finalized.length,
        totalRecords: uniqueRecords.length,
      };
    } catch (error) {
      console.error(
        'Error al obtener los casos por número de documento del cliente:',
        error,
      );
      throw new BadRequestException(
        'Error al obtener los casos por número de documento del cliente',
      );
    }
  }
}
