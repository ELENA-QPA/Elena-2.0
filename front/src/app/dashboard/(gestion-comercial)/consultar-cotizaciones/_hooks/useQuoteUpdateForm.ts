import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useGetQuoteById, useUpdateQuote } from '../../_shared/api/quotes.hooks';
import { buildQuotePayload, mapQuoteToFormValues } from '../../_shared/lib/quote.helpers';
import { LICENSE_BILLING_PERIOD } from '../../_shared/types/quotes.types';
import { QuoteFormValues, quoteResolver } from '../../_shared/validations';

export function useQuoteUpdateForm(quoteId: string, onSuccess?: () => void) {
  const { mutate, isPending } = useUpdateQuote();
  const { data: quoteData, isLoading } = useGetQuoteById(quoteId);

  const form = useForm<QuoteFormValues>({
    resolver: quoteResolver,
    mode: 'onChange',
    defaultValues: {
      quoteId: '',
      companyName: '',
      phones: [NaN],
      includeLicenses: false,
      standardLicenses: { unitPrice: 108 },
      premiumLicenses: { unitPrice: 120 },
      notificationEmails: [],
      includedModules: [],
      licenseBillingPeriod: LICENSE_BILLING_PERIOD.MONTHLY,
    },
  });

  useEffect(() => {
    if (quoteData) {
      form.reset(mapQuoteToFormValues(quoteData));
    }
  }, [quoteData, form]);

  const onSubmit = async (values: QuoteFormValues) => {
    const payload = buildQuotePayload(values);
    mutate(
      { id: quoteId, payload },
      {
        onSuccess: () => {
          toast.success('¡Cotización actualizada exitosamente!');
          onSuccess?.();
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Error al actualizar la cotización');
        },
      }
    );
  };

  return { form, onSubmit, isPending, isLoading };
}
