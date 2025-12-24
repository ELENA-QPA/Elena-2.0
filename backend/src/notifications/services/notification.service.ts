import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../entities/notification.entity';
import { CreateNotificationDto } from '../dto/create-notification.dto';
import { UpdateNotificationDto } from '../dto/update-notification.dto';
import { NotificationResponseDto } from '../dto/notification-response.dto';
import { NotificationsGateway } from '../gateway/notifications.gateway';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  private toResponseDto(notification: Notification): NotificationResponseDto {
    return {
      _id: notification._id.toString(),
      audience_id: notification.audience._id.toString(),
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    };
  }

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    try {
      const notification = new this.notificationModel(createNotificationDto);
      const saved = await notification.save();

      const responseDto = this.toResponseDto(saved);
      this.notificationsGateway.emitNewNotification(responseDto);

      return saved;
    } catch (error) {
      throw new BadRequestException('Error al crear la notificación');
    }
  }

  async findAll(): Promise<NotificationResponseDto[]> {
    const notifications = await this.notificationModel
      .find()
      .populate('audience')
      .exec();

    return notifications.map((n) => this.toResponseDto(n));
  }

  async findOne(id: string): Promise<NotificationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const notification = await this.notificationModel
      .findById(id)
      .populate('audience')
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }

    return this.toResponseDto(notification);
  }

  async update(
    id: string,
    updateNotificationDto: UpdateNotificationDto,
  ): Promise<NotificationResponseDto> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const notification = await this.notificationModel
      .findByIdAndUpdate(id, updateNotificationDto, { new: true })
      .populate('audience')
      .exec();

    if (!notification) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }

    return this.toResponseDto(notification);
  }

  async remove(id: string): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID inválido');
    }

    const result = await this.notificationModel.findByIdAndDelete(id).exec();

    if (!result) {
      throw new NotFoundException(`Notificación con ID ${id} no encontrada`);
    }

    this.notificationsGateway.emitNotificationDeleted(id);
  }

  async count(): Promise<number> {
    return await this.notificationModel.countDocuments().exec();
  }
}
