import { Checkbox } from '@/components';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { MODULE_OPTIONS } from '../../../types/quotes.constants';
import { QuoteFormValues } from '../../../validations';

interface ModulesSectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function ModulesSection({ form }: ModulesSectionProps) {
  return (
    <>
      <p className='mt-5 text-md text-elena-pink-500 font-semibold'>
        Módulos incluidos
      </p>
      <div className='mt-2'>
        <FormField
          control={form.control}
          name='includedModules'
          render={() => (
            <FormItem>
              <FormLabel className='text-sm'>
                Selecciona los módulos que incluye la propuesta:
              </FormLabel>
              <div className='grid grid-cols-3 gap-3 mt-2'>
                {MODULE_OPTIONS.map(mod => (
                  <FormField
                    key={mod.value}
                    control={form.control}
                    name='includedModules'
                    render={({ field }) => (
                      <FormItem className='flex items-center space-x-2 space-y-0'>
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(mod.value)}
                            onCheckedChange={checked => {
                              const current = field.value ?? [];
                              field.onChange(
                                checked
                                  ? [...current, mod.value]
                                  : current.filter(
                                      (v: string) => v !== mod.value
                                    )
                              );
                            }}
                          />
                        </FormControl>
                        <FormLabel className='text-sm font-normal'>
                          {mod.label}
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
      </div>
      <div className='mt-4'>
        <FormField
          control={form.control}
          name='additionalModulesDetail'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Módulos o funcionalidades adicionales:
              </FormLabel>
              <FormControl>
                <Textarea
                  className='text-sm text-muted-foreground resize-none'
                  placeholder='Describe módulos o funcionalidades extras no listados arriba'
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
