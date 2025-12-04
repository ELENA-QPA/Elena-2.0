import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { IntervenerService } from './intervener.service';
import { CreateIntervenerDto } from './dto/create-intervener.dto';
import { UpdateIntervenerDto } from './dto/update-intervener.dto';

@ApiTags('Intervinientes')
@Controller('intervener')
export class IntervenerController {
  // -----------------------------------------------------
  constructor(private readonly intervenerService: IntervenerService) { }
  // -----------------------------------------------------
  @Post('create')
  @ApiOperation({ summary: 'Crear nuevo interviniente' })
  create(@Body() createIntervenerDto: CreateIntervenerDto) {
    return this.intervenerService.create(createIntervenerDto);
  }
  // -----------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar interviniente' })
  @ApiParam({ name: 'id', description: 'ID del interviniente' })
  update(@Param('id') id: string, @Body() updateIntervenerDto: UpdateIntervenerDto) {
    return this.intervenerService.update(id, updateIntervenerDto);
  }
  // -----------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar interviniente' })
  @ApiParam({ name: 'id', description: 'ID del interviniente' })
  remove(@Param('id') id: string) {
    return this.intervenerService.remove(id);
  }
  // -----------------------------------------------------
}
