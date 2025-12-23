import { Schema, SchemaFactory } from '@nestjs/mongoose';
import { Prop } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';

@Schema({ timestamps: true })
export class Notification extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Audience',
    required: true,
  })
  audience: ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
