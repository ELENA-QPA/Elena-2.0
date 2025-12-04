import { ApiProperty } from "@nestjs/swagger";
import { IsOptional } from "class-validator";

export class QueryRecordsDto {
    @ApiProperty()
    @IsOptional()
    fecha?: Date;

    @ApiProperty()
    @IsOptional()
    entidad_de_salud?: string;
}
