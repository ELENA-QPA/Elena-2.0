'use client';

import { Table, TableBody } from '@/components/ui/table';
import { useDeleteQuote } from '../../../../_shared/hooks/useDeleteQuote';
import type { IQuoteWithMeta } from '../../../../_shared/types/quotes.types';
import { QuotesEmptyState } from './QuotesEmptyState';
import { QuotesTableHeader } from './QuotesTableHeader';
import { QuotesTableRow } from './QuotesTableRow';

interface QuotesTableProps {
  quotes: IQuoteWithMeta[];
  onSelectQuote: (quote: IQuoteWithMeta) => void;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function QuotesTable({
  quotes,
  onSelectQuote,
  sortColumn,
  sortDirection,
  onSort,
}: QuotesTableProps) {
  const { handleDelete } = useDeleteQuote();

  return (
    <div className='hidden lg:block rounded-md border bg-white'>
      <Table className='bg-white'>
        <QuotesTableHeader
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={onSort}
        />
        <TableBody className='bg-white'>
          {quotes.length > 0 ? (
            quotes.map(quote => (
              <QuotesTableRow
                key={quote._id}
                quote={quote}
                onSelectQuote={onSelectQuote}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <QuotesEmptyState />
          )}
        </TableBody>
      </Table>
    </div>
  );
}
