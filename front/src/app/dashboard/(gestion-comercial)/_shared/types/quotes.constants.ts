import type { QuoteStatus, TechnologyOption } from './quotes.types';

export const TECHNOLOGY_LABELS: Record<TechnologyOption, string> = {
  excel: 'Excel',
  erp_mrp: 'ERP/MRP',
  software: 'Software especializado',
  none: 'Ninguna',
  other: 'Otra',
};

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  make_to_order: 'Make to Order',
  make_to_stock: 'Make to Stock',
  hybrid: 'Híbrido',
};

export const QUOTE_STATUS_COLORS: Record<
  QuoteStatus,
  { bg: string; text: string; dot: string }
> = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-400' },
  preview: { bg: 'bg-blue-100', text: 'text-blue-700', dot: 'bg-blue-400' },
  sent: { bg: 'bg-amber-100', text: 'text-amber-700', dot: 'bg-amber-400' },
  accepted: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-400' },
};

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  preview: 'Vista previa',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

export const MODULE_OPTIONS = [
  { value: 'production', label: 'Producción' },
  { value: 'inventory', label: 'Inventarios y Stock' },
  { value: 'purchasing', label: 'Compras' },
  { value: 'commercial', label: 'Gestión Comercial' },
  { value: 'hr', label: 'Talento Humano' },
  { value: 'analytics', label: 'Tableros y Analítica' },
] as const;
