import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useCreateQuote } from '../../_shared/api/quotes.hooks';
import { buildQuotePayload, generateQuoteId } from '../../_shared/lib/quote.helpers';
import { LICENSE_BILLING_PERIOD } from '../../_shared/types/quotes.types';
import { QuoteFormValues, quoteResolver } from '../../_shared/validations';

export function useQuoteCreateForm() {
  const { mutate, isPending } = useCreateQuote();
  const router = useRouter();

  const form = useForm<QuoteFormValues>({
    resolver: quoteResolver,
    mode: 'onChange',
    defaultValues: {
      quoteId: generateQuoteId(),
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

  const onSubmit = async (values: QuoteFormValues) => {
    const payload = buildQuotePayload(values);

    mutate(payload, {
      onSuccess: () => {
        toast.success('¡Cotización creada exitosamente!');
        form.reset();
        setTimeout(
          () => router.push('/dashboard/consultar-cotizaciones'),
          2000
        );
      },
      onError: (error: Error) => {
        toast.error(error.message || 'Error al procesar la cotización');
      },
    });
  };

  return { form, onSubmit, isPending };
}
