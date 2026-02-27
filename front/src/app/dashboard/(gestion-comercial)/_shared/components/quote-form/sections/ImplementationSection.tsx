import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { currencyUSD } from '../../../lib/formatters';
import { QuoteFormValues } from '../../../validations';

interface ImplementationSectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function ImplementationSection({ form }: ImplementationSectionProps) {
  return (
    <>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        <FormField
          control={form.control}
          name='implementationPriceUSD'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Precio de implementación (USD):
              </FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type='text'
                  inputMode='numeric'
                  className='text-sm text-muted-foreground'
                  placeholder='Precio de implementación'
                  value={
                    field.value !== undefined &&
                    field.value !== null &&
                    !isNaN(Number(field.value))
                      ? currencyUSD(Number(field.value))
                      : ''
                  }
                  onChange={e => {
                    const rawValue = e.target.value.replace(/\D/g, '');
                    field.onChange(rawValue ? Number(rawValue) : undefined);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='implementationDurationWeeks'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Duración estimada (semanas):
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={1}
                  className='text-sm text-muted-foreground'
                  placeholder='Duración en semanas'
                  {...field}
                  onChange={e => field.onChange(e.target.valueAsNumber)}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='grid grid-cols-2 gap-4 mt-4'>
        <FormField
          control={form.control}
          name='estimatedGoLiveDate'
          render={({ field }) => (
            <FormItem className='flex flex-col space-y-1'>
              <FormLabel className='text-sm'>
                Fecha estimada de Go-Live:
              </FormLabel>
              <Popover modal={true}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant='outline'
                      className={cn(
                        'text-sm font-normal justify-start',
                        !field.value && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {field.value
                        ? format(field.value, 'dd/MM/yyyy', { locale: es })
                        : 'Seleccionar fecha de Go-Live'}
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={{
                      before: new Date(new Date().setHours(0, 0, 0, 0)),
                    }}
                    locale={es}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='paymentTerms'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>Forma de pago:</FormLabel>
              <FormControl>
                <Input
                  className='text-sm text-muted-foreground'
                  placeholder='Ej: 50% al inicio, 50% en Go-Live'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <div className='mt-4'>
        <FormField
          control={form.control}
          name='implementationDescription'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Descripción de implementación (para propuesta):
              </FormLabel>
              <FormControl>
                <Textarea
                  className='text-sm text-muted-foreground resize-none'
                  placeholder='Descripción del servicio de implementación que aparecerá en la propuesta comercial'
                  rows={2}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </>
  );
}
