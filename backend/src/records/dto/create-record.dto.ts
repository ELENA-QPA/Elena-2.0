import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsDate, IsEnum, IsMongoId, IsNotEmpty, IsNumber, IsOptional, IsString, ValidateNested } from "class-validator";
import { ObjectId } from "mongoose";

export enum Estado {
    RADICADO = 'RADICADO',
    INADMITIDO = 'INADMITIDO',
    SUBSANACION = 'SUBSANACION',
    ADMITE = 'ADMITE',
    NOTIFICACION_PERSONAL = 'NOTIFICACION_PERSONAL',
    CONTESTACION_DEMANDA = 'CONTESTACION_DEMANDA',
    INADMITE_CONTESTACION = 'INADMITE_CONTESTACION',
    ADMISION_CONTESTACION = 'ADMISION_CONTESTACION',
    FIJA_AUDIENCIA = 'FIJA_AUDIENCIA',
    CELEBRA_AUDIENCIA = 'CELEBRA_AUDIENCIA',
    CONCILIADO = 'CONCILIADO',
    ARCHIVADO = 'ARCHIVADO',
    RETIRO_DEMANDA = 'RETIRO_DEMANDA',
    FINALIZADO_SENTENCIA = 'FINALIZADO_SENTENCIA',
    FINALIZADO_RECHAZO = 'FINALIZADO_RECHAZO',
    RADICA_IMPULSO_PROCESAL = 'RADICA_IMPULSO_PROCESAL',
}

export enum TipoEstado {
    ACTIVO = 'ACTIVO',
    FINALIZADO = 'FINALIZADO',
}

export enum ClientType {
    RAPPI = 'Rappi',
    UBBER = 'Uber',
    DIDI = 'Didi',
    OTRO = 'Otro'
}

export class CreateRecordDto {

    @ApiProperty({
        description: 'Tipo de cliente (REQUERIDO)',
        enum: ClientType,
        example: ClientType.RAPPI
    })
    @IsEnum(ClientType, { message: "El campo 'clientType' debe ser un valor válido del enum ClientType" })
    @IsNotEmpty({ message: "El campo 'clientType' es requerido" })
    clientType: ClientType;

    @ApiProperty({ description: 'Responsable del caso' })
    @IsString({ message: "El campo 'responsible' debe ser un string" })
    @IsOptional()
    responsible?: string;

    @ApiProperty({ description: 'Departamento' })
    @IsString({ message: "El campo 'department' debe ser un string" })
    @IsOptional()
    department: string;

    @ApiProperty({ description: 'Tipo de persona' })
    @IsString({ message: "El campo 'personType' debe ser un string" })
    @IsOptional()
    personType: string;

    @ApiProperty({ description: 'Jurisdicción' })
    @IsString({ message: "El campo 'jurisdiction' debe ser un string" })
    @IsOptional()
    jurisdiction: string;

    @ApiProperty({ description: 'Ubicación' })
    @IsString({ message: "El campo 'location' debe ser un string" })
    @IsOptional()
    location: string;

    @ApiProperty({ description: 'Tipo de proceso' })
    @IsString({ message: "El campo 'processType' debe ser un string" })
    @IsOptional()
    processType: string;

    @ApiProperty({ description: 'Oficina' })
    @IsString({ message: "El campo 'office' debe ser un string" })
    @IsOptional()
    office: string;

    @ApiProperty({ description: 'Asentado' })
    @IsString({ message: "El campo 'settled' debe ser un string" })
    @IsOptional()
    settled: string;

    @ApiProperty({ description: 'Ciudad' })
    @IsString({ message: "El campo 'city' debe ser un string" })
    @IsOptional()
    city: string;

    @ApiProperty({ description: 'País' })
    @IsString({ message: "El campo 'country' debe ser un string" })
    @IsOptional()
    country: string;


    // @ApiProperty({
    //     description: 'Estado del expediente',
    //     enum: Estado,
    //     default: Estado.RADICADO
    // })
    // @IsEnum(Estado, { message: "El campo 'estado' debe ser un valor válido del enum Estado" })
    // @IsOptional()
    estado: Estado;

}
