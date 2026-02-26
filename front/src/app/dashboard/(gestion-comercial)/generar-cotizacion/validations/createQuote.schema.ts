import { z } from 'zod';
import {
  LICENSE_BILLING_PERIOD,
  OPERATION_TYPES,
  QUOTE_STATUSES,
  TECHNOLOGY_OPTIONS,
} from '../types/quotes.types';

export const quoteSchema = z.object({
  companyName: z
    .string({
      message: 'El nombre de la empresa no puede estar vacío',
    })
    .min(1, 'El nombre de la empresa no puede estar vacío'),

  nit: z
    .number({ message: 'Debe proporcionar un número de NIT' })
    .int({ message: 'El NIT solo debe contener dígitos enteros' })
    .min(100000, { message: 'El NIT debe tener al menos 6 dígitos' })
    .max(9999999999, { message: 'El NIT no puede tener más de 10 dígitos' }),

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

  productionWorkers: z
    .number({
      message: 'El total de trabajadores en produccion no puede ser 0',
    })
    .min(1, { message: 'El valor debe ser mayor a 0' }),

  email: z
    .string({ message: 'El correo electronico no puede estar vacio' })
    .email({ message: 'Debe ser un correo electrónico válido' }),

  phones: z
    .array(
      z
        .number({ message: 'Debe digitar un numero de contacto' })
        .int({ message: 'El número no puede contener decimales' })
        .min(1000000, { message: 'El número debe tener al menos 7 dígitos' })
        .max(9999999999, {
          message: 'El número no puede tener más de 10 dígitos',
        })
    )
    .min(1, { message: 'Debe ingresar al menos un teléfono' }),

  operationType: z.enum(OPERATION_TYPES, {
    message: 'Debe elegir un tipo de operación',
  }),

  currentTechnology: z
    .array(z.enum(TECHNOLOGY_OPTIONS), {
      message: 'Debe seleccionar al menos una tecnología',
    })
    .min(1, { message: 'Debe seleccionar al menos una tecnología' }),

  otherTechnologyDetail: z.string().optional(),

  includeLicenses: z.boolean().default(false),

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
    totalLicensesPrice: z.number().optional(),
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

  // Generado en el frontend al cargar el formulario
  quoteId: z.string().optional(),

  // ── NUEVOS CAMPOS ──────────────────────────────────────────────────────────

  companyAddress: z.string().optional(),

  notificationEmails: z
    .array(z.string().email({ message: 'Debe ser un email válido' }))
    .default([]),

  numberOfLocations: z
    .number()
    .int()
    .min(1, { message: 'Debe ser al menos 1' })
    .optional(),

  operationalNotes: z.string().optional(),

  licenseBillingPeriod: z.nativeEnum(LICENSE_BILLING_PERIOD).default(LICENSE_BILLING_PERIOD.MONTHLY),

  implementationDurationWeeks: z
    .number()
    .int()
    .min(1, { message: 'La duración debe ser al menos 1 semana' })
    .optional(),

  estimatedGoLiveDate: z.date().optional(),

  implementationDescription: z.string().optional(),

  paymentTerms: z.string().optional(),

  includedModules: z.array(z.string()).default([]),

  additionalModulesDetail: z.string().optional(),

  expirationDateOverride: z.date().optional(),

  advisorOverride: z
    .object({
      name: z.string().optional(),
      position: z.string().optional(),
      email: z.string().email({ message: 'Email inválido' }).optional().or(z.literal('')),
    })
    .optional(),

});

export type QuoteFormValues = z.infer<typeof quoteSchema>;
