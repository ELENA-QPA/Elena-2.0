import { Schema } from "@nestjs/mongoose";
import { Prop, SchemaFactory } from "@nestjs/mongoose/dist";
import { ApiProperty } from "@nestjs/swagger";
import { Document } from "mongoose";
import { ValidRoles } from "../interfaces";


@Schema()
export class User extends Document {

    @Prop()
    name: string;

    @Prop()
    lastname: string;

    @Prop({
        unique: true,
        index: true
    })
    email: string;

    @Prop({
        unique: true,
        index: true,
        sparse: true // Permite valores null/undefined y asegura unicidad solo en valores definidos
    })
    phone?: string;

    @Prop()
    password: string;

    @Prop()
    isActive: boolean;

    @Prop()
    roles: ValidRoles[];

    @Prop({
    })
    verificationCode: string;

    @Prop()
    entidad: string[];

    @Prop()
    registro?: string;

    @Prop()
    he_leido: boolean

    @Prop()
    group_admin: string

    @Prop({ type: Date, default: Date.now })
    createdAt: Date;

    @Prop()
    position?: string;
}

export const UserSchema = SchemaFactory.createForClass(User)
UserSchema.methods.toJSON = function () {
    const { __v, ...user } = this.toObject();
    return user;
}