import { Loader2 } from 'lucide-react';

export default function Loading() {
  return (
    <div className='p-6 flex items-center justify-center h-64'>
      <div className='text-center'>
        <Loader2 className='animate-spin h-12 w-12 text-elena-pink-500 mx-auto mb-4' />
        <p className='text-muted-foreground'>Cargando cotizaciones...</p>
      </div>
    </div>
  );
}
