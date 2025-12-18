import { Schema } from '@nestjs/mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { states } from '../interfaces/audience.state';

@Schema({ timestamps: true })
export class Audience extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  })
  record: ObjectId;

  @Prop()
  state: states;

  @Prop()
  judged: string;

  @Prop()
  start: Date;

  @Prop()
  end: Date;

  @Prop()
  link: string;

  @Prop()
  resume: Text;

  @Prop()
  isValid: Boolean;

  @Prop()
  createddAt?: Date;
}

export const AudienceSchema = SchemaFactory.createForClass(Audience);

// Configure the toJSON method to exclude __v field
AudienceSchema.methods.toJSON = function () {
  const { __v, ...AudienceSchema } = this.toObject();
  return AudienceSchema;
};
