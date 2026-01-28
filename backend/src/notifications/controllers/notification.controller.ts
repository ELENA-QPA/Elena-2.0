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
import { NotificationService } from '../services/notification.service';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import {
  NotificationCountResponse,
  NotificationResponse,
} from '../interfaces/notification.interface';

@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crear una notificación' })
  @ApiResponse({
    status: 201,
    description: 'Notificación creada correctamente',
    type: NotificationResponse,
  })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Obtener todas las notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Listado de notificaciones',
    type: [NotificationResponse],
  })
  findAll() {
    return this.notificationService.findAll();
  }

  @Get('count')
  @ApiOperation({ summary: 'Obtener cantidad total de notificaciones' })
  @ApiResponse({
    status: 200,
    description: 'Cantidad total',
    type: NotificationCountResponse,
  })
  async count() {
    const count = await this.notificationService.count();
    return { count };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una notificación por ID' })
  @ApiParam({
    name: 'id',
    description: 'ID de la notificación',
    example: '696a5246df54fb51bd3bb5ca',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación encontrada',
    type: NotificationResponse,
  })
  findOne(@Param('id') id: string) {
    return this.notificationService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una notificación' })
  @ApiParam({
    name: 'id',
    description: 'ID de la notificación',
    example: '696a5246df54fb51bd3bb5ca',
  })
  @ApiResponse({
    status: 200,
    description: 'Notificación actualizada',
    type: NotificationResponse,
  })
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
  ) {
    return this.notificationService.update(id, updateNotificationDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar una notificación' })
  @ApiParam({
    name: 'id',
    description: 'ID de la notificación',
    example: '696a5246df54fb51bd3bb5ca',
  })
  @ApiResponse({
    status: 204,
    description: 'Notificación eliminada correctamente',
  })
  remove(@Param('id') id: string) {
    return this.notificationService.remove(id);
  }
}
