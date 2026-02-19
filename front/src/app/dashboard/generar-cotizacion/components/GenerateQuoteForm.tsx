'use client';

import { Button } from '@/components';
import { Form } from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export function GenerateQuoteForm() {
  //Schema de la peticion con validaciones
  const quoteSchema = z.object({});

  type QuoteFormValues = z.infer<typeof quoteSchema>;

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
