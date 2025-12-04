import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { DocumentService } from './document.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { CreateDocumentWithRecordDto } from './dto/create-document-with-record.dto';
import { CreateDocumentMultipartDto } from './dto/create-document-multipart.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiConsumes,
} from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ObjectId } from 'mongoose';
import { FileInterceptor } from '@nestjs/platform-express';
//import { FileService } from 'src/common/services/file.service';
import { FileLocalService } from 'src/common/services/file-local.service';

@ApiTags('Documentos')
@Controller('document')
export class DocumentController {
  // -----------------------------------------------------
  constructor(private readonly documentService: DocumentService) {}
  // -----------------------------------------------------
  @Post('create')
  @ApiOperation({ summary: 'Crear nuevo documento' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', FileLocalService.multerConfig))
  create(
    @Body() createDocumentDto: CreateDocumentMultipartDto,
    @UploadedFile() file: any,
  ) {
    // Extraer los datos del documento del DTO multipart
    const documentData: CreateDocumentDto = {
      category: createDocumentDto.category,
      documentType: createDocumentDto.documentType,
      document: createDocumentDto.document as any, // Convertir string a DocumentDto enum
      subdocument: createDocumentDto.subdocument,
      settledDate: createDocumentDto.settledDate,
      consecutive: createDocumentDto?.consecutive,
      responsibleType: createDocumentDto.responsibleType,
      responsible: createDocumentDto.responsible,
      observations: createDocumentDto.observations,
    };

    return this.documentService.createWithFile(
      documentData,
      createDocumentDto.recordId as any as ObjectId,
      file,
    );
  }
  // -----------------------------------------------------
  @Get(':id')
  @ApiOperation({ summary: 'Obtener un documento por ID' })
  @ApiParam({ name: 'id', description: 'ID del documento' })
  findOne(@Param('id') id: string) {
    return this.documentService.findOne(id);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Actualizar un documento existente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateDocumentDto: UpdateDocumentDto,
  ) {
    return this.documentService.update(id, updateDocumentDto);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Subir archivo a un documento existente' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @ApiConsumes('multipart/form-data')
  //@UseInterceptors(FileInterceptor('file', FileService.multerConfig))
  @UseInterceptors(FileInterceptor('file', FileLocalService.multerConfig))
  @Post(':id/upload-file')
  uploadFile(@Param('id') id: string, @UploadedFile() file: any) {
    if (!file) {
      throw new Error('El archivo es requerido');
    }
    return this.documentService.addFileToDocument(id, file);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Obtener archivos de un documento' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @Get(':id/files')
  getDocumentFiles(@Param('id') id: string) {
    return this.documentService.getDocumentFiles(id);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Eliminar archivo de un documento' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @Delete(':id/files')
  removeFile(@Param('id') id: string) {
    return this.documentService.removeFileFromDocument(id);
  }
  // -----------------------------------------------------
  @ApiOperation({ summary: 'Eliminar un documento por ID' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiParam({ name: 'id', description: 'ID del documento' })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentService.remove(id);
  }
  // -----------------------------------------------------
}
