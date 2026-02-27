'use client';

import { PageTitle } from '../_shared/components/PageTitle';
import { QuoteForm } from '../_shared/components/quote-form';
import { useQuoteCreateForm } from './_hooks/useQuoteCreateForm';
import { PipeDriveSearchBar } from './components/PipeDriveSearchBar';

export default function GenerateQuotePage() {
  //Datos provisionales
  const userRole = 'admin';
  const title = 'Generar cotización';
  const description = 'Generación de cotizaciones para el software Quanta';

  //Hook que maneja la logica para creacion de una cotizacion
  const { form, onSubmit, isPending, handleSelectPipeDrive } = useQuoteCreateForm();

  return (
    <main className='max-w-screen-lg mx-auto'>
      <section className='flex justify-between items-center'>
        <PageTitle
          userRole={userRole}
          title={title}
          description={description}
        />
        <PipeDriveSearchBar onSelectResult={handleSelectPipeDrive} />
      </section>
      <QuoteForm form={form} onSubmit={onSubmit} isPending={isPending} />
    </main>
  );
}
