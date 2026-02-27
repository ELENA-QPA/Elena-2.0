import { Button } from '@/components/ui/button';
import { Eye, Trash2 } from 'lucide-react';
import type { IQuoteWithMeta } from '../../../../_shared/types/quotes.types';
import { UpdateQuoteModal } from '../../quote-detail/UpdateQuoteModal';

interface QuoteRowActionsProps {
  quote: IQuoteWithMeta;
  onSelectQuote: (quote: IQuoteWithMeta) => void;
  onDelete: (quote: IQuoteWithMeta) => void;
}

export function QuoteRowActions({
  quote,
  onSelectQuote,
  onDelete,
}: QuoteRowActionsProps) {
  return (
    <div className='flex items-center justify-center gap-1'>
      <Button
        variant='ghost'
        size='sm'
        className='h-8 w-8 p-0 hover:text-primary-foreground'
        onClick={() => onSelectQuote(quote)}
        title='Ver detalle'
      >
        <Eye className='h-4 w-4' />
      </Button>
      {quote.quoteStatus === 'draft' && (
        <>
          <UpdateQuoteModal quote={quote} />
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 hover:text-primary-foreground'
            title='Eliminar'
            onClick={() => onDelete(quote)}
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </>
      )}
    </div>
  );
}
