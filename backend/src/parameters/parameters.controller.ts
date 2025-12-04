import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { ParametersService } from './parameters.service';
import { CreateParameterDto } from './dto/create-parameter.dto';
import { UpdateParameterDto } from './dto/update-parameter.dto';
import { FilterParameterDto } from './dto/filter-parameter.dto';
import { PaginationDto } from 'src/common/dto/paginaton.dto';

@ApiTags('Parámetros')
@Controller('parameter')
export class ParametersController {
  // -----------------------------------------------------
  constructor(private readonly parametersService: ParametersService) { }
  // -----------------------------------------------------

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo parámetro' })
  create(@Body() createParameterDto: CreateParameterDto) {
    return this.parametersService.create(createParameterDto);
  }
  // -----------------------------------------------------

  @Post('search')
  @ApiOperation({ summary: 'Obtener parámetros con filtros y paginación' })
  @ApiResponse({ status: 200, description: 'Lista de parámetros obtenida exitosamente.' })
  @ApiResponse({ status: 400, description: 'Error al obtener los parámetros.' })
  findAll(
    @Query() paginationDto: PaginationDto,
    @Body() filterDto: FilterParameterDto
  ) {
    return this.parametersService.findAll(paginationDto, filterDto);
  }
  // -----------------------------------------------------

  // @Get(':id')
  // @ApiOperation({ summary: 'Obtener un parámetro por ID' })
  // findOne(@Param('id') id: string) {
  //   return this.parametersService.findOne(+id);
  // }

  // @Patch(':id')
  // @ApiOperation({ summary: 'Actualizar un parámetro' })
  // update(@Param('id') id: string, @Body() updateParameterDto: UpdateParameterDto) {
  //   return this.parametersService.update(+id, updateParameterDto);
  // }
 // -----------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un parámetro' })
  remove(@Param('id') id: string) {
    return this.parametersService.remove(+id);
  }
}
