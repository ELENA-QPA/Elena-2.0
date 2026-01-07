import { Schema } from '@nestjs/mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { EstadoAudiencia } from '../interfaces/audience.interfaces';

@Schema({ timestamps: true })
export class Audience extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
  })
  record: ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  lawyer: ObjectId;

  @Prop({
    enum: EstadoAudiencia,
    default: EstadoAudiencia.PROGRAMADA,
  })
  state: EstadoAudiencia;

  @Prop()
  start: Date;

  @Prop()
  end: Date;

  @Prop()
  link?: string;

  @Prop()
  is_valid: boolean;

  @Prop()
  monto?: number;

  @Prop()
  deletedAt?: Date;
  @Prop({
    type: {
      oneMonth: { sent: Boolean, sentAt: Date },
      fifteenDays: { sent: Boolean, sentAt: Date },
      oneDay: { sent: Boolean, sentAt: Date },
      oneDayAfterCreation: { sent: Boolean, sentAt: Date, scheduledFor: Date },
    },
    default: {
      oneMonth: { sent: false, sentAt: null },
      fifteenDays: { sent: false, sentAt: null },
      oneDay: { sent: false, sentAt: null },
      oneDayAfterCreation: { sent: false, sentAt: null, scheduledFor: null },
    },
  })
  notifications?: {
    oneMonth: { sent: boolean; sentAt?: Date };
    fifteenDays: { sent: boolean; sentAt?: Date };
    oneDay: { sent: boolean; sentAt?: Date };
    oneDayAfterCreation: {
      sent: boolean;
      sentAt?: Date;
      scheduledFor?: Date;
    };
  };
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);
