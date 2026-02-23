import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createQuote, getQuotes } from './quotes.service';

//Flujo completo:
/* Usuario llena form → mutate(payload)
  → POST /api/quotes  ✓
  → onSuccess: invalida ['quotes']
  → useQuotes() detecta cache stale → GET /api/quotes
  → La tabla de cotizaciones se actualiza sola */

export const useGetAllQuotes = () => {
  //Mantiene una copia almacenada el estado esperando, lo que permite que se actualicen en tiempo real (refetch) cuando se crea una cotizacion de forma automatica.

  //Cuando lleguemos a la parte de actualizacion de una cotizacion veremos la actualizacion optimista.
  return useQuery({
    queryKey: ['quotes'],
    queryFn: getQuotes,
  });
};

export const useCreateQuote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createQuote,

    //Al crear una nueva cotizacion invalida la cache de las cotizaciones y actualiza el listado automaticamente
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  });
};
