import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateParameterDto {
    @ApiProperty()
    @IsString({ message: "El campo 'parameterType' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'parameterType' es requerido" })
    parameterType: string;

    @ApiProperty()
    @IsString({ message: "El campo 'parameter' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'parameter' es requerido" })
    parameter: string;

    @ApiProperty()
    @IsString({ message: "El campo 'parentParameter' debe ser un string" })
    @IsOptional()
    parentParameter?: string;

    @ApiProperty()
    @IsString({ message: "El campo 'description' debe ser un string" })
    @IsNotEmpty({ message: "El campo 'description' es requerido" })
    description: string;
}
