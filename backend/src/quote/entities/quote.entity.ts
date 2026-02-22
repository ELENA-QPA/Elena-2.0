import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  CURRENT_TECHNOLOGY,
  OPERATION_TYPE,
  QUOTE_STATUS,
} from '../types/quote.types';

// ─── Schemas anidados ─────────────────────────────────────────────────────────

@Schema({ _id: false })
class StandardLicenses {
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalLicensesPrice: number;
}
const StandardLicensesSchema = SchemaFactory.createForClass(StandardLicenses);

@Schema({ _id: false })
class PremiumLicenses {
  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  unitPrice: number;

  @Prop({ required: true, min: 0 })
  totalLicensesPrice: number;
}
const PremiumLicensesSchema = SchemaFactory.createForClass(PremiumLicenses);

// ─── Document Type ────────────────────────────────────────────────────────────

export type QuoteDocument = Quote & Document;

// ─── Schema ───────────────────────────────────────────────────────────────────

@Schema({ timestamps: true, collection: 'quotes' })
export class Quote {
  // ── Metadatos ──────────────────────────────────────────────────────────────

  @Prop({ required: true, enum: QUOTE_STATUS, default: QUOTE_STATUS.DRAFT })
  quoteStatus: QUOTE_STATUS;

  @Prop({ required: true })
  createdBy: string; // userId del agente comercial (ref User)

  // ── HubSpot ────────────────────────────────────────────────────────────────

  /* @Prop({ required: false })
  hubspotCompanyId?: string;

  @Prop({ required: false })
  hubspotContactId?: string;

  @Prop({ required: false })
  hubspotDealId?: string; */

  // ── 1. Datos del Cliente ───────────────────────────────────────────────────

  @Prop({ required: true, trim: true })
  quoteId: string;

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true })
  nit: number;

  @Prop({ required: true, trim: true })
  contactName: string;

  @Prop({ required: true, trim: true })
  contactPosition: string;

  @Prop({ required: true, trim: true })
  industry: string;

  // ── 2. Tamaño del Cliente ──────────────────────────────────────────────────

  @Prop({ required: true, min: 1 })
  totalWorkers: number;

  @Prop({ required: true, min: 1 })
  productionWorkers: number;

  // ── 3. Datos de Contacto ───────────────────────────────────────────────────

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: [Number], default: [] })
  phones: number[]; // Índice 0 = principal, resto = alternos

  // ── 4. Contexto Operativo ──────────────────────────────────────────────────

  @Prop({ required: true, enum: OPERATION_TYPE })
  operationType: OPERATION_TYPE;

  @Prop({
    required: true,
    type: [String],
    enum: CURRENT_TECHNOLOGY,
    default: [],
  })
  currentTechnology: CURRENT_TECHNOLOGY[];

  @Prop({ required: false, trim: true })
  otherTechnologyDetail?: string; // Solo aplica si currentTechnology incluye 'other'

  // ── 5. Licenciamiento ──────────────────────────────────────────────────────

  @Prop({ required: true })
  includeLicenses: boolean;

  @Prop({ required: false, type: StandardLicensesSchema })
  standardLicenses?: StandardLicenses;

  @Prop({ required: false, type: PremiumLicensesSchema })
  premiumLicenses?: PremiumLicenses;

  // ── 6. Implementación ─────────────────────────────────────────────────────

  @Prop({ required: false, min: 0 })
  implementationPriceUSD?: number;

  @Prop({ required: false })
  estimatedStartDate?: Date;
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// ── Índices ───────────────────────────────────────────────────────────────────
QuoteSchema.index({ quoteId: 1 }, { unique: true });
QuoteSchema.index({ quoteStatus: 1 });
QuoteSchema.index({ createdBy: 1 });
QuoteSchema.index({ companyName: 'text', contactName: 'text' });
