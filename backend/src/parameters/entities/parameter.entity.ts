import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, ObjectId } from "mongoose";

@Schema({ timestamps: true })
export class Parameter extends Document {

    @Prop({ required: true })
    parameterType: string;

    @Prop({ required: true })
    parameter: string;

    @Prop({ default: null })
    parentParameter?: string;

    @Prop({ required: true })
    description: string;

    @Prop({ default: null })
    deletedAt?: Date | null;
}

export const ParameterSchema = SchemaFactory.createForClass(Parameter);

// Configure the toJSON method to exclude __v field
ParameterSchema.methods.toJSON = function () {
    const { __v, ...parameterSchema } = this.toObject();
    return parameterSchema;
}

