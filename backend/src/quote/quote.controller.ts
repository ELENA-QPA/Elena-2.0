import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { GetUser } from '../auth/decorators/get-user.decorator';
import { User } from '../auth/entities/user.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateQuoteDto } from './dto/create-quote.dto';
import { QueryQuoteDto } from './dto/query-quote.dto';
import { UpdateQuoteDto } from './dto/update-quote.dto';
import { QuoteService } from './quote.service';
import { QUOTE_STATUS } from './types/quote.types';

@ApiTags('QUANTA - Cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('quotes')
export class QuoteController {
  constructor(private readonly quoteService: QuoteService) {}

  @Post()
  @ApiOperation({ summary: 'Crear nueva cotización (inicia como borrador)' })
  create(@Body() dto: CreateQuoteDto, @GetUser() user: User) {
    return this.quoteService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Listar cotizaciones con filtros y paginación' })
  findAll(@Query() query: QueryQuoteDto) {
    return this.quoteService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Obtener cotización por ID (incluye totales calculados)',
  })
  @ApiParam({ name: 'id', description: 'MongoDB ObjectId de la cotización' })
  findOne(@Param('id') id: string) {
    return this.quoteService.findOneWithTotals(id);
  }

  @Get('quote/:quoteId')
  @ApiOperation({ summary: 'Obtener cotización por quoteId (ej: QT-OPFWPZGM)' })
  @ApiParam({ name: 'quoteId', example: 'QT-OPFWPZGM' })
  findByQuoteId(@Param('quoteId') quoteId: string) {
    return this.quoteService.findByQuoteId(quoteId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotización' })
  update(@Param('id') id: string, @Body() dto: UpdateQuoteDto) {
    return this.quoteService.update(id, dto);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Cambiar estado de la cotización' })
  @ApiParam({ name: 'status', enum: QUOTE_STATUS })
  updateStatus(@Param('id') id: string, @Param('status') status: QUOTE_STATUS) {
    return this.quoteService.updateStatus(id, status);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  remove(@Param('id') id: string) {
    return this.quoteService.remove(id);
  }
}
