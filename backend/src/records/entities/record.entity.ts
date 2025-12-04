import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";
import { IsOptional } from "class-validator";
import { Estado, TipoEstado } from '../dto/create-record.dto';





@Schema()
export class Record extends Document {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    })
    user: ObjectId;

    @Prop()
    clientType: string;

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

    @Prop({ default: "Colombia" })
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

}

export const RecordSchema = SchemaFactory.createForClass(Record);
RecordSchema.methods.toJSON = function () {
    const { __v, ...record } = this.toObject();
    return record;
}
