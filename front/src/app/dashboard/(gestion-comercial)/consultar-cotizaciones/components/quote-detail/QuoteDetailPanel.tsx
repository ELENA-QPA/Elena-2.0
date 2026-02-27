'use client';

import { Button } from '@/components/ui/button';
import { AlertCircle, Maximize2, Minimize2 } from 'lucide-react';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { QuotePreview } from './QuotePreview';
import { QuoteTimeline } from './QuoteTimeline';

interface QuoteDetailPanelProps {
  quote: IQuoteWithMeta;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

export function QuoteDetailPanel({
  quote,
  isFullscreen,
  onToggleFullscreen,
}: QuoteDetailPanelProps) {
  return (
    <div
      className={`grid gap-4 ${
        isFullscreen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-3'
      }`}
    >
      <div
        className={`${
          isFullscreen ? 'col-span-1' : 'lg:col-span-2'
        } border rounded-lg bg-white overflow-hidden`}
      >
        <div className='flex items-center justify-between px-4 py-2 border-b bg-gray-50'>
          <h2 className='text-sm font-semibold text-gray-700'>
            Vista previa de la cotización
          </h2>
          <Button
            variant='ghost'
            size='sm'
            className='h-7 w-7 p-0'
            onClick={onToggleFullscreen}
            title={
              isFullscreen
                ? 'Salir de pantalla completa'
                : 'Ver en pantalla completa'
            }
          >
            {isFullscreen ? (
              <Minimize2 className='h-4 w-4' />
            ) : (
              <Maximize2 className='h-4 w-4' />
            )}
          </Button>
        </div>
        <div className='overflow-y-auto max-h-[calc(100vh-280px)]'>
          {quote ? (
            <QuotePreview quote={quote} />
          ) : (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground'>
              <AlertCircle className='h-10 w-10 mb-3 text-gray-300' />
              <p className='text-sm'>No se pudo renderizar la vista previa</p>
              <p className='text-xs mt-1'>
                El histórico sigue disponible en el panel derecho
              </p>
            </div>
          )}
        </div>
      </div>

      {!isFullscreen && (
        <div className='lg:col-span-1 border rounded-lg bg-white overflow-hidden'>
          <div className='px-4 py-2 border-b bg-gray-50'>
            <h2 className='text-sm font-semibold text-gray-700'>
              Línea de tiempo
            </h2>
          </div>
          <div className='overflow-y-auto max-h-[calc(100vh-280px)]'>
            <QuoteTimeline quote={quote} />
          </div>
        </div>
      )}
    </div>
  );
}
