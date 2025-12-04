import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";


export enum PartType {
    demandante = 'demandante',
    demandada = 'demandada'
}

@Schema({ timestamps: true })
export class ProceduralPart extends Document {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true
    })
    record: ObjectId;

    @Prop({ required: true, enum: PartType })
    partType: PartType;

    @Prop({ required: true })
    name: string;

    @Prop({ required: true })
    documentType: string;

    @Prop({ required: true })
    document: string;

    @Prop({ required: true })
    email: string;

    @Prop({ required: true })
    contact: string;

    @Prop()
    deletedAt?: Date;
}

export const ProceduralPartSchema = SchemaFactory.createForClass(ProceduralPart);

// Configure the toJSON method to exclude __v field
ProceduralPartSchema.methods.toJSON = function () {
    const { __v, ...proceduralPartSchema } = this.toObject();
    return proceduralPartSchema;
}
