import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationService } from './services/notification.service';
import { NotificationController } from './controllers/notification.controller';
import {
  Notification,
  NotificationSchema,
} from './entities/notification.entity';
import { NotificationsGateway } from './gateway/notifications.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationsGateway],
  exports: [NotificationService],
})
export class NotificationModule {}
