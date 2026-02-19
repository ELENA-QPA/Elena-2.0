import {
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
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CurrentTechnology, OperationType } from '../entities/quote.entity';
import {
  DEFAULT_PREMIUM_LICENSE_PRICE_USD,
  DEFAULT_STANDARD_LICENSE_PRICE_USD,
} from '../constants/quote.constants';

export class CreateQuoteDto {
  // ── HubSpot ──────────────────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'ID de la empresa en HubSpot' })
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
  hubspotDealId?: string;

  // ── 1. Datos del Cliente ─────────────────────────────────────────────────

  @ApiProperty({ description: 'Nombre de la empresa' })
  @IsNotEmpty()
  @IsString()
  companyName: string;

  @ApiProperty({
    description: 'NIT sin guiones, puntos ni comas. Incluye dígito de verificación',
    example: '9001234565',
  })
  @IsNotEmpty()
  @IsString()
  nit: string;

  @ApiProperty({ description: 'Nombre completo del contacto' })
  @IsNotEmpty()
  @IsString()
  contactName: string;

  @ApiProperty({ description: 'Cargo del contacto en la empresa' })
  @IsNotEmpty()
  @IsString()
  contactPosition: string;

  @ApiPropertyOptional({ description: 'Industria / sector de la empresa' })
  @IsOptional()
  @IsString()
  industry?: string;

  // ── 2. Tamaño del Cliente ────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Número total de trabajadores' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  totalWorkers?: number;

  @ApiPropertyOptional({ description: 'Trabajadores en producción' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  productionWorkers?: number;

  // ── 3. Datos de Contacto ─────────────────────────────────────────────────

  @ApiProperty({ description: 'Correo electrónico principal del contacto' })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'Teléfonos: índice 0 = principal, el resto = alternos',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  phones?: string[];

  // ── 4. Contexto Operativo ────────────────────────────────────────────────

  @ApiPropertyOptional({
    description: 'Tipo de operación',
    enum: OperationType,
  })
  @IsOptional()
  @IsEnum(OperationType)
  operationType?: OperationType;

  @ApiPropertyOptional({
    description: 'Tecnología actual usada por el cliente',
    enum: CurrentTechnology,
    isArray: true,
  })
  @IsOptional()
  @IsArray()
  @IsEnum(CurrentTechnology, { each: true })
  currentTechnology?: CurrentTechnology[];

  @ApiPropertyOptional({
    description: 'Detalle si currentTechnology incluye "other"',
  })
  @ValidateIf((o) => o.currentTechnology?.includes(CurrentTechnology.OTHER))
  @IsNotEmpty({ message: 'Debes especificar la tecnología actual (campo "other")' })
  @IsString()
  otherTechnologyDetail?: string;

  // ── 5. Licenciamiento ────────────────────────────────────────────────────

  @ApiProperty({ description: '¿Se cotizan licencias en esta propuesta?' })
  @IsBoolean()
  includeLicenses: boolean;

  @ApiPropertyOptional({ description: 'Cantidad de licencias Standard' })
  @ValidateIf((o) => o.includeLicenses === true)
  @IsNumber()
  @Min(0)
  standardLicensesCount?: number;

  @ApiPropertyOptional({
    description: `Precio unitario licencia Standard en USD (default: $${DEFAULT_STANDARD_LICENSE_PRICE_USD})`,
    default: DEFAULT_STANDARD_LICENSE_PRICE_USD,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  standardLicensePriceUSD?: number;

  @ApiPropertyOptional({ description: 'Cantidad de licencias Premium' })
  @ValidateIf((o) => o.includeLicenses === true)
  @IsNumber()
  @Min(0)
  premiumLicensesCount?: number;

  @ApiPropertyOptional({
    description: `Precio unitario licencia Premium en USD (default: $${DEFAULT_PREMIUM_LICENSE_PRICE_USD})`,
    default: DEFAULT_PREMIUM_LICENSE_PRICE_USD,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  premiumLicensePriceUSD?: number;

  // ── 6. Implementación ───────────────────────────────────────────────────

  @ApiPropertyOptional({ description: 'Precio de implementación en USD' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  implementationPriceUSD?: number;

  @ApiPropertyOptional({ description: 'Fecha estimada de inicio de implementación' })
  @IsOptional()
  @IsDateString()
  estimatedStartDate?: string;
}