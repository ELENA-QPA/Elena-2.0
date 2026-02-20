'use client';

import {
  Button,
  Calendar,
  Checkbox,
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
  Form,
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
import { CalendarIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  currencyUSD,
  handleAddPhone,
  handleRemovePhone,
} from '../lib/helperFunctions';
import { QuoteFormValues, quoteResolver } from '../validations';

import { TECHNOLOGY_LABELS, TECHNOLOGY_OPTIONS } from '../types/quotes.types';

export function GenerateQuoteForm() {
  //Valores a enviar en la petición
  const form = useForm<QuoteFormValues>({
    resolver: quoteResolver,
    mode: 'onChange',
    defaultValues: {
      //Definir los valores que queramos por default o si queremos obtener los valores desde hubspot
      companyName: '',
      nit: '',
      phones: [''],
      includeLicences: false,
      standardLicenses: { unitPrice: 108 },
      premiumLicenses: { unitPrice: 120 },
    },
  });

  //Watchers para validar cuando un valor cambia en el formulario
  const currentTechnology = form.watch('currentTechnology');
  const phones = form.watch('phones') ?? [''];
  const includeLicences = form.watch('includeLicences');

  //Manejador para el envío de la petición
  const onSubmitHandler = async (values: QuoteFormValues) => {
    console.log('Values', values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)}>
        <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
          Información de la empresa
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='companyName'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Nombre:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Nombre completo de la empresa'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='nit'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Nit:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Solo dígitos numéricos, incluyendo dígito de verificación, sin guiones (-) ni puntos (.)'
                    {...field}
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
            name='industry'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>
                  Industria/Sector que pertenece:
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Industria o sector a la que pertenece la empresa'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='operationType'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Tipo de operación:</FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className='text-sm text-muted-foreground truncate'>
                      <SelectValue
                        placeholder={
                          field.value ?? 'Seleccione un tipo de operación'
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='make_to_order'>make_to_order</SelectItem>
                    <SelectItem value='make_to_stock'>make_to_stock</SelectItem>
                    <SelectItem value='hybrid'>hybrid</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='grid grid-cols-2 gap-4 mt-4'>
          <FormField
            control={form.control}
            name='totalWorkers'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>
                  Total de trabajadores vinculados:
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Total de trabajadores en la empresa'
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='productionWorkers'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>
                  Trabajadores en producción:
                </FormLabel>
                <FormControl>
                  <Input
                    type='number'
                    min={1}
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Cantidad de trabajadores en producción'
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber)}
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
            name='currentTechnology'
            render={() => (
              <FormItem>
                <FormLabel className='text-sm'>Tecnología utilizada:</FormLabel>
                <div className='grid grid-cols-3 gap-3 mt-2'>
                  {TECHNOLOGY_OPTIONS.map(option => (
                    <FormField
                      key={option}
                      control={form.control}
                      name='currentTechnology'
                      render={({ field }) => (
                        <FormItem
                          key={option}
                          className='flex items-center space-x-2 space-y-0'
                        >
                          <FormControl>
                            <Checkbox
                              checked={field.value?.includes(option)}
                              onCheckedChange={checked => {
                                const current = field.value ?? [];
                                field.onChange(
                                  checked
                                    ? [...current, option]
                                    : current.filter((v: any) => v !== option)
                                );
                              }}
                            />
                          </FormControl>
                          <FormLabel className='text-sm font-normal'>
                            {TECHNOLOGY_LABELS[option]}
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
          {currentTechnology?.includes('other') && (
            <FormField
              control={form.control}
              name='otherTecnologyDetail'
              render={({ field }) => (
                <FormItem className='space-y-1 mt-4'>
                  <FormLabel className='text-sm'>
                    Especifica la otra tecnología:
                  </FormLabel>
                  <FormControl>
                    <Input
                      className='text-sm text-muted-foreground truncate'
                      placeholder='Describe la tecnología que utilizas'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
          Información de contacto
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='contactName'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Nombre completo:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Nombre del contacto de la empresa'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='contactPosition'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Cargo:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Cargo del contacto en la empresa'
                    {...field}
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
            name='email'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Correo electrónico:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Mail del contacto de la empresa'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='phones.0'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Número principal:</FormLabel>
                <div className='flex items-center gap-2'>
                  <div className='flex-1 min-w-0'>
                    <FormControl>
                      <Input
                        className='text-sm text-muted-foreground truncate'
                        placeholder='Número principal de contacto'
                        {...field}
                      />
                    </FormControl>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => handleAddPhone(form, phones)}
                    className='shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700'
                  >
                    Añadir
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        {phones.length > 1 && (
          <div className='mt-4 grid grid-cols-2 gap-4'>
            {phones.slice(1).map((_: any, i: number) => {
              const index = i + 1;
              return (
                <FormField
                  key={index}
                  control={form.control}
                  name={`phones.${index}`}
                  render={({ field }) => (
                    <FormItem className='space-y-1'>
                      <FormLabel className='text-sm'>
                        {`Número opcional ${index}:`}
                      </FormLabel>
                      <div className='flex items-center gap-2'>
                        <div className='flex-1 min-w-0'>
                          <FormControl>
                            <Input
                              className='text-sm text-muted-foreground truncate'
                              placeholder='Número adicional de contacto'
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <Button
                          type='button'
                          variant='outline'
                          size='icon'
                          onClick={() => handleRemovePhone(form, phones, index)}
                          className='shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700'
                        >
                          <X className='h-4 w-4' />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              );
            })}
          </div>
        )}
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
                <Popover>
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
            name='includeLicences'
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
        {includeLicences && (
          <>
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
                              'premiumLicenses.totalLicencesPrice',
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
                              'premiumLicenses.totalLicencesPrice',
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
                name='premiumLicenses.totalLicencesPrice'
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
        </div>
        <Button className='mt-6' type='submit'>
          Generar cotización
        </Button>
      </form>
    </Form>
  );
}
