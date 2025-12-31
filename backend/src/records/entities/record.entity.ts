import { Schema } from '@nestjs/mongoose';
import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, ObjectId } from 'mongoose';
import { Estado, TipoEstado } from '../dto/create-record.dto';

@Schema()
export class Record extends Document {
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  })
  user: ObjectId;

  @Prop()
  clientType: string;

  @Prop()
  demandados: string;

  @Prop()
  internalCode: string;

  @Prop()
  department: string;

  @Prop()
  personType: string;

  @Prop()
  jurisdiction: string;

  @Prop()
  location?: string;

  @Prop()
  processType: string;

  @Prop()
  office: string;

  @Prop()
  settled: string;

  @Prop()
  city?: string;

  @Prop({ default: 'Colombia' })
  country: string;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  deletedAt: Date;

  @Prop({ type: String, enum: Estado, required: false })
  estado: Estado;

  @Prop({ type: String, enum: TipoEstado, required: false })
  type: TipoEstado;

  @Prop({ unique: true, sparse: true })
  radicado: string;

  @Prop()
  despachoJudicial: string;

  @Prop()
  etiqueta: string;

  @Prop()
  etapaProcesal: string;

  @Prop()
  ultimaActuacion: string;

  @Prop({ default: false })
  sincronizadoMonolegal: boolean;

  @Prop()
  fechaSincronizacion: Date;

  @Prop()
  ultimaAnotacion?: string;

  @Prop()
  idProcesoMonolegal?: string;
}

export const RecordSchema = SchemaFactory.createForClass(Record);
RecordSchema.methods.toJSON = function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { __v, ...record } = this.toObject();
  return record;
};
