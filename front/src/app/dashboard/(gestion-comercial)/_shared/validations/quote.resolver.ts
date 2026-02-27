import { zodResolver } from '@hookform/resolvers/zod';
import { Resolver } from 'react-hook-form';
import { QuoteFormValues, quoteSchema } from './quote.schema';

export const quoteResolver: Resolver<QuoteFormValues> = async (
  values,
  context,
  options
) => {
  const result = await zodResolver(quoteSchema)(values, context, options);
  const {
    totalWorkers,
    productionWorkers,
    currentTechnology,
    otherTechnologyDetail,
    includeLicenses,
    standardLicenses,
    premiumLicenses,
  } = values;

  const extra: Record<string, unknown> = {};

  if (
    typeof totalWorkers === 'number' &&
    !isNaN(totalWorkers) &&
    typeof productionWorkers === 'number' &&
    !isNaN(productionWorkers) &&
    productionWorkers > totalWorkers
  ) {
    extra.productionWorkers = {
      type: 'custom',
      message: `No puede superar el total de trabajadores (${totalWorkers})`,
    };
  }

  if (
    Array.isArray(currentTechnology) &&
    currentTechnology.includes('other') &&
    !otherTechnologyDetail?.trim()
  ) {
    extra.otherTechnologyDetail = {
      type: 'custom',
      message: 'Debe especificar cuál es la otra tecnología',
    };
  }

  if (includeLicenses) {
    if (!standardLicenses?.quantity || isNaN(standardLicenses.quantity)) {
      extra.standardLicenses = {
        quantity: {
          type: 'custom',
          message: 'La cantidad de licencias estándar debe ser mínimo 1',
        },
      };
    }
    if (!premiumLicenses?.quantity || isNaN(premiumLicenses.quantity)) {
      extra.premiumLicenses = {
        quantity: {
          type: 'custom',
          message: 'La cantidad de licencias premium debe ser mínimo 1',
        },
      };
    }
  }

  return Object.keys(extra).length > 0
    ? { values: {}, errors: { ...result.errors, ...(extra as any) } }
    : result;
};
