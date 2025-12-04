import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";

@Schema({ timestamps: true })
export class Intervener extends Document {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true
    })
    record: ObjectId;

    @Prop({ required: true })
    intervenerType: string;

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

export const IntervenerSchema = SchemaFactory.createForClass(Intervener);

// Configure the toJSON method to exclude __v field
IntervenerSchema.methods.toJSON = function () {
    const { __v, ...intervenerSchema } = this.toObject();
    return intervenerSchema;
}
