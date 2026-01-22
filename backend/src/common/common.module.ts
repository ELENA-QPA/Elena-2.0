import { Module } from '@nestjs/common';
import { FileUploadController } from './controllers/file-upload.controller';
import { FileService } from './services/file.service';
import { UtilitiesService } from './services/utilities.service';

@Module({
  controllers: [FileUploadController],
  providers: [FileService, UtilitiesService],
  exports: [FileService, UtilitiesService],
})
export class CommonModule {}
