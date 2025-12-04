import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

@ApiTags('Payments')
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) { }

  @Post()
  @ApiOperation({ summary: 'Crear un payment con payment values' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentService.create(createPaymentDto);
  }
  // -----------------------------------------------------
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un payment' })
  update(@Param('id') id: string, @Body() updatePaymentDto: UpdatePaymentDto) {
    return this.paymentService.update(id, updatePaymentDto);
  }
  // -----------------------------------------------------
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un payment' })
  remove(@Param('id') id: string) {
    return this.paymentService.remove(id);
  }
}
