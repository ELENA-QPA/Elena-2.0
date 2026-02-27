'use client';

import { Loader2 } from 'lucide-react';
import { useGetQuoteById } from '../../../_shared/api/quotes.hooks';
import { useQuoteDetail } from '../../_hooks/useQuoteDetail';
import { QuoteDetailHeader } from './QuoteDetailHeader';
import { QuoteDetailPanel } from './QuoteDetailPanel';
import { ResendQuoteModal } from './ResendQuoteModal';

interface QuoteDetailViewProps {
  quoteId: string;
  onBack: () => void;
}

export function QuoteDetailView({ quoteId, onBack }: QuoteDetailViewProps) {
  const { data: quote, isLoading } = useGetQuoteById(quoteId);

  const {
    isFullscreen,
    toggleFullscreen,
    showResendModal,
    setShowResendModal,
    handleSend,
    handleDownload,
  } = useQuoteDetail(quote!, onBack);

  if (isLoading || !quote) {
    return (
      <div className='p-6 flex items-center justify-center h-64'>
        <div className='text-center'>
          <Loader2 className='animate-spin h-12 w-12 text-elena-pink-500 mx-auto mb-4' />
          <p className='text-muted-foreground'>Cargando cotización...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden'>
      <QuoteDetailHeader
        quote={quote}
        onBack={onBack}
        onSend={handleSend}
        onDownload={handleDownload}
        onResend={() => setShowResendModal(true)}
      />

      <QuoteDetailPanel
        quote={quote}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
      />

      {showResendModal && (
        <ResendQuoteModal
          quote={quote}
          onClose={() => setShowResendModal(false)}
        />
      )}
    </div>
  );
}
