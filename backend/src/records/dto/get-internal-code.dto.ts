import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class getInternalCodeByIdDto {
    @ApiProperty({
        description: 'Id de un record',
        example: '6aerg4.....'
    })
    @IsString()
    @IsNotEmpty()
    id: string;
}