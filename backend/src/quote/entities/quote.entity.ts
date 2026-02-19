import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// ─── Enums ────────────────────────────────────────────────────────────────────

export enum QuoteStatus {
  DRAFT = 'draft',
  PREVIEW = 'preview',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum OperationType {
  MAKE_TO_ORDER = 'make_to_order',
  MAKE_TO_STOCK = 'make_to_stock',
  HYBRID = 'hybrid',
}

export enum CurrentTechnology {
  EXCEL = 'excel',
  SOFTWARE = 'software',
  ERP_MRP = 'erp_mrp',
  NONE = 'none',
  OTHER = 'other',
}

// ─── Document Type ────────────────────────────────────────────────────────────

export type QuoteDocument = Quote & Document;

// ─── Schema ───────────────────────────────────────────────────────────────────

@Schema({ timestamps: true, collection: 'quotes' })
export class Quote {
  // ── Metadatos ──────────────────────────────────────────────────────────────

  @Prop({ required: true, unique: true })
  quoteNumber: string; 

  @Prop({ required: true, enum: QuoteStatus, default: QuoteStatus.DRAFT })
  status: QuoteStatus;

  @Prop({ required: true })
  createdBy: string; // userId del agente comercial (ref User)

  // ── HubSpot ────────────────────────────────────────────────────────────────

  @Prop({ required: false })
  hubspotCompanyId?: string;

  @Prop({ required: false })
  hubspotContactId?: string;

  @Prop({ required: false })
  hubspotDealId?: string;

  // ── 1. Datos del Cliente ───────────────────────────────────────────────────

  @Prop({ required: true, trim: true })
  companyName: string;

  @Prop({ required: true, trim: true })
  nit: string; // Sin guiones, puntos ni comas, incluye dígito verificación

  @Prop({ required: true, trim: true })
  contactName: string;

  @Prop({ required: true, trim: true })
  contactPosition: string;

  @Prop({ required: false, trim: true })
  industry?: string;

  // ── 2. Tamaño del Cliente ──────────────────────────────────────────────────

  @Prop({ required: false, min: 0 })
  totalWorkers?: number;

  @Prop({ required: false, min: 0 })
  productionWorkers?: number;

  // ── 3. Datos de Contacto ───────────────────────────────────────────────────

  @Prop({ required: true, trim: true, lowercase: true })
  email: string;

  @Prop({ type: [String], default: [] })
  phones: string[]; // Índice 0 = principal, resto = alternos

  // ── 4. Contexto Operativo ──────────────────────────────────────────────────

  @Prop({ required: false, enum: OperationType })
  operationType?: OperationType;

  @Prop({ type: [String], enum: CurrentTechnology, default: [] })
  currentTechnology: CurrentTechnology[];

  @Prop({ required: false, trim: true })
  otherTechnologyDetail?: string; // Solo aplica si currentTechnology incluye 'other'

  // ── 5. Licenciamiento ──────────────────────────────────────────────────────

  @Prop({ required: true, default: false })
  includeLicenses: boolean;

  @Prop({ required: false, min: 0, default: 0 })
  standardLicensesCount?: number;

  @Prop({ required: false, min: 0, default: 108 })
  standardLicensePriceUSD?: number; // Configurable, default $108 USD

  @Prop({ required: false, min: 0, default: 0 })
  premiumLicensesCount?: number;

  @Prop({ required: false, min: 0, default: 120 })
  premiumLicensePriceUSD?: number; // Configurable, default $120 USD

  // ── 6. Implementación ─────────────────────────────────────────────────────

  @Prop({ required: false, min: 0 })
  implementationPriceUSD?: number;

  @Prop({ required: false })
  estimatedStartDate?: Date;

  // ── Campo calculado (no persistido) ───────────────────────────────────────
  // totalQuoteUSD se calcula en el servicio:
  // (standardLicensesCount * standardLicensePriceUSD)
  // + (premiumLicensesCount * premiumLicensePriceUSD)
  // + implementationPriceUSD
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// ── Índices ───────────────────────────────────────────────────────────────────
QuoteSchema.index({ quoteNumber: 1 });
QuoteSchema.index({ status: 1 });
QuoteSchema.index({ createdBy: 1 });
QuoteSchema.index({ companyName: 'text', contactName: 'text' }); 