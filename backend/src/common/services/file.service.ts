import { Storage } from '@google-cloud/storage';
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
  private storage: Storage;
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
    this.storage = new Storage({
      projectId: this.configService.get('GCP_PROJECT_ID'),
      credentials: {
        client_email: this.configService.get('GCP_CLIENT_EMAIL'),
        private_key: this.configService
          .get('GCP_PRIVATE_KEY')
          .replace(/\\n/g, '\n'),
      },
    });
    this.bucketName = this.configService.get<string>('GCP_BUCKET_NAME');
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

  async processUploadedFiles(files: UploadedFile[]): Promise<any[]> {
    if (!files || files.length === 0) {
      return [];
    }

    try {
      const bucket = this.storage.bucket(this.bucketName);

      const uploadPromises = files.map(async (file) => {
        const fileExtension = extname(file.originalname);
        const fileName = `documents/${uuid()}${fileExtension}`;

        const blob = bucket.file(fileName);

        const blobStream = blob.createWriteStream({
          resumable: false,
          metadata: {
            contentType: file.mimetype,
          },
        });

        await new Promise((resolve, reject) => {
          blobStream.on('error', (err) => reject(err));
          blobStream.on('finish', () => resolve(true));
          blobStream.end(file.buffer);
        });

        const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;

        return {
          originalName: file.originalname,
          filename: fileName,
          size: file.size,
          mimetype: file.mimetype,
          url: publicUrl,
          gcsKey: fileName,
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

  async uploadOneFile(file: any): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const fileName = `${Date.now()}-${file.originalname}`;
    const blob = bucket.file(fileName);

    const blobStream = blob.createWriteStream({
      resumable: false,
      metadata: {
        contentType: file.mimetype,
      },
    });

    await new Promise((resolve, reject) => {
      blobStream.on('error', (err) => reject(err));
      blobStream.on('finish', () => resolve(true));
      blobStream.end(file.buffer);
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    return publicUrl;
  }

  async uploadMultipleFiles(files: any[]): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);

    const uploadPromises = files.map(async (file) => {
      const fileName = `${Date.now()}-${file.originalname}`;
      const blob = bucket.file(fileName);

      const blobStream = blob.createWriteStream({
        resumable: false,
        metadata: {
          contentType: file.mimetype,
        },
      });

      await new Promise((resolve, reject) => {
        blobStream.on('error', (err) => reject(err));
        blobStream.on('finish', () => resolve(true));
        blobStream.end(file.buffer);
      });

      return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
    });

    return await Promise.all(uploadPromises);
  }

  async deleteFile(url: string): Promise<void> {
    try {
      const fileName = url.split(`${this.bucketName}/`)[1];

      if (!fileName) {
        throw new Error('No se pudo extraer el nombre del archivo de la URL');
      }

      const bucket = this.storage.bucket(this.bucketName);
      await bucket.file(fileName).delete();
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  async getSignedUrl(
    fileName: string,
    expiresInMinutes: number = 60,
  ): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);

      const [exists] = await file.exists();
      if (!exists) {
        throw new BadRequestException('El archivo no existe');
      }

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw new BadRequestException(
        `Error al generar URL de descarga: ${error.message}`,
      );
    }
  }
  async getMultipleSignedUrls(
    fileNames: string[],
    expiresInMinutes: number = 60,
  ): Promise<Array<{ fileName: string; signedUrl: string }>> {
    const urlPromises = fileNames.map(async (fileName) => {
      const signedUrl = await this.getSignedUrl(fileName, expiresInMinutes);
      return { fileName, signedUrl };
    });

    return await Promise.all(urlPromises);
  }
}
