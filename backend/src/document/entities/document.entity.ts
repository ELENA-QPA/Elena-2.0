import { Schema } from '@nestjs/mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { SubdocumentDto } from '../dto/create-document.dto';

@Schema({ timestamps: true })
export class Documento extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Record',
    required: true,
  })
  record: ObjectId;

  @Prop({ required: true })
  category: string;

  @Prop({ required: true })
  documentType: string;

  @Prop({ required: true })
  document: string;

  @Prop({ required: true, enum: Object.values(SubdocumentDto) })
  subdocument: SubdocumentDto;

  @Prop({ required: true })
  settledDate: Date;

  @Prop({ required: true, unique: true })
  consecutive: string;

  @Prop({ required: true })
  consecutiveNumber: number;

  @Prop({ required: true })
  responsibleType: string;

  @Prop({ required: true })
  responsible: string;

  @Prop()
  url: string;

  @Prop()
  observations: string;

  @Prop()
  deletedAt?: Date;
}

export const DocumentoSchema = SchemaFactory.createForClass(Documento);

// Configure the toJSON method to exclude __v field
DocumentoSchema.methods.toJSON = function () {
  const { __v, ...documentoSchema } = this.toObject();
  return documentoSchema;
};

DocumentoSchema.index(
  { record: 1, document: 1, consecutiveNumber: 1 },
  { unique: true },
);
