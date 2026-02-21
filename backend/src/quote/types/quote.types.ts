export enum QUOTE_STATUS {
  DRAFT = 'draft',
  PREVIEW = 'preview',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum OPERATION_TYPE {
  MAKE_TO_ORDER = 'make_to_order',
  MAKE_TO_STOCK = 'make_to_stock',
  HYBRID = 'hybrid',
}

export enum CURRENT_TECHNOLOGY {
  EXCEL = 'excel',
  SOFTWARE = 'software',
  ERP_MRP = 'erp_mrp',
  NONE = 'none',
  OTHER = 'other',
}

export interface IQuote {
  _id: string;
  quoteNumber: string;
  status: QUOTE_STATUS;
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
  operationType?: OPERATION_TYPE;
  currentTechnology: CURRENT_TECHNOLOGY[];
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
