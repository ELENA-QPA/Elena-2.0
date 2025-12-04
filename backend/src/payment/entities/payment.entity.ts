import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose";
import { ApiProperty } from "@nestjs/swagger";
import mongoose, { Document, ObjectId } from "mongoose";

@Schema({ timestamps: true })
export class Payment extends Document {

    @Prop({
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Record',
        required: true
    })
    record: ObjectId;

    @Prop()
    successBonus: boolean;

    @Prop()
    bonusPercentage: number;

    @Prop()
    bonusPrice: number;

    @Prop()
    bonusCausationDate: Date;

    @Prop()
    bonusPaymentDate: Date;

    @Prop()
    notes: string

    @Prop()
    deletedAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
PaymentSchema.methods.toJSON = function () {
    const { __v, ...paymentSchema } = this.toObject();
    return paymentSchema;
}

