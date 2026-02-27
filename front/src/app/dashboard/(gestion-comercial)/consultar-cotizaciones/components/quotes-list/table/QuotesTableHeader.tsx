import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortIcon } from './SortIcon';

const COLUMNS = [
  { key: 'quoteId', label: 'ID' },
  { key: 'companyName', label: 'Empresa' },
  { key: 'contactName', label: 'Contacto' },
  { key: 'quoteStatus', label: 'Estado' },
  { key: 'totalQuoteUSD', label: 'Total USD' },
  { key: 'createdAt', label: 'Creada' },
  { key: 'updatedAt', label: 'Actualizada' },
] as const;

interface QuotesTableHeaderProps {
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function QuotesTableHeader({
  sortColumn,
  sortDirection,
  onSort,
}: QuotesTableHeaderProps) {
  return (
    <TableHeader className='bg-elena-pink-600'>
      <TableRow className='bg-elena-pink-600 hover:bg-elena-pink-600'>
        {COLUMNS.map(col => (
          <TableHead
            key={col.key}
            className='text-white font-semibold cursor-pointer hover:bg-elena-pink-700'
            onClick={() => onSort(col.key)}
          >
            <div className='flex items-center gap-1'>
              {col.label}{' '}
              <SortIcon
                column={col.key}
                sortColumn={sortColumn}
                sortDirection={sortDirection}
              />
            </div>
          </TableHead>
        ))}
        <TableHead className='text-center text-white font-semibold'>
          Acciones
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
