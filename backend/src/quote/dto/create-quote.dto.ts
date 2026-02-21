import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';
import {
  CURRENT_TECHNOLOGY,
  OPERATION_TYPE,
  QUOTE_STATUS,
} from '../types/quote.types';

export class StandardLicensesDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 108 })
  @IsNumber()
  @Min(108)
  unitPrice: number;

  @ApiProperty({ example: 432 })
  @IsNumber()
  @Min(108)
  totalLicensesPrice: number;
}

export class PremiumLicensesDto {
  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({ example: 120 })
  @IsNumber()
  @Min(120)
  unitPrice: number;

  @ApiProperty({ example: 240 })
  @IsNumber()
  @Min(120)
  totalLicensesPrice: number;
}

export class CreateQuoteDto {
  // ── HubSpot ──────────────────────────────────────────────────────────────

  /*  @ApiPropertyOptional({ description: 'ID de la empresa en HubSpot' })
  @IsOptional()
  @IsString()
  hubspotCompanyId?: string;

  @ApiPropertyOptional({ description: 'ID del contacto en HubSpot' })
  @IsOptional()
  @IsString()
  hubspotContactId?: string;

  @ApiPropertyOptional({ description: 'ID del negocio (deal) en HubSpot' })
  @IsOptional()
  @IsString()
  hubspotDealId?: string; */

  // ── 1. Datos del Cliente ─────────────────────────────────────────────────

  @ApiProperty({ description: 'Id de la cotizacion' })
  @IsNotEmpty()
  @IsString()
  quoteId: string;

  @ApiProperty({
    description: 'Estado de la cotizacion',
    enum: QUOTE_STATUS,
    default: QUOTE_STATUS.DRAFT,
  })
  @IsOptional()
  @IsEnum(QUOTE_STATUS)
  quoteStatus: QUOTE_STATUS = QUOTE_STATUS.DRAFT;

  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description:
      'NIT sin guiones, puntos ni comas. Incluye dígito de verificación',
    example: '9001234565',
  })
  @IsNotEmpty()
  @IsNumber()
  nit: number;

  @ApiProperty({ description: 'Industria / sector de la empresa' })
  @IsNotEmpty()
  @IsString()
  industry: string;

  // ── 2. Tamaño del Cliente ────────────────────────────────────────────────

  @ApiProperty({ description: 'Número total de trabajadores' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  totalWorkers: number;

  @ApiProperty({ description: 'Trabajadores en producción' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  productionWorkers: number;

  // ── 3. Datos de Contacto ─────────────────────────────────────────────────

  @ApiProperty({ description: 'Nombre completo del contacto' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({ description: 'Cargo del contacto en la empresa' })
  @IsNotEmpty()
  @IsString()
  contactPosition: string;

  @ApiProperty({ description: 'Correo electrónico principal del contacto' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description:
      'Teléfonos: índice 0 = principal (obligatorio), el resto = alternos (opcionales)',
    type: [Number],
    minItems: 1,
    example: [2345821823, 1234358232],
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsNumber({}, { each: true })
  phones: number[];

  // ── 4. Contexto Operativo ────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Tipo de operación',
    enum: OPERATION_TYPE,
  })
  @IsNotEmpty()
  @IsEnum(OPERATION_TYPE)
  operationType: OPERATION_TYPE;

  @ApiPropertyOptional({
    description: 'Tecnología actual usada por el cliente',
    enum: CURRENT_TECHNOLOGY,
    isArray: true,
  })
  @IsNotEmpty()
  @IsArray()
  @ArrayMinSize(1)
  @IsEnum(CURRENT_TECHNOLOGY, { each: true })
  currentTechnology: CURRENT_TECHNOLOGY[];

  @ApiPropertyOptional({
    description: 'Detalle si currentTechnology incluye "other"',
  })
  @ValidateIf((o) => o.currentTechnology?.includes(CURRENT_TECHNOLOGY.OTHER))
  @IsNotEmpty({
    message: 'Debes especificar la tecnología actual (campo "other")',
  })
  @IsString()
  otherTechnologyDetail?: string;

  // ── 5. Licenciamiento ────────────────────────────────────────────────────

  @ApiProperty({ description: '¿Se cotizan licencias en esta propuesta?' })
  @IsNotEmpty()
  @IsBoolean()
  includeLicenses: boolean;

  @ApiProperty({ description: 'Licencias Standard', type: StandardLicensesDto })
  @IsNotEmpty()
  @ValidateIf((o) => o.includeLicenses === true)
  @ValidateNested()
  @Type(() => StandardLicensesDto)
  standardLicenses: StandardLicensesDto;

  @ApiProperty({ description: 'Licencias Premium', type: PremiumLicensesDto })
  @IsNotEmpty()
  @ValidateIf((o) => o.includeLicenses === true)
  @ValidateNested()
  @Type(() => PremiumLicensesDto)
  premiumLicenses: PremiumLicensesDto;

  // ── 6. Implementación ───────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Precio de implementación en USD' })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  implementationPriceUSD?: number;

  @ApiPropertyOptional({
    description: 'Fecha estimada de inicio de implementación',
  })
  @IsNotEmpty()
  @IsDateString()
  estimatedStartDate: string;
}
