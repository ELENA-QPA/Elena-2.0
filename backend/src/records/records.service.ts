/* eslint-disable prefer-const */
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import mongoose, { Model, ObjectId, Connection } from 'mongoose';
import { PaginationDto } from 'src/common/dto/paginaton.dto';
import { CreateRecordDto } from './dto/create-record.dto';
import { CreateCompleteRecordDto } from './dto/create-complete-record.dto';
import { UpdateRecordDto } from './dto/update-record.dto';
import { Record } from './entities/record.entity';
import { IUser } from './interfaces/user.interface';
import { AddCommentDto } from './dto/add-comment.dto';
import { User } from 'src/auth/entities/user.entity';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { DraftRecordDto } from './dto/draft.record.dto';
import { MailerService } from '@nestjs-modules/mailer';
import { DocumentService } from 'src/document/document.service';
import { IntervenerService } from 'src/intervener/intervener.service';
import { ProceduralPartService } from 'src/procedural-part/procedural-part.service';
import { PaymentService } from 'src/payment/payment.service';
import { PerfomanceService } from 'src/perfomance/perfomance.service';
import { FileService, UploadedFile } from 'src/common/services/file.service';
import { CreateCompleteRecordWithFilesDto } from './dto/create-complete-record-with-files.dto';
import { ValidRoles } from 'src/auth/interfaces';
import { firstConsecutivePart } from '../common/constants/first-consecutive-part.constant';
import { secondConsecutivePart } from '../common/constants/second-consecutive-part.constant';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ByClientDto } from './dto/by-client-document.dto';
import { ByEtiquetaDto } from './dto/by-internal-code.dto';
import { getEtiquetaByIdDto } from './dto/get-internal-code.dto';
import e from 'express';
// import { Multer } from 'multer';

@Injectable()
export class RecordsService {
  constructor(
    @InjectModel(Record.name)
    private readonly recordModel: Model<Record>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectConnection() private readonly connection: Connection,
    private readonly mailerService: MailerService,
    private readonly documentService: DocumentService,
    private readonly intervenerService: IntervenerService,
    private readonly proceduralPartService: ProceduralPartService,
    private readonly paymentService: PaymentService,
    private readonly perfomanceService: PerfomanceService,
    private readonly fileService: FileService,
  ) {}

  /**
   * @param clientType
   * @param documentType
   * @returns
   */
  private async generateEtiqueta(
    clientType: string,
    documentType: string,
  ): Promise<string> {
    try {
      const firstPart = firstConsecutivePart[clientType];
      const secondPart = secondConsecutivePart[documentType];

      if (!firstPart || !secondPart) {
        throw new BadRequestException(
          `Tipo de cliente o documento inválido: ${clientType}, ${documentType}`,
        );
      }

      const maxEtiquetaData = await this.getMaxEtiquetaByProcessType(
        clientType,
      );

      let nextClientNumber = 1; // Número base inicial
      if (maxEtiquetaData.maxEtiqueta) {
        const matches = maxEtiquetaData.maxEtiqueta.match(/^[A-Z](\d+)$/);
        if (matches) {
          nextClientNumber = parseInt(matches[1]) + 1;
        }
      }

      const formattedNumber = Math.max(nextClientNumber, 1)
        .toString()
        .padStart(3, '0');
      return `${firstPart}${formattedNumber}`;
    } catch (error) {
      console.error('Error al generar código interno:', error);
      throw new InternalServerErrorException(
        'Error al generar el código interno',
      );
    }
  }

