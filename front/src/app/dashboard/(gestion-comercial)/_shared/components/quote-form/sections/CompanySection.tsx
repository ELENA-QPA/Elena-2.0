import {
  Checkbox,
  Input,
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
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from 'react-hook-form';
import { TECHNOLOGY_LABELS } from '../../../types/quotes.constants';
import { TECHNOLOGY_OPTIONS, type TechnologyOption } from '../../../types/quotes.types';
import { QuoteFormValues } from '../../../validations';

interface CompanySectionProps {
  form: UseFormReturn<QuoteFormValues>;
}

export function CompanySection({ form }: CompanySectionProps) {
  const currentTechnology = form.watch('currentTechnology');

  return (
    <>
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
                  inputMode='numeric'
                  type='number'
                  className='text-sm text-muted-foreground truncate'
                  placeholder='Solo dígitos numéricos, incluyendo dígito de verificación, sin guiones (-) ni puntos (.)'
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
      <div className='grid grid-cols-1 gap-4 mt-4'>
        <FormField
          control={form.control}
          name='companyAddress'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Dirección de la empresa:
              </FormLabel>
              <FormControl>
                <Input
                  className='text-sm text-muted-foreground truncate'
                  placeholder='Dirección principal de la empresa'
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
      <div className='grid grid-cols-2 gap-4 mt-4'>
        <FormField
          control={form.control}
          name='numberOfLocations'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Número de sedes o plantas:
              </FormLabel>
              <FormControl>
                <Input
                  type='number'
                  min={1}
                  className='text-sm text-muted-foreground truncate'
                  placeholder='Cantidad de sedes o plantas'
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
          name='operationalNotes'
          render={({ field }) => (
            <FormItem className='space-y-1'>
              <FormLabel className='text-sm'>
                Observaciones operativas:
              </FormLabel>
              <FormControl>
                <Textarea
                  className='text-sm text-muted-foreground resize-none'
                  placeholder='Observaciones relevantes sobre la operación del cliente'
                  rows={3}
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
              <FormLabel className='text-sm'>Tecnología utilizada:</FormLabel>
              <div className='grid grid-cols-3 gap-3 mt-2'>
                {TECHNOLOGY_OPTIONS.map((option: TechnologyOption) => (
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
            name='otherTechnologyDetail'
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
    </>
  );
}
