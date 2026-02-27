import type { IQuoteWithMeta, ITimelineEvent } from '../../_shared/types/quotes.types';

export function buildTimelineFromQuote(
  quote: IQuoteWithMeta
): ITimelineEvent[] {
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
