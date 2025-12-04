import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { memoryStorage } from 'multer';
import { v4 as uuid } from 'uuid';
import { extname } from 'path';

export interface UploadedFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  destination?: string;
  filename?: string;
  path?: string;
  buffer: Buffer;
}

@Injectable()
export class FileService {
  private s3: S3Client;
  private bucketName: string;

  // Configuración de Multer para documentos (usando memoria para S3)
  static multerConfig = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
      // Filtrar tipos de archivo permitidos
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new BadRequestException('Tipo de archivo no permitido'), false);
      }
    },
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  };

  // -----------------------------------------------------
  constructor(private configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.configService.get<string>('AWS_REGION'),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.configService.get<string>(
          'AWS_SECRET_ACCESS_KEY',
        ),
      },
    });
    this.bucketName = this.configService.get<string>('BUCKET_NAME');
  }
  // -----------------------------------------------------

  // Validar archivos antes de procesarlos
  validateFiles(files: UploadedFile[]): boolean {
    if (!files || files.length === 0) {
      return true; // Los archivos son opcionales
    }

    // Validar que no excedan el límite de archivos
    if (files.length > 10) {
      throw new BadRequestException(
        'No se pueden subir más de 10 archivos a la vez',
      );
    }

    // Validar cada archivo individualmente
    files.forEach((file, index) => {
      // Validar tamaño
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(
          `El archivo ${file.originalname} excede el tamaño máximo de 10MB`,
        );
      }

      // Validar tipo MIME
      const allowedMimeTypes = [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      ];

      if (!allowedMimeTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          `Tipo de archivo no permitido: ${file.mimetype} en ${file.originalname}`,
        );
      }
    });

    return true;
  }

  // Procesar archivos subidos usando S3
  async processUploadedFiles(files: UploadedFile[]): Promise<any[]> {
    if (!files || files.length === 0) {
      return [];
    }

    try {
      // Subir archivos a S3 de forma paralela
      const uploadPromises = files.map(async (file) => {
        const fileExtension = extname(file.originalname);
        const fileName = `documents/${uuid()}${fileExtension}`;

        const upload = new Upload({
          client: this.s3,
          params: {
            Bucket: this.bucketName,
            Key: fileName,
            Body: file.buffer,
            ContentType: file.mimetype,
            // ACL: 'public-read'
          },
        });

        const result = await upload.done();

        return {
          originalName: file.originalname,
          filename: fileName,
          size: file.size,
          mimetype: file.mimetype,
          url: result.Location,
          s3Key: fileName,
        };
      });

      const processedFiles = await Promise.all(uploadPromises);
      return processedFiles;
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      throw new BadRequestException(
        `Error al procesar archivos: ${error.message}`,
      );
    }
  }

  // -----------------------------------------------------
  async uploadOneFile(file: any): Promise<string> {
    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucketName,
        Key: `${Date.now()}-${file.originalname}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      },
    });
    const result = await upload.done();
    return result.Location; // Retorna la URL del archivo subido
  }
  // -----------------------------------------------------

  async uploadMultipleFiles(files: any[]): Promise<string[]> {
    const uploadPromises = files.map((file) => {
      const upload = new Upload({
        client: this.s3,
        params: {
          Bucket: this.bucketName,
          Key: `${Date.now()}-${file.originalname}`,
          Body: file.buffer,
          ContentType: file.mimetype,
        },
      });
      return upload.done();
    });

    const results = await Promise.all(uploadPromises);
    return results.map((result) => result.Location); // Retorna las URLs de los archivos subidos
  }
  // -----------------------------------------------------
  async deleteFile(url: string): Promise<void> {
    try {
      const key = url.split('/').pop();
      console.log('Deleting file:', key);

      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });
      const res = await this.s3.send(command);
      console.log(res);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
  // -----------------------------------------------------
}
