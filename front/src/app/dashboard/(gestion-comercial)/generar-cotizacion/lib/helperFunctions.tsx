import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '../validations';

/**
 * Formatea un valor numérico como moneda USD sin decimales.
 * @param value - El valor numérico a formatear.
 * @returns El valor formateado como string en formato de moneda USD. Ej: `$1,500`.
 */
export const currencyUSD = (value: number): string =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(value);

/**
 * Agrega un nuevo input de teléfono vacío al arreglo de teléfonos del formulario.
 * @param form - Instancia del formulario de react-hook-form.
 * @param phones - Arreglo actual de teléfonos registrados en el formulario.
 */
export const handleAddPhone = (
  form: UseFormReturn<QuoteFormValues>,
  phones: string[]
): void => {
  form.setValue('phones', [...phones, '']);
};

/**
 * Elimina un teléfono del arreglo de teléfonos del formulario según su índice.
 * @param form - Instancia del formulario de react-hook-form.
 * @param phones - Arreglo actual de teléfonos registrados en el formulario.
 * @param index - Índice del teléfono a eliminar.
 */
export const handleRemovePhone = (
  form: UseFormReturn<QuoteFormValues>,
  phones: string[],
  index: number
): void => {
  form.setValue(
    'phones',
    phones.filter((_, i) => i !== index)
  );
};
