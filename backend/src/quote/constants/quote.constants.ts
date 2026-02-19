export const generateQuoteNumber = (sequential: number): string => {
  const year = new Date().getFullYear();
  const padded = String(sequential).padStart(4, '0');
  return `Quanta-${year}-${padded}`;
};

// Precios por defecto de licencias (USD)
export const DEFAULT_STANDARD_LICENSE_PRICE_USD = 108;
export const DEFAULT_PREMIUM_LICENSE_PRICE_USD = 120;