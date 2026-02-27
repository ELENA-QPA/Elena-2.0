'use client';

import { Button } from '@/components/ui/button';
import { Download, Edit, Send } from 'lucide-react';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { UpdateQuoteModal } from './UpdateQuoteModal';

interface QuoteDetailActionsProps {
  quote: IQuoteWithMeta;
  onSend: () => void;
  onDownload: () => void;
  onResend: () => void;
}

export function QuoteDetailActions({
  quote,
  onSend,
  onDownload,
  onResend,
}: QuoteDetailActionsProps) {
  return (
    <div className='flex items-center gap-2 shrink-0'>
      {quote.quoteStatus === 'draft' && (
        <>
          <UpdateQuoteModal
            quote={quote}
            trigger={
              <Button
                variant='outline'
                size='sm'
                className='border-elena-pink-400 text-elena-pink-600 hover:bg-elena-pink-50 hover:text-elena-pink-700'
              >
                <Edit className='h-4 w-4 mr-1.5' />
                Continuar edición
              </Button>
            }
          />
          <Button
            variant='outline'
            size='sm'
            className='border-emerald-400 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700'
            onClick={onSend}
          >
            <Send className='h-4 w-4 mr-1.5' />
            Enviar cotización
          </Button>
        </>
      )}

      {quote.quoteStatus === 'sent' && (
        <Button
          variant='outline'
          size='sm'
          className='border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-700'
          onClick={onResend}
        >
          <Send className='h-4 w-4 mr-1.5' />
          Reenviar
        </Button>
      )}

      <Button
        variant='outline'
        size='sm'
        className='border-gray-400 text-gray-600 hover:bg-gray-50 hover:text-gray-700'
        onClick={onDownload}
      >
        <Download className='h-4 w-4 mr-1.5' />
        Descargar PDF
      </Button>
    </div>
  );
}
