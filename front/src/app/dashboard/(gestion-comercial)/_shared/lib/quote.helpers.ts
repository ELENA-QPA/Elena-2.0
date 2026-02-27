import { UseFormReturn } from 'react-hook-form';
import { IQuote, IQuoteWithMeta, LICENSE_BILLING_PERIOD } from '../types/quotes.types';
import { QuoteFormValues } from '../validations';
import { toTitleCase } from './formatters';

const QUOTE_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * Mapea los datos de una cotización existente a los valores del formulario.
 * Convierte strings de fecha a objetos Date que espera el schema de Zod.
 * Es el inverso de `buildQuotePayload`.
 * @param quote - Cotización obtenida desde la API.
 * @returns Valores pre-poblados para react-hook-form.
 */
export const mapQuoteToFormValues = (quote: IQuoteWithMeta): Partial<QuoteFormValues> => ({
  quoteId: quote.quoteId,
  quoteStatus: quote.quoteStatus,
  companyName: quote.companyName,
  nit: quote.nit,
  contactName: quote.contactName,
  contactPosition: quote.contactPosition,
  industry: quote.industry,
  totalWorkers: quote.totalWorkers,
  productionWorkers: quote.productionWorkers,
  email: quote.email,
  phones: quote.phones,
  operationType: quote.operationType,
  currentTechnology: quote.currentTechnology,
  otherTechnologyDetail: quote.otherTechnologyDetail,
  includeLicenses: quote.includeLicenses,
  standardLicenses: quote.standardLicenses ?? { unitPrice: 108 },
  premiumLicenses: quote.premiumLicenses ?? { unitPrice: 120 },
  implementationPriceUSD: quote.implementationPriceUSD,
  estimatedStartDate: quote.estimatedStartDate ? new Date(quote.estimatedStartDate) : new Date(),
  companyAddress: quote.companyAddress,
  notificationEmails: quote.notificationEmails ?? [],
  numberOfLocations: quote.numberOfLocations,
  operationalNotes: quote.operationalNotes,
  licenseBillingPeriod: quote.licenseBillingPeriod ?? LICENSE_BILLING_PERIOD.MONTHLY,
  implementationDurationWeeks: quote.implementationDurationWeeks,
  estimatedGoLiveDate: quote.estimatedGoLiveDate ? new Date(quote.estimatedGoLiveDate) : undefined,
  implementationDescription: quote.implementationDescription,
  paymentTerms: quote.paymentTerms,
  includedModules: quote.includedModules ?? [],
  additionalModulesDetail: quote.additionalModulesDetail,
  expirationDateOverride: quote.expirationDateOverride ? new Date(quote.expirationDateOverride) : undefined,
  advisorOverride: quote.advisorOverride,
});

export const buildQuotePayload = (values: QuoteFormValues): IQuote => ({
  ...values,
  companyName: values.companyName.trim(),
  contactName: toTitleCase(values.contactName.trim()),
  contactPosition: values.contactPosition.trim(),
  email: values.email.trim().toLowerCase(),
  industry: values.industry.trim(),
  otherTechnologyDetail: values.otherTechnologyDetail?.trim(),
  companyAddress: values.companyAddress?.trim(),
  operationalNotes: values.operationalNotes?.trim(),
  implementationDescription: values.implementationDescription?.trim(),
  paymentTerms: values.paymentTerms?.trim(),
  additionalModulesDetail: values.additionalModulesDetail?.trim(),
  estimatedStartDate: values.estimatedStartDate?.toISOString().split('T')[0],
  estimatedGoLiveDate: values.estimatedGoLiveDate?.toISOString().split('T')[0],
  expirationDateOverride: values.expirationDateOverride
    ?.toISOString()
    .split('T')[0],
  notificationEmails: (values.notificationEmails ?? [])
    .map(e => e.trim().toLowerCase())
    .filter(Boolean),
});

/**
 * Genera un ID único para una cotización con el formato `QT-XXXXXXXX`.
 * Usa `crypto.getRandomValues` para garantizar aleatoriedad criptográfica.
 * @returns ID de cotización. Ej: `QT-A3F9B2C1`.
 */
export const generateQuoteId = (): string => {
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  const suffix = Array.from(
    bytes,
    b => QUOTE_ID_CHARS[b % QUOTE_ID_CHARS.length]
  ).join('');
  return `QT-${suffix}`;
};

/**
 * Agrega un nuevo input de teléfono vacío al arreglo de teléfonos del formulario.
 * @param form - Instancia del formulario de react-hook-form.
 * @param phones - Arreglo actual de teléfonos registrados en el formulario.
 */
export const handleAddPhone = (
  form: UseFormReturn<QuoteFormValues>,
  phones: number[]
): void => {
  form.setValue('phones', [...phones, NaN]);
};

/**
 * Elimina un teléfono del arreglo de teléfonos del formulario según su índice.
 * @param form - Instancia del formulario de react-hook-form.
 * @param phones - Arreglo actual de teléfonos registrados en el formulario.
 * @param index - Índice del teléfono a eliminar.
 */
export const handleRemovePhone = (
  form: UseFormReturn<QuoteFormValues>,
  phones: number[],
  index: number
): void => {
  form.setValue(
    'phones',
    phones.filter((_, i) => i !== index)
  );
};

/**
 * Agrega un nuevo campo de email vacío al arreglo de emails de notificación del formulario.
 * @param form - Instancia del formulario de react-hook-form.
 */
export const handleAddNotificationEmail = (
  form: UseFormReturn<QuoteFormValues>
) => {
  const current = form.getValues('notificationEmails') ?? [];
  form.setValue('notificationEmails', [...current, '']);
};

/**
 * Elimina un email del arreglo de emails de notificación del formulario según su índice.
 * @param form - Instancia del formulario de react-hook-form.
 * @param index - Índice del email a eliminar.
 */
export const handleRemoveNotificationEmail = (
  form: UseFormReturn<QuoteFormValues>,
  index: number
) => {
  const current = form.getValues('notificationEmails') ?? [];
  form.setValue(
    'notificationEmails',
    current.filter((_: any, i: number) => i !== index)
  );
};
