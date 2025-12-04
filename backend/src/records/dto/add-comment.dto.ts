import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsMongoId, IsNotEmpty, IsOptional, IsString } from "class-validator";
import mongoose, { ObjectId } from "mongoose";
import { Estado } from "./create-record.dto";

export class AddCommentDto {
    @ApiProperty()
    @IsMongoId({ message: "El campo 'prescripción' debe ser un MongoId" })
    @IsNotEmpty({ message: "El campo 'prescripción' es requerido" })
    prescriptionId: mongoose.Types.ObjectId;

    @ApiProperty()
    @IsString({ message: "El campo 'comentario' debe ser un string" })
    @IsOptional()
    comentario: string

    @ApiProperty()
    @IsOptional()
    @IsEnum(Estado, { message: "El campo estado debe ser un enum" })
    estado: Estado;



}