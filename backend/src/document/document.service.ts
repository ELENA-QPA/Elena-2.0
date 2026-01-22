import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, ObjectId, Connection } from 'mongoose';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Documento } from './entities/document.entity';
import { secondConsecutivePart } from '../common/constants/second-consecutive-part.constant';
import { GetStatisticsDto } from 'src/records/dto/get-statistics.dto';
import { FileService } from 'src/common/services/file.service';
import { json } from 'stream/consumers';

@Injectable()
export class DocumentService {
  // -----------------------------------------------------
  constructor(
    @InjectModel(Documento.name)
    private readonly documentModel: Model<Documento>,
    @InjectConnection()
    private readonly connection: Connection,
    private readonly fileService: FileService,
  ) {}
  // -----------------------------------------------------
  async create(createDocumentDto: CreateDocumentDto, recordId: ObjectId) {
    try {
      const document = new this.documentModel({
        ...createDocumentDto,
        record: recordId,
        settledDate: new Date(createDocumentDto.settledDate),
      });
      return await document.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('El consecutivo ya existe');
      }
      throw new BadRequestException('Error al crear el documento');
    }
  }

  async createWithFile(
    createDocumentDto: CreateDocumentDto,
    recordId: ObjectId,
    file: any,
  ) {
    try {
      // Validar que el archivo es obligatorio
      if (!file) {
        throw new BadRequestException('El archivo es obligatorio');
      }

      // Generar el consecutivo del documento
      const { consecutive, consecutiveNumber } =
        await this.generateDocumentConsecutive(
          recordId,
          createDocumentDto.document,
        );

      // Subir el archivo
      const fileUrl = await this.fileService.uploadOneFile(file);
      // Crear el documento con la URL incluida y el consecutivo generado
      const document = new this.documentModel({
        ...createDocumentDto,
        record: recordId,
        settledDate: new Date(createDocumentDto.settledDate),
        url: fileUrl,
        consecutive,
        consecutiveNumber,
      });
      return await document.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('El consecutivo ya existe');
      }
      throw new BadRequestException('Error al crear el documento');
    }
  }
  // -----------------------------------------------------
  async createMany(
    createDocumentDtos: CreateDocumentDto[],
    recordId: ObjectId,
    session?: any,
  ) {
    try {
      const documents = createDocumentDtos.map((dto) => ({
        ...dto,
        record: recordId,
        settledDate: new Date(dto.settledDate),
      }));

      const options = session ? { session } : {};
      return await this.documentModel.insertMany(documents, options);
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Uno o más consecutivos ya existen');
      }
      console.log(error);
      throw new BadRequestException('Error al crear los documentos');
    }
  }
  // -----------------------------------------------------
  async createManyWithUrls(
    createDocumentDtos: CreateDocumentDto[],
    recordId: ObjectId,
    urls: string[],
    session?: any,
  ) {
    try {
      const documents = createDocumentDtos.map((dto, index) => ({
        ...dto,
        record: recordId,
        settledDate: new Date(dto.settledDate),
        url: urls[index] || null,
      }));

      const options = session ? { session } : {};
      return await this.documentModel.insertMany(documents, options);
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('Uno o más consecutivos ya existen');
      }
      console.log(error);
      throw new BadRequestException('Error al crear los documentos');
    }
  }
  // -----------------------------------------------------
  async findAll() {
    return await this.documentModel
      .find({ deletedAt: { $exists: false } })
      .populate('record');
  }
  // -----------------------------------------------------
  async findByRecord(recordId: string) {
    return await this.documentModel.find({
      record: recordId,
      deletedAt: { $exists: false },
    });
  }

  async findByRecords(recordIds: string[]) {
    return await this.documentModel
      .find({
        record: { $in: recordIds },
        deletedAt: { $exists: false },
      })
      .lean()
      .exec();
  }
  // -----------------------------------------------------
  async findOne(id: string) {
    const document = await this.documentModel.findById(id).populate('record');
    if (!document || document.deletedAt) {
      throw new NotFoundException('Documento no encontrado');
    }
    return document;
  }
  // -----------------------------------------------------
  async update(id: string, updateDocumentDto: UpdateDocumentDto, file?: any) {
    try {
      const currentDocument = await this.documentModel.findById(id);
      if (!currentDocument || currentDocument.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }

      let updateData = { ...updateDocumentDto };
      // Si el campo 'document' está cambiando, generar un nuevo consecutivo
      if (
        updateDocumentDto.document &&
        updateDocumentDto.document !== currentDocument.document
      ) {
        const { consecutive, consecutiveNumber } =
          await this.generateDocumentConsecutive(
            currentDocument.record,
            updateDocumentDto.document,
          );
        updateData.consecutive = consecutive;
        updateData.consecutiveNumber = consecutiveNumber;
      }
      const updatedDocument = await this.documentModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          ...(updateDocumentDto.settledDate && {
            settledDate: new Date(updateDocumentDto.settledDate),
          }),
        },
        { new: true },
      );
      if (!updatedDocument || updatedDocument.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }

      if (file) {
        const dataUploaded = await this.addFileToDocument(id, file);
        return dataUploaded.document;
      }
      return updatedDocument;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('El consecutivo ya existe');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el documento');
    }
  }

  private async deleteDocumentFile(document: any): Promise<void> {
    if (!document?.url) return;

    try {
      await this.fileService.deleteFile(document.url);
    } catch (error) {
      console.warn(
        `No se pudo eliminar archivo de GCS para documento ${document._id}`,
        error,
      );
    }
  }
  // -----------------------------------------------------
  async updateWithFile(
    id: string,
    updateDocumentDto: UpdateDocumentDto,
    file?: any,
  ) {
    try {
      // Buscar el documento actual
      const currentDocument = await this.documentModel.findById(id);
      if (!currentDocument || currentDocument.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }
      let updateData = { ...updateDocumentDto };
      // Si el campo 'document' está cambiando, generar un nuevo consecutivo
      if (
        updateDocumentDto.document &&
        updateDocumentDto.document !== currentDocument.document
      ) {
        const { consecutive, consecutiveNumber } =
          await this.generateDocumentConsecutive(
            currentDocument.record,
            updateDocumentDto.document,
          );
        updateData.consecutive = consecutive;
        updateData.consecutiveNumber = consecutiveNumber;
      }
      // Si viene un nuevo archivo
      if (file) {
        const newUrl = await this.fileService.uploadOneFile(file);
        updateData.url = newUrl;

        await this.deleteDocumentFile(currentDocument);
      }
      const updatedDocument = await this.documentModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          ...(updateDocumentDto.settledDate && {
            settledDate: new Date(updateDocumentDto.settledDate),
          }),
        },
        { new: true },
      );
      return updatedDocument;
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('El consecutivo ya existe');
      }
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Error al actualizar el documento');
    }
  }
  // -----------------------------------------------------
  async remove(id: string) {
    const document = await this.documentModel.findById(id);

    if (!document || document.deletedAt) {
      throw new NotFoundException('Documento no encontrado');
    }

    // 1. Eliminar archivo (best effort)
    await this.deleteDocumentFile(document);

    // 2. Soft delete
    document.deletedAt = new Date();
    await document.save();

    return { message: 'Documento eliminado correctamente' };
  }
  // -----------------------------------------------------
  // Método para agregar/actualizar archivo a un documento existente
  async addFileToDocument(documentId: string, file: any) {
    try {
      // Verificar que el documento existe
      const document = await this.documentModel.findById(documentId);
      if (!document || document.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }
      if (document.url) {
        await this.deleteDocumentFile(document);
      }
      const fileUrl = await this.fileService.uploadOneFile(file);
      const updatedDocument = await this.documentModel.findByIdAndUpdate(
        documentId,
        { url: fileUrl },
        { new: true },
      );
      return {
        message: 'Archivo subido exitosamente',
        document: updatedDocument,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al subir el archivo al documento');
    }
  }
  // -----------------------------------------------------
  async getDocumentFiles(documentId: string) {
    try {
      // Verificar que el documento existe
      const document = await this.documentModel.findById(documentId);
      if (!document || document.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }
      return {
        document: document,
        url: document.url || null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error al obtener el archivo del documento',
      );
    }
  }
  // -----------------------------------------------------
  async removeFileFromDocument(documentId: string) {
    const document = await this.documentModel.findById(documentId);

    if (!document || document.deletedAt) {
      throw new NotFoundException('Documento no encontrado');
    }

    if (!document.url) {
      throw new BadRequestException('El documento no tiene archivo asociado');
    }

    await this.deleteDocumentFile(document);

    const updatedDocument = await this.documentModel.findByIdAndUpdate(
      documentId,
      { $unset: { url: 1 } },
      { new: true },
    );

    return {
      message: 'Archivo eliminado exitosamente',
      document: updatedDocument,
    };
  }
  // -----------------------------------------------------
  /**
   * Genera un consecutivo para un documento basado en el record y el tipo de documento
   */
  private async generateDocumentConsecutive(
    recordId: ObjectId,
    documentType: string,
  ): Promise<{ consecutive: string; consecutiveNumber: number }> {
    try {
      // Obtener el record para obtener el internalCode
      const RecordModel = this.connection.model('Record');
      const record = await RecordModel.findById(recordId)
        .select('etiqueta')
        .exec();

      if (!record) {
        throw new BadRequestException('Record no encontrado');
      }
      const internalCode = record.etiqueta;
      // Obtener el código del documento de la constante
      const secondPart = secondConsecutivePart[documentType];
      if (!secondPart) {
        throw new BadRequestException(
          `Tipo de documento inválido: ${documentType}`,
        );
      }
      const lastDocument = await this.documentModel
        .findOne({
          record: recordId,
          document: documentType,
        })
        .sort({ consecutiveNumber: -1 })
        .select('consecutiveNumber')
        .exec();

      const nextNumber = lastDocument ? lastDocument.consecutiveNumber + 1 : 1;

      // 4. Formatear consecutivo
      const padded = nextNumber.toString().padStart(2, '0');
      const consecutive = `${internalCode}-${secondPart}-QPA-${padded}`;

      return {
        consecutive,
        consecutiveNumber: nextNumber,
      };
    } catch (error) {
      console.error('Error al generar consecutivo del documento:', error);
      throw new InternalServerErrorException(
        'Error al generar el consecutivo del documento',
      );
    }
  }
  // -----------------------------------------------------
  async getStatisticsDocumentation() {
    // Agrupa documentos por tipo de documento y subdocumento, y cuenta la cantidad en cada grupo
    // Se asume que los campos son 'document' (tipo) y 'subdocument' (subtipo)
    try {
      const stats = await this.documentModel.aggregate([
        { $match: { deletedAt: { $exists: false } } },
        {
          $group: {
            _id: {
              document: '$document',
              subdocument: '$subdocument',
            },
            count: { $sum: 1 },
          },
        },
        {
          $project: {
            _id: 0,
            document: '$_id.document',
            subdocument: '$_id.subdocument',
            count: 1,
          },
        },
        { $sort: { document: 1, subdocument: 1 } },
      ]);
      return stats;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener estadísticas de documentos',
      );
    }
  }
  // -----------------------------------------------------
  async getDocumentationMetrics(body: GetStatisticsDto) {
    try {
      // Obtener año y mes del body, si no vienen usar el actual
      const now = new Date();
      const year = body.year || now.getFullYear();
      const month = body.month !== undefined ? body.month : now.getMonth() + 1; // 1-12

      // Importar el enum correctamente
      const { DocumentDto } = require('./dto/create-document.dto');
      const documentTypes: string[] = Object.values(DocumentDto);

      // Calcular rango de fechas para el mes y año
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      // Buscar todos los documentos en el periodo
      const documents = await this.documentModel
        .find({
          settledDate: { $gte: startDate, $lt: endDate },
          deletedAt: { $exists: false },
        })
        .select('document settledDate');

      // Calcular totales y porcentajes para el periodo
      const total = documents.length;
      const typeCounts: Record<string, number> = {};
      documentTypes.forEach((type: string) => {
        typeCounts[type] = documents.filter(
          (doc) => doc.document === type,
        ).length;
      });
      const typePercents: Record<string, number> = {};
      documentTypes.forEach((type: string) => {
        typePercents[type] =
          total > 0 ? Math.round((typeCounts[type] / total) * 100) : 0;
      });

      return {
        year,
        month,
        total,
        percents: typePercents,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error al obtener métricas de documentación',
      );
    }
  }
  // -----------------------------------------------------
}
