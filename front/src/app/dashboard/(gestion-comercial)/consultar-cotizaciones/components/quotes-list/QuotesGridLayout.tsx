'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useGetAllQuotes } from '../../../_shared/api/quotes.hooks';
import { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { useFilterQuotes } from '../../_hooks/useFilterQuotes';
import { usePaginationQuotes } from '../../_hooks/usePaginationQuotes';
import { QuotesListHeader } from './QuotesListHeader';
import { QuotesPagination } from './QuotesPagination';
import { QuotesFilter } from './QuotesFilter';
import { QuoteCardMobile } from './table/QuoteCardMobile';
import { QuotesTable } from './table/QuotesTable';

interface QuotesGridProps {
  onSelectQuote: (id: string) => void;
}

export function QuotesGridLayout({ onSelectQuote }: QuotesGridProps) {
  const { data: response } = useGetAllQuotes();
  const quotes: IQuoteWithMeta[] = (response as any)?.data ?? [];

  const filters = useFilterQuotes(quotes);
  const pagination = usePaginationQuotes(filters.filteredQuotes);

  const { sortColumn, sortDirection, handleSort, filteredQuotes } = filters;

  return (
    <div className='p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden'>
      <QuotesListHeader quotesCount={quotes.length} />

      <Card>
        <QuotesFilter filters={filters} totalCount={quotes.length} />
        <CardContent className='bg-white p-3 sm:p-4 md:p-6'>
          <QuotesTable
            quotes={pagination.currentPageItems}
            onSelectQuote={(q: IQuoteWithMeta) => onSelectQuote(q._id)}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          <QuoteCardMobile
            quotes={pagination.currentPageItems}
            onSelectQuote={(q: IQuoteWithMeta) => onSelectQuote(q._id)}
          />

          <QuotesPagination
            pagination={pagination}
            totalFiltered={filteredQuotes.length}
          />
        </CardContent>
      </Card>
    </div>
  );
}
