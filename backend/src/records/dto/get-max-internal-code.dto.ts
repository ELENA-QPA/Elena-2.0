import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetMaxInternalCodeDto {
    @ApiProperty({
        description: 'Tipo de proceso para buscar el mayor código interno',
        example: 'Rappi'
    })
    @IsString({ message: "El campo 'processType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'processType' es requerido" })
    processType: string;
}
