'use client';

import { useState } from 'react';
import { useGetAllQuotes } from '../api/useQuotes';
import { QuotesGrid } from './quotesGrid/components/QuotesGrid';
import { QuoteDetailView } from './quotesGrid/components/QuoteDetailView';
import type { IQuoteWithMeta } from './types/quotes.types';

export default function ConsultQuotesPage() {
  const { data: response, isLoading, error } = useGetAllQuotes();
  const quotes = (response as any)?.data ?? [];
  const [selectedQuote, setSelectedQuote] = useState<IQuoteWithMeta | null>(null);
  
  // Si hay una cotización seleccionada, mostrar la vista detalle
  if (selectedQuote) {
    return (
      <QuoteDetailView
        quote={selectedQuote}
        onBack={() => setSelectedQuote(null)}
      />
    );
  }

  // Vista principal: grilla de cotizaciones
  return (
    <QuotesGrid
      quotes={quotes}
      isLoading={isLoading}
      error={error}
      onSelectQuote={setSelectedQuote}
    />
  );
}
