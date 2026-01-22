import {
  Injectable,
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, ObjectId, Connection } from 'mongoose';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Documento } from './entities/document.entity';
import { secondConsecutivePart } from '../common/constants/second-consecutive-part.constant';
import { GetStatisticsDto } from 'src/records/dto/get-statistics.dto';
import { FileService } from 'src/common/services/file.service';

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
      this.logger.error('Error al crear el documento:', error);
      throw new BadRequestException('Error al crear el documento');
    }
  }
  // -----------------------------------------------------
  private readonly logger = new Logger(FileService.name);
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
      const consecutive = await this.generateDocumentConsecutive(
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
        consecutive: consecutive,
      });
      return await document.save();
    } catch (error) {
      if (error.code === 11000) {
        throw new BadRequestException('El consecutivo ya existe');
      }
      this.logger.error('Error al crear el documento con archivo:', error);
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
  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    try {
      // Buscar el documento actual para comparar el campo 'document'
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
        const newConsecutive = await this.generateDocumentConsecutive(
          currentDocument.record,
          updateDocumentDto.document,
        );
        updateData.consecutive = newConsecutive;
      }
      const document = await this.documentModel.findByIdAndUpdate(
        id,
        {
          ...updateData,
          ...(updateDocumentDto.settledDate && {
            settledDate: new Date(updateDocumentDto.settledDate),
          }),
        },
        { new: true },
      );
      if (!document || document.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }
      return document;
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
        const newConsecutive = await this.generateDocumentConsecutive(
          currentDocument.record,
          updateDocumentDto.document,
        );
        updateData.consecutive = newConsecutive;
      }
      // Si viene un nuevo archivo
      if (file) {
        const newUrl = await this.fileService.uploadOneFile(file);
        updateData.url = newUrl;
        if (currentDocument.url) {
          try {
            // Extraer la key del S3 desde la URL
            const urlParts = currentDocument.url.split('/');
            const s3Key = urlParts.slice(-2).join('/'); // documents/filename
            await this.fileService.deleteFile(s3Key);
          } catch (deleteError) {
            console.warn(
              'Error al eliminar archivo anterior de S3:',
              deleteError,
            );
          }
        }
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
    const document = await this.documentModel.findByIdAndUpdate(
      id,
      { deletedAt: new Date() },
      { new: true },
    );
    if (!document) {
      throw new NotFoundException('Documento no encontrado');
    }
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
        try {
          const urlParts = document.url.split('/');
          const s3Key = urlParts.slice(-2).join('/'); // documents/filename
          await this.fileService.deleteFile(s3Key);
        } catch (deleteError) {
          console.warn(
            'Error al eliminar archivo anterior de S3:',
            deleteError,
          );
        }
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
    try {
      // Verificar que el documento existe
      const document = await this.documentModel.findById(documentId);
      if (!document || document.deletedAt) {
        throw new NotFoundException('Documento no encontrado');
      }
      if (!document.url) {
        throw new NotFoundException('El documento no tiene archivo asociado');
      }
      try {
        const urlParts = document.url.split('/');
        const s3Key = urlParts.slice(-2).join('/'); // documents/filename
        await this.fileService.deleteFile(s3Key);
      } catch (deleteError) {
        console.warn('Error al eliminar archivo de S3:', deleteError);
        // Continuar con la eliminación en BD aunque falle la eliminación en S3
      }
      // Remover la URL del documento
      const updatedDocument = await this.documentModel.findByIdAndUpdate(
        documentId,
        { $unset: { url: 1 } },
        { new: true },
      );
      return {
        message: 'Archivo eliminado exitosamente',
        document: updatedDocument,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error al eliminar el archivo del documento',
      );
    }
  }
  // -----------------------------------------------------
  /**
   * Genera un consecutivo para un documento basado en el record y el tipo de documento
   */
  private async generateDocumentConsecutive(
    recordId: ObjectId,
    documentType: string,
  ): Promise<string> {
    try {
      // Obtener el record para obtener el internalCode
      const RecordModel = this.connection.model('Record');
      const record = await RecordModel.findById(recordId)
        .select('internalCode')
        .exec();

      if (!record) {
        throw new BadRequestException('Record no encontrado');
      }
      const internalCode = record.internalCode;
      // Obtener el código del documento de la constante
      const secondPart = secondConsecutivePart[documentType];
      if (!secondPart) {
        throw new BadRequestException(
          `Tipo de documento inválido: ${documentType}`,
        );
      }
      // Obtener el siguiente número consecutivo para este tipo de documento específico
      const documentPattern = `^${internalCode}-${secondPart}-QPA-`;
      // Buscar el último documento con este patrón para este record específico
      const lastDocument = await this.documentModel
        .findOne({
          record: recordId,
          consecutive: { $regex: documentPattern },
          deletedAt: { $exists: false },
        })
        .sort({ consecutive: -1 })
        .select('consecutive')
        .exec();

      let nextDocumentNumber = 1;
      if (lastDocument && lastDocument.consecutive) {
        const matches = lastDocument.consecutive.match(/-(\d+)$/);
        if (matches) {
          nextDocumentNumber = parseInt(matches[1]) + 1;
        }
      }
      const paddedNumber = nextDocumentNumber.toString().padStart(2, '0');
      return `${internalCode}-${secondPart}-QPA-${paddedNumber}`;
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
