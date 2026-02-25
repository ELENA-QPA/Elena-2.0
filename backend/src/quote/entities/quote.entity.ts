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
  @Prop({ required: false, min: 1 })
  quantity: number;

  @Prop({ required: false, min: 0 })
  unitPrice: number;

  @Prop({ required: false, min: 0 })
  totalLicensesPrice: number;
}
const StandardLicensesSchema = SchemaFactory.createForClass(StandardLicenses);

@Schema({ _id: false })
class PremiumLicenses {
  @Prop({ required: false, min: 1 })
  quantity: number;

  @Prop({ required: false, min: 0 })
  unitPrice: number;

  @Prop({ required: false, min: 0 })
  totalLicensesPrice: number;
}
const PremiumLicensesSchema = SchemaFactory.createForClass(PremiumLicenses);

@Schema({ _id: false })
export class TimelineEvent {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true, default: () => new Date() })
  date: Date;

  @Prop({ required: false })
  actor?: string;

  @Prop({ required: false })
  detail?: string;
}
const TimelineEventSchema = SchemaFactory.createForClass(TimelineEvent);

// ── NUEVO: Asesor override ────────────────────────────────────────────────────

@Schema({ _id: false })
class AdvisorOverride {
  @Prop({ required: false, trim: true })
  name?: string;

  @Prop({ required: false, trim: true })
  position?: string;

  @Prop({ required: false, trim: true, lowercase: true })
  email?: string;
}
const AdvisorOverrideSchema = SchemaFactory.createForClass(AdvisorOverride);

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

  @Prop({ required: false, trim: true })
  companyAddress?: string; // NUEVO: Dirección de la empresa

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

  @Prop({ type: [String], default: [] })
  notificationEmails: string[]; // NUEVO: Emails para notificaciones contractuales

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
  otherTechnologyDetail?: string;

  @Prop({ required: false, min: 1 })
  numberOfLocations?: number; // NUEVO: Sedes o plantas

  @Prop({ required: false, trim: true })
  operationalNotes?: string; // NUEVO: Observaciones operativas

  // ── 5. Licenciamiento ──────────────────────────────────────────────────────

  @Prop({ required: true })
  includeLicenses: boolean;

  @Prop({ required: false, type: StandardLicensesSchema })
  standardLicenses?: StandardLicenses;

  @Prop({ required: false, type: PremiumLicensesSchema })
  premiumLicenses?: PremiumLicenses;

  @Prop({ required: false, enum: ['monthly', 'annual'], default: 'monthly' })
  licenseBillingPeriod?: string; // NUEVO: Periodo de facturación

  // ── 6. Implementación ─────────────────────────────────────────────────────

  @Prop({ required: false, min: 0 })
  implementationPriceUSD?: number;

  @Prop({ required: false })
  estimatedStartDate?: Date;

  @Prop({ required: false, min: 1 })
  implementationDurationWeeks?: number; // NUEVO: Duración en semanas

  @Prop({ required: false })
  estimatedGoLiveDate?: Date; // NUEVO: Fecha estimada de Go-Live

  @Prop({ required: false, trim: true })
  implementationDescription?: string; // NUEVO: Descripción para tabla del PDF

  @Prop({ required: false, trim: true })
  paymentTerms?: string; // NUEVO: Forma de pago (ej: "50% inicio, 50% Go-Live")

  // ── 7. Módulos incluidos ──────────────────────────────────────────────────

  @Prop({ type: [String], default: [] })
  includedModules: string[]; // NUEVO: Checkboxes predefinidos

  @Prop({ required: false, trim: true })
  additionalModulesDetail?: string; // NUEVO: Módulos adicionales (texto libre)

  // ── 8. Fecha de vencimiento ───────────────────────────────────────────────

  @Prop({ required: false })
  expirationDateOverride?: Date; // NUEVO: Override (si null → createdAt + 30 días)

  // ── 9. Asesor Quanta ──────────────────────────────────────────────────────

  @Prop({ required: false, type: AdvisorOverrideSchema })
  advisorOverride?: AdvisorOverride; // NUEVO: Override del asesor (si vacío → User)

  // ── 10. Timeline ──────────────────────────────────────────────────────────

  @Prop({ type: [TimelineEventSchema], default: [] })
  timeline: TimelineEvent[];
}

export const QuoteSchema = SchemaFactory.createForClass(Quote);

// ── Índices ───────────────────────────────────────────────────────────────────
QuoteSchema.index({ quoteId: 1 }, { unique: true });
QuoteSchema.index({ quoteStatus: 1 });
QuoteSchema.index({ createdBy: 1 });
QuoteSchema.index({ companyName: 'text', contactName: 'text' });