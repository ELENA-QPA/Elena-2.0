export enum INCLUDED_MODULE {
  PRODUCTION = 'production',
  INVENTORY = 'inventory',
  PURCHASING = 'purchasing',
  COMMERCIAL = 'commercial',
  HR = 'hr',
  ANALYTICS = 'analytics',
}

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

export interface IAdvisorOverride {
  name?: string;
  position?: string;
  email?: string;
}

export enum LICENSE_BILLING_PERIOD {
  MONTHLY = 'monthly',
  ANNUAL = 'annual',
}

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
  companyAddress?: string;
  notificationEmails: string[];
  numberOfLocations?: number;
  operationalNotes?: string;
  licenseBillingPeriod?: LICENSE_BILLING_PERIOD;
  implementationDurationWeeks?: number;
  estimatedGoLiveDate?: string;
  implementationDescription?: string;
  paymentTerms?: string;
  includedModules: string[];
  additionalModulesDetail?: string;
  expirationDateOverride?: string;
  advisorOverride?: IAdvisorOverride;
}

export interface IQuoteWithMeta extends IQuote {
  _id: string;
  createdBy: string;
  totalQuoteUSD?: number;
  createdAt: string;
  updatedAt: string;
  timeline?: ITimelineEvent[];
}

export type TimelineEventType =
  | 'created'
  | 'draft_saved'
  | 'editing_resumed'
  | 'sent'
  | 'resent'
  | 'send_error'
  | 'accepted'
  | 'rejected'
  | 'status_changed';

export interface ITimelineEvent {
  type: TimelineEventType;
  date: string;
  actor?: string;
  detail?: string;
}
