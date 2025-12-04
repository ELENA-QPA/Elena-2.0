import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';
import { ProceduralPartService } from './procedural-part.service';
import { CreateProceduralPartDto } from './dto/create-procedural-part.dto';
import { UpdateProceduralPartDto } from './dto/update-procedural-part.dto';

@ApiTags('Partes procesales')
@Controller('procedural-part')
export class ProceduralPartController {
  // -----------------------------------------------------
  constructor(private readonly proceduralPartService: ProceduralPartService) { }
  // -----------------------------------------------------
  @Post('create')
  @ApiOperation({ summary: 'Crear nueva parte procesal' })
  create(@Body() createProceduralPartDto: CreateProceduralPartDto) {
    return this.proceduralPartService.create(createProceduralPartDto);
  }
  // -----------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar parte procesal' })
  @ApiParam({ name: 'id', description: 'ID de la parte procesal' })
  update(@Param('id') id: string, @Body() updateProceduralPartDto: UpdateProceduralPartDto) {
    return this.proceduralPartService.update(id, updateProceduralPartDto);
  }
  // -----------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar parte procesal' })
  @ApiParam({ name: 'id', description: 'ID de la parte procesal' })
  remove(@Param('id') id: string) {
    return this.proceduralPartService.remove(id);
  }
  // -----------------------------------------------------


}
