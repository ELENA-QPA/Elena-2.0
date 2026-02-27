'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className='p-6 flex items-center justify-center h-64'>
      <div className='text-center'>
        <AlertCircle className='h-12 w-12 text-red-400 mx-auto mb-4' />
        <p className='text-red-500 font-medium'>Error al cargar cotizaciones</p>
        <p className='text-sm text-muted-foreground mt-1'>{error.message}</p>
        <Button variant='outline' className='mt-4' onClick={reset}>
          Reintentar
        </Button>
      </div>
    </div>
  );
}
