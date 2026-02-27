import { Button, Input } from '@/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Plus, X } from 'lucide-react';
import { UseFormReturn } from 'react-hook-form';
import {
  handleAddNotificationEmail,
  handleAddPhone,
  handleRemoveNotificationEmail,
  handleRemovePhone,
} from '../../../lib/quote.helpers';
import { QuoteFormValues } from '../../../validations';

interface ContactSectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function ContactSection({ form }: ContactSectionProps) {
  const phones = form.watch('phones') ?? [1];
  const notificationEmails = form.watch('notificationEmails') ?? [];

  return (
    <>
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
                      type='number'
                      inputMode='numeric'
                      className='text-sm text-muted-foreground truncate'
                      placeholder='Número principal de contacto'
                      {...field}
                      onChange={e => field.onChange(e.target.valueAsNumber)}
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
                            type='number'
                            inputMode='numeric'
                            className='text-sm text-muted-foreground truncate'
                            placeholder='Número adicional de contacto'
                            {...field}
                            onChange={e =>
                              field.onChange(e.target.valueAsNumber)
                            }
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
      <div className='mt-4'>
        <div className='flex items-center justify-between mb-2'>
          <p className='text-sm font-medium'>
            Emails de notificación contractual:
          </p>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => handleAddNotificationEmail(form)}
            className='shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700'
          >
            <Plus className='h-3 w-3 mr-1' />
            Añadir email
          </Button>
        </div>
        {notificationEmails.length === 0 && (
          <p className='text-xs text-muted-foreground'>
            Si no se agregan, se usará el correo de contacto principal.
          </p>
        )}
        <div className='grid grid-cols-2 gap-4'>
          {notificationEmails.map((_, i) => (
            <FormField
              key={i}
              control={form.control}
              name={`notificationEmails.${i}`}
              render={({ field }) => (
                <FormItem className='space-y-1'>
                  <FormLabel className='text-sm'>
                    {`Email notificación ${i + 1}:`}
                  </FormLabel>
                  <div className='flex items-center gap-2'>
                    <div className='flex-1 min-w-0'>
                      <FormControl>
                        <Input
                          type='email'
                          className='text-sm text-muted-foreground truncate'
                          placeholder='email@empresa.com'
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='icon'
                      onClick={() => handleRemoveNotificationEmail(form, i)}
                      className='shrink-0 border-elena-pink-400 bg-elena-pink-50 text-elena-pink-600 hover:bg-elena-pink-100 hover:text-elena-pink-700'
                    >
                      <X className='h-4 w-4' />
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
}
