import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQuote, getQuoteById, getQuotes, updateQuote } from './quotes.service';

//Flujo completo:
/* Usuario llena form → mutate(payload)
  → POST /api/quotes  ✓
  → onSuccess: invalida ['quotes']
  → useQuotes() detecta cache stale → GET /api/quotes
  → La tabla de cotizaciones se actualiza sola */

export const useGetAllQuotes = () => {
  return useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotes,
  });
};

export const useGetQuoteById = (id: string | null) => {
  return useQuery({
    queryKey: ['quote', id],
    queryFn: () => getQuoteById(id!),
    enabled: !!id,
  });
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) =>
      updateQuote(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};