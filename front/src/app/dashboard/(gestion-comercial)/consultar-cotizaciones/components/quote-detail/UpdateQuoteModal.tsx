'use client';

import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from '@/components';
import { Edit } from 'lucide-react';
import { ReactNode, useState } from 'react';
import { PageTitle } from '../../../_shared/components/PageTitle';
import { QuoteForm } from '../../../_shared/components/quote-form';
import type { IQuoteWithMeta } from '../../../_shared/types/quotes.types';
import { useQuoteUpdateForm } from '../../_hooks/useQuoteUpdateForm';

interface UpdateQuoteModalProps {
  quote: IQuoteWithMeta;
  trigger?: ReactNode;
}

export function UpdateQuoteModal({ quote, trigger }: UpdateQuoteModalProps) {
  const [open, setOpen] = useState(false);
  const title = 'Actualizar cotización';
  const description = 'Actualizacion de los datos de la cotización';

  const { form, onSubmit, isPending } = useQuoteUpdateForm(quote._id, () => setOpen(false));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant='ghost'
            size='sm'
            className='h-8 w-8 p-0 hover:text-primary-foreground'
            title='Modificar cotizacion'
          >
            <Edit className='h-4 w-4' />
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className='max-w-5xl max-h-[90vh] overflow-y-auto p-8 px-20'>
        <DialogHeader>
          <PageTitle userRole='admin' title={title} description={description} />
        </DialogHeader>
        <QuoteForm
          form={form}
          onSubmit={onSubmit}
          isPending={isPending}
          formMode='update'
          onCancel={() => setOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
