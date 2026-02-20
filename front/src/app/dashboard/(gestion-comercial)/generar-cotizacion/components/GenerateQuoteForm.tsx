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
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import {
  QuoteFormValues,
  TECHNOLOGY_OPTIONS,
  quoteSchema,
} from '../validations';

const TECHNOLOGY_LABELS: Record<(typeof TECHNOLOGY_OPTIONS)[number], string> = {
  excel: 'Excel',
  erp_mrp: 'ERP/MRP',
  software: 'Software especializado',
  none: 'Ninguna',
  other: 'Otra',
};

export function GenerateQuoteForm() {
  //Valores a enviar en la peticion
  const form = useForm<QuoteFormValues>({
    resolver: zodResolver(quoteSchema),
    defaultValues: {
      //Definir los valores que queramos por default o si queremos obtener los valores desde hubspot
      phones: [''],
      includeLicences: false,
    },
  });

  const currentTechnology = form.watch('currentTechnology');
  const phones = form.watch('phones') ?? [''];
  const includeLicences = form.watch('includeLicences');

  const handleAddPhone = () => {
    form.setValue('phones', [...phones, '']);
  };

  const handleRemovePhone = (index: number) => {
    form.setValue(
      'phones',
      phones.filter((_, i) => i !== index)
    );
  };

  const onSubmitHandler = async (values: QuoteFormValues) => {
    console.log('Values', values);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmitHandler)}>
        <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
          Informacion de la empresa
        </p>
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='companyName'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Nombre de la empresa:</FormLabel>
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
                <FormLabel className='text-sm'>Nit de la empresa:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Solo digitos numericos, incluyendo digito de verificacion, sin guiones (-) ni puntos (.)'
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
                  Industria/Sector de la empresa:
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
                <FormLabel className='text-sm'>
                  Tipo de operacion de la empresa:
                </FormLabel>
                <Select
                  defaultValue={field.value}
                  onValueChange={field.onChange}
                >
                  <FormControl>
                    <SelectTrigger className='text-sm text-muted-foreground truncate'>
                      <SelectValue
                        placeholder={
                          field.value ?? 'Seleccione un tipo de operacion'
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
            name='productionWorkers'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>
                  Trabajadores en produccion:
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Cantidad de trabajadores en produccion'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='totalWorkers'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>
                  Trabajadores de la empresa:
                </FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='Total de trabajadores en la empresa'
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
            name='currentTechnology'
            render={() => (
              <FormItem>
                <FormLabel className='text-sm'>Tecnologia utilizada:</FormLabel>
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
                                    : current.filter(v => v !== option)
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
          Informacion de contacto
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
            name='email'
            render={({ field }) => (
              <FormItem className='space-y-1'>
                <FormLabel className='text-sm'>Correo electronico:</FormLabel>
                <FormControl>
                  <Input
                    className='text-sm text-muted-foreground truncate'
                    placeholder='mail del contacto de la empresa'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className='mt-4 grid grid-cols-2 gap-4'>
          {phones.map((_, index) => (
            <FormField
              key={index}
              control={form.control}
              name={`phones.${index}`}
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    {index === 0
                      ? 'Número principal:'
                      : `Número opcional ${index}:`}
                  </FormLabel>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 min-w-0'>
                      <FormControl>
                        <Input
                          className='text-sm text-muted-foreground truncate'
                          placeholder={
                            index === 0
                              ? 'Número principal de contacto'
                              : 'Número adicional de contacto'
                          }
                          {...field}
                        />
                      </FormControl>
                    </div>
                    {index > 0 ? (
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => handleRemovePhone(index)}
                        className='shrink-0'
                      >
                        <X className='h-4 w-4' />
                      </Button>
                    ) : (
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={handleAddPhone}
                        className='shrink-0'
                      >
                        Añadir
                      </Button>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
        <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
          Detalles de la cotizacion
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
                    {field.value ? 'Sí, incluir licencias' : 'No incluir licencias'}
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
            <div className='grid grid-cols-2 gap-4 mt-2'>
              <FormField
                control={form.control}
                name='standardLicensesCount'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-sm'>Cantidad:</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='text-sm text-muted-foreground'
                        placeholder='Cantidad de licencias estándar'
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
                name='standardLicencesPriceUSD'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-sm'>Precio por licencia (USD):</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='text-sm text-muted-foreground'
                        placeholder='Precio mínimo $108 USD'
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
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
            <div className='grid grid-cols-2 gap-4 mt-2'>
              <FormField
                control={form.control}
                name='premiumLicensesCount'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-sm'>Cantidad:</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='text-sm text-muted-foreground'
                        placeholder='Cantidad de licencias premium'
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
                name='premiumLicencesPriceUSD'
                render={({ field }) => (
                  <FormItem className='space-y-1'>
                    <FormLabel className='text-sm'>Precio por licencia (USD):</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        className='text-sm text-muted-foreground'
                        placeholder='Precio mínimo $120 USD'
                        {...field}
                        onChange={e => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </>
        )}
        <Button className='mt-4' type='submit'>
          Generar cotizacion
        </Button>
      </form>
    </Form>
  );
}
