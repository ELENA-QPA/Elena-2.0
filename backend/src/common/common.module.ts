import { Module } from '@nestjs/common';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileService } from './services/file.service';
import { FileLocalService } from './services/file-local.service';
import { UtilitiesService } from './services/utilities.service';

@Module({
  controllers: [FileUploadController],
  providers: [
    FileLocalService, // ← Provee FileLocalService
    {
      provide: FileService, // ← Cuando alguien pida FileService
      useClass: FileLocalService, // ← Dale FileLocalService
    },
    UtilitiesService,
  ],
  exports: [FileService, FileLocalService, UtilitiesService], // ← Exporta ambos
})
export class CommonModule {}
