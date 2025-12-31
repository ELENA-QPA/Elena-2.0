import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { NotificationResponseDto } from '../dto/notification-response.dto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {}

  handleDisconnect(client: Socket) {}

  emitNewNotification(notification: NotificationResponseDto): void {
    this.server.emit('newNotification', notification);
  }

  emitNotificationDeleted(notificationId: string): void {
    this.server.emit('notificationDeleted', notificationId);
  }

  emitToUser(userId: string, notification: NotificationResponseDto): void {
    this.server.to(`user-${userId}`).emit('newNotification', notification);
  }
}
