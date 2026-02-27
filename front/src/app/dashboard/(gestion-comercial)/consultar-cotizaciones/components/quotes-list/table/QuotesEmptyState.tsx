import { TableCell, TableRow } from '@/components/ui/table';
import { FileText } from 'lucide-react';
import Link from 'next/link';

export function QuotesEmptyState() {
  return (
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
  );
}
