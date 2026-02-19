import { CurrentTechnology, OperationType, QuoteStatus } from '../entities/quote.entity';

export interface IQuote {
  _id: string;
  quoteNumber: string;
  status: QuoteStatus;
  createdBy: string;

  // HubSpot
  hubspotCompanyId?: string;
  hubspotContactId?: string;
  hubspotDealId?: string;

  // Cliente
  companyName: string;
  nit: string;
  contactName: string;
  contactPosition: string;
  industry?: string;

  // Tamaño
  totalWorkers?: number;
  productionWorkers?: number;

  // Contacto
  email: string;
  phones: string[];

  // Contexto operativo
  operationType?: OperationType;
  currentTechnology: CurrentTechnology[];
  otherTechnologyDetail?: string;

  // Licenciamiento
  includeLicenses: boolean;
  standardLicensesCount?: number;
  standardLicensePriceUSD?: number;
  premiumLicensesCount?: number;
  premiumLicensePriceUSD?: number;

  // Implementación
  implementationPriceUSD?: number;
  estimatedStartDate?: Date;

  // Calculado
  totalQuoteUSD: number;

  createdAt: Date;
  updatedAt: Date;
}

export interface IQuoteTotals {
  standardSubtotalUSD: number;
  premiumSubtotalUSD: number;
  implementationPriceUSD: number;
  totalQuoteUSD: number;
}