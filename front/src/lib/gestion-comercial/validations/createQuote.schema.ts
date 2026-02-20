import { z } from 'zod';

const TECHNOLOGY_OPTIONS = [
  'excel',
  'erp_mrp',
  'software',
  'none',
  'other',
] as const;
const OPERATION_TYPES = ['make_to_order', 'make_to_stock', 'hybrid'] as const;
const QUOTE_STATUSES = [
  'draft',
  'preview',
  'sent',
  'accepted',
  'rejected',
] as const;

export const quoteSchema = z
  .object({
    //Datos del cliente
    companyName: z
      .string()
      .min(1, { message: 'El nombre de la empresa no puede estar vacío' }),

    // Solo dígitos, sin guiones, puntos ni comas, incluye el dígito de verificación (9-10 dígitos)
    nit: z.string().regex(/^\d{9,10}$/, {
      message:
        'El NIT debe contener solo dígitos sin guiones, puntos ni comas, incluyendo el dígito de verificación',
    }),

    contactName: z
      .string()
      .min(1, { message: 'El nombre del contacto no puede estar vacío' }),

    contactPosition: z
      .string()
      .min(1, { message: 'El cargo no puede estar vacío' }),

    industry: z
      .string()
      .min(1, 'La industria/sector de la empresa no puede estar vacía'),

    totalWorkers: z
      .number({ message: 'Debe ser un valor numérico' })
      .min(1, { message: 'El valor debe ser mayor a 0' })
      .default(1),

    // La validación cruzada con totalWorkers se hace en superRefine
    productionWorkers: z
      .number({ message: 'Debe ser un valor numérico' })
      .min(1, { message: 'El valor debe ser mayor a 0' })
      .default(1),

    email: z
      .string()
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
      .array(z.enum(TECHNOLOGY_OPTIONS))
      .min(1, { message: 'Debe seleccionar al menos una tecnología' }),

    // La validación de requerido cuando se elige 'other' se hace en superRefine
    otherTecnologyDetail: z.string().optional(),

    includeLicences: z.boolean().default(false),

    standardLicensesCount: z
      .number()
      .min(1, { message: 'La cantidad de licencias debe ser mayor a 0' })
      .default(0),

    standardLicencesPriceUSD: z
      .number({ message: 'El valor debe ser numérico' })
      .min(108, { message: 'El valor no puede ser menor de $108 USD' })
      .default(108),

    premiumLicensesCount: z
      .number()
      .min(1, { message: 'La cantidad de licencias debe ser mayor a 0' })
      .default(0),

    premiumLicencesPriceUSD: z
      .number({ message: 'El valor debe ser numérico' })
      .min(120, { message: 'El valor no puede ser menor de $120 USD' })
      .default(120),

    implementationPriceUSD: z
      .number({ message: 'El valor debe ser numérico' })
      .min(0, { message: 'El precio debe ser mayor a 0' }),

    // No puede ser menor a la fecha actual
    estimatedStartDate: z
      .date({ message: 'Debes seleccionar una fecha estimada de inicio' })
      .refine(date => date >= new Date(new Date().setHours(0, 0, 0, 0)), {
        message: 'La fecha no puede ser anterior a hoy',
      }),

    quoteStatus: z.enum(QUOTE_STATUSES).default('draft'),
  })
  .superRefine((data, ctx) => {
    // productionWorkers no puede superar totalWorkers
    if (data.productionWorkers > data.totalWorkers) {
      ctx.addIssue({
        code: z.ZodIssueCode.too_big,
        maximum: data.totalWorkers,
        type: 'number',
        inclusive: true,
        message: `No puede superar el total de trabajadores (${data.totalWorkers})`,
        path: ['productionWorkers'],
      });
    }

    // otherTecnologyDetail es obligatorio si se selecciona 'other'
    if (
      data.currentTechnology.includes('other') &&
      !data.otherTecnologyDetail?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Debe especificar cuál es la otra tecnología',
        path: ['otherTecnologyDetail'],
      });
    }
  });

export type QuoteFormValues = z.infer<typeof quoteSchema>;
