'use client';

import { useState } from 'react';
import { QuoteDetailView } from './components/quote-detail/QuoteDetailView';
import { QuotesGridLayout } from './components/quotes-list/QuotesGridLayout';

export default function ConsultQuotesPage() {
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);

  if (selectedQuoteId) {
    return (
      <QuoteDetailView
        quoteId={selectedQuoteId}
        onBack={() => setSelectedQuoteId(null)}
      />
    );
  }

  return <QuotesGridLayout onSelectQuote={setSelectedQuoteId} />;
}
