'use client';

import { currencyUSD } from '../../../_shared/lib/formatters';
import {
  OPERATION_TYPE_LABELS,
  TECHNOLOGY_LABELS,
} from '../../../_shared/types/quotes.constants';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';

interface QuotePreviewProps {
  quote: IQuoteWithMeta;
}

export function QuotePreview({ quote }: QuotePreviewProps) {
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const date = dateStr.includes('T')
      ? new Date(dateStr.replace('T00:00:00.000Z', 'T12:00:00'))
      : new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('es-CO', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatNit = (nit: number) => {
    const str = nit.toString();
    if (str.length <= 1) return str;
    const body = str.slice(0, -1);
    const dv = str.slice(-1);
    return `${body.replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${dv}`;
  };

  const standardTotal = quote.standardLicenses?.totalLicensesPrice ?? 0;
  const premiumTotal = quote.premiumLicenses?.totalLicensesPrice ?? 0;
  const implementationPrice = quote.implementationPriceUSD ?? 0;
  const grandTotal =
    quote.totalQuoteUSD ?? standardTotal + premiumTotal + implementationPrice;

  return (
    <div className='p-6 sm:p-8 space-y-6'>
      <div className='border-b pb-6'>
        <div className='flex items-start justify-between'>
          <div>
            <h1 className='text-2xl font-bold text-elena-pink-600'>
              QUANTA COTIZACIONES
            </h1>
            <p className='text-xs text-muted-foreground mt-1'>
              Plataforma de Gestión Comercial
            </p>
          </div>
          <div className='text-right'>
            <p className='text-sm font-semibold text-gray-900'>COTIZACIÓN</p>
            <p className='text-lg font-mono font-bold text-elena-pink-600'>
              {quote.quoteId}
            </p>
            <p className='text-xs text-muted-foreground mt-1'>
              Fecha: {formatDate(quote.createdAt)}
            </p>
          </div>
        </div>
      </div>

      <section>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Información del Cliente
        </h2>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
            <div>
              <span className='text-xs text-muted-foreground'>Empresa</span>
              <p className='font-medium'>{quote.companyName}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>NIT</span>
              <p className='font-medium'>{formatNit(quote.nit)}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>Industria</span>
              <p className='font-medium'>{quote.industry || '—'}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>
                Tipo de operación
              </span>
              <p className='font-medium'>
                {quote.operationType
                  ? (OPERATION_TYPE_LABELS[quote.operationType] ??
                    quote.operationType)
                  : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Datos de Contacto
        </h2>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
            <div>
              <span className='text-xs text-muted-foreground'>
                Nombre completo
              </span>
              <p className='font-medium'>{quote.contactName}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>Cargo</span>
              <p className='font-medium'>{quote.contactPosition}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>
                Correo electrónico
              </span>
              <p className='font-medium'>{quote.email}</p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>Teléfonos</span>
              <p className='font-medium'>
                {quote.phones?.length > 0 ? quote.phones.join(' · ') : '—'}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Contexto Operativo
        </h2>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
            <div>
              <span className='text-xs text-muted-foreground'>
                Total trabajadores
              </span>
              <p className='font-medium'>
                {quote.totalWorkers?.toLocaleString() ?? '—'}
              </p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>
                Trabajadores en producción
              </span>
              <p className='font-medium'>
                {quote.productionWorkers?.toLocaleString() ?? '—'}
              </p>
            </div>
            <div className='col-span-2'>
              <span className='text-xs text-muted-foreground'>
                Tecnología actual
              </span>
              <div className='flex flex-wrap gap-1.5 mt-1'>
                {quote.currentTechnology?.map(tech => (
                  <span
                    key={tech}
                    className='inline-flex items-center px-2 py-0.5 rounded-md bg-white border text-xs font-medium text-gray-700'
                  >
                    {TECHNOLOGY_LABELS[
                      tech as keyof typeof TECHNOLOGY_LABELS
                    ] ?? tech}
                  </span>
                ))}
                {quote.otherTechnologyDetail && (
                  <span className='inline-flex items-center px-2 py-0.5 rounded-md bg-white border text-xs text-gray-600 italic'>
                    {quote.otherTechnologyDetail}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {quote.includeLicenses && (
        <section>
          <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
            Licenciamiento
          </h2>
          <div className='border rounded-lg overflow-hidden'>
            <table className='w-full text-sm'>
              <thead>
                <tr className='bg-gray-100'>
                  <th className='text-left px-4 py-2 font-medium text-gray-700'>
                    Tipo
                  </th>
                  <th className='text-center px-4 py-2 font-medium text-gray-700'>
                    Cantidad
                  </th>
                  <th className='text-right px-4 py-2 font-medium text-gray-700'>
                    Precio unitario
                  </th>
                  <th className='text-right px-4 py-2 font-medium text-gray-700'>
                    Subtotal
                  </th>
                </tr>
              </thead>
              <tbody>
                {quote.standardLicenses &&
                  (quote.standardLicenses.quantity ?? 0) > 0 && (
                    <tr className='border-t'>
                      <td className='px-4 py-2.5'>Licencia Estándar</td>
                      <td className='px-4 py-2.5 text-center'>
                        {quote.standardLicenses.quantity ?? 0}
                      </td>
                      <td className='px-4 py-2.5 text-right'>
                        {currencyUSD(quote.standardLicenses.unitPrice)}
                      </td>
                      <td className='px-4 py-2.5 text-right font-medium'>
                        {currencyUSD(
                          quote.standardLicenses.totalLicensesPrice ?? 0
                        )}
                      </td>
                    </tr>
                  )}
                {quote.premiumLicenses &&
                  (quote.premiumLicenses.quantity ?? 0) > 0 && (
                    <tr className='border-t'>
                      <td className='px-4 py-2.5'>Licencia Premium</td>
                      <td className='px-4 py-2.5 text-center'>
                        {quote.premiumLicenses.quantity ?? 0}
                      </td>
                      <td className='px-4 py-2.5 text-right'>
                        {currencyUSD(quote.premiumLicenses.unitPrice)}
                      </td>
                      <td className='px-4 py-2.5 text-right font-medium'>
                        {currencyUSD(
                          quote.premiumLicenses.totalLicensesPrice ?? 0
                        )}
                      </td>
                    </tr>
                  )}
              </tbody>
              <tfoot>
                <tr className='border-t bg-gray-50'>
                  <td
                    colSpan={3}
                    className='px-4 py-2 text-right font-medium text-gray-600'
                  >
                    Subtotal licencias:
                  </td>
                  <td className='px-4 py-2 text-right font-semibold'>
                    {currencyUSD(standardTotal + premiumTotal)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </section>
      )}

      <section>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Resumen Económico
        </h2>
        <div className='border rounded-lg overflow-hidden'>
          <div className='divide-y'>
            {quote.includeLicenses && (
              <div className='flex justify-between px-4 py-3 text-sm'>
                <span className='text-gray-600'>Subtotal licencias</span>
                <span className='font-medium'>
                  {currencyUSD(standardTotal + premiumTotal)}
                </span>
              </div>
            )}
            <div className='flex justify-between px-4 py-3 text-sm'>
              <span className='text-gray-600'>Implementación</span>
              <span className='font-medium'>
                {currencyUSD(implementationPrice)}
              </span>
            </div>
            <div className='flex justify-between px-4 py-3 bg-elena-pink-50'>
              <span className='font-semibold text-elena-pink-700'>
                Total cotización (USD)
              </span>
              <span className='font-bold text-lg text-elena-pink-700'>
                {currencyUSD(grandTotal)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Fechas
        </h2>
        <div className='bg-gray-50 rounded-lg p-4'>
          <div className='grid grid-cols-2 gap-x-6 gap-y-3 text-sm'>
            <div>
              <span className='text-xs text-muted-foreground'>
                Fecha estimada de inicio
              </span>
              <p className='font-medium'>
                {formatDate(String(quote.estimatedStartDate))}
              </p>
            </div>
            <div>
              <span className='text-xs text-muted-foreground'>
                Fecha de creación
              </span>
              <p className='font-medium'>{formatDate(quote.createdAt)}</p>
            </div>
          </div>
        </div>
      </section>

      <section className='border-t pt-6'>
        <h2 className='text-sm font-semibold text-elena-pink-600 uppercase tracking-wider mb-3'>
          Condiciones Comerciales
        </h2>
        <div className='text-xs text-muted-foreground space-y-1.5'>
          <p>• Los precios están expresados en dólares americanos (USD).</p>
          <p>• Esta cotización tiene una validez de 30 días calendario.</p>
          <p>
            • Los precios no incluyen impuestos aplicables según la legislación
            vigente.
          </p>
          <p>
            • La fecha de inicio está sujeta a la aceptación formal de la
            cotización.
          </p>
        </div>
      </section>
    </div>
  );
}
