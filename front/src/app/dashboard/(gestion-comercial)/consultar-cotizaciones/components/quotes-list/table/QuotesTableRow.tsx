import { TableCell, TableRow } from '@/components/ui/table';
import { currencyUSD } from '../../../../_shared/lib/formatters';
import type { IQuoteWithMeta } from '../../../../_shared/types/quotes.types';
import { QuoteStatusBadge } from './QuoteStatusBadge';
import { QuoteRowActions } from './QuoteRowActions';

interface QuotesTableRowProps {
  quote: IQuoteWithMeta;
  onSelectQuote: (quote: IQuoteWithMeta) => void;
  onDelete: (quote: IQuoteWithMeta) => void;
}

export function QuotesTableRow({
  quote,
  onSelectQuote,
  onDelete,
}: QuotesTableRowProps) {
  return (
    <TableRow
      className='hover:bg-gray-50 cursor-pointer'
      onClick={() => onSelectQuote(quote)}
    >
      <TableCell className='font-mono text-xs text-elena-pink-600 font-medium'>
        {quote.quoteId}
      </TableCell>
      <TableCell className='text-sm max-w-[200px] truncate'>
        {quote.companyName}
      </TableCell>
      <TableCell className='text-sm'>
        <div>
          <p className='truncate'>{quote.contactName}</p>
          <p className='text-xs text-muted-foreground truncate'>
            {quote.email}
          </p>
        </div>
      </TableCell>
      <TableCell>
        <QuoteStatusBadge status={quote.quoteStatus} />
      </TableCell>
      <TableCell className='text-sm font-medium'>
        {quote.totalQuoteUSD ? currencyUSD(quote.totalQuoteUSD) : '—'}
      </TableCell>
      <TableCell className='text-xs text-muted-foreground'>
        {new Date(quote.createdAt).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </TableCell>
      <TableCell className='text-xs text-muted-foreground'>
        {new Date(quote.updatedAt).toLocaleDateString('es-CO', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        })}
      </TableCell>
      <TableCell onClick={e => e.stopPropagation()}>
        <QuoteRowActions
          quote={quote}
          onSelectQuote={onSelectQuote}
          onDelete={onDelete}
        />
      </TableCell>
    </TableRow>
  );
}
