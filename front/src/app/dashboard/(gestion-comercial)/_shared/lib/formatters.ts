/**
 * Formatea los datos recibidos para que tengan el formato Title Case
 * @param {string} str - texto a formatear: HOLA munDo
 * @returns - Texto formateado -> Hola Mundo
 */
export const toTitleCase = (str: string) =>
  str.replace(
    /\w\S*/g,
    word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  );

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
