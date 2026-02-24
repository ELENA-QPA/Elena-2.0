// Reutilizamos los tipos existentes del módulo de generación
import type { IQuote, QuoteStatus } from '../../generar-cotizacion/types/quotes.types';

// Re-exportamos para uso local
export type { IQuote, QuoteStatus };

// ─── Labels y colores para la UI de la grilla ────────────────────────────────

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  draft: 'Borrador',
  preview: 'Vista previa',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
};

export const QUOTE_STATUS_COLORS: Record<
  QuoteStatus,
  { bg: string; text: string; dot: string }
> = {
  draft: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    dot: 'bg-gray-400',
  },
  preview: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    dot: 'bg-blue-400',
  },
  sent: {
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    dot: 'bg-amber-400',
  },
  accepted: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    dot: 'bg-emerald-400',
  },
  rejected: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    dot: 'bg-red-400',
  },
};

export const OPERATION_TYPE_LABELS: Record<string, string> = {
  make_to_order: 'Make to Order',
  make_to_stock: 'Make to Stock',
  hybrid: 'Híbrido',
};

// ─── Interface extendida con campos que vienen del GET (timestamps, _id, totales) ─

export interface IQuoteWithMeta extends IQuote {
  _id: string;
  createdBy: string;
  totalQuoteUSD?: number;
  createdAt: string;
  updatedAt: string;
  timeline?: ITimelineEvent[];
}

// ─── Timeline ────────────────────────────────────────────────────────────────

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

export function buildTimelineFromQuote(quote: IQuoteWithMeta): ITimelineEvent[] {
  const events: ITimelineEvent[] = [];

  events.push({
    type: 'created',
    date: quote.createdAt,
    detail: `Cotización ${quote.quoteId} creada`,
  });

  if (quote.updatedAt !== quote.createdAt) {
    events.push({
      type: 'draft_saved',
      date: quote.updatedAt,
      detail: 'Borrador guardado',
    });
  }

  if (quote.quoteStatus === 'sent') {
    events.push({
      type: 'sent',
      date: quote.updatedAt,
      detail: `Enviada a ${quote.email}`,
    });
  }

  if (quote.quoteStatus === 'accepted') {
    events.push({
      type: 'accepted',
      date: quote.updatedAt,
      detail: 'Cotización aceptada por el cliente',
    });
  }

  if (quote.quoteStatus === 'rejected') {
    events.push({
      type: 'rejected',
      date: quote.updatedAt,
      detail: 'Cotización rechazada por el cliente',
    });
  }

  return events.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}