  private async generateDocumentConsecutive(
    etiqueta: string,
    documentType: string,
  ): Promise<string> {
    try {
      // Obtener el código del documento de la constante
      const secondPart = secondConsecutivePart[documentType];
      if (!secondPart) {
        throw new BadRequestException(
          `Tipo de documento inválido: ${documentType}`,
        );
      }

      // Obtener el siguiente número consecutivo para este tipo de documento específico
      const documentPattern = `^${etiqueta}-${secondPart}-QPA-`;

      // Buscar directamente en la colección de documentos usando regex
      const DocumentModel = this.connection.model('Documento');
      const lastDocument = await DocumentModel.findOne({
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
      return `${etiqueta}-${secondPart}-QPA-${paddedNumber}`;
    } catch (error) {
      console.error('Error al generar consecutivo del documento:', error);
      throw new InternalServerErrorException(
        'Error al generar el consecutivo del documento',
      );
    }
  }

  async findAll(paginationDto: PaginationDto) {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      return await this.recordModel
        .find()
        .limit(limit)
        .skip(offset)
        .sort({
          no: 1,
        })
        .select('-__v');
    } catch (error) {
      this.handleExceptions(error);
    }
  }

  async getMyRecords(user: IUser, paginationDto: PaginationDto): Promise<any> {
    try {
      const { limit = 10, offset = 0 } = paginationDto;
      // Buscar solo los records creados por el usuario actual
      const baseQuery: { [key: string]: any } = {
        deletedAt: { $exists: false },
      };

      // Obtener el total para paginación
      const total = await this.recordModel.countDocuments(baseQuery);

      // Obtener los records paginados
      const records = await this.recordModel
        .find(baseQuery)
        .limit(limit)
        .skip(offset)
        .sort({ createdAt: -1 })
        .select('-__v')
        .exec();

      // Para cada record, obtener relaciones igual que findById
      const recordsWithRelations = await Promise.all(
        (records || []).map(async (record: any) => {
          const id = record._id?.toString?.() || record.id;
          const [
            documents,
            interveners,
            proceduralParts,
            payments,
            performances,
          ] = await Promise.all([
            this.documentService.findByRecord(id),
            this.intervenerService.findByRecord(id),
            this.proceduralPartService.findByRecord(id),
            this.paymentService.findByRecord(id),
            this.perfomanceService.findByRecord(id),
          ]);
          return {
            ...record.toObject(),
            documents: documents || [],
            interveners: interveners || [],
            proceduralParts: proceduralParts || [],
            payments: payments || [],
            performances: performances || [],
          };
        }),
      );

      return {
        message: 'Expedientes obtenidos exitosamente',
        records: recordsWithRelations,
        count: total,
      };
    } catch (error) {
      console.log(error);
      this.handleExceptions(error);
    }
  }
  // // -----------------------------------------------------
  async create(user: IUser, createPrescriptionDto: DraftRecordDto) {
    const datatoInsert: any = {
      ...createPrescriptionDto,
      user: user.id,
    };
    try {
      const recordCreated = await this.recordModel.create(datatoInsert);
      console.log(`data created : ${recordCreated}`);

      return `Caso creado con estado ${recordCreated.estado}`;
    } catch (error) {
      console.log(error);
      this.handleExceptions(error);
    }
  }

  // -----------------------------------------------------
  async createCompleteRecord(
    user: IUser,
    createCompleteRecordDto: CreateCompleteRecordDto,
  ) {
    try {
      // 1. Extraer datos del DTO
      const {
        documents,
        interveners,
        proceduralParts,
        payments,
        ...recordData
      } = createCompleteRecordDto;

      // 1.1. Validar que el documento tenga el campo responsible
      if (documents && Array.isArray(documents) && documents.length > 0) {
        const firstDocument = documents[0];
        if (!firstDocument.responsible) {
          throw new BadRequestException(
            'El campo responsible es obligatorio en el documento',
          );
        }
      }

      // 2. Generar la etiqueta básico automáticamente (ej: R430)
      let etiqueta: string;
      if (recordData.clientType && documents && documents.length > 0) {
        const firstDocument = documents[0];
        etiqueta = await this.generateEtiqueta(
          recordData.clientType,
          firstDocument.document,
        );
      } else {
        throw new BadRequestException(
          'Se requiere clientType y al menos un documento para generar el código interno',
        );
      }

      // 3. Crear el record principal
      const dataToInsert = {
        ...recordData,
        etiqueta: etiqueta,
        user: user.id,
      };

      const recordCreated = await this.recordModel.create(dataToInsert);
      console.log(`Record created: ${recordCreated._id}`);

      // 4. Crear documentos si existen
      if (documents && Array.isArray(documents) && documents.length > 0) {
        const firstDocument = documents[0];
        const documentConsecutive = await this.generateDocumentConsecutive(
          etiqueta,
          firstDocument.document,
        );

        const documentToCreate = [
          {
            ...firstDocument,
            consecutive: documentConsecutive,
          },
        ];

        await this.documentService.createMany(
          documentToCreate,
          recordCreated._id as unknown as ObjectId,
          null, // session = null
        );
        console.log(
          `Created 1 document with consecutive: ${documentConsecutive}`,
        );
      }

      // 5. Crear intervinientes si existen
      if (interveners && interveners.length > 0) {
        const intervenersWithRecord = interveners.map((intervener) => ({
          ...intervener,
          record: recordCreated._id.toString(),
        }));
        await this.intervenerService.createMany(
          intervenersWithRecord,
          null, // session = null
        );
        console.log(`Created ${interveners.length} interveners`);
      }

      // 6. Crear partes procesales si existen
      if (proceduralParts && proceduralParts.length > 0) {
        const proceduralPartsWithRecord = proceduralParts.map((part) => ({
          ...part,
          record: recordCreated._id.toString(),
        }));
        await this.proceduralPartService.createMany(
          proceduralPartsWithRecord,
          null, // session = null
        );
        console.log(`Created ${proceduralParts.length} procedural parts`);
      }

      // 7. Crear payments si existen
      if (payments && payments.length > 0) {
        const paymentsWithRecord = payments.map((payment) => ({
          ...payment,
          record: recordCreated._id as unknown as ObjectId,
        }));
        await this.paymentService.createMany(
          paymentsWithRecord,
          recordCreated._id as unknown as ObjectId,
          null,
        );
        console.log(
          `Created ${payments.length} payments with their payment values`,
        );
      }

      return {
        success: true,
        message: 'Caso completo creado exitosamente',
        record: recordCreated,
        etiqueta: etiqueta,
        documentsCount: documents?.length || 0,
        intervenersCount: interveners?.length || 0,
        proceduralPartsCount: proceduralParts?.length || 0,
        paymentsCount: payments?.length || 0,
      };
    } catch (error) {
      console.error('Error creating complete record:', error);
      throw new BadRequestException(
        `Error al crear el caso completo: ${error.message}`,
      );
    }
  }

  // -----------------------------------------------------
  async createCompleteRecordWithFiles(
    user: IUser,
    createCompleteRecordDto: CreateCompleteRecordWithFilesDto,
    files: UploadedFile[],
  ) {
    try {
      // 1. Validar archivos
      this.fileService.validateFiles(files);

      // 2. Procesar archivos subidos
      const processedFiles = await this.fileService.processUploadedFiles(files);

      // 3. Crear el record principal
      const {
        documents,
        interveners,
        proceduralParts,
        payments,
        filesMetadata,
        ...recordData
      } = createCompleteRecordDto;

      // 3.1. Validar que el documento tenga el campo responsible
      if (documents && Array.isArray(documents) && documents.length > 0) {
        const firstDocument = documents[0];
        if (!firstDocument.responsible) {
          throw new BadRequestException(
            'El campo responsible es obligatorio en el documento',
          );
        }
      }

      // Validar que existan tanto documentos (metadata) como archivos físicos
      if (!recordData.clientType) {
        throw new BadRequestException(
          'Se requiere clientType para generar el código interno',
        );
      }
      if (!documents || documents.length === 0) {
        throw new BadRequestException(
          'Se requiere al menos un documento (metadata) para generar consecutivo',
        );
      }
      if (!processedFiles || processedFiles.length === 0) {
        throw new BadRequestException(
          'Se requiere subir al menos un archivo físico',
        );
      }

      // Generar la etiqueta básica automáticamente
      let etiqueta: string;
      const firstDocument = documents[0];
      etiqueta = await this.generateEtiqueta(
        recordData.clientType,
        firstDocument.document,
      );

      const dataToInsert = {
        ...recordData,
        etiqueta: etiqueta,
        user: user.id,
      };

      const recordCreated = await this.recordModel.create(dataToInsert);

      // Crear documentos si existen
      let createdDocuments = [];
      if (documents && Array.isArray(documents) && documents.length > 0) {
        const firstDocument = documents[0];
        const documentConsecutive = await this.generateDocumentConsecutive(
          etiqueta,
          firstDocument.document,
        );

        const documentToCreate = {
          ...firstDocument,
          consecutive: documentConsecutive,
        };

        // Si hay archivos, asociar URL al documento
        if (processedFiles.length > 0) {
          const documentWithUrl = {
            ...documentToCreate,
            url: processedFiles[0]?.url || null,
          };
          createdDocuments = await this.documentService.createManyWithUrls(
            [documentWithUrl],
            recordCreated._id as unknown as ObjectId,
            [processedFiles[0]?.url],
            null,
          );
        } else {
          createdDocuments = await this.documentService.createMany(
            [documentToCreate],
            recordCreated._id as unknown as ObjectId,
            null,
          );
        }
      }

      // Crear intervinientes si existen
      let createdInterveners = [];
      if (interveners) {
        const intervenersArray = Array.isArray(interveners)
          ? interveners
          : [interveners];
        if (intervenersArray.length > 0) {
          const intervenersWithRecord = intervenersArray.map((intervener) => ({
            ...intervener,
            record: recordCreated._id.toString(),
          }));
          createdInterveners = await this.intervenerService.createMany(
            intervenersWithRecord,
            null, // session = null
          );
        }
      }

      // Crear partes procesales si existen
      let createdProceduralParts = [];
      if (proceduralParts) {
        const proceduralPartsArray = Array.isArray(proceduralParts)
          ? proceduralParts
          : [proceduralParts];
        if (proceduralPartsArray.length > 0) {
          const proceduralPartsWithRecord = proceduralPartsArray.map(
            (part) => ({
              ...part,
              record: recordCreated._id.toString(),
            }),
          );
          createdProceduralParts = await this.proceduralPartService.createMany(
            proceduralPartsWithRecord,
            null, // session = null
          );
          console.log(
            `Created ${proceduralPartsArray.length} procedural parts`,
          );
        }
      }

      // Crear payments si existen
      let createdPayments = [];
      if (payments) {
        const paymentsArray = Array.isArray(payments) ? payments : [payments];
        if (paymentsArray.length > 0) {
          const paymentsWithRecord = paymentsArray.map((payment) => ({
            ...payment,
            record: recordCreated._id as unknown as ObjectId,
          }));
          createdPayments = await this.paymentService.createMany(
            paymentsWithRecord,
            recordCreated._id as unknown as ObjectId,
            null,
          );
        }
      }

      // Crear el objeto completo con todas las relaciones
      const completeRecord = {
        ...recordCreated.toObject(),
        documents: createdDocuments || [],
        interveners: createdInterveners,
        proceduralParts: createdProceduralParts,
        payments: createdPayments,
      };

      return {
        message: 'Caso creado exitosamente',
        record: completeRecord,
      };
    } catch (error) {
      console.error('Error creating complete record with files:', error);
      throw new BadRequestException(
        `Error al crear el caso completo con archivos: ${error.message}`,
      );
    }
  }

  // -----------------------------------------------------
  /**
   * Obtiene el siguiente número único para un tipo de documento específico
   * @param document Tipo de documento
   * @returns Siguiente número secuencial para este documento
   */
  private async getNextUniqueNumberForDocument(
    document: string,
  ): Promise<number> {
    try {
      // Buscar todos los records que tengan este tipo de documento
      // y extraer el número más alto usado para este documento
      const documentCode = secondConsecutivePart[document];

      // Buscar todos los records con este tipo de documento
      const records = await this.recordModel
        .find({
          deletedAt: { $exists: false },
          // Aquí puedes agregar más filtros si tienes un campo específico para el tipo de documento
        })
        .select('etiqueta')
        .exec();

      let maxNumber = 0;

      // Buscar en todos los etiqueta el patrón del documento y extraer el número más alto
      const regexPattern = new RegExp(`-${documentCode}-QPA-(\\d+)$`);

      for (const record of records) {
        if (record.etiqueta) {
          const match = record.etiqueta.match(regexPattern);
          if (match && match[1]) {
            const currentNumber = parseInt(match[1], 10);
            if (currentNumber > maxNumber) {
              maxNumber = currentNumber;
            }
          }
        }
      }

      // Retornar el siguiente número
      return maxNumber + 1;
    } catch (error) {
      console.error(
        'Error al obtener siguiente número único para documento:',
        error,
      );
      throw new InternalServerErrorException(
        'Error al generar número único para documento',
      );
    }
  }

  // -----------------------------------------------------
  /**
   * Verifica si la etiqueta base ya existe en algún record
   * @param etiqueta La etiqueta base a verificar (ej: "R123")
   * @returns true si existe, false si no existe
   */
  private async checkEtiquetaBaseExists(etiqueta: string): Promise<boolean> {
    try {
      // Buscar en todos los records si existe algún código que empiece con esta etiqueta base
      // Esto incluye tanto "R123" como "R123-DDD-QPA-001"
      const existingRecord = await this.recordModel
        .findOne({
          etiqueta: new RegExp(`^${etiqueta}(-|$)`),
          // deletedAt: { $exists: false } // Solo considerar records no eliminados
        })
        .exec();

      return !!existingRecord; // Retorna true si encuentra algo, false si no
    } catch (error) {
      console.error(
        'Error al verificar duplicado de código interno base:',
        error,
      );
      throw new InternalServerErrorException(
        'Error al validar unicidad del código interno base',
      );
    }
  }
  // -----------------------------------------------------
  async findOne(user: IUser, no_orden: string) {
    let record;

    if (
      user.roles.includes('Administrador') ||
      user.roles.includes('Control de Calidad')
    ) {
      record = await this.recordModel
        .findOne({ no_orden: no_orden })
        .select('-__v')
        .populate('user', 'name lastname email phone ')
        .populate('controlador_de_calidad', 'name lastname email')
        .populate('preparador', 'name lastname email')
        .exec();
    } else {
      record = await this.recordModel
        .findOne({ no_orden: no_orden })
        .select('-__v')
        .populate('user', 'name lastname email phone registro_medico')
        .populate('controlador_de_calidad', 'name lastname email')
        .populate('preparador', 'name lastname email')
        .exec();
    }

    if (!record) {
      throw new NotFoundException(
        `Prescripción con el numero de orden:  ${no_orden} no encontrado en la DB`,
      );
    }

    // Obtener todas las relaciones asociadas al record
    const [documents, interveners, proceduralParts, payments, performances] =
      await Promise.all([
        this.documentService.findByRecord(record._id.toString()),
        this.intervenerService.findByRecord(record._id.toString()),
        this.proceduralPartService.findByRecord(record._id.toString()),
        this.paymentService.findByRecord(record._id.toString()),
        this.perfomanceService.findByRecord(record._id.toString()),
      ]);

    return {
      ...record.toObject(),
      documents,
      interveners,
      proceduralParts,
      payments,
      performances,
      documentsCount: documents?.length || 0,
      intervenersCount: interveners?.length || 0,
      proceduralPartsCount: proceduralParts?.length || 0,
      paymentsCount: payments?.length || 0,
      performancesCount: performances?.length || 0,
    };
  }
  // -----------------------------------------------------
  async getMetricsByDepartmentAndCity(): Promise<any> {
    // Agrupa por departamento y ciudad, y cuenta por tipo
    const aggregation = await this.recordModel.aggregate([
      {
        $match: {
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: {
            department: '$department',
            city: '$city',
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
    ]);

    // Reorganiza los datos a estructura: { [department]: { [city]: { activos, finalizados, total, porcentajeActivo, rapidezMediaFijacionDemanda }}}
    const result: { [key: string]: any } = {};
    // Para calcular la rapidez media, necesitamos los ids de los casos por ciudad
    const recordsByCity: { [dep: string]: { [city: string]: string[] } } = {};

    // 1. Agrupa conteos y recolecta ids
    const records = await this.recordModel
      .find({ deletedAt: { $exists: false } })
      .select('_id department city type')
      .lean();
    for (const rec of records) {
      const { department, city, _id } = rec;
      if (!department || !city) continue;
      if (!recordsByCity[department]) recordsByCity[department] = {};
      if (!recordsByCity[department][city])
        recordsByCity[department][city] = [];
      recordsByCity[department][city].push(_id.toString());
    }

    for (const item of aggregation) {
      const { department, city, type } = item._id;
      if (!department || !city) continue;
      if (!result[department]) result[department] = {};
      if (!result[department][city])
        result[department][city] = {
          activos: 0,
          finalizados: 0,
          total: 0,
          porcentajeActivo: 0,
          rapidezMediaFijacionDemanda: null,
        };
      if (type === 'ACTIVO') result[department][city].activos = item.count;
      if (type === 'FINALIZADO')
        result[department][city].finalizados = item.count;
    }
    // Calcula totales y porcentaje
    for (const dep of Object.keys(result)) {
      for (const city of Object.keys(result[dep])) {
        const data = result[dep][city];
        data.total = (data.activos || 0) + (data.finalizados || 0);
        data.porcentajeActivo =
          data.total > 0
            ? parseFloat(((data.activos / data.total) * 100).toFixed(2))
            : 0;
      }
    }

    // 2. Calcular rapidez media de fijación de demanda por ciudad
    await this.setRapidezMediaPorCiudad(
      recordsByCity,
      result,
      'FIJA_AUDIENCIA',
      'rapidezMediaFijacionDemanda',
    );
    // 3. Calcular rapidez media de celebra_AUDIENCIA por ciudad
    await this.setRapidezMediaPorCiudad(
      recordsByCity,
      result,
      'CELEBRA_AUDIENCIA',
      'rapidezMediaCelebraAudiencia',
    );
    return { records: result };
  }

  /**
   * Calcula la rapidez media (en días) desde la creación del caso hasta la actuación indicada por ciudad
   * @param recordsByCity ids de casos agrupados por departamento y ciudad
   * @param result objeto resultado donde se almacena la métrica
   * @param performanceType tipo de actuación ('FIJA_AUDIENCIA', 'CELEBRA_AUDIENCIA', etc)
   * @param resultKey clave donde guardar el resultado en el objeto result
   */
  private async setRapidezMediaPorCiudad(
    recordsByCity: { [dep: string]: { [city: string]: string[] } },
    result: { [dep: string]: any },
    performanceType: string,
    resultKey: string,
  ) {
    const performanceModel = this.connection.model('Performance');
    for (const dep of Object.keys(recordsByCity)) {
      for (const city of Object.keys(recordsByCity[dep])) {
        const recordIds = recordsByCity[dep][city];
        if (!recordIds.length) continue;
        // Buscar para estos casos las actuaciones del tipo indicado
        const actuaciones = await performanceModel
          .find({
            record: { $in: recordIds },
            performanceType,
          })
          .select('record createdAt')
          .lean();

        // Buscar los casos y sus fechas de creación
        const casos = await this.recordModel
          .find({ _id: { $in: recordIds } })
          .select('_id createdAt')
          .lean();
        const fechaCreacionMap: { [id: string]: Date } = {};
        for (const c of casos) fechaCreacionMap[c._id.toString()] = c.createdAt;

        // Para cada actuación, calcular la diferencia en días
        let sumaDias = 0;
        let cuenta = 0;
        for (const act of actuaciones) {
          const fechaCreacion = fechaCreacionMap[act.record.toString()];
          if (fechaCreacion && act.createdAt) {
            const diffMs =
              new Date(act.createdAt).getTime() -
              new Date(fechaCreacion).getTime();
            const diffDias = diffMs / (1000 * 60 * 60 * 24);
            sumaDias += diffDias;
            cuenta++;
          }
        }
        result[dep][city][resultKey] =
          cuenta > 0 ? parseFloat((sumaDias / cuenta).toFixed(2)) : null;
      }
    }
  }
  // -----------------------------------------------------
  async findByDate(user: IUser, date: Date): Promise<Record[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    const { roles } = user;
    if (
      roles.includes('Prescriptor') ||
      user.roles.includes('Servicio Farmacéutico')
    ) {
      try {
        const prescriptions = await this.recordModel
          .find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            user: user.id,
          })
          .select('-__v')
          .populate('user', 'nombre_apellidos email')
          .populate('controlador_de_calidad', 'nombre_apellidos email')
          .populate('preparador', 'nombre_apellidos email')
          .exec();
        return prescriptions;
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    }
    if (
      user.roles.includes('Administrador') ||
      user.roles.includes('Control de Calidad')
    ) {
      try {
        const prescriptions = await this.recordModel
          .find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            estado: {
              $nin: ['PENDIENTE FINALIZAR', 'FINALIZADA', 'CANCELADA'],
            },
          })
          .select('-__v')
          .populate('user', 'name lastname email phone')
          .populate('controlador_de_calidad', 'name lastname email')
          .populate('preparador', 'name lastname email')
          .exec();
        return prescriptions;
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    }
    if (roles.includes('Preparador NPT')) {
      try {
        const prescriptions = await this.recordModel
          .find({
            createdAt: { $gte: startOfDay, $lte: endOfDay },
            estado: 'PRODUCCION',
          })
          .select('-__v')
          .populate('user', 'name lastname email phone')
          .populate('controlador_de_calidad', 'name lastname email')
          .populate('preparador', 'name lastname email')
          .exec();
        return prescriptions;
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    }
  }

  // -----------------------------------------------------

  async update(
    user: IUser,
    no_orden: number,
    updatePrescriptionDto: UpdateRecordDto,
  ) {
    const prescription = await this.recordModel.findOne({
      user: user.id,
      no_orden: no_orden,
    });
    if (!prescription) {
      throw new NotFoundException(
        `Prescripción con el numero de orden  ${no_orden} no encontrado en la DB `,
      );
    }
    // if (prescription.estado === Estado.CALIDAD || prescription.estado === Estado.PRODUCCION || prescription.estado === Estado.RECIBIDA) {
    //   throw new ForbiddenException(`No puede actualizar la prescripcion. Ya su estado es ${prescription.estado}`)
    // }
    try {
      const { estado, ...rest } = updatePrescriptionDto;
      const dataToUpdate: Partial<Record> = {
        ...rest,
        // preparador: rest.preparador?.map(id => new mongoose.Schema.Types.ObjectId(id)) // Convert string[] to ObjectId[]
      };
      const presc = plainToClass(CreateRecordDto, updatePrescriptionDto);
      const errors = await validate(presc);
      // (errors.length > 0) ? dataToUpdate.estado = Estado.PENDIENTE : dataToUpdate.estado = Estado.FINALIZADA;

      const preparedUpdateDto = {
        ...updatePrescriptionDto,
        // preparador: updatePrescriptionDto.preparador?.map(id => new mongoose.Types.ObjectId(id)) // Convert string[] to ObjectId[]
      };
      // const cambios = await this.recordChanges(prescription, {
      //   ...preparedUpdateDto,
      //   // preparador: preparedUpdateDto.preparador?.map(id => id as any),
      // });
      await prescription.updateOne(dataToUpdate);
      // const prescriptionLog: CreateRecordLogDto = {
      //   user: user.id,
      //   opcion: `Actualizó`,
      //   record: no_orden,
      //   date: new Date(),
      //   cambios: ''

      // }
      // this.recordLogService.create(prescriptionLog)
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException(
        `No se puede actualizar la prescripción. error interno del servidor`,
      );
    }

    return `Prescripción con numero de orden ${no_orden} ha sido actualizada`;
  }

  // -----------------------------------------------------
  // async findMaxNo_orden(user: IUser) {
  async findMaxNo_orden() {
    // try {
    //   const data = await this.recordModel.
    //     find().
    //     sort({ 'no_orden': -1 }).
    //     select('no_orden').
    //     limit(1);
    //   return data[0].no_orden
    // } catch (error) {
    //   return '0';
    // }
    // return '0';
  }
  // -----------------------------------------------------
  async addComment(user: IUser, commentDto: AddCommentDto) {
    let update = '';
    const { prescriptionId, comentario, estado } = commentDto;
    const prescription = await this.recordModel.findById(prescriptionId);
    if (!prescription) {
      throw new NotFoundException('Prescripción no encontrada');
    }
    const { name, lastname, roles } = await this.userModel.findById(user.id);
    // if (comentario) {
    //   // const commentToInsert: Observaciones = {
    //   //   usuario: `${name} ${lastname}`,
    //   //   rol: roles,
    //   //   comentario: commentDto.comentario,
    //   //   fecha: new Date()
    //   // }
    //   // const { observaciones } = prescription;
    //   // if (!observaciones) {
    //   //   let observaciones: Observaciones[];
    //   // }
    //   // observaciones.push(commentToInsert)
    //   // await prescription.updateOne({ observaciones })
    //   // update += 'Se agregó un Comentario ';
    //   // const prescriptionLog: CreateRecordLogDto = {
    //   //   user: user.id,
    //   //   opcion: 'Comentó',
    //   //   record: prescription.no_orden,
    //   //   date: new Date(),
    //   //   cambios: [{
    //   //     campo: 'Observaciones',
    //   //     anteriorValor: '',
    //   //     nuevoValor: `${comentario}`,
    //   //   }]
    //   // }
    //   // this.recordLogService.create(prescriptionLog)
    // }
    if (estado) {
      // if ((estado === 'CANCELADA') && (prescription.estado === 'PENDIENTE FINALIZAR')) {
      //   try {
      //     await this.recordModel.findByIdAndDelete(prescriptionId);
      //     return 'El borrador ha sido eliminado'
      //   } catch (error) {
      //     throw new InternalServerErrorException('No se pudo eliminar la prescripción')
      //   }
      // }
      // if ((estado === 'CANCELADA') && (prescription.estado === 'PRODUCCION' || prescription.estado === 'CALIDAD' || prescription.estado === 'RECIBIDA')) {
      //   throw new ForbiddenException(`No puede cancelar la prescripción. Ya su estado es ${prescription.estado}`)
      // }
      // if (estado === 'SOLICITADA') {
      //   let datatoUpdate: any = {};
      //   // Busca el group_admin  del usuario logueado
      //   const { group_admin } = await this.userModel.findOne({ _id: user.id });
      //   // Busca si ya existe un user con rol, controlador de calidad en el mismo grupo del prescriptor
      //   const calidad = await this.userModel.findOne({ group_admin, roles: { $in: ['Control de Calidad'] } });
      //   // Si ya existe,asigna, controlador_de_calidad a la prescripcion
      //   if (calidad) {
      //     datatoUpdate.controlador_de_calidad = calidad.id
      //   }
      //   // Busca si ya existe un user con rol, preparador en el mismo grupo del prescriptor
      //   const preparador = await this.userModel.findOne({ group_admin, roles: { $in: ['Preparador NPT'] } });
      //   // Si ya existe,asigna, preparador a la prescripcion
      //   if (preparador) {
      //     datatoUpdate.preparador = [preparador.id];
      //   }
      //   datatoUpdate.estado = estado;
      //   await prescription.updateOne(datatoUpdate);
      // }
      // if (estado === 'PRODUCCION') {
      //   const colombiaTime = new Date().toLocaleString("en-US", { timeZone: "America/Bogota" });
      //   const colombiaDate = new Date(colombiaTime).toISOString().split('T')[0];

      //   await prescription.updateOne({
      //     'archivo_plano.state': State.SOLICITADO,
      //     'archivo_plano.createdAt': colombiaDate,
      //     fecha: new Date(colombiaTime),
      //     controlador_de_calidad: user.id
      //   });
      // }
      await prescription.updateOne({ estado });
      const state = `.Se cambió estado a ${estado}`;
      update += state;
      // const prescriptionLog: CreateRecordLogDto = {
      //   user: user.id,
      //   opcion: `Cambió estado a ' ${estado} ' `,
      //   record: prescription.no_orden,
      //   date: new Date(),
      //   cambios: []
      // }
      // this.recordLogService.create(prescriptionLog)
    }
    return `La prescripción ha sido actualizada: ${update} `;
  }
  // -----------------------------------------------------
  async getPrescriptionsByLab(user: IUser) {
    const { id } = user;
    const { roles } = await this.userModel.findById(id);

    if (roles.includes(ValidRoles.admin)) {
      return await this.recordModel
        .find({
          estado: {
            $nin: [
              'PENDIENTE FINALIZAR',
              'FINALIZADA',
              'CANCELADA',
              'RECHAZADA',
            ],
          },
        })
        .populate('user', 'name lastname email phone')
        .exec();
    }
    if (roles.includes(ValidRoles.legal_analist_1)) {
      return await this.recordModel
        .find({
          estado: { $in: ['SOLICITADA', 'CALIDAD', 'PRODUCCION', 'RECHAZADA'] },
        })
        .populate('user', 'name lastname email phone')
        .exec();
    }
    // if (roles.includes('Preparador NPT')) {
    //   return await this.recordModel.find({ estado: 'PRODUCCION' }).populate('user', 'name lastname email phone').exec()
    // }
  }
  // -----------------------------------------------------
  private getCurrentDate(): string {
    const now = new Date();
    return now.toISOString().split('T')[0]; // Returns the current date in 'YYYY-MM-DD' format
  }
  // -----------------------------------------------------
  private handleExceptions(error: any) {
    if (error.code === 11000) {
      throw new BadRequestException(error.toString());
    }
    console.log(error);
    throw new InternalServerErrorException(`Error interno del servidor`);
  }
  // -----------------------------------------------------
  async findById(id: string) {
    try {
      // Verificar que el ID sea válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de caso inválido');
      }

      // Buscar el record principal
      const record = await this.recordModel.findById(id).select('-__v').exec();

      if (!record) {
        throw new NotFoundException(`Caso con ID: ${id} no encontrado`);
      }

      // Obtener todas las relaciones asociadas al record
      const [documents, interveners, proceduralParts, payments, performances] =
        await Promise.all([
          this.documentService.findByRecord(id),
          this.intervenerService.findByRecord(id),
          this.proceduralPartService.findByRecord(id),
          this.paymentService.findByRecord(id),
          this.perfomanceService.findByRecord(id),
        ]);

      // Combinar toda la información similar al create
      const completeRecord = {
        ...record.toObject(),
        documents: documents || [],
        interveners: interveners || [],
        proceduralParts: proceduralParts || [],
        payments: payments || [],
        performances: performances || [],
      };

      return {
        message: 'Caso obtenido exitosamente',
        record: completeRecord,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno del servidor al buscar el caso',
      );
    }
  }

  // -----------------------------------------------------
  async getMaxEtiquetaByProcessType(processType: string) {
    try {
      // Buscar el record con la mayor etiqueta básica para el processType especificado
      // Solo etiquetas básicas como R430, R431, etc. (sin guiones)
      const record = await this.recordModel
        .findOne({
          clientType: processType,
          etiqueta: { $regex: `^[A-Z]\\d+$` }, // Solo etiquetas básicas sin guiones
        })
        .sort({ etiqueta: -1 })
        .select('etiqueta')
        .exec();

      if (!record) {
        return {
          message: `No se encontraron registros para el tipo de proceso: ${processType}`,
          maxEtiqueta: null,
          processType,
        };
      }

      return {
        message: `Mayor código interno encontrado para el tipo de proceso: ${processType}`,
        maxEtiqueta: record.etiqueta,
        processType,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Error interno del servidor al buscar el mayor código interno',
      );
    }
  }

  // -----------------------------------------------------
  async updateRecord(id: string, updateRecordDto: UpdateRecordDto) {
    try {
      // Verificar que el ID sea válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de caso inválido');
      }

      // Buscar el record y verificar que pertenezca al usuario
      const existingRecord = await this.recordModel.findOne({
        _id: id,
      });

      if (!existingRecord) {
        throw new NotFoundException(`Caso con ID: ${id} no encontrado`);
      }

      // // Verificar que el record no esté en un estado que no permita edición
      // const nonEditableStates = [Estado.FINALIZADA, Estado.CANCELADA];
      // if (nonEditableStates.includes(existingRecord.estado)) {
      //   throw new ForbiddenException(`No se puede actualizar el caso. Su estado actual es: ${existingRecord.estado}`);
      // }

      // Preparar datos para actualizar (solo campos básicos del record)
      const dataToUpdate: Partial<Record> = {};

      // Solo incluir campos que no sean null/undefined (etiqueta NO es editable)
      // if (updateRecordDto.clientType !== undefined) dataToUpdate.clientType = updateRecordDto.clientType;
      if (updateRecordDto.department !== undefined)
        dataToUpdate.department = updateRecordDto.department;
      if (updateRecordDto.personType !== undefined)
        dataToUpdate.personType = updateRecordDto.personType;
      if (updateRecordDto.jurisdiction !== undefined)
        dataToUpdate.jurisdiction = updateRecordDto.jurisdiction;
      if (updateRecordDto.location !== undefined)
        dataToUpdate.location = updateRecordDto.location;
      if (updateRecordDto.processType !== undefined)
        dataToUpdate.processType = updateRecordDto.processType;
      if (updateRecordDto.despachoJudicial !== undefined)
        dataToUpdate.despachoJudicial = updateRecordDto.despachoJudicial;
      if (updateRecordDto.radicado !== undefined)
        dataToUpdate.radicado = updateRecordDto.radicado;
      if (updateRecordDto.city !== undefined)
        dataToUpdate.city = updateRecordDto.city;
      if (updateRecordDto.country !== undefined)
        dataToUpdate.country = updateRecordDto.country;
      if (updateRecordDto.estado !== undefined)
        dataToUpdate.estado = updateRecordDto.estado;

      // Actualizar timestamp
      dataToUpdate.updatedAt = new Date();

      // Realizar la actualización
      const updatedRecord = await this.recordModel
        .findByIdAndUpdate(
          id,
          { $set: dataToUpdate },
          { new: true, runValidators: true },
        )
        .select('-__v');

      if (!updatedRecord) {
        throw new InternalServerErrorException('Error al actualizar el caso');
      }

      return {
        message: 'Caso actualizado exitosamente',
        record: updatedRecord,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno del servidor al actualizar el caso',
      );
    }
  }

  // -----------------------------------------------------
  async deleteRecord(user: IUser, id: string) {
    try {
      // Verificar que el ID sea válido
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new BadRequestException('ID de caso inválido');
      }

      // Buscar el record
      const existingRecord = await this.recordModel.findOne({ _id: id });

      if (!existingRecord) {
        throw new NotFoundException(`Caso con ID: ${id} no encontrado`);
      }

      // 1. Eliminar documentos relacionados (soft delete)
      const documentsToDelete = await this.documentService.findByRecord(id);
      for (const document of documentsToDelete) {
        await this.documentService.remove(document._id.toString());
      }

      // 2. Eliminar interveners relacionados (soft delete)
      const intervenersToDelete = await this.intervenerService.findByRecord(id);
      for (const intervener of intervenersToDelete) {
        await this.intervenerService.remove(intervener._id.toString());
      }

      // 3. Eliminar partes procesales si existen
      const proceduralPartsToDelete =
        await this.proceduralPartService.findByRecord(id);
      for (const proceduralPart of proceduralPartsToDelete) {
        await this.proceduralPartService.remove(proceduralPart._id.toString());
      }

      // 4. Eliminar payments relacionados (soft delete)
      const paymentsToDelete = await this.paymentService.findByRecord(id);
      for (const payment of paymentsToDelete) {
        await this.paymentService.remove(payment._id.toString());
      }

      // 5. Finalmente eliminar el record principal (soft delete)
      await this.recordModel.findByIdAndUpdate(id, {
        deletedAt: new Date(),
        updatedAt: new Date(),
      });

      return {
        message: 'Caso eliminado exitosamente',
        deletedElements: {
          record: true,
          documents: documentsToDelete.length,
          interveners: intervenersToDelete.length,
          proceduralParts: proceduralPartsToDelete.length,
          payments: paymentsToDelete.length,
        },
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error interno del servidor al eliminar el caso',
      );
    }
  }
  // ============== STATISTICS METHODS ==============

