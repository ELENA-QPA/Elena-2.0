import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { Documento, DocumentoSchema } from './entities/document.entity';
import { CommonModule } from 'src/common/common.module';
//import { FileService } from 'src/common/services/file.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Documento.name, schema: DocumentoSchema },
    ]),
    CommonModule,
  ],
  controllers: [DocumentController],
  providers: [DocumentService],
  exports: [DocumentService],
})
export class DocumentModule {}
