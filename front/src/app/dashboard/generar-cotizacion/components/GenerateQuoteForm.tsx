'use client';

import { Button } from '@/components';
import { Form } from '@/components/ui/form';
import {
  QuoteFormValues,
  quoteSchema,
} from '@/lib/gestion-comercial/validations';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function GenerateQuoteForm() {
  //Valores a enviar en la peticion
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      //Definir los valores que queramos por default o si queremos obtener los valores desde hubspot
    },
  });

  const onSubmitHandler = async (values: QuoteFormValues) => {
    console.log('Values', values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)}>
        <Button type='submit'>Generar cotizacion</Button>
      </form>
    </Form>
  );
}