  /**
   * Get active vs inactive processes statistics by month for a specific year
   * @param year Year to query (default: current year)
   * @param type Optional type to filter by (ACTIVO or FINALIZADO). If not provided, returns both types
   * @returns Statistics of active vs inactive processes by month
   */
  async getActiveInactiveProcessesByMonth(
    year: number,
    type?: string,
  ): Promise<any> {
    // Start and end dates for the specified year
    const startOfYear = new Date(year, 0, 1); // January 1st
    const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // Month names in English
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Build match criteria
    const matchCriteria: any = {
      createdAt: {
        $gte: startOfYear,
        $lte: endOfYear,
      },
      deletedAt: { $exists: false }, // Exclude soft deleted records
    };

    // Add type filter if provided
    if (type) {
      matchCriteria.type = type;
    }

    // Aggregation to get active and inactive processes by month
    const statistics = await this.recordModel.aggregate([
      {
        $match: matchCriteria,
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
            type: '$type',
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Calculate totals
    const totalActive = statistics
      .filter((item) => item._id.type === 'ACTIVO')
      .reduce((total, item) => total + item.count, 0);

    const totalInactive = statistics
      .filter((item) => item._id.type === 'FINALIZADO')
      .reduce((total, item) => total + item.count, 0);

    const totalProcesses = totalActive + totalInactive;

    // Create array with all months of the year (even if no data exists)
    const monthlyMetrics = [];
    for (let month = 1; month <= 12; month++) {
      const activeData = statistics.find(
        (item) => item._id.month === month && item._id.type === 'ACTIVO',
      );
      const inactiveData = statistics.find(
        (item) => item._id.month === month && item._id.type === 'FINALIZADO',
      );

      const activeCount = activeData ? activeData.count : 0;
      const inactiveCount = inactiveData ? inactiveData.count : 0;
      const monthTotal = activeCount + inactiveCount;

      monthlyMetrics.push({
        month,
        monthName: monthNames[month - 1],
        activeProcesses: activeCount,
        inactiveProcesses: inactiveCount,
        totalProcesses: monthTotal,
      });
    }

    return {
      year,
      activeProcesses: totalActive,
      inactiveProcesses: totalInactive,
      totalProcesses,
      monthlyMetrics,
      filterType: type || 'ALL', // Indicate what filter was applied
      summary: {
        mostActiveMonth: monthlyMetrics.reduce((max, month) =>
          month.totalProcesses > max.totalProcesses ? month : max,
        ),
        // averagePerMonth: Math.round(totalProcesses / 12 * 100) / 100,
        // monthsWithoutActivity: monthlyMetrics.filter(month => month.totalProcesses === 0).length
      },
    };
  }

  /**
   * Get filed lawsuits and scheduled hearings statistics grouped by month for a specific year
   * @param year Year to query (default: current year)
   * @returns Statistics of filed lawsuits and scheduled hearings by month
   */
  async getFiledLawsuitsAndScheduledHearingsByMonth(
    year: number,
  ): Promise<any> {
    // Start and end dates for the specified year
    const startOfYear = new Date(year, 0, 1); // January 1st
    const endOfYear = new Date(year, 11, 31, 23, 59, 59); // December 31st

    // Month names in English
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];

    // Aggregation to get filed lawsuits by month (RADICADO state)
    const filedLawsuitsStats = await this.recordModel.aggregate([
      {
        $match: {
          estado: 'RADICADO',
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
          deletedAt: { $exists: false }, // Exclude soft deleted records
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          filedCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Aggregation to get scheduled hearings by month (FIJA_AUDIENCIA state)
    const scheduledHearingsStats = await this.recordModel.aggregate([
      {
        $match: {
          estado: 'FIJA_AUDIENCIA',
          createdAt: {
            $gte: startOfYear,
            $lte: endOfYear,
          },
          deletedAt: { $exists: false }, // Exclude soft deleted records
        },
      },
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' },
          },
          hearingsCount: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.month': 1 },
      },
    ]);

    // Calculate totals
    const totalFiledLawsuits = filedLawsuitsStats.reduce(
      (total, item) => total + item.filedCount,
      0,
    );
    const totalScheduledHearings = scheduledHearingsStats.reduce(
      (total, item) => total + item.hearingsCount,
      0,
    );

    // Create arrays with all months of the year (even if no data exists)
    const filedLawsuitsMetric = [];
    const scheduledHearingsMetric = [];

    for (let month = 1; month <= 12; month++) {
      // Filed lawsuits data
      const filedData = filedLawsuitsStats.find(
        (item) => item._id.month === month,
      );
      const filedCount = filedData ? filedData.filedCount : 0;

      filedLawsuitsMetric.push({
        month,
        monthName: monthNames[month - 1],
        count: filedCount,
      });

      // Scheduled hearings data
      const hearingsData = scheduledHearingsStats.find(
        (item) => item._id.month === month,
      );
      const hearingsCount = hearingsData ? hearingsData.hearingsCount : 0;

      scheduledHearingsMetric.push({
        month,
        monthName: monthNames[month - 1],
        count: hearingsCount,
      });
    }

    return {
      year,
      filedLawsuits: {
        total: totalFiledLawsuits,
        metric: filedLawsuitsMetric,
      },
      scheduledHearings: {
        total: totalScheduledHearings,
        metric: scheduledHearingsMetric,
      },
      summary: {
        totalLawsuits: totalFiledLawsuits,
        totalHearings: totalScheduledHearings,
      },
    };
  }

  /**
   * Retrieves statistics of processes grouped by their state for a specified type.
   *
   * This method aggregates records from the database, excluding those that are soft deleted,
   * and groups them by the `estado` field. It returns the count and percentage of processes
   * in each state, sorted in descending order by count.
   *
   * @param type - The type of process to filter records by.
   * @returns A promise that resolves to an object containing:
   *   - `type`: The specified process type.
   *   - `total`: The total number of processes for the given type.
   *   - `statistics`: An array of objects, each representing a state with its count and percentage.
   * @throws {Error} If there is an issue retrieving the statistics.
   */
  async getProcessStatisticsByState(type: string): Promise<any> {
    try {
      // Get current statistics grouped by state for the specified type
      const statistics = await this.recordModel.aggregate([
        {
          $match: {
            type: type,
            deletedAt: { $exists: false }, // Exclude soft deleted records
          },
        },
        {
          $group: {
            _id: '$estado',
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 }, // Sort by count in descending order
        },
      ]);

      // Calculate total processes for this type
      const totalProcesses = statistics.reduce(
        (total, item) => total + item.count,
        0,
      );

      // Format the response with percentages
      const processStatistics = statistics.map((item) => ({
        estado: item._id,
        count: item.count,
        percentage:
          totalProcesses > 0
            ? parseFloat(((item.count / totalProcesses) * 100).toFixed(2))
            : 0,
      }));

      return {
        type: type,
        total: totalProcesses,
        statistics: processStatistics,
      };
    } catch (error) {
      throw new Error(
        `Error getting process statistics by state: ${error.message}`,
      );
    }
  }

  async getProcessStatisticsByStateAndYear(
    type: string,
    year?: number,
  ): Promise<any> {
    try {
      const targetYear = year || new Date().getFullYear();

      // Create date range for the specified year
      const startDate = new Date(targetYear, 0, 1); // January 1st
      const endDate = new Date(targetYear + 1, 0, 1); // January 1st of next year

      // Get statistics grouped by state and month for the specified type and year
      const statistics = await this.recordModel.aggregate([
        {
          $match: {
            type: type,
            createdAt: {
              $gte: startDate,
              $lt: endDate,
            },
            deletedAt: { $exists: false }, // Exclude soft deleted records
          },
        },
        {
          $group: {
            _id: {
              estado: '$estado',
              month: { $month: '$createdAt' },
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: '$_id.estado',
            months: {
              $push: {
                month: '$_id.month',
                count: '$count',
              },
            },
            totalByState: { $sum: '$count' },
          },
        },
        {
          $sort: { totalByState: -1 }, // Sort by total count per state in descending order
        },
      ]);

      // Calculate total processes for this type and year
      const totalProcesses = statistics.reduce(
        (total, item) => total + item.totalByState,
        0,
      );

      // Create months array (1-12) for each state
      const monthNames = [
        'Enero',
        'Febrero',
        'Marzo',
        'Abril',
        'Mayo',
        'Junio',
        'Julio',
        'Agosto',
        'Septiembre',
        'Octubre',
        'Noviembre',
        'Diciembre',
      ];

      // Format the response with monthly data for each state
      const processStatistics = statistics.map((item) => {
        // Create array with all 12 months initialized to 0
        const monthlyData = Array.from({ length: 12 }, (_, index) => {
          const monthNumber = index + 1;
          const monthData = item.months.find((m) => m.month === monthNumber);
          return {
            month: monthNumber,
            monthName: monthNames[index],
            count: monthData ? monthData.count : 0,
          };
        });

        return {
          estado: item._id,
          totalByState: item.totalByState,
          percentage:
            totalProcesses > 0
              ? parseFloat(
                  ((item.totalByState / totalProcesses) * 100).toFixed(2),
                )
              : 0,
          monthlyData: monthlyData,
        };
      });

      return {
        type: type,
        year: targetYear,
        total: totalProcesses,
        statistics: processStatistics,
      };
    } catch (error) {
      throw new Error(
        `Error getting process statistics by state and year: ${error.message}`,
      );
    }
  }
  // -----------------------------------------------------
  async getCasesCountAndPercentageByDepartment(): Promise<any> {
    const records = await this.recordModel
      .find({ deletedAt: { $exists: false } })
      .select('department city')
      .lean();
    const totalCasos = records.length;
    const depMap: {
      [dep: string]: { total: number; ciudades: { [city: string]: number } };
    } = {};
    for (const rec of records) {
      const dep = rec.department || 'SIN_DEPARTAMENTO';
      const city = rec.city || 'SIN_CIUDAD';
      if (!depMap[dep]) depMap[dep] = { total: 0, ciudades: {} };
      depMap[dep].total++;
      if (!depMap[dep].ciudades[city]) depMap[dep].ciudades[city] = 0;
      depMap[dep].ciudades[city]++;
    }
    const result = Object.entries(depMap).map(([department, data]) => {
      const porcentajeDepartamento =
        totalCasos > 0
          ? parseFloat(((data.total / totalCasos) * 100).toFixed(2))
          : 0;
      return {
        department,
        total: data.total,
        porcentaje: porcentajeDepartamento,
        ciudades: data.ciudades,
      };
    });

    return {
      total: totalCasos,
      departamentos: result,
    };
  }
  // -----------------------------------------------------
  async getActiveProcessCountByOffice(): Promise<any> {
    // type: 'ACTIVO' indica proceso activo
    const aggregation = await this.recordModel.aggregate([
      {
        $match: {
          type: 'ACTIVO',
          deletedAt: { $exists: false },
        },
      },
      {
        $group: {
          _id: {
            despachoJudicial: '$despachoJudicial',
            city: '$city',
            department: '$department',
          },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          despachoJudicial: '$_id.despachoJudicial',
          city: '$_id.city',
          department: '$_id.department',
          count: 1,
        },
      },
      { $sort: { department: 1, city: 1, despachoJudicial: 1 } },
    ]);
    // Mapear para asegurar que si falta department o city se devuelva null
    const result = aggregation.map((item) => ({
      despachoJudicial: item.despachoJudicial,
      city: item.city ?? null,
      department: item.department ?? null,
      count: item.count,
    }));
    return { records: result };
  }
  // -----------------------------------------------------
  async getFiledLawsuitsByUserByYear(dto: GetStatisticsDto) {
    // Espera que dto tenga: { year: number }
    const { year } = dto;
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59);

    // Criterios de búsqueda (sin filtrar por usuario)
    const match: any = {
      estado: 'RADICADO',
      createdAt: { $gte: startOfYear, $lte: endOfYear },
      deletedAt: { $exists: false },
    };

    // Agrupación por usuario, año y mes
    const aggregation = await this.recordModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            user: '$user',
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.user': 1, '_id.year': 1, '_id.month': 1 } },
    ]);

    // Poblar info de usuario
    const records = await Promise.all(
      aggregation.map(async (item) => {
        let userInfo = null;
        try {
          userInfo = await this.userModel
            .findById(item._id.user)
            .select('name lastname email')
            .lean();
        } catch {}
        return {
          user: item._id.user,
          userInfo,
          year: item._id.year,
          month: item._id.month,
          count: item.count,
        };
      }),
    );

    return { year, records };
  }
  // -----------------------------------------------------
  /**
   * Obtiene el seguimiento de estados actuales para los procesos radicados en un mes y año específicos
   * @param month Nombre del mes en inglés (ej: 'January')
   * @param year Año numérico (ej: 2025)
   * @returns Estadísticas de estados actuales y porcentaje respecto al total de radicados
   */
  async getProcessTracking(month: string, year?: number): Promise<any> {
    // Convertir mes a número (1-12)
    const monthNames = [
      'January',
      'February',
      'March',
      'April',
      'May',
      'June',
      'July',
      'August',
      'September',
      'October',
      'November',
      'December',
    ];
    const monthIndex = monthNames.findIndex(
      (m) => m.toLowerCase() === month.toLowerCase(),
    );
    if (monthIndex === -1) {
      throw new BadRequestException('Mes inválido. Debe estar en inglés.');
    }
    const monthNumber = monthIndex + 1;
    const targetYear = year || new Date().getFullYear();
    // Buscar procesos radicados en ese mes y año
    const startDate = new Date(targetYear, monthNumber - 1, 1);
    const endDate = new Date(targetYear, monthNumber, 0, 23, 59, 59, 999);
    // Buscar solo los procesos con estado 'RADICADO' creados en ese mes/año
    const radicados = await this.recordModel
      .find({
        estado: 'RADICADO',
        createdAt: { $gte: startDate, $lte: endDate },
        deletedAt: { $exists: false },
      })
      .select('_id')
      .lean();
    const recordIds = radicados.map((r) => r._id.toString());
    if (recordIds.length === 0) {
      return {
        month: month,
        year: targetYear,
        totalRadicados: 0,
        states: [],
        message: 'No hay procesos radicados en ese mes y año.',
      };
    }
    // Buscar el estado actual de cada proceso radicado
    const records = await this.recordModel
      .find({ _id: { $in: recordIds } })
      .select('estado type')
      .lean();
    // Contabilizar estados actuales
    const stateCount: { [estado: string]: number } = {};
    let activeCount = 0;
    let finalizedCount = 0;
    for (const rec of records) {
      const estado = rec.estado || 'SIN_ESTADO';
      stateCount[estado] = (stateCount[estado] || 0) + 1;
      if (rec.type === 'ACTIVO') activeCount++;
      if (rec.type === 'FINALIZADO') finalizedCount++;
    }
    // Calcular porcentaje por estado
    const total = recordIds.length;
    const states = Object.entries(stateCount).map(([estado, count]) => ({
      estado,
      count,
      percentage: parseFloat(((count / total) * 100).toFixed(2)),
    }));
    // Calcular porcentaje de ACTIVO y FINALIZADO
    const activePercentage =
      total > 0 ? parseFloat(((activeCount / total) * 100).toFixed(2)) : 0;
    const finalizedPercentage =
      total > 0 ? parseFloat(((finalizedCount / total) * 100).toFixed(2)) : 0;
    return {
      month: month,
      year: targetYear,
      filedLawsuits: total,
      states,
      active: { count: activeCount, percentage: activePercentage },
      finalized: { count: finalizedCount, percentage: finalizedPercentage },
      message:
        'Estados actuales de los procesos radicados en el mes y año indicados.',
    };
  }
  // -----------------------------------------------------
  async getRecordsByClientDocument(body: ByClientDto): Promise<any> {
    try {
      // Llamar al método del ProceduralPartService
      return await this.proceduralPartService.getRecordsByClient(body);
    } catch (error) {
      console.error('Error en getRecordsByClientDocument:', error);
      throw new BadRequestException(
        'Error al obtener los casos por número de documento del cliente',
      );
    }
  }
  // -----------------------------------------------------
  async getRecordDetailsByEtiqueta(EtiquetaDto: ByEtiquetaDto) {
    try {
      const { etiqueta } = EtiquetaDto;
      // Buscar el record por etiqueta
      const record = await this.recordModel
        .findOne({
          etiqueta: etiqueta,
          deletedAt: { $exists: false },
        })
        .select(
          'internalCode processType jurisdiction settled office clientType etiqueta radicado despachoJudicial city department ultimaActuacion fechaUltimaActuacion location country',
        );

      if (!record) {
        throw new NotFoundException(
          `No se encontró el caso con código interno: ${etiqueta}`,
        );
      }

      const recordId = record._id.toString();

      // Obtener todas las partes procesales para este record
      const allPartsForRecord = await this.proceduralPartService.findByRecord(
        recordId,
      );

      // Separar demandantes y demandados
      const plaintiffs = allPartsForRecord
        .filter((part) => part.partType === 'demandante')
        .map((part) => ({
          name: part.name,
          email: part.email,
          contact: part.contact,
        }));

      const defendants = allPartsForRecord
        .filter((part) => part.partType === 'demandada')
        .map((part) => ({
          name: part.name,
        }));

      // Obtener el historial de performance
      const performances = await this.perfomanceService.findByRecord(recordId);

      return {
        message: 'Caso obtenido exitosamente',
        record: {
          ...record.toObject(),
          proceduralParts: {
            plaintiffs,
            defendants,
          },
          performances,
        },
      };
    } catch (error) {
      console.error(
        'Error al obtener los detalles del caso por código interno:',
        error,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Error al obtener los detalles del caso por código interno',
      );
    }
  }

  // -----------------------------------------------------
  async getDetailedRecordsByClient(body: ByClientDto) {
    try {
      const { document } = body;

      // 1. Primero obtenemos todos los casos básicos del cliente usando el servicio existente
      const basicRecordsResult =
        await this.proceduralPartService.getRecordsByClient(body);

      if (!basicRecordsResult.active && !basicRecordsResult.finalized) {
        return {
          message: 'No se encontraron casos para el documento proporcionado',
          activeRecords: [],
          finalizedRecords: [],
          totalActive: 0,
          totalFinalized: 0,
        };
      }

      // 2. Obtener detalles completos para casos activos
      const activeRecordsWithDetails = [];
      if (basicRecordsResult.active && basicRecordsResult.active.length > 0) {
        for (const activeRecord of basicRecordsResult.active) {
          try {
            const detailsResult = await this.getRecordDetailsByEtiqueta({
              etiqueta: activeRecord.etiqueta,
            });
            activeRecordsWithDetails.push({
              ...detailsResult.record,
              state: activeRecord.state,
              updatedAt: activeRecord.updatedAt,
            });
          } catch (error) {
            console.warn(
              `Error obteniendo detalles del caso activo ${activeRecord.etiqueta}:`,
              error.message,
            );
            // Si no se pueden obtener los detalles, incluir solo la información básica
            activeRecordsWithDetails.push({
              etiqueta: activeRecord.etiqueta,
              state: activeRecord.state,
              updatedAt: activeRecord.updatedAt,
              error: 'No se pudieron obtener los detalles completos',
            });
          }
        }
      }

      // 3. Obtener detalles completos para casos finalizados
      const finalizedRecordsWithDetails = [];
      if (
        basicRecordsResult.finalized &&
        basicRecordsResult.finalized.length > 0
      ) {
        for (const finalizedRecord of basicRecordsResult.finalized) {
          try {
            const detailsResult = await this.getRecordDetailsByEtiqueta({
              etiqueta: finalizedRecord.etiqueta,
            });
            finalizedRecordsWithDetails.push({
              ...detailsResult.record,
              state: finalizedRecord.state,
              updatedAt: finalizedRecord.updatedAt,
            });
          } catch (error) {
            console.warn(
              `Error obteniendo detalles del caso finalizado ${finalizedRecord.etiqueta}:`,
              error.message,
            );
            // Si no se pueden obtener los detalles, incluir solo la información básica
            finalizedRecordsWithDetails.push({
              etiqueta: finalizedRecord.etiqueta,
              state: finalizedRecord.state,
              updatedAt: finalizedRecord.updatedAt,
              error: 'No se pudieron obtener los detalles completos',
            });
          }
        }
      }

      return {
        message: 'Casos con detalles obtenidos exitosamente',
        activeRecords: activeRecordsWithDetails,
        finalizedRecords: finalizedRecordsWithDetails,
        totalActive: activeRecordsWithDetails.length,
        totalFinalized: finalizedRecordsWithDetails.length,
        totalRecords:
          activeRecordsWithDetails.length + finalizedRecordsWithDetails.length,
      };
    } catch (error) {
      console.error(
        'Error al obtener los casos detallados por número de documento del cliente:',
        error,
      );
      throw new BadRequestException(
        'Error al obtener los casos detallados por número de documento del cliente',
      );
    }
  }
  // -----------------------------------------------------
  async getEtiquetaCodeById(body: getEtiquetaByIdDto) {
    try {
      const { id } = body;

      const record = await this.recordModel
        .findOne({
          _id: id,
          deletedAt: { $exists: false },
        })
        .select('etiqueta')
        .lean();

      if (!record) {
        throw new NotFoundException(`No se encontró el caso con id: ${id}`);
      }
      return {
        etiqueta: record.etiqueta,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Error al obtener la etiqueta por id');
    }
  }

  async exists(id: string): Promise<boolean> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return false;
    }

    const count = await this.recordModel.countDocuments({ _id: id }).exec();
    return count > 0;
  }
}
