// audience/audience.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { AudienceService } from '../services/audience.service';
import { CreateAudienceDto } from '../dto/create-audience.dto';
import { UpdateAudienceDto } from '../dto/update-audience.dto';
import { QueryAudienceDto } from '../dto/query-audience.dto';

@ApiTags('Audiences')
@Controller('audiences')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva audiencia' })
  @ApiResponse({ status: 201, description: 'Audiencia creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  create(@Body() createAudienceDto: CreateAudienceDto) {
    return this.audienceService.create(createAudienceDto, true);
  }

  @Post('/monolegal')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una nueva audiencia desde monolegal' })
  @ApiResponse({ status: 201, description: 'Audiencia creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  createMono(@Body() createAudienceDto: CreateAudienceDto) {
    return this.audienceService.create(createAudienceDto, false);
  }

  @Post('/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener todas las audiencias' })
  @ApiResponse({ status: 200, description: 'Lista de audiencias' })
  findAll(@Body() queryDto: QueryAudienceDto) {
    return this.audienceService.findAll(queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener una audiencia por ID' })
  @ApiResponse({ status: 200, description: 'Audiencia encontrada' })
  @ApiResponse({ status: 404, description: 'Audiencia no encontrada' })
  findOne(@Param('id') id: string) {
    return this.audienceService.findOne(id);
  }

  @Put(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Actualizar una audiencia' })
  @ApiResponse({
    status: 200,
    description: 'Audiencia actualizada exitosamente',
  })
  @ApiResponse({ status: 404, description: 'Audiencia no encontrada' })
  update(
    @Param('id') id: string,
    @Body() updateAudienceDto: UpdateAudienceDto,
  ) {
    return this.audienceService.update(id, updateAudienceDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Eliminar una audiencia (soft delete)' })
  @ApiResponse({ status: 200, description: 'Audiencia eliminada exitosamente' })
  @ApiResponse({ status: 404, description: 'Audiencia no encontrada' })
  remove(@Param('id') id: string) {
    return this.audienceService.remove(id);
  }

  @Post('/process')
  async processReminders() {
    await this.audienceService.processReminders();
    return { message: 'Recordatorios procesados' };
  }
}
