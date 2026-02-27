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
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { QuoteFormValues } from '../../../validations';

interface ExpirationAdvisorSectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function ExpirationAdvisorSection({
  form,
}: ExpirationAdvisorSectionProps) {
  return (
    <>
      <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
        Vencimiento y asesor
      </p>
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='expirationDateOverride'
          render={({ field }) => (
            <FormItem className='flex flex-col space-y-1'>
              <FormLabel className='text-sm'>
                Fecha de vencimiento (opcional):
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
                        : 'Auto: emisión + 30 días'}
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
              <p className='text-xs text-muted-foreground'>
                Si no seleccionas fecha, se calcula automáticamente como fecha
                de emisión + 30 días
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <p className='mt-4 text-sm text-muted-foreground font-medium'>
        Asesor Quanta (se toma del usuario logueado; completa solo si deseas
        sobreescribir)
      </p>
      <div className='grid grid-cols-3 gap-4 mt-2'>
        <FormField
          control={form.control}
          name='advisorOverride.name'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>Nombre del asesor:</FormLabel>
              <FormControl>
                <Input
                  className='text-sm text-muted-foreground'
                  placeholder='Nombre (vacío = usuario actual)'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='advisorOverride.position'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>Cargo del asesor:</FormLabel>
              <FormControl>
                <Input
                  className='text-sm text-muted-foreground'
                  placeholder='Cargo (vacío = usuario actual)'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='advisorOverride.email'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>Email del asesor:</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  className='text-sm text-muted-foreground'
                  placeholder='Email (vacío = usuario actual)'
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
