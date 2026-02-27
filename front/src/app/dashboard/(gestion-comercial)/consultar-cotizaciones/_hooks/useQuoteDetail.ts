'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { downloadQuotePdf, sendQuote } from '../../_shared/api/quotes.service';
import type { IQuoteWithMeta } from '../../_shared/types/quotes.types';

export function useQuoteDetail(quote: IQuoteWithMeta, onBack: () => void) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showResendModal, setShowResendModal] = useState(false);

  const toggleFullscreen = () => setIsFullscreen(prev => !prev);

  const handleSend = async () => {
    if (!window.confirm(`¿Enviar cotización ${quote.quoteId} a ${quote.email}?`))
      return;
    try {
      await sendQuote(quote._id);
      toast.success(`Cotización enviada a ${quote.email}`);
      onBack();
    } catch (error: any) {
      toast.error(error.message || 'Error al enviar la cotización');
    }
  };

  const handleDownload = async () => {
    try {
      await downloadQuotePdf(quote._id, quote.quoteId);
      toast.success('PDF descargado');
    } catch {
      toast.error('Error al descargar el PDF');
    }
  };

  return {
    isFullscreen,
    toggleFullscreen,
    showResendModal,
    setShowResendModal,
    handleSend,
    handleDownload,
  };
}
