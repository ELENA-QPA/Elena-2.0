import { Injectable, BadRequestException } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuid } from 'uuid';
import * as fs from 'fs';
import { promisify } from 'util';

const unlinkAsync = promisify(fs.unlink);

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
export class FileLocalService {
  private uploadPath = join(process.cwd(), 'public', 'uploads');

  // Usar memoryStorage igual que FileService
  static multerConfig = {
    storage: memoryStorage(),
    fileFilter: (req, file, cb) => {
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

  constructor() {
    // Crear directorio si no existe
    if (!fs.existsSync(this.uploadPath)) {
      fs.mkdirSync(this.uploadPath, { recursive: true });
    }
    console.log('📁 Archivos se guardarán en:', this.uploadPath);
  }

  validateFiles(files: UploadedFile[]): boolean {
    if (!files || files.length === 0) {
      return true;
    }

    if (files.length > 10) {
      throw new BadRequestException(
        'No se pueden subir más de 10 archivos a la vez',
      );
    }

    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        throw new BadRequestException(
          `El archivo ${file.originalname} excede el tamaño máximo de 10MB`,
        );
      }

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
          `Tipo de archivo no permitido: ${file.mimetype}`,
        );
      }
    });

    return true;
  }

  async processUploadedFiles(files: UploadedFile[]): Promise<any[]> {
    console.log('🔥🔥🔥 ENTRANDO A FileLocalService.processUploadedFiles');
    console.log('🔥 Archivos recibidos:', files?.length);
    if (!files || files.length === 0) {
      return [];
    }

    try {
      const uploadPromises = files.map(async (file) => {
        const fileExtension = extname(file.originalname);
        const fileName = `${uuid()}${fileExtension}`;
        const filePath = join(this.uploadPath, fileName);

        // Escribir el buffer al disco
        await fs.promises.writeFile(filePath, file.buffer);

        return {
          originalName: file.originalname,
          filename: fileName,
          size: file.size,
          mimetype: file.mimetype,
          url: `/uploads/${fileName}`,
          localPath: filePath,
        };
      });

      const processedFiles = await Promise.all(uploadPromises);
      console.log('✅ Archivos guardados localmente:', processedFiles.length);
      return processedFiles;
    } catch (error) {
      console.error('Error processing uploaded files:', error);
      throw new BadRequestException(
        `Error al procesar archivos: ${error.message}`,
      );
    }
  }

  async uploadOneFile(file: any): Promise<string> {
    try {
      const fileExtension = extname(file.originalname);
      const fileName = `${Date.now()}-${uuid()}${fileExtension}`;
      const filePath = join(this.uploadPath, fileName);

      // Escribir el buffer al disco
      await fs.promises.writeFile(filePath, file.buffer);

      console.log('✅ Archivo guardado:', fileName);
      return `/uploads/${fileName}`;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new BadRequestException(`Error al subir archivo: ${error.message}`);
    }
  }

  async uploadMultipleFiles(files: any[]): Promise<string[]> {
    const uploadPromises = files.map((file) => this.uploadOneFile(file));
    return Promise.all(uploadPromises);
  }

  async deleteFile(key: string): Promise<void> {
    try {
      // key puede ser una URL como "/uploads/filename.pdf" o solo "filename.pdf"
      const filename = key.split('/').pop();
      const filepath = join(this.uploadPath, filename);

      if (fs.existsSync(filepath)) {
        await unlinkAsync(filepath);
        console.log('🗑️ Archivo eliminado:', filename);
      } else {
        console.log('⚠️ Archivo no encontrado:', filename);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }
}
