'use client';

import {
  AlertCircle,
  ArrowRightLeft,
  CheckCircle,
  FilePlus,
  Pencil,
  RefreshCw,
  Save,
  Send,
  XCircle,
} from 'lucide-react';
import {
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
} from '../../../_shared/types/quotes.constants';
import type {
  IQuoteWithMeta,
  ITimelineEvent,
} from '../../../_shared/types/quotes.types';
import { buildTimelineFromQuote } from '../../_lib/buildTimeline';

interface QuoteTimelineProps {
  quote: IQuoteWithMeta;
}

const EVENT_CONFIG: Record<
  string,
  { icon: typeof FilePlus; color: string; bgColor: string; label: string }
> = {
  created: {
    icon: FilePlus,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Cotización creada',
  },
  draft_saved: {
    icon: Save,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    label: 'Borrador guardado',
  },
  editing_resumed: {
    icon: Pencil,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100',
    label: 'Edición reanudada',
  },
  sent: {
    icon: Send,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Cotización enviada',
  },
  resent: {
    icon: RefreshCw,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    label: 'Reenvío realizado',
  },
  send_error: {
    icon: AlertCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Error de envío',
  },
  accepted: {
    icon: CheckCircle,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100',
    label: 'Aceptada',
  },
  rejected: {
    icon: XCircle,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
    label: 'Rechazada',
  },
  status_changed: {
    icon: ArrowRightLeft,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    label: 'Cambio de estado',
  },
};

export function QuoteTimeline({ quote }: QuoteTimelineProps) {
  const events: ITimelineEvent[] =
    quote.timeline && quote.timeline.length > 0
      ? [...quote.timeline].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        )
      : buildTimelineFromQuote(quote);
  const statusColors = QUOTE_STATUS_COLORS[quote.quoteStatus];

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return {
      date: date.toLocaleDateString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      time: date.toLocaleTimeString('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };
  };

  return (
    <div className='p-4 space-y-4'>
      <div className='rounded-lg border p-3 bg-gray-50'>
        <div className='flex items-center gap-2'>
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${statusColors.bg} ${statusColors.text}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${statusColors.dot} animate-pulse`}
            />
            {QUOTE_STATUS_LABELS[quote.quoteStatus]}
          </span>
        </div>
        <p className='text-xs text-muted-foreground mt-2'>
          Última interacción:{' '}
          {new Date(quote.updatedAt).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className='relative'>
        <div className='absolute left-4 top-0 bottom-0 w-px bg-gray-200' />

        <div className='space-y-0'>
          {events.map((event, index) => {
            const config =
              EVENT_CONFIG[event.type] ?? EVENT_CONFIG.status_changed;
            const Icon = config.icon;
            const { date, time } = formatEventDate(event.date);

            return (
              <div key={index} className='relative flex items-start gap-3 py-3'>
                <div
                  className={`relative z-10 flex items-center justify-center h-8 w-8 rounded-full ${config.bgColor} shrink-0`}
                >
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>

                <div className='flex-1 min-w-0 pt-0.5'>
                  <p className='text-sm font-medium text-gray-900'>
                    {config.label}
                  </p>
                  {event.detail && (
                    <p className='text-xs text-muted-foreground mt-0.5 truncate'>
                      {event.detail}
                    </p>
                  )}
                  <div className='flex items-center gap-2 mt-1'>
                    <span className='text-xs text-muted-foreground'>
                      {date}
                    </span>
                    <span className='text-xs text-muted-foreground'>·</span>
                    <span className='text-xs text-muted-foreground'>
                      {time}
                    </span>
                  </div>
                  {event.actor && (
                    <p className='text-xs text-muted-foreground mt-0.5'>
                      Por: {event.actor}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {events.length === 0 && (
        <div className='text-center py-8'>
          <p className='text-sm text-muted-foreground'>
            No hay eventos registrados
          </p>
        </div>
      )}
    </div>
  );
}
