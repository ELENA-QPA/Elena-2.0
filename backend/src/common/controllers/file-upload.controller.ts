import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  Body,
  BadRequestException,
  UseGuards,
  Delete,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  FileService,
  UploadedFile as CustomUploadedFile,
} from '../services/file.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { GetUser } from 'src/auth/decorators';
import { IUser } from 'src/records/interfaces/user.interface';

@ApiTags('Subida de Archivos')
@Controller('file-upload')
export class FileUploadController {
  constructor(private readonly fileService: FileService) {}

  @ApiOperation({
    summary: 'Subir un archivo único a S3',
    description:
      'Permite subir un archivo único a Amazon S3. Formatos soportados: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Tamaño máximo: 10MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivo para subir',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Archivo a subir (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX - Max: 10MB)',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Archivo subido exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Archivo subido exitosamente' },
        data: {
          type: 'object',
          properties: {
            originalName: { type: 'string', example: 'documento.pdf' },
            filename: { type: 'string', example: 'documents/uuid-123.pdf' },
            size: { type: 'number', example: 1024000 },
            mimetype: { type: 'string', example: 'application/pdf' },
            url: {
              type: 'string',
              example: 'https://bucket.s3.amazonaws.com/documents/uuid-123.pdf',
            },
            s3Key: { type: 'string', example: 'documents/uuid-123.pdf' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación del archivo',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Tipo de archivo no permitido' },
        error: { type: 'string', example: 'BadRequestException' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('single')
  @UseInterceptors(FileInterceptor('file', FileService.multerConfig))
  async uploadSingleFile(@UploadedFile() file: any, @GetUser() user: IUser) {
    try {
      if (!file) {
        throw new BadRequestException('No se ha proporcionado ningún archivo');
      }

      // Validar el archivo usando el servicio
      this.fileService.validateFiles([file]);

      // Procesar y subir el archivo
      const result = await this.fileService.processUploadedFiles([file]);

      return {
        success: true,
        message: 'Archivo subido exitosamente',
        data: result[0],
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Error al subir el archivo',
        error: error.name || 'BadRequestException',
      });
    }
  }

  @ApiOperation({
    summary: 'Subir múltiples archivos a S3',
    description:
      'Permite subir hasta 10 archivos simultáneamente a Amazon S3. Formatos soportados: PDF, JPG, PNG, DOC, DOCX, XLS, XLSX. Tamaño máximo por archivo: 10MB',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Archivos para subir (máximo 10)',
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description:
            'Archivos a subir (PDF, JPG, PNG, DOC, DOCX, XLS, XLSX - Max: 10MB cada uno, máximo 10 archivos)',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Archivos subidos exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Archivos subidos exitosamente' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              originalName: { type: 'string', example: 'documento.pdf' },
              filename: { type: 'string', example: 'documents/uuid-123.pdf' },
              size: { type: 'number', example: 1024000 },
              mimetype: { type: 'string', example: 'application/pdf' },
              url: {
                type: 'string',
                example:
                  'https://bucket.s3.amazonaws.com/documents/uuid-123.pdf',
              },
              s3Key: { type: 'string', example: 'documents/uuid-123.pdf' },
            },
          },
        },
        count: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error en la validación de archivos',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: {
          type: 'string',
          example: 'No se pueden subir más de 10 archivos a la vez',
        },
        error: { type: 'string', example: 'BadRequestException' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('multiple')
  @UseInterceptors(FilesInterceptor('files', 10, FileService.multerConfig))
  async uploadMultipleFiles(
    @UploadedFiles() files: any[],
    @GetUser() user: IUser,
  ) {
    try {
      if (!files || files.length === 0) {
        throw new BadRequestException('No se han proporcionado archivos');
      }

      // Validar los archivos usando el servicio
      this.fileService.validateFiles(files);

      // Procesar y subir los archivos
      const results = await this.fileService.processUploadedFiles(files);

      return {
        success: true,
        message: 'Archivos subidos exitosamente',
        data: results,
        count: results.length,
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Error al subir los archivos',
        error: error.name || 'BadRequestException',
      });
    }
  }

  @ApiOperation({
    summary: 'Eliminar archivo de S3',
    description: 'Elimina un archivo de Amazon S3 usando su clave (s3Key)',
  })
  @ApiResponse({
    status: 200,
    description: 'Archivo eliminado exitosamente',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Archivo eliminado exitosamente' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Error al eliminar el archivo',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: 'Error al eliminar el archivo' },
        error: { type: 'string', example: 'BadRequestException' },
      },
    },
  })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':s3Key')
  async deleteFile(@Param('s3Key') s3Key: string, @GetUser() user: IUser) {
    try {
      // Decodificar la clave S3 si viene codificada en la URL
      const decodedKey = decodeURIComponent(s3Key);

      await this.fileService.deleteFile(decodedKey);

      return {
        success: true,
        message: 'Archivo eliminado exitosamente',
      };
    } catch (error) {
      throw new BadRequestException({
        success: false,
        message: error.message || 'Error al eliminar el archivo',
        error: error.name || 'BadRequestException',
      });
    }
  }

  @ApiOperation({
    summary: 'Información sobre tipos de archivo soportados',
    description:
      'Obtiene información sobre los tipos de archivo soportados y límites',
  })
  @ApiResponse({
    status: 200,
    description: 'Información de configuración de archivos',
    schema: {
      type: 'object',
      properties: {
        allowedMimeTypes: {
          type: 'array',
          items: { type: 'string' },
          example: [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/png',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          ],
        },
        maxFileSize: { type: 'string', example: '10MB' },
        maxFiles: { type: 'number', example: 10 },
      },
    },
  })
  @Post('info')
  getFileUploadInfo() {
    return {
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ],
      allowedExtensions: [
        '.pdf',
        '.jpg',
        '.jpeg',
        '.png',
        '.doc',
        '.docx',
        '.xls',
        '.xlsx',
      ],
      maxFileSize: '10MB',
      maxFiles: 10,
      supportedFormats: {
        documents: ['PDF', 'DOC', 'DOCX'],
        images: ['JPG', 'JPEG', 'PNG'],
        spreadsheets: ['XLS', 'XLSX'],
      },
    };
  }
}
