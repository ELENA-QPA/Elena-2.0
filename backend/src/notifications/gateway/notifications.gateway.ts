import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
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

  private readonly logger = new Logger(NotificationsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);

    // Autenticar al cliente aquí
    // const token = client.handshake.auth.token;
    // if (!token) client.disconnect();

    // Uunir al cliente a una room específica
    // const userId = extractUserIdFromToken(token);
    // client.join(`user-${userId}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);

    // Hacer cleanup aquí
    // removeClientFromActiveList(client.id);
  }

  emitNewNotification(notification: NotificationResponseDto): void {
    this.logger.log('Emitiendo nueva notificación');
    this.server.emit('newNotification', notification);
  }

  emitNotificationDeleted(notificationId: string): void {
    this.logger.log(`Emitiendo eliminación de notificación: ${notificationId}`);
    this.server.emit('notificationDeleted', notificationId);
  }

  emitToUser(userId: string, notification: NotificationResponseDto): void {
    this.server.to(`user-${userId}`).emit('newNotification', notification);
  }
}
