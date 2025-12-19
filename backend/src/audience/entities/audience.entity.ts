
import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { EstadoAudiencia } from "../interfaces/audience.interfaces";

@Schema({ timestamps: true })
export class Audience extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  })
  record: ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  })
  lawyer: ObjectId;

  @Prop({ 
    enum: EstadoAudiencia, 
    default: EstadoAudiencia.PROGRAMADA 
  })
  state: EstadoAudiencia;

  @Prop({ required: true })
  start: Date;

  @Prop({ required: true })
  end: Date;

  @Prop()
  link?: string;

  @Prop({ default: false})
  is_valid: boolean;

  @Prop({ type: Date })
  deletedAt?: Date;
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);