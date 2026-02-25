import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';

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

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar cotización' })
  remove(@Param('id') id: string) {
    return this.quoteService.remove(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar cotización' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateQuoteDto,
    @GetUser() user: User,
  ) {
    return this.quoteService.update(id, dto, user.id);
  }

  @Patch(':id/status/:status')
  @ApiOperation({ summary: 'Cambiar estado de la cotización' })
  @ApiParam({ name: 'status', enum: QUOTE_STATUS })
  updateStatus(
    @Param('id') id: string,
    @Param('status') status: QUOTE_STATUS,
    @GetUser() user: User,
  ) {
    return this.quoteService.updateStatus(id, status, user.id);
  }

  @Patch(':id/timeline')
  @ApiOperation({ summary: 'Agregar evento al timeline de la cotización' })
  addTimelineEvent(
    @Param('id') id: string,
    @Body() body: { type: string; detail: string },
    @GetUser() user: User,
  ) {
    return this.quoteService.addTimelineEvent(
      id,
      body.type,
      body.detail,
      user.id,
    );
  }
  @Get(':id/pdf')
  @ApiOperation({ summary: 'Descargar PDF de la cotización' })
  async downloadPdf(@Param('id') id: string, @Res() res: Response) {
    const pdf = await this.quoteService.generatePdf(id);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename=cotizacion-${id}.pdf`,
      'Content-Length': pdf.length,
    });
    res.end(pdf);
  }

  @Patch(':id/send')
  @ApiOperation({ summary: 'Enviar cotización por correo electrónico' })
  async sendQuote(
    @Param('id') id: string,
    @Body() body: { email?: string },
    @GetUser() user: User,
  ) {
    return this.quoteService.sendQuote(id, user.id, body.email);
  }
}
