'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import type { usePaginationQuotes } from '../../_hooks/usePaginationQuotes';

interface QuotesPaginationProps {
  pagination: ReturnType<typeof usePaginationQuotes<IQuoteWithMeta>>;
  totalFiltered: number;
}

export function QuotesPagination({
  pagination,
  totalFiltered,
}: QuotesPaginationProps) {
  const {
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    totalPages,
    startIndex,
    endIndex,
  } = pagination;

  if (totalFiltered === 0) return null;

  return (
    <div className='flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-4 mt-4 p-2 sm:p-4 border-t'>
      <div className='flex items-center gap-1 sm:gap-2 min-w-0'>
        <span className='text-xs sm:text-sm text-gray-600 whitespace-nowrap'>
          Mostrando {startIndex + 1} -{' '}
          {Math.min(endIndex, totalFiltered)} de {totalFiltered}
        </span>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={val => {
            setItemsPerPage(parseInt(val));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className='w-16 sm:w-20 text-xs sm:text-sm'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='5'>5</SelectItem>
            <SelectItem value='10'>10</SelectItem>
            <SelectItem value='25'>25</SelectItem>
            <SelectItem value='50'>50</SelectItem>
          </SelectContent>
        </Select>
        <span className='text-xs sm:text-sm text-gray-600'>por página</span>
      </div>

      <div className='flex items-center gap-0.5 sm:gap-1'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className='text-xs sm:text-sm'
        >
          <ChevronLeft className='h-3 w-3 sm:h-4 sm:w-4' />
          Anterior
        </Button>

        <div className='flex items-center gap-0.5 sm:gap-1'>
          {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
            let pageNum: number;

            if (totalPages <= 7) {
              pageNum = i + 1;
            } else if (currentPage <= 4) {
              pageNum = i + 1;
            } else if (currentPage >= totalPages - 3) {
              pageNum = totalPages - 6 + i;
            } else {
              pageNum = currentPage - 3 + i;
            }

            return (
              <Button
                key={pageNum}
                variant={currentPage === pageNum ? 'default' : 'outline'}
                size='sm'
                className='w-6 h-6 sm:w-8 sm:h-8 p-0 text-xs sm:text-sm'
                onClick={() => setCurrentPage(pageNum)}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant='outline'
          size='sm'
          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
          disabled={currentPage >= totalPages}
          className='text-xs sm:text-sm'
        >
          Siguiente
          <ChevronRight className='h-3 w-3 sm:h-4 sm:w-4' />
        </Button>
      </div>
    </div>
  );
}
