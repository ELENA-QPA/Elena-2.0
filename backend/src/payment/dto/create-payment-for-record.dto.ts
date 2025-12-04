import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsNumber, IsDateString, IsString, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreatePaymentValueDto {
    @ApiProperty()
    @IsNumber()
    value: number;

    @ApiProperty()
    @IsDateString()
    causationDate: string;

    @ApiProperty()
    @IsDateString()
    paymentDate: string;
}

export class CreatePaymentForRecordDto {
    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    successBonus?: boolean;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    bonusPercentage?: number;

    @ApiProperty()
    @IsOptional()
    @IsNumber()
    bonusPrice?: number;

    @ApiProperty()
    @IsOptional()
    @IsDateString()
    bonusCausationDate?: string;

    @ApiProperty()
    @IsOptional()
    @IsDateString()
    bonusPaymentDate?: string;

    @ApiProperty()
    @IsOptional()
    @IsString()
    notes?: string;

    @ApiProperty({ type: [CreatePaymentValueDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreatePaymentValueDto)
    paymentValues: CreatePaymentValueDto[];
}
