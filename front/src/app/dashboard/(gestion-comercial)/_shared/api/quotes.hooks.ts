import { useMutation, useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import type { IQuoteWithMeta } from '../types/quotes.types';
import {
  createQuote,
  getQuoteById,
  getQuotes,
  updateQuote,
} from './quotes.service';

interface QuotesCache {
  data: IQuoteWithMeta[];
  total: number;
}

export const useGetAllQuotes = () => {
  return useSuspenseQuery({
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
    onMutate: async ({ id, payload }) => {
      const now = new Date().toISOString();

      await queryClient.cancelQueries({ queryKey: ['quotes'] });
      await queryClient.cancelQueries({ queryKey: ['quote', id] });

      const previousList = queryClient.getQueryData<QuotesCache>(['quotes']);
      const previousQuote = queryClient.getQueryData<IQuoteWithMeta>(['quote', id]);

      if (previousList) {
        queryClient.setQueryData<QuotesCache>(['quotes'], {
          ...previousList,
          data: previousList.data.map(q =>
            q._id === id ? { ...q, ...payload, updatedAt: now } : q
          ),
        });
      }

      if (previousQuote) {
        queryClient.setQueryData<IQuoteWithMeta>(['quote', id], {
          ...previousQuote,
          ...payload,
          updatedAt: now,
        });
      }

      return { previousList, previousQuote };
    },
    onError: (_err, { id }, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(['quotes'], context.previousList);
      }
      if (context?.previousQuote) {
        queryClient.setQueryData(['quote', id], context.previousQuote);
      }
    },
    onSettled: (_data, _err, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['quote', id] });
    },
  });
};
