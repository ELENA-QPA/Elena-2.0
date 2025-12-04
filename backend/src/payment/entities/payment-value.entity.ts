import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { Document, ObjectId } from "mongoose";

@Schema({ timestamps: true })
export class PaymentValue extends Document {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        required: true
    })
    payment: ObjectId;

    @Prop()
    value: number;

    @Prop()
    causationDate: Date;

    @Prop()
    paymentDate: Date;

    @Prop()
    deletedAt: Date;
}

export const PaymentValueSchema = SchemaFactory.createForClass(PaymentValue);
PaymentValueSchema.methods.toJSON = function () {
    const { __v, ...paymentValueSchema } = this.toObject();
    return paymentValueSchema;
}

