import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { MonolegalService } from '../services/monolegal.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { GetUser } from '../../auth/decorators';
import { IUser } from '../../records/interfaces/user.interface';
import { ImportMonolegalDto } from '../dto/import-monolegal.dto';

@ApiTags('Monolegal')
@Controller('monolegal')
export class MonolegalController {
  constructor(private readonly monolegalService: MonolegalService) {}

  @Post('import')
  @ApiOperation({
    summary: 'Importar procesos desde Excel de Monolegal',
    description: `
      Importa y sincroniza procesos judiciales desde el archivo Excel exportado por Monolegal.
      
      **Funcionalidad:**
      - Si el radicado existe: Actualiza la información
      - Si el radicado NO existe: Crea un nuevo registro
      - Sincroniza demandantes, demandados y última actuación
      
      **Frecuencia recomendada:** Martes y Jueves
    `,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo Excel de Monolegal',
    type: ImportMonolegalDto,
  })
  @ApiResponse({
    status: 201,
    description: 'Importación completada exitosamente',
    example: {
      success: true,
      message: 'Importación completada',
      summary: {
        total: 50,
        created: 15,
        updated: 30,
        skipped: 3,
        errors: 2,
      },
      details: [
        {
          radicado: '11001310300120250012300',
          status: 'created',
          message: 'Registro creado exitosamente',
        },
        {
          radicado: '11001310300120250012301',
          status: 'updated',
          message: 'Registro actualizado exitosamente',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en el archivo o formato incorrecto',
    example: {
      statusCode: 400,
      message: 'El archivo debe ser un Excel (.xlsx o .xls)',
      error: 'Bad Request',
    },
  })
  @UseInterceptors(FileInterceptor('file'))
  async importExcel(
    @UploadedFile() file: Express.Multer.File,
    @GetUser() user: IUser,
  ) {
    if (!file) {
      throw new BadRequestException('No se proporcionó ningún archivo');
    }

    return this.monolegalService.importFromExcel(file, user._id.toString());
  }

  @Post('sync')
  @ApiOperation({
    summary: 'Sincronizar procesos desde API de Monolegal',
    description: `
    Sincroniza procesos judiciales directamente desde la API de Monolegal.
    
    **Funcionalidad:**
    - Obtiene cambios del día actual (o fecha específica)
    - Si el radicado existe: Actualiza la información
    - Si el radicado NO existe: Crea un nuevo registro
    - Sincroniza demandantes, demandados y última actuación  
    `,
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiBody({
    description:
      'Fecha opcional para sincronizar (formato YYYY-MM-DD). Si no se envía, sincroniza el día actual.',
    required: false,
    schema: {
      type: 'object',
      properties: {
        fecha: {
          type: 'string',
          format: 'date',
          example: '2025-12-12',
          description: 'Fecha en formato YYYY-MM-DD (opcional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Sincronización completada exitosamente',
    example: {
      success: true,
      message: 'Sincronización completada',
      summary: {
        total: 45,
        created: 12,
        updated: 30,
        skipped: 2,
        errors: 1,
      },
      details: [
        {
          radicado: '76001310502120240023500',
          status: 'created',
          message: 'Registro creado desde API',
        },
        {
          radicado: '76001310502120240020400',
          status: 'updated',
          message: 'Registro actualizado desde API',
        },
      ],
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la sincronización',
    example: {
      statusCode: 400,
      message: 'Error al sincronizar con Monolegal: Authentication failed',
      error: 'Bad Request',
    },
  })
  async syncWithMonolegal(
    @GetUser() user: IUser,
    @Body() body?: { fecha?: string },
  ) {
    const fecha = body?.fecha ? new Date(body.fecha) : new Date();
    return this.monolegalService.syncFromApi(user._id.toString(), fecha);
  }
}
