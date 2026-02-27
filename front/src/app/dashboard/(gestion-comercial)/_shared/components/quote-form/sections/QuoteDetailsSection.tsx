import {
  Button,
  Calendar,
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import { currencyUSD } from '../../../lib/formatters';
import { QuoteFormValues } from '../../../validations';

interface QuoteDetailsSectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function QuoteDetailsSection({ form }: QuoteDetailsSectionProps) {
  const includeLicenses = form.watch('includeLicenses');

  return (
    <>
      <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
        Detalles de la cotización
      </p>
      <div className='grid grid-cols-2 gap-4'>
        <FormField
          control={form.control}
          name='estimatedStartDate'
          render={({ field }) => (
            <FormItem className='flex flex-col space-y-1'>
              <FormLabel className='text-sm'>
                Fecha estimada de inicio:
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
                        : 'Seleccionar fecha de inicio'}
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
          name='includeLicenses'
          render={({ field }) => (
            <FormItem className='flex flex-col space-y-1'>
              <FormLabel className='text-sm'>¿Incluir licencias?</FormLabel>
              <div
                className={cn(
                  'flex items-center justify-between border rounded-lg px-3 h-9 transition-colors',
                  field.value
                    ? 'border-elena-pink-400 bg-elena-pink-50'
                    : 'border-input bg-background'
                )}
              >
                <span
                  className={cn(
                    'text-sm transition-colors',
                    field.value
                      ? 'text-elena-pink-600 font-medium'
                      : 'text-muted-foreground'
                  )}
                >
                  {field.value
                    ? 'Sí, incluir licencias'
                    : 'No incluir licencias'}
                </span>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className='data-[state=checked]:bg-elena-pink-500 data-[state=unchecked]:bg-elena-pink-100'
                  />
                </FormControl>
              </div>
            </FormItem>
          )}
        />
      </div>

      {includeLicenses && (
        <>
          <div className='grid grid-cols-2 gap-4 mt-4'>
            <FormField
              control={form.control}
              name='licenseBillingPeriod'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    Periodo de facturación:
                  </FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className='text-sm text-muted-foreground'>
                        <SelectValue placeholder='Seleccionar periodo' />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value='monthly'>Mensual</SelectItem>
                      <SelectItem value='annual'>Anual</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <p className='mt-5 text-sm text-muted-foreground font-medium'>
            Licencias estándar
          </p>
          <div className='grid grid-cols-3 gap-4 mt-2'>
            <FormField
              control={form.control}
              name='standardLicenses.quantity'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>Cantidad:</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={1}
                      className='text-sm text-muted-foreground'
                      placeholder='Cantidad de licencias estándar'
                      onChange={e => {
                        const qty = e.target.valueAsNumber;
                        field.onChange(qty);
                        const unitPrice = form.getValues(
                          'standardLicenses.unitPrice'
                        );
                        if (!isNaN(qty) && unitPrice) {
                          form.setValue(
                            'standardLicenses.totalLicensesPrice',
                            qty * unitPrice,
                            { shouldValidate: false }
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='standardLicenses.unitPrice'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    Precio por licencia (USD):
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='text'
                      inputMode='numeric'
                      className='text-sm text-muted-foreground'
                      placeholder='Precio mínimo $108'
                      value={
                        field.value ? currencyUSD(Number(field.value)) : ''
                      }
                      onChange={e => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const price = rawValue ? Number(rawValue) : undefined;
                        field.onChange(price ?? '');
                        const qty = form.getValues(
                          'standardLicenses.quantity'
                        );
                        if (price && qty && !isNaN(qty)) {
                          form.setValue(
                            'standardLicenses.totalLicensesPrice',
                            qty * price,
                            { shouldValidate: false }
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='standardLicenses.totalLicensesPrice'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    Precio total estándar (USD):
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      type='text'
                      className='text-sm text-muted-foreground bg-muted cursor-default'
                      placeholder='Se calcula automáticamente'
                      value={
                        field.value ? currencyUSD(Number(field.value)) : ''
                      }
                      onChange={() => {}}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <p className='mt-4 text-sm text-muted-foreground font-medium'>
            Licencias premium
          </p>
          <div className='grid grid-cols-3 gap-4 mt-2'>
            <FormField
              control={form.control}
              name='premiumLicenses.quantity'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>Cantidad:</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min={1}
                      className='text-sm text-muted-foreground'
                      placeholder='Cantidad de licencias premium'
                      onChange={e => {
                        const qty = e.target.valueAsNumber;
                        field.onChange(qty);
                        const unitPrice = form.getValues(
                          'premiumLicenses.unitPrice'
                        );
                        if (!isNaN(qty) && unitPrice) {
                          form.setValue(
                            'premiumLicenses.totalLicensesPrice',
                            qty * unitPrice,
                            { shouldValidate: false }
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='premiumLicenses.unitPrice'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    Precio por licencia (USD):
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='text'
                      inputMode='numeric'
                      className='text-sm text-muted-foreground'
                      placeholder='Precio mínimo $120'
                      value={
                        field.value ? currencyUSD(Number(field.value)) : ''
                      }
                      onChange={e => {
                        const rawValue = e.target.value.replace(/\D/g, '');
                        const price = rawValue ? Number(rawValue) : undefined;
                        field.onChange(price ?? '');
                        const qty = form.getValues(
                          'premiumLicenses.quantity'
                        );
                        if (price && qty && !isNaN(qty)) {
                          form.setValue(
                            'premiumLicenses.totalLicensesPrice',
                            qty * price,
                            { shouldValidate: false }
                          );
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='premiumLicenses.totalLicensesPrice'
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    Precio total premium (USD):
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      readOnly
                      type='text'
                      className='text-sm text-muted-foreground bg-muted cursor-default'
                      placeholder='Se calcula automáticamente'
                      value={
                        field.value ? currencyUSD(Number(field.value)) : ''
                      }
                      onChange={() => {}}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </>
  );
}
