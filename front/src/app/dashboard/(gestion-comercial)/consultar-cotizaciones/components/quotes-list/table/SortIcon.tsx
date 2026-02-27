import { ChevronDown, ChevronUp } from 'lucide-react';

export const SortIcon = ({
  column,
  sortColumn,
  sortDirection,
}: {
  column: string;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
}) => {
  if (sortColumn !== column) return null;
  return sortDirection === 'asc' ? (
    <ChevronUp className='h-3 w-3' />
  ) : (
    <ChevronDown className='h-3 w-3' />
  );
};
