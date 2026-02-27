import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { usePipeDriveDetail } from '../_api/pipedrive.hooks';
import { useCreateQuote } from '../../_shared/api/quotes.hooks';
import { buildQuotePayload, generateQuoteId } from '../../_shared/lib/quote.helpers';
import { LICENSE_BILLING_PERIOD } from '../../_shared/types/quotes.types';
import { QuoteFormValues, quoteResolver } from '../../_shared/validations';
import type { IPipeDriveSearchResult } from '../types/pipedrive.types';

export function useQuoteCreateForm() {
  const { mutate, isPending } = useCreateQuote();
  const { mutate: fetchDetail } = usePipeDriveDetail();
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

  const handleSelectPipeDrive = (result: IPipeDriveSearchResult) => {
    fetchDetail(
      { id: result.id, type: result.type },
      {
        onSuccess: data => {
          form.setValue('companyName', data.companyName);
          form.setValue('nit', data.nit);
          form.setValue('industry', data.industry);
          form.setValue('totalWorkers', data.totalWorkers);
          form.setValue('productionWorkers', data.productionWorkers);
          form.setValue('contactName', data.contactName);
          form.setValue('contactPosition', data.contactPosition ?? '');
          form.setValue('email', data.email);
          form.setValue(
            'phones',
            data.phones.map(p => Number(p))
          );

          toast.success('Datos cargados desde PipeDrive');
        },
        onError: (error: Error) => {
          toast.error(error.message || 'Error al cargar datos de PipeDrive');
        },
      }
    );
  };

  return { form, onSubmit, isPending, handleSelectPipeDrive };
}
