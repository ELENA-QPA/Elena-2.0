'use client';

import { Button } from '@/components/ui/button';
import { Eye, FileText } from 'lucide-react';
import { currencyUSD } from '../../../../_shared/lib/formatters';
import type { IQuoteWithMeta } from '../../../../_shared/types/quotes.types';
import { QuoteStatusBadge } from './QuoteStatusBadge';

interface QuoteCardMobileProps {
  quotes: IQuoteWithMeta[];
  onSelectQuote: (quote: IQuoteWithMeta) => void;
}

export function QuoteCardMobile({
  quotes,
  onSelectQuote,
}: QuoteCardMobileProps) {
  if (quotes.length === 0) {
    return (
      <div className='text-center py-12 text-muted-foreground'>
        <FileText className='h-12 w-12 mx-auto mb-3 text-gray-300' />
        <p>No hay cotizaciones registradas</p>
      </div>
    );
  }

  return (
    <div className='lg:hidden space-y-3'>
      {quotes.map(quote => (
        <div
          key={quote._id}
          className='bg-white border rounded-lg p-3 shadow-sm cursor-pointer hover:border-elena-pink-300 transition-colors'
          onClick={() => onSelectQuote(quote)}
        >
          <div className='flex justify-between items-start mb-2'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2'>
                <span className='font-mono text-xs text-elena-pink-600 font-medium'>
                  {quote.quoteId}
                </span>
                <QuoteStatusBadge status={quote.quoteStatus} />
              </div>
              <h3 className='font-semibold text-gray-900 truncate text-sm mt-1'>
                {quote.companyName}
              </h3>
            </div>
            <div className='flex gap-1 ml-2'>
              <Button
                variant='ghost'
                size='sm'
                className='h-7 w-7 p-0'
                onClick={e => {
                  e.stopPropagation();
                  onSelectQuote(quote);
                }}
              >
                <Eye className='h-3 w-3' />
              </Button>
            </div>
          </div>

          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div>
              <span className='text-gray-500'>Contacto:</span>
              <p className='font-medium truncate'>{quote.contactName}</p>
            </div>
            <div>
              <span className='text-gray-500'>Total:</span>
              <p className='font-medium'>
                {quote.totalQuoteUSD ? currencyUSD(quote.totalQuoteUSD) : '—'}
              </p>
            </div>
          </div>

          <div className='mt-2 pt-2 border-t flex justify-between items-center text-xs text-gray-500'>
            <span>
              Creada: {new Date(quote.createdAt).toLocaleDateString('es-CO')}
            </span>
            <span>
              Actualizada:{' '}
              {new Date(quote.updatedAt).toLocaleDateString('es-CO')}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
