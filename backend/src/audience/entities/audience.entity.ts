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
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);
