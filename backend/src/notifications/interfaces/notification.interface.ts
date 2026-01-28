import { ObjectId } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
export interface INotification {
  _id?: ObjectId;
  audience: ObjectId;
  message: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class NotificationResponse {
  @ApiProperty({ example: '696a5246df54fb51bd3bb5ca' })
  _id: string;

  @ApiProperty({ example: '696a5246df54fb51bd3bb5c8' })
  audience_id: string;

  @ApiProperty({
    example: 'Faltantes start: faltante, end: faltante',
  })
  message: string;

  @ApiProperty({
    example: '2026-01-16T14:59:18.817Z',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-01-16T14:59:18.817Z',
  })
  updatedAt: string;
}

export class NotificationCountResponse {
  @ApiProperty({ example: 26 })
  count: number;
}
