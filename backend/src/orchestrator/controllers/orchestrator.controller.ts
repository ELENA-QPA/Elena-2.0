import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Logger,
  Put,
} from '@nestjs/common';
import { OrchestratorService } from '../services/orchestrator.service';
import {
  EtiquetaDto,
  IdRecordDto,
  IdLawyerDto,
  IdAudienceDto,
} from '../dto/records-service.dto';
import { RecordAdaptedResponse } from '../interfaces/record-adapted.interface';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Auth } from 'src/auth/decorators';
import { AudienceService } from 'src/audience/services/audience.service';
import { ValidRoles } from 'src/auth/interfaces';

@ApiTags('Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(
    private readonly orchestratorService: OrchestratorService,
    private readonly audienceService: AudienceService,
  ) {}

  private readonly logger = new Logger(OrchestratorService.name);

  @Post('record')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener un record dado el ID' })
  @ApiBody({
    description: 'ID del record a consultar',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          example: '6966cc02ac796fa1247a8788',
        },
      },
      required: ['id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Record obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        record: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6966cc02ac796fa1247a8788',
            },
            client: {
              type: 'string',
              example: 'Rappi SAS',
            },
            etiqueta: {
              type: 'string',
              example: 'R699',
            },
            despachoJudicial: {
              type: 'string',
              example: 'Juzgado 04 Laboral del Circuito de Bucaramanga',
            },
            radicado: {
              type: 'string',
              example: '68001310500420250023000',
            },
            proceduralParts: {
              type: 'object',
              properties: {
                plaintiff: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'EMANUEL JOSUE LINARES MENDOZA',
                    },
                    email: {
                      type: 'string',
                      example: 'por-verificar@temp.com',
                    },
                    contact: {
                      type: 'string',
                      example: 'Por verificar',
                    },
                  },
                },
                defendant: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'Rappi SAS',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async getRecord(@Body() body: IdRecordDto): Promise<RecordAdaptedResponse> {
    const internalCodeDto: EtiquetaDto =
      await this.orchestratorService.getEtiquetaById(body);
    return this.orchestratorService.getRecordByEtiqueta(internalCodeDto);
  }

  @Post('record/internalCode')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener un record dado el código interno (etiqueta)',
  })
  @ApiBody({
    description: 'Código interno (etiqueta) del record',
    schema: {
      type: 'object',
      properties: {
        etiqueta: {
          type: 'string',
          example: 'R699',
        },
      },
      required: ['etiqueta'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Record obtenido exitosamente',
    schema: {
      type: 'object',
      properties: {
        record: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              example: '6966cc02ac796fa1247a8788',
            },
            client: {
              type: 'string',
              example: 'Rappi SAS',
            },
            etiqueta: {
              type: 'string',
              example: 'R699',
            },
            despachoJudicial: {
              type: 'string',
              example: 'Juzgado 04 Laboral del Circuito de Bucaramanga',
            },
            radicado: {
              type: 'string',
              example: '68001310500420250023000',
            },
            proceduralParts: {
              type: 'object',
              properties: {
                plaintiff: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'EMANUEL JOSUE LINARES MENDOZA',
                    },
                    email: {
                      type: 'string',
                      example: 'por-verificar@temp.com',
                    },
                    contact: {
                      type: 'string',
                      example: 'Por verificar',
                    },
                  },
                },
                defendant: {
                  type: 'object',
                  properties: {
                    name: {
                      type: 'string',
                      example: 'Rappi SAS',
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async getRecordByInternalCode(
    @Body() body: EtiquetaDto,
  ): Promise<RecordAdaptedResponse> {
    return this.orchestratorService.getRecordByEtiqueta(body);
  }

  @Auth(ValidRoles.admin)
  @Get('audience/all')
  @ApiOperation({
    summary: 'Obtener todas las audiencias',
    description:
      'Retorna el listado completo de audiencias registradas en el sistema. ' +
      'Este endpoint está restringido a usuarios con rol administrador.',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de audiencias obtenido exitosamente',
  })
  @ApiResponse({
    status: 401,
    description: 'No autorizado',
  })
  @ApiResponse({
    status: 403,
    description: 'Acceso denegado. Rol insuficiente',
  })
  findAll() {
    return this.orchestratorService.getAllAudiences();
  }

  @Post('audience')
  @ApiOperation({
    summary: 'Obtener audiencias por abogado',
    description:
      'Recibe el identificador de un abogado y retorna las audiencias asociadas a dicho abogado.',
  })
  @ApiBody({
    description: 'Identificador del abogado',
    schema: {
      type: 'object',
      properties: {
        lawyer: {
          type: 'string',
          description: 'ID del abogado',
          example: '6953437bd41bd4c76ea3cb2e',
        },
      },
      required: ['lawyer'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audiencias obtenidas exitosamente para el abogado indicado',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  findOne(@Body() body: IdLawyerDto) {
    return this.orchestratorService.getAudienceByLawyer(body);
  }

  @Post('audience/fix')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener una audiencia por ID',
    description:
      'Recibe el identificador de una audiencia y retorna la información completa ' +
      'de la audiencia asociada, incluyendo los datos básicos del abogado.',
  })
  @ApiBody({
    description: 'Identificador de la audiencia',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'ID de la audiencia',
          example: '696ebbd6ee342f12bb735281',
        },
      },
      required: ['id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Audiencia obtenida exitosamente',
    schema: {
      type: 'object',
      properties: {
        audience: {
          type: 'object',
          properties: {
            _id: {
              type: 'string',
              description: 'ID de la audiencia',
            },
            monto: {
              type: 'number',
              description: 'Monto asociado a la audiencia',
            },
            state: {
              type: 'string',
              description: 'Estado actual de la audiencia',
            },
            link: {
              type: 'string',
              description: 'Enlace de la audiencia',
            },
            is_valid: {
              type: 'boolean',
              description: 'Indica si la audiencia es válida',
            },
            lawyer: {
              type: 'object',
              description: 'Información básica del abogado',
              properties: {
                _id: {
                  type: 'string',
                  description: 'ID del abogado',
                },
                name: {
                  type: 'string',
                  description: 'Nombre del abogado',
                },
              },
            },
            start: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de inicio de la audiencia',
            },
            end: {
              type: 'string',
              format: 'date-time',
              description: 'Fecha y hora de finalización de la audiencia',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  findAudience(@Body() body: IdAudienceDto) {
    return this.orchestratorService.getAudienceById(body);
  }

  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Creación masiva de audiencias (endpoint de prueba)',
    description:
      'Endpoint de prueba utilizado para validar la creación automática de audiencias y la generación de notificaciones. ' +
      'Permite enviar múltiples audiencias en un solo request, incluso con datos incompletos o inválidos, ' +
      'para probar reglas de validación y comportamiento del sistema.',
  })
  @ApiBody({
    description: 'Listado de audiencias a crear de forma masiva',
    schema: {
      type: 'object',
      properties: {
        audiences: {
          type: 'array',
          description: 'Arreglo de audiencias a procesar',
          items: {
            type: 'object',
            properties: {
              record: {
                type: 'string',
                description: 'ID del record asociado',
              },
              lawyer: {
                type: 'string',
                description: 'ID del abogado asociado',
              },
              start: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha y hora de inicio de la audiencia',
              },
              end: {
                type: 'string',
                format: 'date-time',
                description: 'Fecha y hora de fin de la audiencia',
              },
              state: {
                type: 'string',
                description: 'Estado de la audiencia',
              },
              monto: {
                type: 'number',
                description: 'Monto asociado a la audiencia',
              },
              link: {
                type: 'string',
                description: 'Enlace virtual de la audiencia',
              },
            },
          },
        },
      },
      required: ['audiences'],
      example: {
        audiences: [
          {
            record: '69534608102eaab137d7d673',
            lawyer: '6953437bd41bd4c76ea3cb2e',
            start: '2025-12-24T10:00:00Z',
            end: '2025-12-24T12:00:00Z',
            state: 'Programada',
            monto: 1500,
            link: 'https://meet.google.com/abc-defg-hij',
          },
          {
            record: 'invalid-mongo-id',
            lawyer: '6953437bd41bd4c76ea3cb2e',
            start: '2025-12-26T09:00:00Z',
            end: '2025-12-26T11:00:00Z',
            state: 'Programada',
          },
          {
            record: '69534608102eaab137d7d673',
            lawyer: '69534390d41bd4c76ea3cb30',
            start: '2025-12-27T14:00:00Z',
            state: 'Programada',
            monto: 2000,
          },
        ],
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Resultado del procesamiento masivo de audiencias, indicando cuántas fueron creadas correctamente, fallidas y cuántas notificaciones se generaron',
    schema: {
      type: 'object',
      properties: {
        success: {
          type: 'number',
          description: 'Cantidad de audiencias creadas exitosamente',
        },
        failed: {
          type: 'number',
          description: 'Cantidad de audiencias que fallaron en su creación',
        },
        notifications_created: {
          type: 'number',
          description:
            'Cantidad de notificaciones generadas durante el proceso',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async bulkCreateAudiences(@Body() body) {
    return await this.orchestratorService.bulkCreateAudiencesWithNotifications(
      body.audiences,
    );
  }

  @Post('singlebulk')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Creación individual de audiencia (endpoint de prueba)',
    description:
      'Endpoint de prueba utilizado para validar la creación automática de una audiencia individual ' +
      'y la generación de notificaciones. A diferencia del endpoint bulk, este recibe un solo objeto ' +
      'con los datos de la audiencia, permitiendo probar validaciones y flujos de notificación de forma aislada.',
  })
  @ApiBody({
    description: 'Datos de la audiencia a crear',
    schema: {
      type: 'object',
      properties: {
        record: {
          type: 'string',
          description: 'ID del record asociado',
        },
        lawyer: {
          type: 'string',
          description: 'ID del abogado asociado',
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de inicio de la audiencia',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de fin de la audiencia',
        },
        state: {
          type: 'string',
          description: 'Estado de la audiencia',
        },
        monto: {
          type: 'number',
          description: 'Monto asociado a la audiencia',
        },
        link: {
          type: 'string',
          description: 'Enlace virtual de la audiencia',
        },
      },
      example: {
        record: '69534608102eaab137d7d673',
        lawyer: '69534390d41bd4c76ea3cb30',
        start: '2025-12-27T14:00:00Z',
        state: 'Programada',
        monto: 2000,
      },
    },
  })
  @ApiResponse({
    status: 201,
    description:
      'Audiencia creada y procesada. En caso de datos incompletos o inválidos, ' +
      'la audiencia se marca como no válida y se generan las notificaciones correspondientes.',
    schema: {
      type: 'object',
      properties: {
        _id: {
          type: 'string',
          description: 'ID de la audiencia creada',
        },
        lawyer: {
          type: 'string',
          description: 'ID del abogado asociado',
        },
        state: {
          type: 'string',
          description: 'Estado de la audiencia',
        },
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de inicio',
        },
        is_valid: {
          type: 'boolean',
          description:
            'Indica si la audiencia es válida según las reglas del sistema',
        },
        monto: {
          type: 'number',
          description: 'Monto asociado a la audiencia',
        },
        notifications: {
          type: 'object',
          description: 'Estado de las notificaciones generadas',
          properties: {
            oneMonth: { type: 'object' },
            fifteenDays: { type: 'object' },
            oneDay: { type: 'object' },
            oneDayAfterCreation: { type: 'object' },
          },
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de creación',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha de última actualización',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos',
  })
  async CreateAudiences(@Body() body) {
    return await this.orchestratorService.createAudiencesWithNotifications(
      body,
    );
  }

  @Post('availablelawyer')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Obtener un abogado disponible',
    description:
      'Recibe un rango de fechas (inicio y fin) y retorna el identificador de un abogado ' +
      'que se encuentre disponible para dicho intervalo de tiempo.',
  })
  @ApiBody({
    description: 'Rango de fechas para verificar disponibilidad del abogado',
    schema: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de inicio del intervalo',
          example: '2025-12-24T08:00:00Z',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de fin del intervalo',
          example: '2025-12-24T11:00:00Z',
        },
      },
      required: ['start', 'end'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'ID del abogado disponible para el rango de fechas solicitado',
    schema: {
      type: 'string',
      description: 'Identificador del abogado disponible',
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o rango de fechas incorrecto',
  })
  async getAvailableLawyer(@Body() body) {
    return await this.orchestratorService.findAvailableLawyer(
      body.start,
      body.end,
    );
  }

  @Post('reminders/process')
  @ApiOperation({
    summary: 'Procesar envío de recordatorios',
    description:
      'Dispara el proceso de envío de recordatorios de audiencias de forma asíncrona. ' +
      'Este endpoint encola los recordatorios pendientes para su posterior procesamiento, ' +
      'sin bloquear la ejecución ni esperar a que el envío finalice.',
  })
  @ApiResponse({
    status: 200,
    description:
      'Los recordatorios fueron encolados correctamente para procesamiento asíncrono',
  })
  async processReminders() {
    await this.orchestratorService.processReminders();
    return { message: 'Recordatorios encolados para procesamiento asíncrono' };
  }

  @Get('reminders/queue/stats')
  @ApiOperation({
    summary: 'Obtener estadísticas de la cola de recordatorios',
    description:
      'Retorna información general sobre el estado de la cola de procesamiento de recordatorios, ' +
      'incluyendo métricas relevantes para monitoreo y diagnóstico.',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas de la cola obtenidas exitosamente',
  })
  async getQueueStats() {
    return this.orchestratorService.getQueueStats();
  }

  @Post('reminders/queue/clean')
  @ApiOperation({
    summary: 'Limpiar la cola de recordatorios',
    description:
      'Elimina los trabajos pendientes y/o fallidos de la cola de recordatorios. ' +
      'Este endpoint está pensado para tareas administrativas o de mantenimiento.',
  })
  @ApiResponse({
    status: 200,
    description: 'Cola de recordatorios limpiada exitosamente',
  })
  async cleanQueue() {
    await this.orchestratorService.cleanQueue();
    return { message: 'Cola limpiada exitosamente' };
  }

  @Post('extractdate')
  @ApiOperation({
    summary: 'Extraer rango de fechas desde texto',
    description:
      'Recibe un texto en lenguaje natural y extrae un rango de fechas (inicio y fin) ' +
      'utilizando procesamiento de lenguaje natural basado en OpenAI. ' +
      'Este endpoint es útil para interpretar fechas escritas de forma descriptiva o informal.',
  })
  @ApiBody({
    description: 'Texto del cual se desea extraer el rango de fechas',
    schema: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description:
            'Texto en lenguaje natural que contiene información de fechas',
          example:
            'La audiencia se celebrará el día (20) de agosto del año dos mil veintiséis (2026), a las nueve de la mañana (9:00 a.m.).',
        },
      },
      required: ['text'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Rango de fechas extraído exitosamente',
    schema: {
      type: 'object',
      properties: {
        start: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de inicio extraída del texto',
        },
        end: {
          type: 'string',
          format: 'date-time',
          description: 'Fecha y hora de fin extraída del texto',
        },
      },
    },
  })
  extractRange(@Body() dto) {
    return this.orchestratorService.extractDate(dto.text);
  }

  @Put('/filepay')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Archivar y marcar como pagado un caso',
    description:
      'Recibe el identificador de un caso y actualiza su estado a ' +
      '"ARCHIVADO_Y_PAGADO". Retorna el caso actualizado.',
  })
  @ApiBody({
    description: 'Identificador del caso a archivar y marcar como pagado',
    schema: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: 'Identificador del caso',
          example: '697c0b0ee200e73d829d8d49',
        },
      },
      required: ['id'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Caso actualizado exitosamente',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Caso actualizado exitosamente',
        },
        record: {
          type: 'object',
          description: 'Caso actualizado',
          properties: {
            _id: { type: 'string', example: '697c0b0ee200e73d829d8d49' },
            user: { type: 'string', example: '696809d1e3ad0c02055ee650' },
            clientType: { type: 'string', example: 'Uber' },
            department: { type: 'string', example: 'Antioquia' },
            personType: { type: 'string', example: 'NATURAL' },
            jurisdiction: { type: 'string', example: 'Administrativo' },
            location: { type: 'string', example: 'Unificada' },
            processType: { type: 'string', example: 'Acciones de grupo' },
            city: { type: 'string', example: 'Abejorral' },
            country: { type: 'string', example: 'COLOMBIA' },
            radicado: { type: 'string', example: '554654' },
            despachoJudicial: { type: 'string', example: 'sassa' },
            etiqueta: { type: 'string', example: 'U004' },
            sincronizadoMonolegal: { type: 'boolean', example: false },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-01-30T01:36:14.299Z',
            },
            updatedAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-01-30T02:42:22.944Z',
            },
            estado: {
              type: 'string',
              example: 'ARCHIVADO_Y_PAGADO',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Datos inválidos o el caso no puede ser actualizado',
  })
  filepay(@Body() dto) {
    return this.orchestratorService.filePay(dto.id);
  }
}
