export const TECHNOLOGY_LABELS: Record<
  (typeof TECHNOLOGY_OPTIONS)[number],
  string
> = {
  excel: 'Excel',
  erp_mrp: 'ERP/MRP',
  software: 'Software especializado',
  none: 'Ninguna',
  other: 'Otra',
};

export const TECHNOLOGY_OPTIONS = [
  'excel',
  'erp_mrp',
  'software',
  'none',
  'other',
] as const;
export type TechnologyOption = (typeof TECHNOLOGY_OPTIONS)[number];

export const OPERATION_TYPES = [
  'make_to_order',
  'make_to_stock',
  'hybrid',
] as const;
export type OperationType = (typeof OPERATION_TYPES)[number];

export const QUOTE_STATUSES = [
  'draft',
  'preview',
  'sent',
  'accepted',
  'rejected',
] as const;
export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export interface IQuote {
  quoteId: string;
  quoteStatus: QuoteStatus;
  companyName: string;
  nit: number;
  contactName: string;
  contactPosition: string;
  industry: string;
  totalWorkers: number;
  productionWorkers: number;
  email: string;
  phones: number[];
  operationType: OperationType;
  currentTechnology: TechnologyOption[];
  otherTechnologyDetail?: string;
  includeLicenses: boolean;
  standardLicenses?: {
    quantity?: number;
    unitPrice: number;
    totalLicensesPrice?: number;
  };
  premiumLicenses?: {
    quantity?: number;
    unitPrice: number;
    totalLicensesPrice?: number;
  };
  implementationPriceUSD: number;
  estimatedStartDate: Date | string;
}
