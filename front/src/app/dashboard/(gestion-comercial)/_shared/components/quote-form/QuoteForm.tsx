import { Button } from '@/components';
import { Form } from '@/components/ui/form';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '../../validations';
import { CompanySection } from './sections/CompanySection';
import { ContactSection } from './sections/ContactSection';
import { ExpirationAdvisorSection } from './sections/ExpirationAdvisorSection';
import { ImplementationSection } from './sections/ImplementationSection';
import { ModulesSection } from './sections/ModulesSection';
import { QuoteDetailsSection } from './sections/QuoteDetailsSection';

interface QuoteFormProps {
  form: UseFormReturn<QuoteFormValues>;
  onSubmit: (values: QuoteFormValues) => void;
  isPending: boolean;
  formMode?: 'create' | 'update';
  onCancel?: () => void;
}

export function QuoteForm({
  form,
  onSubmit,
  isPending,
  formMode = 'create',
  onCancel,
}: QuoteFormProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CompanySection form={form} />
        <ContactSection form={form} />
        <ModulesSection form={form} />
        <QuoteDetailsSection form={form} />
        <ImplementationSection form={form} />
        <ExpirationAdvisorSection form={form} />

        <div className='mt-10 flex gap-3'>
          {onCancel && (
            <Button
              type='button'
              variant='outline'
              onClick={onCancel}
              disabled={isPending}
            >
              Cancelar
            </Button>
          )}
          <Button type='submit' disabled={isPending}>
            {isPending
              ? formMode === 'update'
                ? 'Actualizando...'
                : 'Creando...'
              : formMode === 'update'
                ? 'Actualizar cotización'
                : 'Generar cotización'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
