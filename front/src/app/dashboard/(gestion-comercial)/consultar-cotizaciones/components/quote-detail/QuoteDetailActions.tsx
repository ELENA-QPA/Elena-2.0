'use client';

import { Button } from '@/components/ui/button';
import { Download, Edit, Send } from 'lucide-react';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { SendQuoteModal } from './SendQuoteModal';
import { UpdateQuoteModal } from './UpdateQuoteModal';

interface QuoteDetailActionsProps {
  quote: IQuoteWithMeta;
  onSend: () => void;
  onDownload: () => void;
  onResend: () => void;
  onBack: () => void;
}

export function QuoteDetailActions({
  quote,
  onDownload,
  onResend,
  onBack,
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
          <SendQuoteModal quote={quote} onBack={onBack} />
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
