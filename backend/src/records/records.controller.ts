import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  BadRequestException,
  forwardRef,
  Inject,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RecordsService } from './records.service';
import { UpdateRecordDto } from './dto/update-record.dto';
import { MonolegalApiService } from '../monolegal/services/monolegal-api.service';
import { CreateCompleteRecordWithFilesDto } from './dto/create-complete-record-with-files.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { Auth, GetUser, ApiKeyAuth } from 'src/auth/decorators';
import { IUser } from './interfaces/user.interface';
import { PaginationDto } from 'src/common/dto/paginaton.dto';
import { GetMaxInternalCodeDto } from './dto/get-max-internal-code.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetStatisticsDto } from './dto/get-statistics.dto';
import { ApiProperty } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';

export class GetProcessTrackingDto {
  @ApiProperty({
    example: 'January',
    description: 'Mes en inglés (ej: January, February, ...)',
  })
  month: string;
  @ApiProperty({ example: 2025, required: false })
  year?: number;
}
import { GetProcessStatisticsDto } from './dto/get-process-statistics.dto';
import { plainToClass } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateDocumentDto } from '../document/dto/create-document.dto';
import { CreateIntervenerForRecordDto } from '../intervener/dto/create-intervener-for-record.dto';
import { CreateProceduralPartForRecordDto } from '../procedural-part/dto/create-procedural-part-for-record.dto';
import { CreatePaymentForRecordDto } from '../payment/dto/create-payment-for-record.dto';
import { DocumentService } from 'src/document/document.service';
import { ByClientDto } from './dto/by-client-document.dto';
import { ProceduralPartService } from 'src/procedural-part/procedural-part.service';
import { ByEtiquetaDto } from './dto/by-internal-code.dto';
import { FileService } from 'src/common/services/file.service';

@ApiTags('Casos')
@Controller('records')
export class RecordsController {
  constructor(
    private readonly recordsService: RecordsService,
    private readonly documentService: DocumentService,
    private readonly proceduralPartService: ProceduralPartService,
    @Inject(forwardRef(() => MonolegalApiService))
    private readonly monolegalApiService: MonolegalApiService,
  ) {}

  private async validateAndTransform<T>(
    data: any,
    DtoClass: new () => T,
    fieldName: string,
  ): Promise<T[]> {
    if (!data) return [];

    const dataArray = Array.isArray(data) ? data : [data];
    if (dataArray.length === 0) return [];

    const dtoInstances = dataArray.map((item) => plainToClass(DtoClass, item));

    for (const [index, dto] of dtoInstances.entries()) {
      const errors = await validate(dto as any);
      if (errors.length > 0) {
        const errorMessages = errors
          .map((error) => Object.values(error.constraints || {}).join(', '))
          .join('; ');
        throw new BadRequestException(
          `Error en ${fieldName}[${index}]: ${errorMessages}`,
        );
      }
    }

    return dtoInstances as T[];
  }

