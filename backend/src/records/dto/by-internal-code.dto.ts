import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ByInternalCodeDto {
    @ApiProperty({
        description: 'Número de documento del cliente demandante',
        example: '12345678'
    })
    @IsString()
    @IsNotEmpty()
    internalCode: string;
}