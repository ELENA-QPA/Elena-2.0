import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FilterParameterDto {
    @ApiProperty()
    @IsOptional()
    @IsString({ message: "El campo 'parameterType' debe ser un string" })
    parameterType?: string;
}
