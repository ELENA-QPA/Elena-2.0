import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { deleteQuote } from '../api/quotes.service';
import type { IQuoteWithMeta } from '../types/quotes.types';

export function useDeleteQuote() {
  const queryClient = useQueryClient();

  const handleDelete = async (quote: IQuoteWithMeta) => {
    if (!window.confirm(`¿Eliminar cotización ${quote.quoteId}?`)) return;
    try {
      await deleteQuote(quote._id);
      toast.success('Cotización eliminada');
      await queryClient.invalidateQueries({ queryKey: ['quotes'] });
    } catch {
      toast.error('Error al eliminar la cotización');
    }
  };

  return { handleDelete };
}