  @ApiOperation({ summary: 'Crear caso completo con archivos adjuntos' })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 201,
    description:
      'Caso creado exitosamente con todos sus elementos relacionados',
    example: {
      message: 'Caso creado exitosamente',
      record: {
        _id: '67a1234567890abcdef12345',
        internalCode: 'INT-2025-001',
        clientType: 'Persona Natural',
        department: 'Bogotá D.C.',
        personType: 'Natural',
        jurisdiction: 'Civil',
        location: 'Bogotá D.C.',
        processType: 'Ordinario',
        office: 'Juzgado 1ro Civil',
        settled: 'Juzgado',
        country: 'Colombia',
        estado: 'PENDIENTE FINALIZAR',
        user: '67a1234567890abcdef11111',
        createdAt: '2025-07-29T10:00:00.000Z',
        updatedAt: '2025-07-29T10:00:00.000Z',
        documents: [
          {
            _id: '67a1234567890abcdef22222',
            category: 'Demanda',
            documentType: 'Escrito',
            document: 'Demanda',
            subdocument: 'Petición Principal',
            settledDate: '2025-01-15T10:30:00.000Z',
            consecutive: 'DOC-2025-001',
            responsibleType: 'Abogado',
            responsible: 'Juan Pérez',
            url: 'https://storage.googleapis.com/bucket/documents/file-123.pdf',
            record: '67a1234567890abcdef12345',
            createdAt: '2025-07-29T10:00:00.000Z',
          },
        ],
        interveners: [
          {
            _id: '67a1234567890abcdef33333',
            intervenerType: 'Demandante',
            name: 'María González',
            documentType: 'Cédula',
            document: '12345678',
            email: 'maria@email.com',
            contact: '3001234567',
            record: '67a1234567890abcdef12345',
            createdAt: '2025-07-29T10:00:00.000Z',
          },
        ],
        proceduralParts: [
          {
            _id: '67a1234567890abcdef44444',
            partType: 'Demandado',
            name: 'Carlos Rodríguez',
            documentType: 'Cédula',
            document: '11223344',
            email: 'carlos@email.com',
            contact: '3009876543',
            record: '67a1234567890abcdef12345',
            createdAt: '2025-07-29T10:00:00.000Z',
          },
        ],
        payments: [
          {
            _id: '67a1234567890abcdef55555',
            paymentType: 'Honorarios',
            amount: 500000,
            description: 'Honorarios profesionales',
            record: '67a1234567890abcdef12345',
            createdAt: '2025-07-29T10:00:00.000Z',
            paymentValues: [
              {
                _id: '67a1234567890abcdef66666',
                valueType: 'Base',
                amount: 500000,
                payment: '67a1234567890abcdef55555',
              },
            ],
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación en los datos enviados',
    example: {
      statusCode: 400,
      message:
        'Error en documents[0]: category must not be empty, documentType must not be empty',
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('create')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description:
      'Crear caso completo con archivos adjuntos. IMPORTANTE: documents contiene la metadata del archivo, files contiene el archivo físico.',
    type: CreateCompleteRecordWithFilesDto,
    schema: {
      type: 'object',
      properties: {
        clientType: {
          type: 'string',
          enum: ['Rappi', 'Uber', 'Didi', 'Otro'],
          example: 'Rappi',
          description: 'REQUERIDO: Tipo de cliente',
        },

        internalCode: { type: 'string', example: 'INT-2025-001' },
        department: { type: 'string', example: 'Bogotá D.C.' },
        personType: { type: 'string', example: 'Natural' },
        jurisdiction: { type: 'string', example: 'Civil' },
        location: { type: 'string', example: 'Bogotá D.C.' },
        processType: { type: 'string', example: 'Ordinario' },
        office: { type: 'string', example: 'Juzgado 1ro Civil' },
        settled: { type: 'string', example: 'Juzgado' },
        country: { type: 'string', example: 'Colombia' },
        documents: {
          type: 'string',
          description:
            'REQUERIDO: Array de documentos en formato JSON string (validado con CreateDocumentDto)',
          example:
            '[{"category":"Demanda","documentType":"Escrito","document":"Demanda","subdocument":"Petición Principal","settledDate":"2025-01-15T10:30:00.000Z","consecutive":"DOC-2025-001","responsibleType":"Abogado","responsible":"Juan Pérez"}]',
        },
        interveners: {
          type: 'string',
          description:
            'Array de intervinientes en formato JSON string (validado con CreateIntervenerForRecordDto)',
          example:
            '[{"intervenerType":"Demandante","name":"María González","documentType":"Cédula","document":"12345678","email":"maria@email.com","contact":"3001234567"}]',
        },
        proceduralParts: {
          type: 'string',
          description:
            'Array de partes procesales en formato JSON string (validado con CreateProceduralPartForRecordDto)',
          example:
            '[{"partType":"Demandado","name":"Carlos Rodríguez","documentType":"Cédula","document":"11223344","email":"carlos@email.com","contact":"3009876543"}]',
        },
        payments: {
          type: 'string',
          description:
            'Array de pagos en formato JSON string (validado con CreatePaymentForRecordDto)',
          example:
            '[{"paymentType":"Honorarios","amount":500000,"description":"Honorarios profesionales"}]',
        },
        filesMetadata: {
          type: 'string',
          example: '{"category":"Demanda","documentType":"Escrito"}',
        },
        files: {
          type: 'array',
          description:
            'REQUERIDO: Archivo físico del documento (corresponde a la metadata en documents)',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(FilesInterceptor('files', 10, FileService.multerConfig))
  async createCompleteWithFiles(
    @GetUser() user: IUser,
    @Body() body: any,
    @UploadedFiles() files: any[],
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException(
        'Se requiere subir al menos un archivo físico',
      );
    }
    try {
      const documentsData = body.documents ? JSON.parse(body.documents) : [];
      const validatedDocuments =
        await this.validateAndTransform<CreateDocumentDto>(
          documentsData,
          CreateDocumentDto,
          'documents',
        );

      const intervenersData = body.interveners
        ? JSON.parse(body.interveners)
        : [];
      const validatedInterveners =
        await this.validateAndTransform<CreateIntervenerForRecordDto>(
          intervenersData,
          CreateIntervenerForRecordDto,
          'interveners',
        );

      const proceduralPartsData = body.proceduralParts
        ? JSON.parse(body.proceduralParts)
        : [];
      const validatedProceduralParts =
        await this.validateAndTransform<CreateProceduralPartForRecordDto>(
          proceduralPartsData,
          CreateProceduralPartForRecordDto,
          'proceduralParts',
        );

      const paymentsData = body.payments ? JSON.parse(body.payments) : [];
      const validatedPayments =
        await this.validateAndTransform<CreatePaymentForRecordDto>(
          paymentsData,
          CreatePaymentForRecordDto,
          'payments',
        );

      const createCompleteRecordDto: CreateCompleteRecordWithFilesDto = {
        ...body,
        documents: validatedDocuments,
        interveners: validatedInterveners,
        proceduralParts: validatedProceduralParts,
        payments: validatedPayments,
        filesMetadata: body.filesMetadata,
        files: files,
      };
      return this.recordsService.createCompleteRecordWithFiles(
        user,
        createCompleteRecordDto,
        files,
      );
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestException(
          'Error al parsear JSON. Verifique el formato de los datos enviados.',
        );
      }
      throw error;
    }
  }

  @ApiOperation({ summary: 'Buscar todos los expedientes del usuario' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Lista de expedientes con toda la información completa',
    example: {
      records: [
        {
          _id: '67a1234567890abcdef12345',
          internalCode: 'INT-2025-001',
          clientType: 'Persona Natural',
          department: 'Bogotá D.C.',
          personType: 'Natural',
          jurisdiction: 'Civil',
          processType: 'Ordinario',
          office: 'Juzgado 1ro Civil',
          settled: 'Juzgado',
          country: 'Colombia',
          estado: 'PENDIENTE FINALIZAR',
          user: {
            _id: '67a1234567890abcdef11111',
            name: 'Juan',
            lastname: 'Pérez',
            email: 'juan@email.com',
            phone: '3001234567',
          },
          createdAt: '2025-07-29T10:00:00.000Z',
          updatedAt: '2025-07-29T10:00:00.000Z',
          documents: [
            {
              _id: '67a1234567890abcdef22222',
              category: 'Demanda',
              documentType: 'Escrito',
              document: 'Demanda',
              subdocument: 'Petición Principal',
              settledDate: '2025-01-15T10:30:00.000Z',
              consecutive: 'DOC-2025-001',
              responsibleType: 'Abogado',
              responsible: 'Juan Pérez',
              url: 'https://storage.googleapis.com/bucket/documents/file-123.pdf',
              record: '67a1234567890abcdef12345',
              createdAt: '2025-07-29T10:00:00.000Z',
            },
          ],
          interveners: [
            {
              _id: '67a1234567890abcdef33333',
              intervenerType: 'Demandante',
              name: 'María González',
              documentType: 'Cédula',
              document: '12345678',
              email: 'maria@email.com',
              contact: '3001234567',
              record: '67a1234567890abcdef12345',
              createdAt: '2025-07-29T10:00:00.000Z',
            },
          ],
          proceduralParts: [
            {
              _id: '67a1234567890abcdef44444',
              partType: 'Demandado',
              name: 'Carlos Rodríguez',
              documentType: 'Cédula',
              document: '11223344',
              email: 'carlos@email.com',
              contact: '3009876543',
              record: '67a1234567890abcdef12345',
              createdAt: '2025-07-29T10:00:00.000Z',
            },
          ],
          payments: [
            {
              _id: '67a1234567890abcdef55555',
              paymentType: 'Honorarios',
              amount: 500000,
              description: 'Honorarios profesionales',
              record: '67a1234567890abcdef12345',
              createdAt: '2025-07-29T10:00:00.000Z',
              paymentValues: [
                {
                  _id: '67a1234567890abcdef66666',
                  valueType: 'Base',
                  amount: 500000,
                  payment: '67a1234567890abcdef55555',
                },
              ],
            },
          ],
        },
      ],
      count: 1,
      message: 'Expedientes obtenidos exitosamente',
    },
  })
  @Post('all')
  @ApiOperation({
    summary:
      'Buscar todos los expedientes del usuario logueado con todas sus relaciones',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    example: {
      message: 'Expedientes obtenidos exitosamente',
      records: [
        {
          _id: '689cdb5fa12ad3026a86b2bf',
          user: '6887adcb73202e78bdf451b8',
          clientType: 'Uber',
          internalCode: 'U002',
          department: 'string',
          personType: 'string',
          jurisdiction: 'string',
          processType: 'string',
          office: 'string',
          settled: 'string',
          city: 'string',
          country: 'string',
          estado: 'RADICADO',
          type: 'ACTIVO',
          createdAt: '2025-08-13T18:37:19.274Z',
          documents: [
            {
              record: '689cdb5fa12ad3026a86b2bf',
              category: 'Demanda',
              documentType: 'Escrito',
              document: 'Demanda',
              subdocument: 'Impulso procesal',
              settledDate: '2025-01-15T10:30:00.000Z',
              consecutive: 'U002-DDD-QPA-01',
              responsibleType: 'Abogado',
              responsible: 'Juan Pérez',
              url: 'https://example.com/documents/file.pdf',
              _id: '689cdb5fa12ad3026a86b2c2',
              createdAt: '2025-08-13T18:37:19.280Z',
              updatedAt: '2025-08-13T18:37:19.280Z',
            },
          ],
          interveners: [
            {
              record: '689cdb5fa12ad3026a86b2bf',
              intervenerType: 'string',
              name: 'string',
              documentType: 'string',
              document: 'string',
              email: 'ana@gmail.com',
              contact: 'string',
              _id: '689cdb5fa12ad3026a86b2c4',
            },
          ],
          proceduralParts: [
            {
              record: '689cdb5fa12ad3026a86b2bf',
              partType: 'string',
              name: 'string',
              documentType: 'string',
              document: 'string',
              email: 'ana@gmail.com',
              contact: 'string',
              _id: '689cdb5fa12ad3026a86b2c6',
            },
          ],
          payments: [
            {
              record: '689cdb5fa12ad3026a86b2bf',
              successBonus: true,
              bonusPercentage: 0,
              bonusPrice: 0,
              bonusCausationDate: '2025-08-13T17:59:06.749Z',
              bonusPaymentDate: '2025-08-13T17:59:06.749Z',
              notes: 'string',
              _id: '689cdb5fa12ad3026a86b2c8',
            },
          ],
          performances: [
            {
              record: '689cdb5fa12ad3026a86b2bf',
              performanceType: 'RADICADO',
              responsible: 'Juan Pérez',
              observation: 'Radicación de demanda',
              _id: '689cdb5fa12ad3026a86b2cc',
              createdAt: '2025-08-13T18:37:19.295Z',
              updatedAt: '2025-08-13T18:37:19.295Z',
            },
          ],
        },
      ],
      count: 1,
    },
  })
  async getMyRecords(
    @GetUser() user: IUser,
    @Query() paginationDto: PaginationDto,
  ): Promise<any> {
    const result = await this.recordsService.getMyRecords(user, paginationDto);
    return {
      message: 'Expedientes obtenidos exitosamente',
      ...result,
    };
  }

  @ApiOperation({ summary: 'Buscar caso por ID con todas sus relaciones' })
  @ApiResponse({
    status: 200,
    example: {
      message: 'Caso obtenido exitosamente',
      record: {
        _id: '689cdb5fa12ad3026a86b2bf',
        user: '6887adcb73202e78bdf451b8',
        clientType: 'Uber',
        internalCode: 'U002',
        department: 'string',
        personType: 'string',
        jurisdiction: 'string',
        processType: 'string',
        office: 'string',
        settled: 'string',
        country: 'string',
        estado: 'RADICADO',
        type: 'ACTIVO',
        createdAt: '2025-08-13T18:37:19.274Z',
        documents: [
          {
            record: '689cdb5fa12ad3026a86b2bf',
            category: 'Demanda',
            documentType: 'Escrito',
            document: 'Demanda',
            subdocument: 'Impulso procesal',
            settledDate: '2025-01-15T10:30:00.000Z',
            consecutive: 'U002-DDD-QPA-01',
            responsibleType: 'Abogado',
            responsible: 'Juan Pérez',
            url: 'https://example.com/documents/file.pdf',
            _id: '689cdb5fa12ad3026a86b2c2',
            createdAt: '2025-08-13T18:37:19.280Z',
            updatedAt: '2025-08-13T18:37:19.280Z',
          },
        ],
        interveners: [
          {
            record: '689cdb5fa12ad3026a86b2bf',
            intervenerType: 'string',
            name: 'string',
            documentType: 'string',
            document: 'string',
            email: 'ana@gmail.com',
            contact: 'string',
            _id: '689cdb5fa12ad3026a86b2c4',
          },
        ],
        proceduralParts: [
          {
            record: '689cdb5fa12ad3026a86b2bf',
            partType: 'string',
            name: 'string',
            documentType: 'string',
            document: 'string',
            email: 'ana@gmail.com',
            contact: 'string',
            _id: '689cdb5fa12ad3026a86b2c6',
          },
        ],
        payments: [
          {
            record: '689cdb5fa12ad3026a86b2bf',
            successBonus: true,
            bonusPercentage: 0,
            bonusPrice: 0,
            bonusCausationDate: '2025-08-13T17:59:06.749Z',
            bonusPaymentDate: '2025-08-13T17:59:06.749Z',
            notes: 'string',
            _id: '689cdb5fa12ad3026a86b2c8',
          },
        ],
        performances: [
          {
            record: '689cdb5fa12ad3026a86b2bf',
            performanceType: 'RADICADO',
            responsible: 'Juan Pérez',
            observation: 'Radicación de demanda',
            _id: '689cdb5fa12ad3026a86b2cc',
            createdAt: '2025-08-13T18:37:19.295Z',
            updatedAt: '2025-08-13T18:37:19.295Z',
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    example: {
      statusCode: 404,
      message: 'Caso no encontrado',
      error: 'Not Found',
    },
  })
  @Get('one/:id')
  findById(@Param('id') id: string) {
    return this.recordsService.findById(id);
  }

  @ApiOperation({
    summary:
      'Obtener el mayor internal code para un tipo de proceso específico',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Mayor código interno encontrado exitosamente',
    example: {
      message:
        'Mayor código interno encontrado para el tipo de proceso: Ordinario',
      maxInternalCode: 'INT-2025-015',
      processType: 'Ordinario',
    },
  })
  @ApiResponse({
    status: 200,
    description: 'No se encontraron registros para el tipo de proceso',
    example: {
      message:
        'No se encontraron registros para el tipo de proceso: Extraordinario',
      maxInternalCode: null,
      processType: 'Extraordinario',
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: ['processType must not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('max-internal-code')
  getMaxInternalCodeByProcessType(
    @Body() getMaxInternalCodeDto: GetMaxInternalCodeDto,
  ) {
    return this.recordsService.getMaxEtiquetaByProcessType(
      getMaxInternalCodeDto.processType,
    );
  }

  @ApiOperation({ summary: 'Actualizar caso' })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Caso actualizado exitosamente',
    example: {
      message: 'Caso actualizado exitosamente',
      record: {
        _id: '67a1234567890abcdef12345',
        internalCode: 'INT-2025-001',
        clientType: 'Persona Natural',
        department: 'Bogotá D.C.',
        personType: 'Natural',
        jurisdiction: 'Civil',
        location: 'Bogotá D.C.',
        processType: 'Ordinario',
        office: 'Juzgado 1ro Civil',
        settled: 'Juzgado',
        country: 'Colombia',
        estado: 'PENDIENTE FINALIZAR',
        user: '67a1234567890abcdef11111',
        createdAt: '2025-07-29T10:00:00.000Z',
        updatedAt: '2025-07-29T10:00:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: 400,
    example: {
      statusCode: 400,
      message: ['clientType must not be empty'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    example: {
      statusCode: 404,
      message: 'Caso no encontrado',
      error: 'Not Found',
    },
  })
  @Patch(':id')
  updateRecord(
    @Param('id') id: string,
    @Body() updateRecordDto: UpdateRecordDto,
  ) {
    return this.recordsService.updateRecord(id, updateRecordDto);
  }

  @ApiOperation({ summary: 'Eliminar caso y todas sus relaciones' })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Caso eliminado exitosamente junto con todas sus relaciones',
    example: {
      message: 'Caso eliminado exitosamente',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @ApiResponse({
    status: 404,
    example: {
      statusCode: 404,
      message: 'Caso no encontrado',
      error: 'Not Found',
    },
  })
  @ApiResponse({
    status: 403,
    example: {
      statusCode: 403,
      message: 'No tienes permisos para eliminar este caso',
      error: 'Forbidden',
    },
  })
  @Delete(':id')
  deleteRecord(@GetUser() user: IUser, @Param('id') id: string) {
    return this.recordsService.deleteRecord(user, id);
  }

  @ApiOperation({
    summary:
      'Obtener estadísticas de procesos activos vs inactivos por mes por año',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Statistics retrieved successfully. Si no se especifica type, se devuelven ambos tipos. Si se especifica ACTIVO o FINALIZADO, se filtra solo por ese tipo.',
    example: {
      year: 2024,
      activeProcesses: 150,
      inactiveProcesses: 75,
      totalProcesses: 225,
      filterType: 'ACTIVO',
      monthlyMetrics: [
        {
          month: 1,
          monthName: 'January',
          activeProcesses: 15,
          inactiveProcesses: 8,
          totalProcesses: 23,
        },
        {
          month: 2,
          monthName: 'February',
          activeProcesses: 12,
          inactiveProcesses: 6,
          totalProcesses: 18,
        },
      ],
      summary: {
        mostActiveMonth: {
          month: 1,
          monthName: 'January',
          activeProcesses: 15,
          inactiveProcesses: 8,
          totalProcesses: 23,
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error de validación',
    example: {
      statusCode: 400,
      message: ['Type must be either ACTIVO or FINALIZADO'],
      error: 'Bad Request',
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('statistics/active-inactive-by-month')
  getActiveInactiveProcessesByMonth(
    @Body() getStatisticsDto: GetStatisticsDto,
  ) {
    const year = getStatisticsDto.year || new Date().getFullYear();
    const type = getStatisticsDto.type;
    return this.recordsService.getActiveInactiveProcessesByMonth(year, type);
  }

  @ApiOperation({
    summary:
      'Obtener estadísticas de demandas radicadas y audiencias fijadas por mes por año',
  })
  @ApiResponse({
    status: 200,
    description:
      'Demandas radicadas y Audiencias fijadas obtenidas exitosamente',
    example: {
      year: 2024,
      filedLawsuits: {
        total: 180,
        metric: [
          {
            month: 1,
            monthName: 'January',
            count: 15,
          },
          {
            month: 2,
            monthName: 'February',
            count: 12,
          },
        ],
      },
      scheduledHearings: {
        total: 85,
        metric: [
          {
            month: 1,
            monthName: 'January',
            count: 8,
          },
          {
            month: 2,
            monthName: 'February',
            count: 7,
          },
        ],
      },
      summary: {
        totalLawsuits: 180,
        totalHearings: 85,
      },
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('statistics/lawsuits-hearings-by-month')
  getFiledLawsuitsAndScheduledHearingsByMonth(
    @Body() getStatisticsDto: GetStatisticsDto,
  ) {
    const year = getStatisticsDto.year || new Date().getFullYear();
    return this.recordsService.getFiledLawsuitsAndScheduledHearingsByMonth(
      year,
    );
  }

  @ApiOperation({
    summary:
      'Obtener estadísticas de procesos activos o finalizados por estado',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de procesos por estado obtenidas exitosamente',
    example: {
      type: 'ACTIVO',
      total: 245,
      statistics: [
        {
          estado: 'RADICADO',
          count: 89,
          percentage: 36.33,
        },
        {
          estado: 'ADMITE',
          count: 67,
          percentage: 27.35,
        },
        {
          estado: 'NOTIFICACION_PERSONAL',
          count: 45,
          percentage: 18.37,
        },
        {
          estado: 'CONTESTACION_DEMANDA',
          count: 32,
          percentage: 13.06,
        },
        {
          estado: 'FIJA_AUDIENCIA',
          count: 12,
          percentage: 4.9,
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('statistics/processes-by-state')
  getProcessStatisticsByState(
    @Body() getProcessStatisticsDto: GetProcessStatisticsDto,
  ) {
    return this.recordsService.getProcessStatisticsByState(
      getProcessStatisticsDto.type,
    );
  }

  @ApiOperation({
    summary:
      'Obtener estadísticas de procesos activos por estado y mes en un año específico',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Estadísticas de procesos por estado y mes obtenidas exitosamente',
    example: {
      type: 'ACTIVO',
      year: 2024,
      total: 189,
      statistics: [
        {
          estado: 'RADICADO',
          totalByState: 67,
          percentage: 35.45,
          monthlyData: [
            {
              month: 1,
              monthName: 'Enero',
              count: 8,
            },
            {
              month: 2,
              monthName: 'Febrero',
              count: 12,
            },
            {
              month: 3,
              monthName: 'Marzo',
              count: 6,
            },
            {
              month: 4,
              monthName: 'Abril',
              count: 9,
            },
            {
              month: 5,
              monthName: 'Mayo',
              count: 5,
            },
            {
              month: 6,
              monthName: 'Junio',
              count: 7,
            },
            {
              month: 7,
              monthName: 'Julio',
              count: 4,
            },
            {
              month: 8,
              monthName: 'Agosto',
              count: 6,
            },
            {
              month: 9,
              monthName: 'Septiembre',
              count: 3,
            },
            {
              month: 10,
              monthName: 'Octubre',
              count: 2,
            },
            {
              month: 11,
              monthName: 'Noviembre',
              count: 8,
            },
            {
              month: 12,
              monthName: 'Diciembre',
              count: 7,
            },
          ],
        },
        {
          estado: 'ADMITE',
          totalByState: 52,
          percentage: 27.51,
          monthlyData: [
            {
              month: 1,
              monthName: 'Enero',
              count: 4,
            },
            {
              month: 2,
              monthName: 'Febrero',
              count: 6,
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('statistics/processes-by-state-year')
  getProcessStatisticsByStateAndYear(
    @Body() getStatisticsDto: GetStatisticsDto,
  ) {
    const year = getStatisticsDto.year || new Date().getFullYear();
    return this.recordsService.getProcessStatisticsByStateAndYear(
      'ACTIVO',
      year,
    );
  }

  @ApiOperation({
    summary:
      'Obtener estadísticas de procesos finalizados por estado y mes en un año específico',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @ApiResponse({
    status: 200,
    description:
      'Estadísticas de procesos finalizados por estado y mes obtenidas exitosamente',
    example: {
      type: 'FINALIZADO',
      year: 2024,
      total: 145,
      statistics: [
        {
          estado: 'SENTENCIA',
          totalByState: 58,
          percentage: 40.0,
          monthlyData: [
            {
              month: 1,
              monthName: 'Enero',
              count: 6,
            },
            {
              month: 2,
              monthName: 'Febrero',
              count: 8,
            },
            {
              month: 3,
              monthName: 'Marzo',
              count: 4,
            },
            {
              month: 4,
              monthName: 'Abril',
              count: 7,
            },
            {
              month: 5,
              monthName: 'Mayo',
              count: 3,
            },
            {
              month: 6,
              monthName: 'Junio',
              count: 5,
            },
            {
              month: 7,
              monthName: 'Julio',
              count: 2,
            },
            {
              month: 8,
              monthName: 'Agosto',
              count: 4,
            },
            {
              month: 9,
              monthName: 'Septiembre',
              count: 6,
            },
            {
              month: 10,
              monthName: 'Octubre',
              count: 5,
            },
            {
              month: 11,
              monthName: 'Noviembre',
              count: 4,
            },
            {
              month: 12,
              monthName: 'Diciembre',
              count: 4,
            },
          ],
        },
        {
          estado: 'DESISTIMIENTO',
          totalByState: 34,
          percentage: 23.45,
          monthlyData: [
            {
              month: 1,
              monthName: 'Enero',
              count: 2,
            },
            {
              month: 2,
              monthName: 'Febrero',
              count: 4,
            },
          ],
        },
      ],
    },
  })
  @ApiResponse({
    status: 401,
    example: {
      statusCode: 401,
      message: 'Unauthorized',
      error: 'Unauthorized',
    },
  })
  @Post('statistics/finished-processes-by-state-year')
  getFinishedProcessStatisticsByStateAndYear(
    @Body() getStatisticsDto: GetStatisticsDto,
  ) {
    const year = getStatisticsDto.year || new Date().getFullYear();
    return this.recordsService.getProcessStatisticsByStateAndYear(
      'FINALIZADO',
      year,
    );
  }

  @ApiOperation({
    summary:
      'Obtener métricas agrupadas por departamento y ciudad-Rapidez media de fijacion y celebracion de audiencia',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics/processes/by-department-city')
  async getMetricsByDepartmentAndCity() {
    return this.recordsService.getMetricsByDepartmentAndCity();
  }

  @ApiOperation({
    summary: 'Obtener cantidad y porcentaje de casos por departamento y ciudad',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics/processes-percentage-by-department')
  async getCasesCountAndPercentageByDepartment() {
    return this.recordsService.getCasesCountAndPercentageByDepartment();
  }

  @ApiOperation({
    summary:
      'Obtener juzgados laborales con cantidad de procesos activos, ciudad y departamento',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiResponse({
    status: 200,
    description: 'Lista de juzgados laborales con cantidad de procesos activos',
    schema: {
      example: {
        records: [
          {
            office: 'Juzgado 1',
            city: 'Bogotá',
            department: 'Cundinamarca',
            count: 5,
          },
          { office: 'Juzgado 2', city: null, department: null, count: 3 },
        ],
      },
    },
  })
  async getActiveByOffice() {
    return this.recordsService.getActiveProcessCountByOffice();
  }

  @ApiOperation({ summary: 'Obtener demandas radicadas por user por año' })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Post('statistics/filed-lawsuits-by-user')
  async getFiledLawsuitsByUserByYear(@Body() dto: GetStatisticsDto) {
    return this.recordsService.getFiledLawsuitsByUserByYear(dto);
  }

  @ApiOperation({
    summary: 'Obtener estadísticas relativas a la documentación',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Get('statistics/documentation')
  async getStatisticsDocumentation() {
    return this.documentService.getStatisticsDocumentation();
  }

  @ApiOperation({
    summary: 'Obtener data de documentos con porciento por mes por año',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Post('statistics/documentation/monthly')
  async getMonthlyDocumentationStats(@Body() body: GetStatisticsDto) {
    return this.documentService.getDocumentationMetrics(body);
  }

  @ApiOperation({
    summary: 'Obtener seguimiento de procesos radicados en un mes específico',
  })
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  @Post('statistics/processes/tracking')
  async getProcessTracking(@Body() body: GetProcessTrackingDto) {
    return this.recordsService.getProcessTracking(body.month, body.year);
  }

  @ApiOperation({
    summary:
      ' Obtener estado de casos activos y finalizados por número de documento del cliente',
  })
  @ApiKeyAuth()
  @Post('by-client')
  async getRecordsByClient(@Body() body: ByClientDto) {
    return this.proceduralPartService.getRecordsByClient(body);
  }

  @ApiOperation({ summary: 'Obtener caso por internalCode' })
  @ApiKeyAuth()
  @Post('by-internal-code')
  async getRecordDetailsByInternalCode(@Body() internalCodeDto: ByEtiquetaDto) {
    return this.recordsService.getRecordDetailsByEtiqueta(internalCodeDto);
  }

  @ApiOperation({
    summary:
      'Obtener detalles completos de todos los casos activos y finalizados por número de documento del cliente',
  })
  @ApiKeyAuth()
  @Post('detailed-by-client')
  async getDetailedRecordsByClient(@Body() body: ByClientDto) {
    return this.recordsService.getDetailedRecordsByClient(body);
  }

  // ====== ENDPOINTS PARA SINCRONIZACIÓN CON MONOLEGAL ======

  /**
   * Reintenta la sincronización de un caso específico con Monolegal
   */
  @Post('sync-monolegal/:id')
  @UseGuards(AuthGuard('jwt'))
  async retrySyncWithMonolegal(@Param('id') id: string) {
    return this.recordsService.retrySyncWithMonolegal(id);
  }

  /**
   * Obtiene todos los casos pendientes de sincronización
   */
  @Get('pending-sync-monolegal')
  @UseGuards(AuthGuard('jwt'))
  async getPendingSyncRecords() {
    const records = await this.recordsService.getPendingSyncRecords();
    return {
      count: records.length,
      records,
    };
  }

  /**
   * Sincroniza todos los casos pendientes con Monolegal
   */
  @Post('sync-all-pending-monolegal')
  @UseGuards(AuthGuard('jwt'))
  async syncAllPendingWithMonolegal() {
    return this.recordsService.syncAllPendingWithMonolegal();
  }

  // ============================================
  // TAMBIÉN PUEDES AGREGAR UN ENDPOINT EN EL CONTROLLER DE MONOLEGAL
  // Archivo: monolegal.controller.ts
  // ============================================

  /**
   * Registra un proceso directamente en Monolegal (sin crear caso local)
   * Útil para testing o casos especiales
   */
  @Post('register-process')
  @ApiBearerAuth()
  @Auth()
  @UseGuards(JwtAuthGuard)
  // @UseGuards(AuthGuard('jwt'))
  @ApiOperation({ summary: 'Registrar proceso en Monolegal' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        radicado: {
          type: 'string',
          example: '05001400300120250000001',
          description: 'Número de radicado del proceso (23 dígitos)',
        },
      },
      required: ['radicado'],
    },
  })
  async registerProcessInMonolegal(@Body() body: { radicado: string }) {
    if (!body.radicado || body.radicado.trim() === '') {
      throw new BadRequestException('El radicado es requerido');
    }

    return this.monolegalApiService.registrarProcesoEnMonolegal(
      body.radicado.trim(),
    );
  }

  /**
   * Registra múltiples procesos en Monolegal
   */
  @Post('register-processes')
  @UseGuards(AuthGuard('jwt'))
  async registerProcessesInMonolegal(@Body() body: { radicados: string[] }) {
    if (!body.radicados || body.radicados.length === 0) {
      throw new BadRequestException('Se requiere al menos un radicado');
    }

    const radicadosLimpios = body.radicados
      .map((r) => r.trim())
      .filter((r) => r.length > 0);

    if (radicadosLimpios.length === 0) {
      throw new BadRequestException('No hay radicados válidos');
    }

    return this.monolegalApiService.registrarProcesosEnMonolegal(
      radicadosLimpios,
    );
  }
}
