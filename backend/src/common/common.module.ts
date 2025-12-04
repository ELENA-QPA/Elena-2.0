import { Module } from '@nestjs/common';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileService } from './services/file.service';
import { FileLocalService } from './services/file-local.service';

@Module({
  controllers: [FileUploadController],
  providers: [
    FileLocalService, // ← Provee FileLocalService
    {
      provide: FileService, // ← Cuando alguien pida FileService
      useClass: FileLocalService, // ← Dale FileLocalService
    },
  ],
  exports: [FileService, FileLocalService], // ← Exporta ambos
})
export class CommonModule {}
