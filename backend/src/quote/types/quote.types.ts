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

export interface ILicenses {
  quantity: number;
  unitPrice: number;
  totalLicensesPrice: number;
}

export interface IQuote {
  _id: string;
  quoteStatus: QUOTE_STATUS;
  createdBy: string;
  quoteId: string;

  // Cliente
  companyName: string;
  nit: number;
  contactName: string;
  contactPosition: string;
  industry?: string;

  // Tamaño
  totalWorkers?: number;
  productionWorkers?: number;

  // Contacto
  email: string;
  phones: number[];

  // Contexto operativo
  operationType?: OPERATION_TYPE;
  currentTechnology: CURRENT_TECHNOLOGY[];
  otherTechnologyDetail?: string;

  // Licenciamiento
  includeLicenses: boolean;
  standardLicenses?: ILicenses;
  premiumLicenses?: ILicenses;

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
