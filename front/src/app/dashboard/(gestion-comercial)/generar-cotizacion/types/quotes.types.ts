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

export const OPERATION_TYPES = [
  'make_to_order',
  'make_to_stock',
  'hybrid',
] as const;

export const QUOTE_STATUSES = [
  'draft',
  'preview',
  'sent',
  'accepted',
  'rejected',
] as const;
