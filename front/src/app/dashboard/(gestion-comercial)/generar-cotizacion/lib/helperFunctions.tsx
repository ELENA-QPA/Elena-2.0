import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '../validations';

const QUOTE_ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

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
