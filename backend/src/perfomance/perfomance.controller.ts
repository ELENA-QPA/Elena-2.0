import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody, ApiExcludeEndpoint } from '@nestjs/swagger';
import { PerfomanceService } from './perfomance.service';
import { CreatePerfomanceDto, PerformanceType } from './dto/create-perfomance.dto';
import { UpdatePerfomanceDto } from './dto/update-perfomance.dto';
import { PerfomanceResponseDto } from './dto/perfomance-response.dto';
import { CreatePerformanceWithValidationDto, StateFlowResponseDto, StateHistoryItemDto } from './dto/state-management.dto';
import { TipoEstado } from '../records/dto/create-record.dto';
import { RecordStateTypeService } from './services/record-state-type.service';

@ApiTags('Actuaciones')
@Controller('perfomance')
export class PerfomanceController {
  // -----------------------------------------------------
  constructor(
    private readonly perfomanceService: PerfomanceService,
    private readonly recordStateTypeService: RecordStateTypeService
  ) { }
  // -----------------------------------------------------
  @Post('create')
  @ApiOperation({
    summary: 'Crear una nueva actuación con validación de estados',
    description: 'Este endpoint valida que la transición de estado sea válida antes de crear la actuación'
  })
  @ApiBody({ type: CreatePerformanceWithValidationDto })
  @ApiResponse({
    status: 201,
    description: 'Actuación creada exitosamente',
    type: PerfomanceResponseDto
  })
  @ApiResponse({
    status: 400,
    description: 'Transición de estado inválida'
  })
  async createWithValidation(@Body() createDto: CreatePerformanceWithValidationDto) {
    // Si no se fuerza la transición, se valida automáticamente en el servicio
    const createPerfomanceDto: CreatePerfomanceDto = {
      record: createDto.record,
      performanceType: createDto.performanceType,
      responsible: createDto.responsible,
      observation: createDto.observation,
      document: createDto.document,
      performanceDate: createDto.performanceDate,
    };

    return this.perfomanceService.create(createPerfomanceDto);
  }
  // -----------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar actuación por ID' })
  remove(@Param('id') id: string) {
    return this.perfomanceService.remove(id);
  }
  // -----------------------------------------------------
  // @ApiExcludeEndpoint()
  // @Post('update-fields')
  // updateFields() {
  //   return this.perfomanceService.updateFields();
  // }
  // -----------------------------------------------------

}
