'use client';

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import Link from 'next/link';
import { useDeleteQuote } from '../../../../_shared/hooks/useDeleteQuote';
import type { IQuoteWithMeta } from '../../../../_shared/types/quotes.types';
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
            <TableRow>
              <TableCell
                colSpan={8}
                className='text-center py-12 text-muted-foreground'
              >
                <FileText className='h-12 w-12 mx-auto mb-3 text-gray-300' />
                <p>No hay cotizaciones registradas</p>
                <Link
                  href='/dashboard/generar-cotizacion'
                  className='text-elena-pink-600 hover:underline text-sm mt-1 inline-block'
                >
                  Crear primera cotización
                </Link>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
