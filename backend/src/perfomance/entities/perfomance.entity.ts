import { Schema } from '@nestjs/mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { Document, ObjectId } from 'mongoose';

@Schema({ timestamps: true })
export class Performance extends Document {
  // @Prop({
  //     type: mongoose.Schema.Types.ObjectId,
  //     ref: 'User',
  //     required: true
  // })
  // user: ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  })
  record: ObjectId;

  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Document',
    required: false,
  })
  document: ObjectId;

  @Prop()
  performanceType: string;

  @Prop()
  responsible: string;

  @Prop()
  observation: string;

  @Prop()
  fecha: Date;

  @Prop()
  fuente: string;

  @Prop()
  deletedAt: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PerfomanceSchema = SchemaFactory.createForClass(Performance);
PerfomanceSchema.methods.toJSON = function () {
  const { __v, ...performanceSchema } = this.toObject();
  return performanceSchema;
};
