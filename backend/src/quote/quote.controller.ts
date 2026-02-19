import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,  
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { QuoteService } from './quote.service';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { QuoteStatus } from './entities/quote.entity';

// Ajusta estos imports según tus guards/decorators existentes
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
// import { GetUser } from '../auth/decorators/get-user.decorator';

@ApiTags('ELENA - Cotizaciones')
@ApiBearerAuth()
// @UseGuards(JwtAuthGuard)  ← descomenta cuando conectes auth
@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva cotización (inicia como borrador)' })
  create(
    @Body() dto: CreateQuoteDto,
    // @GetUser('id') userId: string, 
  ) {
    const userId = 'temp-user-id'; 
    return this.quoteService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones con filtros y paginación' })
  findAll(@Query() query: QueryQuoteDto) {
    return this.quoteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener cotización por ID (incluye totales calculados)' })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId de la cotización' })
  findOne(@Param('id') id: string) {
    return this.quoteService.findOneWithTotals(id);
  }

  @Get('number/:quoteNumber')
  @ApiOperation({ summary: 'Obtener cotización por número (ej: ELENA-2025-0001)' })
  @ApiParam({ name: 'quoteNumber', example: 'ELENA-2025-0001' })
  findByNumber(@Param('quoteNumber') quoteNumber: string) {
    return this.quoteService.findByQuoteNumber(quoteNumber);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotización' })
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quoteService.update(id, dto);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Cambiar estado de la cotización' })
  @ApiParam({ name: 'status', enum: QuoteStatus })
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: QuoteStatus,
  ) {
    return this.quoteService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  remove(@Param('id') id: string) {
    return this.quoteService.remove(id);
  }
}