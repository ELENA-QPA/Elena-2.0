import { z } from 'zod';
import {
  OPERATION_TYPES,
  QUOTE_STATUSES,
  TECHNOLOGY_OPTIONS,
} from '../types/quotes.types';

export const quoteSchema = z.object({
  //Datos del cliente
  companyName: z
    .string({
      message: 'El nombre de la empresa no puede estar vacío',
    })
    .min(1, 'El nombre de la empresa no puede estar vacío'),

  // Solo dígitos, sin guiones, puntos ni comas (6-10 dígitos)
  nit: z
    .string({ message: 'Debe proporcionar un número de NIT' })
    .min(6, { message: 'El NIT debe tener al menos 6 dígitos' })
    .max(10, { message: 'El NIT no puede tener más de 10 dígitos' })
    .regex(/^\d+$/, {
      message:
        'El NIT debe contener solo dígitos, sin guiones, puntos ni comas',
    }),

  contactName: z
    .string({ message: 'El nombre del contacto no puede estar vacío' })
    .min(4, {
      message: 'El nombre del contacto debe tener almenos 4 digitos',
    }),

  contactPosition: z
    .string()
    .min(1, { message: 'El cargo no puede estar vacío' }),

  industry: z
    .string({
      message: 'La industria/sector no puede estar vacío',
    })
    .min(1, { message: 'La industria/sector no puede estar vacío' }),

  totalWorkers: z
    .number({
      message: 'El total de trabajadores de la empresa no puede ser 0',
    })
    .min(1, { message: 'El valor debe ser mayor a 0' }),

  // La validación cruzada con totalWorkers se hace en superRefine
  productionWorkers: z
    .number({
      message: 'El total de trabajadores en produccion no puede ser 0',
    })
    .min(1, { message: 'El valor debe ser mayor a 0' }),

  email: z
    .string({ message: 'El correo electronico no puede estar vacio' })
    .email({ message: 'Debe ser un correo electrónico válido' }),

  // 1 Número principal requerido, el resto opcionales
  phones: z
    .array(
      z.string().regex(/^\d{7,15}$/, {
        message: 'Número inválido, solo dígitos sin espacios',
      })
    )
    .min(1, { message: 'Debe ingresar al menos un teléfono' }),

  operationType: z.enum(OPERATION_TYPES, {
    message: 'Debe elegir un tipo de operación',
  }),

  // Multi-selección: permite elegir una o varias opciones
  currentTechnology: z
    .array(z.enum(TECHNOLOGY_OPTIONS), {
      message: 'Debe seleccionar al menos una tecnología',
    })
    .min(1, { message: 'Debe seleccionar al menos una tecnología' }),

  // La validación de requerido cuando se elige 'other' se hace en superRefine
  otherTecnologyDetail: z.string().optional(),

  includeLicences: z.boolean().default(false),

  standardLicenses: z.object({
    quantity: z.preprocess(
      value => (typeof value === 'string' ? parseInt(value, 10) : value),
      z
        .number({ message: 'La cantidad de licencias debe ser un número' })
        .min(1, { message: 'La cantidad de licencias debe ser mínimo 1' })
        .optional()
    ),
    unitPrice: z.preprocess(
      value => {
        if (typeof value === 'string') {
          const numeric = value.replace(/[^0-9]/g, '');
          return numeric ? parseInt(numeric, 10) : value;
        }
        return value;
      },
      z
        .number({ message: 'El precio debe ser un número' })
        .min(108, {
          message: 'El precio mínimo de licencias estándar es $108 USD',
        })
        .default(108)
    ),
    totalLicensesPrice: z.number().optional(),
  }),

  premiumLicenses: z.object({
    quantity: z.preprocess(
      value => (typeof value === 'string' ? parseInt(value, 10) : value),
      z
        .number({ message: 'La cantidad de licencias debe ser un número' })
        .min(1, { message: 'La cantidad de licencias debe ser mínimo 1' })
        .optional()
    ),
    unitPrice: z.preprocess(
      value => {
        if (typeof value === 'string') {
          const numeric = value.replace(/[^0-9]/g, '');
          return numeric ? parseInt(numeric, 10) : value;
        }
        return value;
      },
      z
        .number({ message: 'El precio no puede estar vacio' })
        .min(120, {
          message: 'El precio mínimo de licencias premium es $120 USD',
        })
        .default(120)
    ),
    totalLicencesPrice: z.number().optional(),
  }),

  implementationPriceUSD: z
    .number({ message: 'El precio de implementacion no puede estar vacio' })
    .min(0, { message: 'El precio debe ser mayor a 0' }),

  // No puede ser menor a la fecha actual
  estimatedStartDate: z
    .date({ message: 'Debes seleccionar una fecha estimada de inicio' })
    .refine(date => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
      message: 'La fecha no puede ser anterior a hoy',
    }),

  quoteStatus: z.enum(QUOTE_STATUSES).default('draft'),
});

export type QuoteFormValues = z.infer<typeof quoteSchema>;
