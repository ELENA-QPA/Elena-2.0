import { Button } from '@/components';
import { TitlePages } from '@/components/shared/TitlePages';
import { Plus } from 'lucide-react';
import Link from 'next/link';

export function QuotesListHeader({ quotesCount }: { quotesCount: number }) {
  return (
    <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6'>
      <TitlePages displayNumber={quotesCount} />
      <Link href='/dashboard/generar-cotizacion' className='flex-shrink-0'>
        <Button className='bg-elena-pink-600 hover:bg-elena-pink-700 text-white rounded-lg text-xs sm:text-sm'>
          <Plus className='h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2' />
          Nueva Cotización
        </Button>
      </Link>
    </div>
  );
}
