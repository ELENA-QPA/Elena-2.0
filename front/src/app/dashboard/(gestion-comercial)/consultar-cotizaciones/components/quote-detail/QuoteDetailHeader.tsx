'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import {
  QUOTE_STATUS_COLORS,
  QUOTE_STATUS_LABELS,
} from '../../../_shared/types/quotes.constants';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { QuoteDetailActions } from './QuoteDetailActions';

interface QuoteDetailHeaderProps {
  quote: IQuoteWithMeta;
  onBack: () => void;
  onSend: () => void;
  onDownload: () => void;
  onResend: () => void;
}

export function QuoteDetailHeader({
  quote,
  onBack,
  onSend,
  onDownload,
  onResend,
}: QuoteDetailHeaderProps) {
  const statusColors = QUOTE_STATUS_COLORS[quote.quoteStatus];

  return (
    <div className='mb-4 sm:mb-6'>
      <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3'>
        <div className='flex items-center gap-3 min-w-0 flex-1'>
          <Button
            variant='ghost'
            size='sm'
            onClick={onBack}
            className='shrink-0 -ml-2'
          >
            <ArrowLeft className='h-4 w-4 mr-1' />
            Volver
          </Button>
          <div className='min-w-0'>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-lg sm:text-xl md:text-2xl font-bold truncate'>
                {quote.quoteId}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors.bg} ${statusColors.text}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${statusColors.dot}`}
                />
                {QUOTE_STATUS_LABELS[quote.quoteStatus]}
              </span>
            </div>
            <p className='text-sm text-muted-foreground mt-0.5'>
              {quote.companyName} · {quote.contactName}
            </p>
          </div>
        </div>

        <QuoteDetailActions
          quote={quote}
          onSend={onSend}
          onDownload={onDownload}
          onResend={onResend}
        />
      </div>

      <div className='flex items-center gap-4 mt-3 text-xs text-muted-foreground flex-wrap'>
        <span>
          Última actualización:{' '}
          {new Date(quote.updatedAt).toLocaleString('es-CO', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
        <span>·</span>
        <span>Email: {quote.email}</span>
      </div>
    </div>
  );
}
