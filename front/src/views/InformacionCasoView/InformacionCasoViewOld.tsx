"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { get, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { useCaso } from "@/modules/informacion-caso/hooks/useCaso";
import {
  Document as CasoDocument,
  Intervener,
  ProceduralPart,
  Payment,
  PaymentValue,
  CreateDocumentBody,
  UpdateDocumentBody,
  CreateIntervenerBody,
  CreateProceduralPartBody,
  CreatePaymentBody,
} from "@/modules/informacion-caso/data/interfaces/caso.interface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Upload,
  Plus,
  Trash2,
  Edit,
  Phone,
  Eye,
  Copy,
  Download,
  ChevronUp,
  Calendar,
  X,
  ChevronDown,
  Users,
  FileText,
  Clock,
  CreditCard,
  ArrowLeft,
} from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { z } from "zod";
import loading from "@/app/dashboard/informacion-caso/loading";
import error from "next/error";

// Función para validar documento según el tipo
const validateDocumentNumber = (
  documentType: string,
  documentNumber: string,
) => {
  if (!documentNumber) return true;

  // Tipos que requieren solo números
  const numericTypes = [
    "Cédula de Ciudadanía",
    "NIT",
    "Cédula de Extranjería",
    "NUIP",
    "PEP",
    "PPT",
    "TTP",
  ];

  // Tipos que permiten letras y números (como pasaporte)
  const alphanumericTypes = ["Pasaporte"];

  if (numericTypes.includes(documentType)) {
    return /^[0-9]+$/.test(documentNumber);
  }

  if (alphanumericTypes.includes(documentType)) {
    return /^[A-Za-z0-9]+$/.test(documentNumber);
  }

  // Por defecto, permitir alfanumérico
  return /^[A-Za-z0-9]+$/.test(documentNumber);
};

// Función para obtener mensaje de error según el tipo de documento
const getDocumentErrorMessage = (documentType: string) => {
  const numericTypes = [
    "Cédula de Ciudadanía",
    "NIT",
    "Cédula de Extranjería",
    "NUIP",
    "PEP",
    "PPT",
    "TTP",
  ];

  if (numericTypes.includes(documentType)) {
    return "El número de documento solo puede contener números";
  }

  return "El número de documento solo puede contener letras y números";
};

// Esquema de validación actualizado para coincidir con el diseño
export const caseFormSchema = z.object({
  clientType: z.string().min(1, "Seleccione un tipo de cliente"),
  // El código interno lo genera el backend; permitir vacío
  internalCode: z.string().optional().or(z.literal("")),
  department: z.string().min(1, "Seleccione un departamento"),
  city: z.string().min(1, "Seleccione una ciudad"),
  country: z.string().min(1, "Seleccione un país"),
  personType: z
    .string()
    .optional()
    .refine((val) => val && val !== "", {
      message: "Seleccione un tipo de persona",
    }),
  processType: z
    .string()
    .optional()
    .refine((val) => val && val !== "", {
      message: "Seleccione un tipo de proceso",
    }),
  creationDate: z.string().min(1, "Fecha requerida"),
  jurisdiction: z
    .string()
    .optional()
    .refine((val) => val && val !== "", {
      message: "Seleccione una jurisdicción",
    }),
  location: z.string().optional(),
  despachoJudicial: z.string().min(1, "Despacho judicial requerido"),
  numeroRadicado: z
    .string()
    .min(1, "Número de radicado requerido")
    .refine((val) => /^[0-9\-]+$/.test(val), {
      message: "El número de radicado solo puede contener números y guiones",
    }),
  demandantePart: z
    .array(
      z
        .object({
          name: z.string().optional(),
          documentType: z.string().optional(),
          documentNumber: z.string().optional(),
          electronicAddress: z.string().optional(),
          contact: z
            .string()
            .optional()
            .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
              message:
                "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +",
            }),
        })
        .superRefine((data, ctx) => {
          if (
            data.documentNumber &&
            !validateDocumentNumber(
              data.documentType || "",
              data.documentNumber,
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: getDocumentErrorMessage(data.documentType || ""),
              path: ["documentNumber"],
            });
          }
        }),
    )
    .optional()
    .default([]),
  demandadoPart: z
    .array(
      z
        .object({
          name: z.string().optional(),
          documentType: z.string().optional(),
          documentNumber: z.string().optional(),
          electronicAddress: z.string().optional(),
          contact: z
            .string()
            .optional()
            .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
              message:
                "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +",
            }),
        })
        .superRefine((data, ctx) => {
          if (
            data.documentNumber &&
            !validateDocumentNumber(
              data.documentType || "",
              data.documentNumber,
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: getDocumentErrorMessage(data.documentType || ""),
              path: ["documentNumber"],
            });
          }
        }),
    )
    .optional()
    .default([]),

  // Campos temporales para formularios individuales - SIEMPRE OPCIONALES para el submit del formulario principal
  tempDemandante: z
    .object({
      name: z.string().optional(),
      documentType: z.string().optional(),
      documentNumber: z.string().optional(),
      electronicAddress: z.string().optional(),
      contact: z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
          message:
            "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +",
        }),
    })
    .superRefine((data, ctx) => {
      if (
        data.documentNumber &&
        !validateDocumentNumber(data.documentType || "", data.documentNumber)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getDocumentErrorMessage(data.documentType || ""),
          path: ["documentNumber"],
        });
      }
    })
    .optional(),
  tempDemandado: z
    .object({
      name: z.string().optional(),
      documentType: z.string().optional(),
      documentNumber: z.string().optional(),
      electronicAddress: z.string().optional(),
      contact: z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
          message:
            "El teléfono solo puede contener números, espacios, guiones, paréntesis y el símbolo +",
        }),
    })
    .superRefine((data, ctx) => {
      if (
        data.documentNumber &&
        !validateDocumentNumber(data.documentType || "", data.documentNumber)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getDocumentErrorMessage(data.documentType || ""),
          path: ["documentNumber"],
        });
      }
    })
    .optional(),
  tempInterviniente: z
    .object({
      name: z.string().optional(),
      documentType: z.string().optional(),
      documentNumber: z.string().optional(),
      interventionType: z.string().optional(),
      contact: z
        .string()
        .optional()
        .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
          message:
            "El teléfono solo puede contener números, espacios, paréntesis y signos + o -",
        }),
      electronicAddress: z.string().optional(),
    })
    .superRefine((data, ctx) => {
      if (
        data.documentNumber &&
        !validateDocumentNumber(data.documentType || "", data.documentNumber)
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: getDocumentErrorMessage(data.documentType || ""),
          path: ["documentNumber"],
        });
      }
    })
    .optional(),
  tempPago: z
    .object({
      value: z.number().min(0, "Valor debe ser mayor o igual a 0").optional(),
      causationDate: z.string().optional(),
      paymentDate: z.string().optional(),
    })
    .optional(),
  // Hacer que intervinientes sea más flexible - puede existir sin datos completos
  intervinientes: z
    .array(
      z
        .object({
          name: z.string().optional(),
          documentType: z.string().optional(),
          documentNumber: z.string().optional(),
          interventionType: z.string().optional(),
          contact: z
            .string()
            .optional()
            .refine((val) => !val || /^[0-9+\-\s()]*$/.test(val), {
              message:
                "El teléfono solo puede contener números, espacios, paréntesis y signos + o -",
            }),
          electronicAddress: z.string().optional(),
        })
        .superRefine((data, ctx) => {
          if (
            data.documentNumber &&
            !validateDocumentNumber(
              data.documentType || "",
              data.documentNumber,
            )
          ) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: getDocumentErrorMessage(data.documentType || ""),
              path: ["documentNumber"],
            });
          }
        }),
    )
    .optional()
    .default([]),
  includeSuccessPremium: z.boolean().default(false),
  payments: z
    .array(
      z.object({
        value: z.number().min(0, "Valor debe ser mayor o igual a 0"),
        causationDate: z.string().optional(),
        paymentDate: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
  successPremiumPercentage: z
    .number()
    .min(0)
    .max(100, "Porcentaje debe estar entre 0 y 100")
    .optional()
    .default(0),
  successPremiumPrice: z
    .number()
    .min(0, "Precio debe ser mayor o igual a 0")
    .optional()
    .default(0),
  successPremiumCausationDate: z.string().optional(),
  successPremiumPaymentDate: z.string().optional(),
  totalAmount: z
    .number()
    .min(0, "Monto debe ser mayor o igual a 0")
    .optional()
    .default(0),
});

export type CaseFormData = z.infer<typeof caseFormSchema>;

// Datos actualizados para coincidir con el diseño
const PROCESS_TYPES_BY_JURISDICTION: Record<string, string[]> = {
  Administrativo: [
    "Acción de nulidad y restablecimiento del derecho",
    "Acciones de cumplimiento",
    "Acciones de grupo",
    "Acciones populares",
    "Aprobación conciliaciones extrajudiciales",
    "Comisiones (Despachos comisorios)",
    "Negación copias, consultas y certificaciones (artículos 21 y 24 de la Ley 57 de 1985)",
    "Residuales (diferentes a temas laborales, contractuales o tributarios)",
    "Sección 1a electorales",
    "Sección 1a nulidad simple (otros asuntos)",
    "Sección 1a nulidad y restablecimiento del derecho (otros asuntos)",
    "Sección 2a ejecutivos (laboral)",
    "Sección 2a lesividad",
    "Sección 2a nulidad y restablecimiento del derecho (asuntos laborales)",
    "Sección 3a acción de repetición",
    "Sección 3a contractuales",
    "Sección 3a ejecutivos (contractual)",
    "Sección 3a reparación directa",
    "Sección 3a restitución de inmueble",
    "Sección 4a jurisdicción coactiva",
    "Sección 4a nulidad simple (asuntos tributarios)",
    "Sección 4a nulidad y restablecimiento del derecho (asuntos tributarios)",
  ],

  "Civil circuito - mayor cuantía": [
    "Procesos verbales (mayor cuantía)",
    "Proceso nulidad, disolución y liquidación sociedad civil y comercial",
    "Proceso pertenencia, divisorios, deslinde, amojonamiento",
    "Procesos de insolvencia",
    "Acciones populares y de grupo",
    "Procesos ejecutivos",
    "Pruebas extraprocesales designación árbitros",
    "Otros procesos (exhortos, recusaciones, etc.)",
  ],

  "Civil municipal - menor cuantía": [
    "Verbal de menor cuantía",
    "Verbal sumario",
    "Monitorio",
    "Pertenencia - divisorios - deslinde y amojonamiento",
    "Ejecutivo de menor cuantía",
    "Sucesión",
    "Pruebas extraprocesales - otros requerimientos - diligencias varias",
    "Matrimonio civil",
    "Proceso de insolvencia",
    "Medidas cautelares anticipadas",
    "Despacho comisorio",
  ],

  "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía":
    [
      "Verbal de mínima cuantía",
      "Monitorio",
      "Sucesión de mínima cuantía",
      "Celebración matrimonio civil - mínima cuantía",
      "Despacho comisorio",
      "Otros procesos de mínima cuantía",
      "Ejecutivo de mínima cuantía",
      "Verbal sumario",
      "Pertenencia - divisorios - deslinde y amojonamiento",
      "Pruebas extraprocesales - otros requerimientos - diligencias varias",
      "Proceso de insolvencia",
      "Medidas cautelares anticipadas",
    ],

  "Consejo de Estado": ["Otros"],

  Familia: [
    "Verbales",
    "Verbales sumarios",
    "Sucesión y cualquier otro de naturaleza liquidatoria",
    "Jurisdicción voluntaria",
    "Adopciones",
    "Derechos menores - permisos especiales salidas del país",
    "Ejecutivo de alimentos - ejecutivo",
    "Homologaciones",
    "Restablecimiento de derechos",
    "Otros procesos y actuaciones (comisarias, ICBF, cancillería, etc.)",
  ],

  "Laboral circuito": [
    "Ordinario",
    "Fuero sindical - acción de reintegro",
    "Cancelación personería jurídica",
    "Ejecutivos",
    "Pago por consignación",
    "Residual - otros procesos",
    "Homologaciones",
    "Despachos comisorios de laborales",
  ],

  "Pequeñas causas laborales": [
    "Ordinario de única instancia",
    "Ejecutivos",
    "Pago por consignación - oficina de depósitos judiciales",
    "Residual - otros procesos",
  ],

  "Tribunal administrativo - sección primera": [
    "Electorales",
    "Nulidad simple (otros asuntos)",
    "Nulidad y restablecimiento del derecho (otros asuntos)",
  ],

  "Tribunal administrativo - sección segunda": [
    "Ejecutivos (laboral)",
    "Lesividad",
    "Nulidad y restablecimiento del derecho (asuntos laborales)",
  ],

  "Tribunal administrativo - sección tercera": [
    "Acción de repetición",
    "Ejecutivos (contractual)",
    "Reparación directa",
    "Restitución de inmueble",
  ],

  "Tribunal administrativo - sección cuarta": [
    "Jurisdicción coactiva",
    "Nulidad simple (asuntos tributarios)",
    "Nulidad y restablecimiento del derecho (asuntos tributarios)",
  ],

  Otros: [
    "Superintendencia de Industria y Comercio",
    "Superintendencia Financiera",
    "Otro",
  ],
};

// Obtener tipos de proceso según jurisdicción seleccionada
const getProcessTypesByJurisdiction = (jurisdiction: string): string[] => {
  return PROCESS_TYPES_BY_JURISDICTION[jurisdiction] || [];
};

const personTypes = ["NATURAL", "JURÍDICA", "OTRO"];

const documentTypes = [
  { value: "Cédula de Ciudadanía", label: "Cédula de Ciudadanía" },
  { value: "NIT", label: "NIT" },
  { value: "Cédula de Extranjería", label: "Cédula de Extranjería" },
  { value: "Pasaporte", label: "Pasaporte" },
  { value: "NUIP", label: "NUIP" },
  { value: "PEP", label: "PEP" },
  { value: "PPT", label: "PPT" },
  { value: "TTP", label: "TTP" },
];
const ubicacionesExpediente = [
  "Unificada",
  "Rama",
  "Siugj",
  "PublicacionesProcesales",
  "Samai",
  "Tyba",
  "EstadosElectronicos",
];

const jurisdictions = [
  "Administrativo",
  "Civil circuito - mayor cuantía",
  "Civil municipal - menor cuantía",
  "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía",
  "Consejo de Estado",
  "Familia",
  "Laboral circuito",
  "Pequeñas causas laborales",
  "Tribunal administrativo - sección primera",
  "Tribunal administrativo - sección segunda",
  "Tribunal administrativo - sección tercera",
  "Tribunal administrativo - sección cuarta",
  "Otros",
];
const despachoJudicial = [
  "Juzgado 37 Laboral del Circuito de Bogotá",
  "Juzgado 1 Civil del Circuito de Bogotá",
  "Juzgado 2 Penal del Circuito de Bogotá",
  "Juzgado 3 Comercial del Circuito de Bogotá",
];

// Los departamentos y ciudades se cargarán dinámicamente desde divipola.json
const clientTypes = ["Rappi SAS", "Uber", "Didi", "Beat", "Ifood", "Otro"];

const interventionTypes = [
  "Tercero Interviniente",
  "Representante Legal",
  "Ministerio Público",
  "Apoderado",
  "Testigo",
  "Perito",
];

const documentModalTypes = [
  "Juzgado",
  "Demanda",
  "Contestación de la demanda",
  "Sentencia",
  "Auto",
  "Resolución",
  "Notificación",
  "Comunicación",
  "Oficio",
  "Memorial",
  "Pruebas",
  "Poder",
  "Cédula de ciudadanía",
  "RUT",
  "Certificado de cámara de comercio",
];

// Opciones específicas para los selects de Documento y Subdocumento
const documentoOptions = [
  "Documento",
  "Demanda",
  "Memorial",
  "Concepto",
  "Derecho de petición",
  "Notificación personal",
  "Poder",
  "Tutela",
  "Acta de Conciliación",
];

const subdocumentoOptions = [
  "Impulso procesal",
  "Subsanación",
  "Solicitud de acceso a expediente",
  "Indicio grave",
  "Sustitución -Designación de poder",
  "Solicitud de información",
  "Otros",
];

// El backend espera la etiqueta tal cual (p.ej. 'Subsanación', 'Impulso procesal').
// Por tanto enviamos el valor de UI directamente en el campo `subdocument`.

// Normaliza el subdocumento recibido para garantizar que coincida con las opciones
// permitidas por la UI/backend. Si no coincide, devuelve 'Otros'.
const normalizeSubdocument = (label?: string) => {
  if (!label) return "Otros";
  return subdocumentoOptions.includes(label) ? label : "Otros";
};

const responsibleTypes = [
  // "Sistema",
  "Juzgado",
  "Demandante",
  "Demandado",
  // "Abogado",
  "Apoderado",
  "Tercero",
];

interface Document {
  id: string;
  name: string;
  type: string;
  date: string;
  responsible: string;
  status: string;
  size?: string;
}

interface ProcessAction {
  id: string;
  date: string;
  responsible: string;
  action: string;
  observations: string;
  status: "completed" | "pending" | "in_progress";
}

// Documento borrador (solo nombre y tipo) para mostrar en tabla con estado opaco
type DraftDoc = {
  id: string;
  category: string;
  document: string;
  consecutive?: string;
  responsible?: string;
  responsibleType?: string;
  settledDate?: string;
};

export default function InformacionCasoFormViewOld() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseId = searchParams.get("id");
  const mode = searchParams.get("mode") || "create";

  // Helper para generar fecha actual en formato ISO (YYYY-MM-DD) en horario local
  const getCurrentDate = () => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Helpers para formatear/parsear fechas entre ISO (YYYY-MM-DD) y display (DD/MM/YYYY)
  function formatToDisplay(dateStr?: string): string {
    if (!dateStr) return "";
    const str = String(dateStr).trim();
    // Si ya está en formato DD/MM/YYYY, devolver tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
    // Extraer parte de fecha si viene en ISO completo (YYYY-MM-DDTHH:mm:ss.sssZ)
    let ymd = str.includes("T") ? str.split("T")[0] : str;
    // Validar formato YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(ymd)) return "";
    const [yyyy, mm, dd] = ymd.split("-");
    return `${dd}/${mm}/${yyyy}`;
  }

  function parseDisplayToISO(dateStr?: string): string {
    if (!dateStr) return "";

    try {
      // Si ya viene en ISO (YYYY-MM-DD or full ISO), devolver la parte fecha
      if (dateStr.includes("-")) {
        const isoDate = dateStr.split("T")[0];
        const testDate = new Date(isoDate);
        if (isNaN(testDate.getTime())) {
          return "";
        }
        return isoDate;
      }

      // Si viene en DD/MM/YYYY
      if (dateStr.includes("/")) {
        const parts = dateStr.split("/");
        if (parts.length !== 3) {
          return "";
        }

        const [dd, mm, yyyy] = parts;
        const isoDate = `${yyyy}-${mm.padStart(2, "0")}-${dd.padStart(2, "0")}`;

        const testDate = new Date(isoDate);
        if (isNaN(testDate.getTime())) {
          return "";
        }
        return isoDate;
      }

      // Intentar parsear directamente como fecha
      const testDate = new Date(dateStr);
      if (isNaN(testDate.getTime())) {
        return "";
      }

      return testDate.toISOString().split("T")[0];
    } catch {
      return "";
    }
  }

  // Helper para sanitizar fechas antes de pasarlas al DatePicker
  const sanitizeDate = useCallback((dateStr?: string): string => {
    const parsed = parseDisplayToISO(dateStr);
    return parsed || getCurrentDate();
  }, []);

  // Helper para convertir fechas a formato ISO 8601 completo
  function toISO8601ForPayments(dateStr?: string | null): string {
    // Manejar valores nulos, undefined o string vacío
    if (
      !dateStr ||
      dateStr === "" ||
      dateStr === null ||
      dateStr === undefined
    ) {
      return getCurrentDate() + "T00:00:00.000Z";
    }

    // Convertir a string si no lo es
    const dateString = String(dateStr).trim();

    // Si ya está en formato ISO completo (con T y Z), normalizar a YYYY-MM-DDT00:00:00.000Z
    if (dateString.includes("T") && dateString.includes("Z")) {
      const base = dateString.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(base)) {
        return `${base}T00:00:00.000Z`;
      }
    }

    try {
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        // Simplemente agregar la hora UTC sin cambiar el día
        return `${dateString}T00:00:00.000Z`;
      }

      // Si está en formato DD/MM/YYYY (formato antiguo)
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split("/").map(Number);
        const formattedDate = `${year}-${month
          .toString()
          .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
        return `${formattedDate}T00:00:00.000Z`;
      }

      // Para cualquier otro formato, intentar extraer YYYY-MM-DD sin usar la hora
      const maybe = dateString.split("T")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybe)) {
        return `${maybe}T00:00:00.000Z`;
      }

      return getCurrentDate() + "T00:00:00.000Z";
    } catch {
      return getCurrentDate() + "T00:00:00.000Z";
    }
  }

  // Helper para convertir fechas a formato ISO 8601 completo (versión original)
  function toISO8601(dateStr?: string | null): string {
    // Manejar valores nulos, undefined o string vacío
    if (
      !dateStr ||
      dateStr === "" ||
      dateStr === null ||
      dateStr === undefined
    ) {
      return getCurrentDate() + "T00:00:00.000Z";
    }

    // Convertir a string si no lo es
    const dateString = String(dateStr).trim();

    // Si ya incluye hora (formato ISO completo)
    if (dateString.includes("T")) {
      const testDate = new Date(dateString);
      if (isNaN(testDate.getTime())) {
        return getCurrentDate() + "T00:00:00.000Z";
      }
      return dateString;
    }

    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      return getCurrentDate() + "T00:00:00.000Z";
    }

    // Validar que sea una fecha real válida
    const testDate = new Date(dateString + "T00:00:00.000Z");
    if (isNaN(testDate.getTime())) {
      return getCurrentDate() + "T00:00:00.000Z";
    }

    // Si es solo fecha (YYYY-MM-DD), agregar hora
    return `${dateString}T00:00:00.000Z`;
  }

  // Flags de modo derivados para reaccionar a cambios de URL
  const isViewMode = useMemo(() => mode === "view", [mode]);
  const isEditMode = useMemo(() => mode === "edit", [mode]);
  const isCreateMode = useMemo(() => mode === "create", [mode]);

  // Estado para el rol del usuario
  const [userRole, setUserRole] = useState<string>("");
  const [isAdmin, setIsAdmin] = useState(false);

  // Calcular si los campos deben estar deshabilitados usando useMemo para evitar recálculos innecesarios
  const isFieldDisabled = useMemo(() => {
    // En modo view: todos los campos deshabilitados
    // En modo edit: solo deshabilitado si NO es admin
    // En modo create: nunca deshabilitado
    return isViewMode || (mode === "edit" && !isAdmin);
  }, [isViewMode, mode, isAdmin]);

  const {
    caso,
    loading: isCaseLoading,
    error: caseError,
    getCasoById,
    createCaso,
    createDocument,
    updateDocument,
    deleteDocument: deleteCaseDocument,
    createIntervener,
    deleteIntervener,
    createProceduralPart,
    updateProceduralPart,
    deleteProceduralPart,
    createPayment,
    updatePayment,
    deletePayment,
    uploadSingleFile,
    updateCaso,
    updateIntervener,
    createPerformance,
    deletePerformance,
    getActuacionesMonolegal,
  } = useCaso();

  // Los documentos ahora vienen de caso.documents de la API
  const documents = caso?.documents || [];

  // Estado local para documentos agregados antes de guardar el caso
  const [localDocuments, setLocalDocuments] = useState<CasoDocument[]>([]);
  // Documentos incompletos confirmados desde el modal (opacos en tabla)
  const [draftDocuments, setDraftDocuments] = useState<DraftDoc[]>([]);
  const processActions: any[] = [];

  // controls whether the inline document form is visible (only in create/edit)
  const [showDocumentForm, setShowDocumentForm] = useState(false);
  const [editingDocument, setEditingDocument] = useState<CasoDocument | null>(
    null,
  );
  const [documentSaving, setDocumentSaving] = useState(false);
  // controls whether the performance form is visible in sidebar
  const [showPerformanceForm, setShowPerformanceForm] = useState(false);
  // controls whether the mobile actuaciones sidebar is open
  const [showMobileActuaciones, setShowMobileActuaciones] = useState(false);
  // controls whether the performance details modal is open
  const [showPerformanceDetailModal, setShowPerformanceDetailModal] =
    useState(false);
  const [selectedPerformance, setSelectedPerformance] = useState<any>(null);
  // controls whether actuaciones editing mode is active (independent of case editing)
  const [performanceForm, setPerformanceForm] = useState({
    performanceType: "",
    description: "",
    date: "",
    estadoActuacion: "",
    fechaActuacion: "",
    responsableActuacion: "",
    observacionesActuacion: "",
    documentoRelacion: "",
  });
  const [documentForm, setDocumentForm] = useState({
    categoria: "",
    documentType: "",
    subdocumento: "",
    fechaRadicacion: "",
    consecutivo: "",
    tipoResponsable: "",
    responsable: "",
    observaciones: "",
  });

  const [uploadedFiles, setUploadedFiles] = useState<
    {
      name: string;
      size: string;
      progress: number;
      id: string;
      file: File;
    }[]
  >([]);

  const [isDragOver, setIsDragOver] = useState(false);

  // Estados para departamentos y ciudades de divipola.json
  const [departments, setDepartments] = useState<any[]>([]);
  const [allCities, setAllCities] = useState<any[]>([]);
  const [availableCities, setAvailableCities] = useState<any[]>([]);

  // Estados para despacho judicial
  const [despachoJudicialData, setDespachoJudicialData] = useState<any>(null);
  const [availableDespachos, setAvailableDespachos] = useState<string[]>([]);
  const [showManualDespacho, setShowManualDespacho] = useState(false);
  const [manualDespacho, setManualDespacho] = useState("");
  const [caseInitialLoadCompleted, setCaseInitialLoadCompleted] =
    useState(false);

  /// Función para normalizar nombres de ciudades
  const normalizeCityName = (cityName: string): string => {
    const cityMap: { [key: string]: string } = {
      Medellin: "Medellín",
      Bogota: "Bogotá",
      "Bogota D.C.": "Bogotá",
      "Bogotá D.C.": "Bogotá",
      BOGOTA: "Bogotá",
      BOGOTÁ: "Bogotá",
      "BOGOTA D.C.": "Bogotá",
      "BOGOTÁ D.C.": "Bogotá",
      Barranquilla: "Barranquilla",
      Cali: "Cali",
      Bucaramanga: "Bucaramanga",
      Cucuta: "Cúcuta",
      "Santa Marta": "Santa Marta",
      Villavicencio: "Villavicencio",
      Monteria: "Montería",
      Neiva: "Neiva",
      Armenia: "Armenia",
      Bello: "Bello",
      Envigado: "Envigado",
      Girardot: "Girardot",
      Itagui: "Itagüí",
    };

    // Normalizar búsqueda (remover tildes para comparación)
    const normalizedInput = cityName
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toUpperCase();

    // Buscar coincidencia
    for (const [key, value] of Object.entries(cityMap)) {
      const normalizedKey = key
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toUpperCase();

      if (normalizedInput === normalizedKey) {
        return value;
      }
    }

    return cityName;
  };

  // Estados para el progreso de creación del caso
  const [isCreatingCase, setIsCreatingCase] = useState(false);
  const [creationProgress, setCreationProgress] = useState(0);
  const [creationStep, setCreationStep] = useState("");
  const [creationSteps, setCreationSteps] = useState<
    {
      step: string;
      status: "pending" | "loading" | "success" | "error";
      message?: string;
      id?: string;
    }[]
  >([]);

  // IDs obtenidos de las APIs previas
  const [createdIds, setCreatedIds] = useState<{
    documents: string[];
    interveners: string[];
    proceduralParts: string[];
    payments: string[];
  }>({
    documents: [],
    interveners: [],
    proceduralParts: [],
    payments: [],
  });

  // Guardar el id del caso que ya cargamos en el formulario para evitar
  // que comprobaciones con `internalCode` vacío impidan el reset.
  const [loadedCaseId, setLoadedCaseId] = useState<string | null>(null);

  type IntervinienteFormType = {
    _id?: string;
    name?: string;
    documentType?: string;
    documentNumber?: string;
    electronicAddress?: string;
    contact?: string;
    interventionType?: string;
  };

  const form = useForm<CaseFormData>({
    resolver: zodResolver(caseFormSchema),
    defaultValues: {
      clientType: "",
      internalCode: "",
      department: "",
      city: "",
      country: "COLOMBIA",
      personType: "",
      processType: "",
      creationDate: getCurrentDate(), // Asegurar fecha actual por defecto
      jurisdiction: "",
      location: "",
      despachoJudicial: "",
      numeroRadicado: "",
      demandantePart: [],
      demandadoPart: [],
      tempDemandante: {
        name: "",
        documentType: "",
        documentNumber: "",
        electronicAddress: "",
        contact: "",
      },
      tempDemandado: {
        name: "",
        documentType: "",
        documentNumber: "",
        electronicAddress: "",
        contact: "",
      },
      tempInterviniente: {
        name: "",
        documentType: "",
        documentNumber: "",
        interventionType: "",
        contact: "",
        electronicAddress: "",
      },
      tempPago: {
        value: 0,
        causationDate: getCurrentDate(),
        paymentDate: getCurrentDate(),
      },
      intervinientes: [] as IntervinienteFormType[],
      includeSuccessPremium: false,
      payments: [],
      successPremiumPercentage: 0,
      successPremiumPrice: 0,
      successPremiumCausationDate: getCurrentDate(),
      successPremiumPaymentDate: getCurrentDate(),
      totalAmount: 0,
    },
  });

  const calculateTotalAmount = useCallback(() => {
    const includeSuccessPremium = form.getValues("includeSuccessPremium");
    const successPremiumPrice = form.getValues("successPremiumPrice") || 0;
    const payments = form.getValues("payments") || [];

    // Calcular total de pagos guardados en el caso (solo paymentValues, NO bonusPrice)
    const savedPaymentsTotal =
      caso?.payments?.reduce(
        (total: number, payment: any) =>
          total +
          (payment.paymentValues || []).reduce(
            (sum: number, value: any) => sum + (value.value || 0),
            0,
          ),
        0,
      ) || 0;

    // Obtener la prima de éxito guardada del caso
    const savedSuccessPremium =
      (caso?.payments?.[0]?.successBonus && caso?.payments?.[0]?.bonusPrice) ||
      0;

    let total: number;

    if (isViewMode) {
      // En modo visualización: solo datos guardados
      total = savedPaymentsTotal + savedSuccessPremium;
    } else if (isEditMode) {
      // En modo edición: usar datos guardados para pagos, pero permitir editar prima de éxito
      const useFormSuccessPremium =
        includeSuccessPremium && successPremiumPrice > 0;
      const premiumToUse = useFormSuccessPremium
        ? successPremiumPrice
        : savedSuccessPremium;

      // En edición: solo pagos guardados + prima de éxito (del formulario o guardada)
      total = savedPaymentsTotal + premiumToUse;
    } else {
      // Modo creación: solo datos del formulario
      const paymentsTotal = payments.reduce(
        (sum, payment) => sum + (payment.value || 0),
        0,
      );
      const useSuccessPremium =
        includeSuccessPremium && successPremiumPrice > 0;
      const premiumToAdd = useSuccessPremium ? successPremiumPrice : 0;
      total = paymentsTotal + premiumToAdd;
    }

    form.setValue("totalAmount", total);
  }, [form, caso, isViewMode, isEditMode]);

  // Tipo unificado para partes procesales (API y local)
  type UnifiedPart = {
    _id?: string;
    name: string;
    documentType: string;
    document?: string; // Para API
    documentNumber?: string; // Para local
    email?: string; // Para API
    electronicAddress?: string; // Para local
    contact: string;
    partType?: string;
  };

  // Partes demandadas adicionales (permitir múltiples)
  type DemandadaData = UnifiedPart;

  // Funciones de utilidad para compatibilidad de tipos
  const getDocumentNumber = (item: UnifiedPart | ProceduralPart) => {
    return (
      (item as UnifiedPart).documentNumber ||
      (item as ProceduralPart).document ||
      ""
    );
  };

  const getEmailAddress = (item: UnifiedPart | ProceduralPart) => {
    return (
      (item as UnifiedPart).electronicAddress ||
      (item as ProceduralPart).email ||
      ""
    );
  };
  const [demandadas, setDemandadas] = useState<DemandadaData[]>([]);
  // Partes demandantes adicionales (permitir múltiples)
  const [demandantes, setDemandantes] = useState<DemandadaData[]>([]);
  // Estados locales para intervinientes en modo creación
  const [intervinientesLocales, setIntervinientesLocales] = useState<any[]>([]);
  // Estados locales para pagos en modo creación
  const [pagosLocales, setPagosLocales] = useState<any[]>([]);

  // Estados para controlar los formularios de partes procesales
  const [showDemandanteForm, setShowDemandanteForm] = useState(false);
  const [showDemandadoForm, setShowDemandadoForm] = useState(false);
  const [editingDemandante, setEditingDemandante] =
    useState<ProceduralPart | null>(null);
  const [editingDemandado, setEditingDemandado] =
    useState<ProceduralPart | null>(null);

  // Estados para controlar los formularios de intervinientes
  const [showIntervinienteForm, setShowIntervinienteForm] = useState(false);
  const [editingInterviniente, setEditingInterviniente] =
    useState<Intervener | null>(null);

  // Estados para controlar los formularios de pagos
  const [showPagoForm, setShowPagoForm] = useState(false);

  const [actuacionesMonolegal, setActuacionesMonolegal] = useState<any[]>([]);
  const [loadingActuaciones, setLoadingActuaciones] = useState(false);

  // Verificar autenticación y rol del usuario
  useEffect(() => {
    const checkAuth = () => {
      try {
        // Obtener información del usuario desde localStorage
        const userDataString = localStorage.getItem("user");

        if (!userDataString) {
          router.push("/login");
          return;
        }

        const userData = JSON.parse(userDataString);
        const userToken = userData.token;
        const userRoles = userData.rol || userData.roles || [];

        if (!userToken) {
          router.push("/login");
          return;
        }

        // Verificar si el usuario tiene rol de administrador
        const isUserAdmin =
          userRoles.includes("Administrador") || userRoles.includes("admin");
        const roleString = userRoles.length > 0 ? userRoles[0] : "";

        setUserRole(roleString);
        setIsAdmin(isUserAdmin);
      } catch {
        router.push("/login");
      }
    };

    checkAuth();
  }, [router, mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cargar datos del caso cuando estamos en modo view o edit
  // SOLO UNA VEZ - usando ref para evitar loops
  const caseLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    // Solo cargar si el caseId es diferente al que ya cargamos
    if (caseId && (mode === "view" || mode === "edit") && caseId !== caseLoadedRef.current) {
      caseLoadedRef.current = caseId;
      getCasoById(caseId);
    }
  }, [caseId, mode]); 
  
  // Efecto para cargar actuaciones de Monolegal
  const radicadoRef = useRef<string | null>(null);

  useEffect(() => {
    const radicado = (caso as any)?.radicado;
    
    // Solo cargar si el radicado cambió realmente
    if (!radicado || radicado === radicadoRef.current) return;
    
    radicadoRef.current = radicado;

    const cargarActuaciones = async () => {
      setLoadingActuaciones(true);
      try {
        const actuaciones = await getActuacionesMonolegal(radicado);
        setActuacionesMonolegal(actuaciones);
      } catch (error) {
        console.error("[ACTUACIONES_MONOLEGAL] Error:", error);
      } finally {
        setLoadingActuaciones(false);
      }
    };

    cargarActuaciones();
  }, [caso?.radicado, getActuacionesMonolegal]);

  // Efecto para actualizar ciudades disponibles cuando cambie el departamento
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name !== "department") return;

      // NO limpiar ciudad durante la carga inicial del caso
      if (!caseInitialLoadCompleted && (mode === "edit" || mode === "view")) {
        return;
      }

      const selectedDepartment = values.department;

      if (selectedDepartment && departments.length > 0) {
        const selectedDept = departments.find(
          (dept) => dept.nombre === selectedDepartment,
        );

        if (!selectedDept) return;

        // Actualizar ciudades disponibles
        setAvailableCities(selectedDept.municipios);

        const currentCity = form.getValues("city");
        if (!currentCity) return;

        const cityNames = selectedDept.municipios.map(
          (municipio: any) => municipio.nombre,
        );

        const normalizedCurrentCity = normalizeCityName(currentCity);
        const normalizedCityNames = cityNames.map((name: string) =>
          normalizeCityName(name),
        );

        const isCityInList = normalizedCityNames.includes(
          normalizedCurrentCity,
        );

        // No limpiar si la ciudad coincide con la del caso cargado
        const casoCityNormalized = caso?.city
          ? normalizeCityName(caso.city)
          : "";

        const isCasoCityMatch =
          casoCityNormalized && normalizedCurrentCity === casoCityNormalized;

        if (!isCityInList && caseInitialLoadCompleted && !isCasoCityMatch) {
          form.setValue("city", "");
          form.setValue("despachoJudicial", "");
          setManualDespacho("");

          toast.info(
            `Ciudad "${currentCity}" no está disponible en ${selectedDepartment}. Por favor seleccione una ciudad válida.`,
          );
        }
      } else {
        setAvailableCities([]);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, departments, caso?.city, caseInitialLoadCompleted, mode]);

  // Cargar datos de divipola.json con caché
  useEffect(() => {
    const loadDivipolaData = async () => {
      try {
        // Verificar si ya tenemos los datos en caché
        const cachedDepartments = sessionStorage.getItem(
          "divipola_departments",
        );
        const cachedCities = sessionStorage.getItem("divipola_cities");

        if (cachedDepartments && cachedCities) {
          setDepartments(JSON.parse(cachedDepartments));
          setAllCities(JSON.parse(cachedCities));
          return;
        }

        const response = await fetch("/divipola.json");
        const data = await response.json();

        setDepartments(data.departamentos);

        // Cargar todas las ciudades de todos los departamentos
        const allCitiesData = data.departamentos.flatMap((dept: any) =>
          dept.municipios.map((municipio: any) => ({
            ...municipio,
            departamento: dept.nombre,
          })),
        );
        setAllCities(allCitiesData);

        // Guardar en caché
        sessionStorage.setItem(
          "divipola_departments",
          JSON.stringify(data.departamentos),
        );
        sessionStorage.setItem(
          "divipola_cities",
          JSON.stringify(allCitiesData),
        );

        // Inicialmente no cargar ciudades hasta que se necesiten
        setAvailableCities([]);
      } catch (error) {
        console.error("[DIVIPOLA] Error loading divipola data:", error);
      }
    };

    const loadDespachoJudicialData = async () => {
      try {
        // Verificar si ya tenemos los datos en caché
        const cachedDespachos = sessionStorage.getItem(
          "despacho_judicial_data",
        );

        if (cachedDespachos) {
          setDespachoJudicialData(JSON.parse(cachedDespachos));
          return;
        }

        const response = await fetch("/despacho_judicial.json");
        const data = await response.json();
        setDespachoJudicialData(data);

        // Guardar en caché
        sessionStorage.setItem("despacho_judicial_data", JSON.stringify(data));
      } catch (error) {
        console.error("Error loading despacho judicial data:", error);
      }
    };

    loadDivipolaData();
    loadDespachoJudicialData();
  }, []);

  // Efecto para procesar caso cargado cuando los datos de divipola estén disponibles
  useEffect(() => {
    if (
      caso &&
      departments.length > 0 &&
      (mode === "view" || mode === "edit")
    ) {
      const caseDepartment = caso.department;
      const caseCity = caso.city;

      if (caseDepartment) {
        // Buscar el departamento del caso en los datos de divipola
        const selectedDept = departments.find(
          (dept) => dept.nombre === caseDepartment,
        );

        if (selectedDept) {
          setAvailableCities(selectedDept.municipios);

          // Verificar si la ciudad del caso está en las ciudades del departamento
          if (caseCity) {
            const cityNames = selectedDept.municipios.map(
              (municipio: any) => municipio.nombre,
            );
            const normalizedCaseCity = normalizeCityName(caseCity);
            const cityExists = cityNames.some(
              (cityName: string) =>
                normalizeCityName(cityName) === normalizedCaseCity,
            );

            if (!cityExists) {
              form.setValue("city", "");
            }
          }
        }
      }
    }
  }, [caso, departments, mode, form]);

  //Efecto para actualizar despachos disponibles cuando cambie la ciudad
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      // Solo reaccionar a cambios en el campo "city"
      if (name !== "city") return;

      const selectedCity = values.city || "";
      const normalizedCity = normalizeCityName(selectedCity);

      // NO ejecutar durante la carga inicial del caso
      if (!caseInitialLoadCompleted && (mode === "edit" || mode === "view")) {
        return;
      }

      if (selectedCity && despachoJudicialData) {
        const despachosForCity =
          despachoJudicialData["Despacho judicial"]?.[0]?.[normalizedCity];

        if (despachosForCity) {
          setAvailableDespachos(despachosForCity);
          setShowManualDespacho(false);

          const currentDespacho = form.getValues("despachoJudicial");
          if (currentDespacho && despachosForCity.includes(currentDespacho)) {
          } else {
            form.setValue("despachoJudicial", "");
            setManualDespacho("");
          }
        } else {
          setAvailableDespachos([]);
          setShowManualDespacho(true);

          const currentDespacho = form.getValues("despachoJudicial");
          if (currentDespacho) {
            setManualDespacho(currentDespacho);
          }
        }
      } else {
        setAvailableDespachos([]);
        setShowManualDespacho(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [form, despachoJudicialData, caseInitialLoadCompleted, mode]);

  // Efecto para manejar despacho judicial cuando se carga un caso existente
  useEffect(() => {
    const currentCity = form.getValues("city");
    const currentDespacho = form.getValues("despachoJudicial");
    const normalizedCity = normalizeCityName(currentCity);

    if (!despachoJudicialData) return;

    // Solo procesar durante la carga inicial del caso en modo EDIT, no en modo CREATE
    if (!caso || caseInitialLoadCompleted) {
      return;
    }

    if (currentCity && despachoJudicialData) {
      const despachosForCity =
        despachoJudicialData["Despacho judicial"]?.[0]?.[normalizedCity];

      if (despachosForCity) {
        // Ciudad encontrada en JSON
        if (currentDespacho && despachosForCity.includes(currentDespacho)) {
          // Despacho existe en la lista, usar select
          setAvailableDespachos(despachosForCity);
          setShowManualDespacho(false);
          // Asegurar que el valor esté establecido en el formulario
          form.setValue("despachoJudicial", currentDespacho);
        } else {
          // Despacho no está en la lista o no hay despacho, usar input manual
          setAvailableDespachos([]);
          setShowManualDespacho(true);
          if (currentDespacho) {
            setManualDespacho(currentDespacho);
          }
        }
      } else {
        // Ciudad no encontrada en JSON, usar input manual
        setAvailableDespachos([]);
        setShowManualDespacho(true);
        if (currentDespacho) {
          setManualDespacho(currentDespacho);
          // También establecer el valor en el formulario
          form.setValue("despachoJudicial", currentDespacho);
        }
      }
    } else if (!currentCity && caso && despachoJudicialData) {
      // Si no hay ciudad en el formulario pero sí en el caso, procesar directamente
      const caseCity = caso.city;
      const caseDespacho = caso.despachoJudicial;
      const normalizedCaseCity = caseCity ? normalizeCityName(caseCity) : "";

      if (caseCity) {
        const despachosForCity =
          despachoJudicialData["Despacho judicial"]?.[0]?.[normalizedCaseCity];

        if (despachosForCity) {
          if (caseDespacho && despachosForCity.includes(caseDespacho)) {
            setAvailableDespachos(despachosForCity);
            setShowManualDespacho(false);
            // Establecer el valor del despacho en el formulario
            form.setValue("despachoJudicial", caseDespacho);
          } else {
            setAvailableDespachos([]);
            setShowManualDespacho(true);
            if (caseDespacho) {
              setManualDespacho(caseDespacho);
            }
          }
        } else {
          setAvailableDespachos([]);
          setShowManualDespacho(true);
          if (caseDespacho) {
            setManualDespacho(caseDespacho);
            // También establecer el valor en el formulario
            form.setValue("despachoJudicial", caseDespacho);
          }
        }
      }
    }

    // Marcar como completada la carga inicial - COMENTADO, se hace en FORM_RESET
  }, [caso, despachoJudicialData, form, caseInitialLoadCompleted]);

  // Efecto para actualizar el formulario cuando caso cambie
  useEffect(() => {
    if (!caso) {
      return;
    }

    if (mode !== "view" && mode !== "edit") {
      return;
    }

    const incomingCaseId =
      (caso as any)._id || (caso as any).record?._id || null;

    // Permitir reset si loadedCaseId es null (primera carga) O si el ID cambió
    if (
      incomingCaseId &&
      (loadedCaseId === null || incomingCaseId !== loadedCaseId) &&
      allCities.length > 0
    ) {
      setLoadedCaseId(incomingCaseId);
      setCaseInitialLoadCompleted(false);

      const clientTypeValue = (() => {
        const rawValue = caso.clientType?.trim().toUpperCase() || "";
        if (rawValue.includes("RAPPI")) return "Rappi SAS";
        if (rawValue.includes("UBER")) return "Uber";
        if (rawValue.includes("DIDI")) return "Didi";
        if (rawValue.includes("BEAT")) return "Beat";
        if (rawValue.includes("IFOOD")) return "Ifood";
        if (rawValue) return "Otro"; // Si tiene valor pero no coincide, usar "Otro"
        return "";
      })();
      const internalCodeValue = caso.etiqueta || "";

      // Función para capitalizar nombres (ej: "ANTIOQUIA" -> "Antioquia")
      // Función para capitalizar nombres
      const capitalizeName = (name: string) => {
        if (!name) return "";

        const upperName = name.toUpperCase();

        // Si el departamento es Bogotá D.C., mapearlo a Cundinamarca
        // porque en divipola.json Bogotá es una ciudad de Cundinamarca
        if (upperName.includes("BOGOTA") || upperName.includes("BOGOTÁ")) {
          return "Cundinamarca";
        }

        // Mapeo de nombres de departamentos para coincidir exactamente con divipola.json
        const departmentMap: { [key: string]: string } = {
          "VALLE DEL CAUCA": "Valle del Cauca",
          "NORTE DE SANTANDER": "Norte de Santander",
          "SAN ANDRES, PROVIDENCIA Y SANTA CATALINA":
            "San Andrés, Providencia y Santa Catalina",
          "SAN ANDRÉS, PROVIDENCIA Y SANTA CATALINA":
            "San Andrés, Providencia y Santa Catalina",
          "LA GUAJIRA": "La Guajira",
        };

        // Buscar en el mapeo
        if (departmentMap[upperName]) {
          return departmentMap[upperName];
        }

        // Para otros casos, capitalizar normalmente
        return (
          name
            .toLowerCase()
            .split(" ")
            .map((word) => {
              if (word.length === 0) return word;
              // Palabras que deben permanecer en minúscula (excepto al inicio)
              const lowercaseWords = ["de", "del", "la", "las", "los", "y"];
              if (lowercaseWords.includes(word)) {
                return word;
              }
              return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(" ")
            // Asegurar que la primera letra siempre sea mayúscula
            .replace(/^./, (str) => str.toUpperCase())
        );
      };

      let departmentValue = capitalizeName(caso.department || "");

      if (!departmentValue && caso.city && allCities.length > 0) {
        const normalizedCaseCity = normalizeCityName(caso.city);
        const cityData = allCities.find(
          (c: any) => normalizeCityName(c.nombre) === normalizedCaseCity,
        );
        if (cityData && cityData.departamento) {
          departmentValue = cityData.departamento;
        }
      }

      if (!departmentValue && caso.city && allCities.length > 0) {
        const normalizedCaseCity = normalizeCityName(caso.city);
        const cityData = allCities.find(
          (c: any) => normalizeCityName(c.nombre) === normalizedCaseCity,
        );
        if (cityData && cityData.departamento) {
          departmentValue = cityData.departamento;
        }
      }

      const cityValue = caso.city ? normalizeCityName(caso.city) : "";
      const countryValue = caso.country || "COLOMBIA";
      const personTypeValue = caso.personType || "";
      const locationValue = caso.location || "";

      // INFERIR JURISDICCIÓN DEL NÚMERO DE RADICADO
      const inferirJurisdiccionDeRadicado = (radicado: string): string => {
        if (!radicado || radicado.length < 9) return "";

        const categoria = radicado.substring(5, 7);
        const especialidad = radicado.substring(7, 9);

        if (categoria === "31" && especialidad === "05")
          return "Laboral circuito";
        if (categoria === "31" && especialidad === "03")
          return "Civil circuito - mayor cuantía";
        if (categoria === "40" && especialidad === "03")
          return "Civil municipal - menor cuantía";
        if (categoria === "41" && especialidad === "03")
          return "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía";
        if (categoria === "31" && especialidad === "09") return "Familia";
        if (categoria === "23" || especialidad === "02")
          return "Administrativo";
        if (categoria === "41" && especialidad === "05")
          return "Pequeñas causas laborales";

        return "";
      };

      const inferirTipoProcesoDefault = (jurisdiccion: string): string => {
        const defaults: Record<string, string> = {
          "Laboral circuito": "Ordinario",
          "Civil circuito - mayor cuantía": "Procesos verbales (mayor cuantía)",
          "Civil municipal - menor cuantía": "Verbal de menor cuantía",
          "Civil municipal de pequeñas causas y competencia múltiple - mínima cuantía":
            "Verbal de mínima cuantía",
          Familia: "Verbales",
          Administrativo: "Acción de nulidad y restablecimiento del derecho",
          "Pequeñas causas laborales": "Ordinario de única instancia",
        };
        return defaults[jurisdiccion] || "";
      };

      const numeroRadicadoRaw =
        (caso as any).radicado || (caso as any).numeroRadicado || "";
      const jurisdiccionInferida =
        inferirJurisdiccionDeRadicado(numeroRadicadoRaw);
      const jurisdictionValue = caso.jurisdiction || jurisdiccionInferida || "";
      const processTypeValue = caso.processType || "lolo";

      const despachoJudicialValue = caso.despachoJudicial || "";

      const numeroRadicadoValue =
        (caso as any).radicado || (caso as any).numeroRadicado || "";

      // EJECUTAR EL RESET DEL FORMULARIO
      const resetData = {
        clientType: clientTypeValue,
        internalCode: internalCodeValue,
        department: departmentValue,
        city: cityValue,
        country: countryValue,
        personType: personTypeValue,
        processType: processTypeValue,
        creationDate: sanitizeDate(caso.createdAt),
        jurisdiction: jurisdictionValue,
        location: locationValue,
        despachoJudicial: despachoJudicialValue,
        numeroRadicado: numeroRadicadoValue,
        demandantePart:
          caso.proceduralParts
            ?.filter((p) => p.partType === "demandante")
            .map((p) => ({
              name: p.name || "",
              documentType: p.documentType || "",
              documentNumber: p.document || "",
              electronicAddress: p.email || "",
              contact: p.contact || "",
            })) || [],
        demandadoPart:
          caso.proceduralParts
            ?.filter((p) => p.partType === "demandada")
            .map((p) => ({
              name: p.name || "",
              documentType: p.documentType || "",
              documentNumber: p.document || "",
              electronicAddress: p.email || "",
              contact: p.contact || "",
            })) || [],
        intervinientes: (caso.interveners || []).map((iv: any) => ({
          _id: iv._id,
          name: iv.name,
          documentType: iv.documentType,
          documentNumber: iv.document,
          interventionType: iv.intervenerType,
          contact: iv.contact || "",
          electronicAddress: iv.email || "",
        })),
        includeSuccessPremium: caso.payments?.[0]?.successBonus || false,
        payments:
          caso.payments?.flatMap((p: any) =>
            (p.paymentValues || []).map((v: any) => ({
              value: v.value || 0,
              causationDate: sanitizeDate(v.causationDate),
              paymentDate: sanitizeDate(v.paymentDate),
            })),
          ) || [],
        successPremiumPercentage: caso.payments?.[0]?.bonusPercentage || 0,
        successPremiumPrice: caso.payments?.[0]?.bonusPrice || 0,
        successPremiumCausationDate: sanitizeDate(
          caso.payments?.[0]?.bonusCausationDate,
        ),
        successPremiumPaymentDate: sanitizeDate(
          caso.payments?.[0]?.bonusPaymentDate,
        ),
        totalAmount: (() => {
          const paymentsTotal =
            caso.payments?.reduce(
              (total: number, payment: any) =>
                total +
                (payment.paymentValues || []).reduce(
                  (sum: number, value: any) => sum + (value.value || 0),
                  0,
                ),
              0,
            ) || 0;
          const bonusPrice =
            (caso.payments?.[0]?.successBonus &&
              caso.payments?.[0]?.bonusPrice) ||
            0;
          return paymentsTotal + bonusPrice;
        })(),
        tempDemandante: {
          name: "",
          documentType: "",
          documentNumber: "",
          electronicAddress: "",
          contact: "",
        },
        tempDemandado: {
          name: "",
          documentType: "",
          documentNumber: "",
          electronicAddress: "",
          contact: "",
        },
        tempInterviniente: {
          name: "",
          documentType: "",
          documentNumber: "",
          interventionType: "",
          contact: "",
          electronicAddress: "",
        },
        tempPago: {
          value: 0,
          causationDate: getCurrentDate(),
          paymentDate: getCurrentDate(),
        },
      };

      // Cargar ciudades del departamento ANTES del reset
      if (departmentValue && departments.length > 0) {
        // Buscar el departamento del caso en los datos de divipola (case-insensitive)
        const selectedDept = departments.find(
          (dept) => dept.nombre.toLowerCase() === departmentValue.toLowerCase(),
        );
        if (selectedDept) {
          setAvailableCities(selectedDept.municipios);
          // Actualizar el valor del departamento para que coincida exactamente con divipola
          if (selectedDept.nombre !== departmentValue) {
            form.setValue("department", selectedDept.nombre);
          }
        }
      }

      form.reset(resetData);

      // FORZAR los valores después del reset para que los Select los reconozcan
      setTimeout(() => {
        form.setValue("city", resetData.city, {
          shouldValidate: false,
          shouldDirty: false,
        });
        form.setValue("despachoJudicial", resetData.despachoJudicial, {
          shouldValidate: false,
          shouldDirty: false,
        });

        form.setValue("processType", resetData.processType, {
          shouldValidate: false,
          shouldDirty: false,
        });

        // Cargar despachos para la ciudad
        if (resetData.city && despachoJudicialData) {
          const normalizedCity = normalizeCityName(resetData.city);
          const despachosForCity =
            despachoJudicialData["Despacho judicial"]?.[0]?.[normalizedCity];
          if (despachosForCity) {
            setAvailableDespachos(despachosForCity);
            setShowManualDespacho(false);
          }
        }
      }, 50);

      // Verificar que los valores se establecieron correctamente
      setTimeout(() => {
        calculateTotalAmount();
        // Marcar carga inicial como completada DESPUÉS de que todo esté establecido
        setCaseInitialLoadCompleted(true);
      }, 100);
    } else {
    }
  }, [
    caso,
    mode,
    form,
    loadedCaseId,
    sanitizeDate,
    calculateTotalAmount,
    allCities,
    departments,
    despachoJudicialData,
  ]);

  //Efecto para mostrar automáticamente formularios en modo creación ESTE
  useEffect(() => {
    if (isCreateMode) {
      // En modo creación, mostrar automáticamente los formularios principales
      setShowDemandanteForm(true);
      setShowDemandadoForm(true);
      setShowIntervinienteForm(true);

      // Asegurar que haya al menos un interviniente vacío en el formulario
      const currentIntervinientes = form.getValues("intervinientes") || [];
      if (currentIntervinientes.length === 0) {
        form.setValue("intervinientes", [
          {
            name: "",
            documentType: "",
            documentNumber: "",
            interventionType: "",
            contact: "",
            electronicAddress: "",
          },
        ]);
      }
    } else {
      // En otros modos, ocultar formularios inicialmente
      setShowDemandanteForm(false);
      setShowDemandadoForm(false);
      setShowIntervinienteForm(false);
      setShowDocumentForm(false);
    }
  }, [isCreateMode, form]);

  //Recalcular automáticamente el total cuando cambie el caso o sus pagos
  // useEffect(() => {
  //   if (caso && caso.payments) {
  //     setTimeout(() => calculateTotalAmount(), 100);
  //   }
  // }, [caso, caso?.payments, calculateTotalAmount]);

  // const watchedPayments = form.watch("payments");
  // const watchedSuccessPremium = form.watch("includeSuccessPremium");
  // const watchedSuccessPremiumPrice = form.watch("successPremiumPrice");

  // useEffect(() => {
  //   calculateTotalAmount();
  // }, [
  //   watchedPayments,
  //   watchedSuccessPremium,
  //   watchedSuccessPremiumPrice,
  //   calculateTotalAmount,
  // ]);

  // UN SOLO useEffect para calcular total - con flag para evitar loops
  const [totalCalculated, setTotalCalculated] = useState(false);

  useEffect(() => {
    if (caso && !totalCalculated) {
      calculateTotalAmount();
      setTotalCalculated(true);
    }
  }, [caso?._id]); // Solo cuando cambia el ID del caso

  // Efecto para limpiar tipo de proceso cuando cambia la jurisdicción
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === "jurisdiction") {
        // NO limpiar durante la carga inicial del caso
        if (!caseInitialLoadCompleted && (mode === "edit" || mode === "view")) {
          return;
        }
        form.setValue("processType", "");
      }
    });
    return () => subscription.unsubscribe();
  }, [form, caseInitialLoadCompleted, mode]);

  //Efecto específico para forzar processType cuando se carga el caso
  useEffect(() => {
    if (caso && caso.processType && (mode === "view" || mode === "edit")) {
      const currentValue = form.getValues("processType");

      // Si el valor del form no coincide con el del caso, forzarlo
      if (currentValue !== caso.processType) {
      }
    }
  }, [caso, caso?.processType, mode, form]);

  // Efecto para mostrar caso Ordinario cuando el tipo cliente es Rappi
  const clientType = form.watch("clientType");

  useEffect(() => {
    if (clientType?.toLowerCase().includes("rappi")) {
      form.setValue("processType", "Ordinario");
    }
  }, [clientType, form]);

  const onSubmit = async (data: CaseFormData) => {
    // Limpiar campos temporales antes de enviar - estos no deben ser parte del caso final
    const cleanData = {
      ...data,
      tempDemandante: undefined,
      tempDemandado: undefined,
      tempInterviniente: undefined,
      tempPago: undefined,
    };

    // Solo validar campos esenciales - el schema de Zod ya maneja el resto
    if (!cleanData.clientType) {
      toast.error("Seleccione un tipo de cliente");
      return;
    }
    if (!cleanData.department) {
      toast.error("Seleccione un departamento");
      return;
    }
    if (!cleanData.city) {
      toast.error("Seleccione una ciudad");
      return;
    }
    if (!cleanData.personType) {
      toast.error("Seleccione un tipo de persona");
      return;
    }
    if (!cleanData.processType) {
      toast.error("Ingrese un tipo de proceso");
      return;
    }
    if (!cleanData.jurisdiction) {
      toast.error("Seleccione una jurisdicción");
      return;
    }
    if (!cleanData.despachoJudicial) {
      toast.error("Seleccione un despacho judicial");
      return;
    }
    if (!cleanData.numeroRadicado) {
      toast.error("Ingrese el número de radicado");
      return;
    }

    if (isCreatingCase) {
      return;
    }

    // Si estamos en modo edición, usar updateCaso en lugar de createCaso
    if (isEditMode && caseId) {
      // Prevenir doble actualización
      if (isCreatingCase) {
        return;
      }

      setIsCreatingCase(true);

      try {
        await saveInformacionGeneral();
        toast.success("Caso actualizado exitosamente");
      } catch (error: any) {
        console.error("Error updating case:", error);
        toast.error(error?.message || "Error al actualizar el caso");
      } finally {
        // Resetear estado después de un breve delay para mostrar feedback
        setTimeout(() => {
          setIsCreatingCase(false);
        }, 1000);
      }
      return;
    }

    // Permitir continuar sin archivos físicos - esto es opcional
    if (uploadedFiles.length === 0) {
    }

    setIsCreatingCase(true);
    setCreationProgress(0);
    setCreationSteps([{ step: "Creando caso principal", status: "loading" }]);

    try {
      // Definir responsible para uso en documentos de fallback
      let responsible = "Sistema";

      const baseParts = [] as Array<{
        partType: string;
        name: string;
        documentType: string;
        documentNumber: string;
        electronicAddress?: string;
        contact: string;
      }>;

      // Agregar demandantes si tienen al menos nombre
      (cleanData.demandantePart || []).forEach((demandante: any) => {
        if (demandante.name?.trim()) {
          baseParts.push({
            ...demandante,
            partType: "demandante",
            documentType: demandante.documentType || "CC",
            documentNumber: demandante.documentNumber || "Sin documento",
            contact: demandante.contact || "Sin contacto",
          });
        }
      });

      // Agregar demandados si tienen al menos nombre
      (cleanData.demandadoPart || []).forEach((demandado: any) => {
        if (demandado.name?.trim()) {
          baseParts.push({
            ...demandado,
            partType: "demandada",
            documentType: demandado.documentType || "CC",
            documentNumber: demandado.documentNumber || "Sin documento",
            contact: demandado.contact || "Sin contacto",
          });
        }
      });

      const proceduralParts = baseParts.map((p) => ({
        partType: (p as any).partType,
        name: p.name,
        documentType: p.documentType || "CC",
        document: p.documentNumber || "Sin documento",
        email: (p as any).electronicAddress || "",
        contact: p.contact || "Sin contacto",
      }));

      const interveners = (cleanData.intervinientes || [])
        .filter((i) => {
          // Un interviniente es válido si tiene al menos nombre y algún dato de identificación
          const hasBasicInfo = i.name && i.name.trim().length > 0;
          const hasIdentification =
            (i.documentType && i.documentNumber) || i.electronicAddress;
          return hasBasicInfo && hasIdentification;
        })
        .map((i) => ({
          intervenerType: i.interventionType || "Tercero", // Valor por defecto si no se especifica
          name: i.name!,
          documentType: i.documentType || "CC", // Valor por defecto
          document: i.documentNumber || "Sin documento",
          email: i.electronicAddress || "",
          contact: i.contact || "Sin contacto", // Valor por defecto
        }));

      // Si hay datos en el formulario de documentos sin guardar, agregarlos automáticamente
      if (
        documentForm.categoria &&
        documentForm.documentType &&
        localDocuments.length === 0 &&
        draftDocuments.length === 0
      ) {
        const autoSavedDocument = {
          category: documentForm.categoria,
          documentType: documentForm.documentType || "Escrito",
          document: documentForm.documentType,
          subdocument: normalizeSubdocument(documentForm.subdocumento),
          settledDate: documentForm.fechaRadicacion || getCurrentDate(),
          consecutive:
            documentForm.consecutivo ||
            `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          responsibleType: documentForm.tipoResponsable || "Abogado",
          responsible: documentForm.responsable || responsible || "Sistema",
          observations: documentForm.observaciones || "",
        };
        // Agregar a la lista de documentos a procesar
        localDocuments.push(autoSavedDocument as any);
      }

      const documentsFromLocal = (localDocuments || []).map((d) => ({
        category: d.category,
        documentType: "Escrito", // Backend siempre espera "Escrito"
        document: d.document,
        subdocument: normalizeSubdocument(d.subdocument),
        settledDate: parseDisplayToISO(d.settledDate) || getCurrentDate(),
        consecutive: d.consecutive,
        responsibleType: d.responsibleType || "Abogado",
        responsible: d.responsible || "Sistema",
        observations: d.observations || "",
      }));

      const documentsFromDrafts = (draftDocuments || []).map((d) => ({
        category: d.category,
        documentType: d.document, // Campo requerido por el backend
        document: d.document,
        // Drafts don't have subdocument field; enviar 'Otros' por defecto
        subdocument: normalizeSubdocument(undefined),
        settledDate: parseDisplayToISO(d.settledDate) || getCurrentDate(),
        consecutive:
          d.consecutive ||
          `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        responsibleType: "SISTEMA",
        responsible: d.responsible || "Sistema",
        observations: "",
      }));

      let documents = [...documentsFromLocal, ...documentsFromDrafts];

      // IMPORTANTE: El backend requiere al menos un documento en metadata para generar código interno
      // Los archivos físicos son opcionales, pero la metadata de documentos es requerida

      // Caso 1: Si hay archivos físicos pero no metadata, crear metadata desde archivos
      if (
        (!documents || documents.length === 0) &&
        uploadedFiles &&
        uploadedFiles.length > 0
      ) {
        const placeholderDocs = uploadedFiles.map((f, index) => ({
          category: "Documento del proceso",
          documentType: "Escrito",
          document: "Demanda",
          subdocument: normalizeSubdocument(undefined),
          settledDate: getCurrentDate(),
          consecutive: `DOC-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 4)}`,
          responsibleType: "Abogado",
          responsible: responsible || "Sistema",
          observations: `Metadata creada desde archivo: ${f.name}`,
        }));
        documents = placeholderDocs;
      }

      // Caso 2: Si no hay metadata ni archivos físicos, crear documento mínimo requerido
      // Esto es necesario para que el backend pueda generar el código interno del caso
      if (!documents || documents.length === 0) {
        documents = [
          {
            category: "Documento del proceso",
            documentType: "Escrito",
            document: "Demanda",
            subdocument: normalizeSubdocument(undefined),
            settledDate: getCurrentDate(),
            consecutive: `DOC-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 4)}`,
            responsibleType: "Abogado",
            responsible: responsible || "Sistema",
            observations:
              "Documento mínimo creado automáticamente - Sin archivo físico",
          },
        ];
      }

      // Informar al usuario sobre el estado de los documentos
      if (
        documents.length > 0 &&
        (!uploadedFiles || uploadedFiles.length === 0)
      ) {
      }

      const payments = [
        {
          successBonus: cleanData.includeSuccessPremium,
          bonusPercentage: cleanData.successPremiumPercentage || 0,
          bonusPrice: cleanData.successPremiumPrice || 0,
          bonusCausationDate: toISO8601ForPayments(
            cleanData.successPremiumCausationDate,
          ),
          bonusPaymentDate: toISO8601ForPayments(
            cleanData.successPremiumPaymentDate,
          ),
          notes: "",
          paymentValues: (cleanData.payments || []).map((p) => ({
            value: p.value,
            causationDate: toISO8601ForPayments(p.causationDate),
            paymentDate: toISO8601ForPayments(p.paymentDate),
          })),
        },
      ];

      // Usar la variable responsible ya declarada más arriba
      try {
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          try {
            const userData = JSON.parse(userDataString);
            responsible =
              userData?.name || userData?.email || userRole || "Sistema";
          } catch (err) {
            console.error(
              "[SUBMIT][USER] Error al parsear userDataString:",
              err,
            );
          }
        }
      } catch (err) {
        console.error(
          "[SUBMIT][USER] Error al obtener usuario de localStorage:",
          err,
        );
      }

      // Construir payload exacto según swagger del backend
      const body = {
        clientType: cleanData.clientType,
        responsible: responsible,
        department: cleanData.department,
        city: cleanData.city,
        personType: cleanData.personType,
        jurisdiction: cleanData.jurisdiction,
        processType: cleanData.processType,
        despachoJudicial: cleanData.despachoJudicial,
        radicado: cleanData.numeroRadicado,
        country: cleanData.country || "COLOMBIA",
        location: cleanData.location,
        documents: documents,
        interveners: interveners,
        proceduralParts: proceduralParts,
        payments: payments,
        // Archivos físicos
        files: uploadedFiles.map((f) => f.file),
        // Metadata adicional de archivos
        filesMetadata: JSON.stringify({
          totalFiles: uploadedFiles.length,
          fileNames: uploadedFiles.map((f) => f.name),
          createdAt: new Date().toISOString(),
        }),
      } as const;

      const result = await createCaso(body);

      if ("record" in result) {
        setCreationSteps([
          {
            step: "Creando caso principal",
            status: "success",
            message: "Caso creado",
          },
        ]);
        setCreationProgress(100);
        toast.success("Expediente creado exitosamente");
        setLocalDocuments([]);
        // Navegar a la vista de expedientes después de crear exitosamente
        router.push("/dashboard/expedientes");
      } else {
        const errorMsg = Array.isArray(result.message)
          ? result.message.join(", ")
          : result.message;
        setCreationSteps([
          {
            step: "Creando caso principal",
            status: "error",
            message: errorMsg,
          },
        ]);
        throw new Error(errorMsg || "Error al crear el caso");
      }
    } catch (error: any) {
      console.error("Error in case creation process:", error);
      toast.error(error?.message || "Error en el proceso de creación del caso");
    } finally {
      setTimeout(() => {
        setIsCreatingCase(false);
        setCreationProgress(0);
        setCreationSteps([]);
      }, 2000);
    }
  };

  const addIntervinenteLocal = () => {
    const currentIntervinientes = form.getValues("intervinientes") || [];
    form.setValue("intervinientes", [
      ...currentIntervinientes,
      {
        name: "",
        documentType: "",
        documentNumber: "",
        interventionType: "",
        contact: "",
        electronicAddress: "",
      },
    ]);
  };

  const saveIntervinienteToAPI = async (intervinienteData: any) => {
    if (caseId) {
      // Temporalmente simular éxito
      const result = { success: true, interviniente: intervinienteData };

      if (result.success) {
        toast.success("Interviniente agregado exitosamente");
        return result.interviniente;
      }
    } else {
      toast.warning("Primero debe guardar el caso");
    }
    return null;
  };

  const removeInterviniente = (index: number) => {
    const currentIntervinientes = form.getValues("intervinientes") || [];
    const interv = currentIntervinientes[index];
    // Si el interviniente ya existe en backend, eliminar por API
    if ((interv as any)?._id && caseId) {
      (async () => {
        try {
          await deleteIntervener((interv as any)._id);
          toast.success("Interviniente eliminado");
          await getCasoById(caseId);
        } catch (err) {
          console.error("Error deleting intervener:", err);
          toast.error("Error al eliminar interviniente");
        }
      })();
    } else {
      form.setValue(
        "intervinientes",
        currentIntervinientes.filter((_: any, i: number) => i !== index),
      );
    }
  };

  const addPayment = () => {
    const currentPayments = form.getValues("payments") || [];
    form.setValue("payments", [
      ...currentPayments,
      {
        value: 0,
        causationDate: getCurrentDate(),
        paymentDate: getCurrentDate(),
      },
    ]);
  };

  const removePayment = (index: number) => {
    const currentPayments = form.getValues("payments") || [];
    form.setValue(
      "payments",
      currentPayments.filter((_: any, i: number) => i !== index),
    );
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileId = Math.random().toString(36).substr(2, 9);
      const fileSize = (file.size / 1024).toFixed(0) + "kb";

      // Agregar archivo a la lista con progreso inicial
      setUploadedFiles((prev) => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          size: fileSize,
          progress: 0,
          file: file, // Guardar el File original
        },
      ]);

      // Simular progreso de subida
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
        }

        setUploadedFiles((prev) =>
          prev.map((f) =>
            f.id === fileId ? { ...f, progress: Math.round(progress) } : f,
          ),
        );
      }, 500);
    });
  };

  const removeUploadedFile = (fileId: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const saveDocument = async () => {
    if (!documentForm.categoria || !documentForm.documentType) {
      toast.error(
        "Por favor completa los campos obligatorios (categoría y tipo de documento)",
      );
      return;
    }

    try {
      if (caseId) {
        if (editingDocument && editingDocument._id) {
          // CORREGIDO: Actualizar documento existente según API PATCH /api/document/{id}
          const updatePayload = {
            category: documentForm.categoria,
            documentType: documentForm.documentType || "Escrito",
            document: documentForm.documentType || "", // Usar documentType como valor de document
            subdocument: documentForm.subdocumento || "",
            settledDate:
              documentForm.fechaRadicacion || new Date().toISOString(),
            responsibleType: documentForm.tipoResponsable || "Sistema",
            responsible: documentForm.responsable || "Sistema",
            observations: documentForm.observaciones || "",
          };

          const result = await updateDocument(
            editingDocument._id,
            updatePayload,
          );

          if (result && !result.statusCode) {
            toast.success("Documento actualizado exitosamente");
            // Recargar el caso para obtener los documentos actualizados
            await getCasoById(caseId);
            // Limpiar archivos subidos después del éxito
            setUploadedFiles([]);
            // Limpiar estado de edición
            setEditingDocument(null);
            // Cerrar el formulario después del éxito
            setShowDocumentForm(false);
          } else {
            const errorMsg = Array.isArray(result.message)
              ? result.message.join(", ")
              : result.message || "Error al actualizar documento";
            toast.error(errorMsg);
            console.error("[UPDATE_DOCUMENT] Error:", result);
            return;
          }
        } else {
          // Crear documento nuevo usando la API del repositorio
          // Generar consecutivo temporal si no existe
          const consecutivoTemp =
            documentForm.consecutivo ||
            `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

          const payload: CreateDocumentBody = {
            recordId: caseId,
            category: documentForm.categoria,
            documentType: documentForm.documentType || "Escrito",
            document: documentForm.documentType || "", // Usar documentType como valor de document
            subdocument: documentForm.subdocumento || "",
            settledDate:
              documentForm.fechaRadicacion || new Date().toISOString(),
            consecutive: consecutivoTemp,
            responsibleType: documentForm.tipoResponsable || "Sistema",
            responsible: documentForm.responsable || "Sistema",
            observations: documentForm.observaciones || "",
            file: uploadedFiles.length > 0 ? uploadedFiles[0].file : "",
          };

          const result = await createDocument(payload);

          if ("document" in result) {
            toast.success("Documento guardado exitosamente");
            // Recargar el caso para obtener los documentos actualizados
            await getCasoById(caseId);
            // Eliminar borrador coincidente si existe
            setDraftDocuments((prev) =>
              prev.filter(
                (d) =>
                  !(
                    d.category === documentForm.categoria &&
                    d.document === documentForm.documentType
                  ),
              ),
            );
            // Limpiar archivos subidos después del éxito
            setUploadedFiles([]);
            // Cerrar el formulario después del éxito
            setShowDocumentForm(false);
          } else {
            const errorMsg = Array.isArray(result.message)
              ? result.message.join(", ")
              : result.message || "Error al crear documento";
            toast.error(errorMsg);
            console.error("[SAVE_DOCUMENT] Error:", result);
            return; // No cerrar el formulario si hay error
          }
        }
      } else {
        // Agregar a documentos locales si no hay caso creado aún (sin generar consecutivo)
        // Normalizar shape para que coincida con CreateDocumentData esperado por backend
        const newDocument: CasoDocument = {
          _id: `local-${Date.now()}`,
          category: documentForm.categoria || "Documento",
          // `documentType` corresponde al tipo/tipo modal seleccionado por el usuario
          documentType: documentForm.documentType || "Escrito",
          // `document` debe ser uno de los permitidos por backend (usamos el select documentType)
          document: documentForm.documentType || "Documento",
          subdocument: normalizeSubdocument(documentForm.subdocumento),
          // Asegurar formato ISO
          settledDate: documentForm.fechaRadicacion
            ? new Date(documentForm.fechaRadicacion).toISOString()
            : new Date().toISOString(),
          consecutive:
            documentForm.consecutivo ||
            `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          responsibleType: documentForm.tipoResponsable || "Sistema",
          responsible: documentForm.responsable || "Sistema",
          observations: documentForm.observaciones || "",
        };

        setLocalDocuments((prev) => {
          const updated = [...prev, newDocument];
          return updated;
        });
        toast.success("Documento agregado localmente");
        // Eliminar borrador coincidente si existe
        setDraftDocuments((prev) =>
          prev.filter(
            (d) =>
              !(
                d.category === documentForm.categoria &&
                d.document === documentForm.documentType
              ),
          ),
        );
      }

      // Limpiar formulario solo si no hay error
      setDocumentForm({
        categoria: "",
        documentType: "",
        subdocumento: "",
        fechaRadicacion: "",
        consecutivo: "",
        tipoResponsable: "",
        responsable: "",
        observaciones: "",
      });
      // Limpiar estado de edición
      setEditingDocument(null);
      // Nota: no limpiamos uploadedFiles aquí; los archivos están vinculados al caso y se deben mantener hasta el submit
    } catch (error) {
      console.error("Error saving document:", error);
      toast.error("Error al guardar documento");
    }
  };

  // Función para editar documento existente
  const editDocument = (doc: CasoDocument) => {
    setEditingDocument(doc);
    setDocumentForm({
      categoria: doc.category || "",
      documentType: doc.document || "",
      subdocumento: doc.subdocument || "",
      fechaRadicacion: doc.settledDate ? sanitizeDate(doc.settledDate) : "",
      consecutivo: doc.consecutive || "",
      tipoResponsable: doc.responsibleType || "",
      responsable: doc.responsible || "",
      observaciones: doc.observations || "",
    });
    setShowDocumentForm(true);
  }; // Función para ver documento
  const viewDocument = (doc: CasoDocument) => {
    if (doc.url) {
      // Abrir en nueva ventana
      window.open(doc.url, "_blank", "noopener,noreferrer");
    } else {
      toast.warning("No hay URL disponible para este documento");
    }
  };

  // Función para descargar documento
  const downloadDocument = async (doc: CasoDocument) => {
    try {
      if (doc.url) {
        // Crear enlace temporal para descarga
        const link = document.createElement("a");
        link.href = doc.url;
        link.download = doc.document || "documento";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Descarga iniciada");
      } else {
        toast.warning("No hay archivo disponible para descargar");
      }
    } catch (error) {
      console.error("Error al descargar documento:", error);
      toast.error("Error al descargar documento");
    }
  };

  // Handler para guardar solo la información general del caso en modo edición
  const saveInformacionGeneral = async () => {
    if (!caseId) {
      toast.error("No hay caso cargado para actualizar");
      return;
    }

    try {
      const values = form.getValues();

      // IMPORTANTE: saveInformacionGeneral SOLO debe actualizar información general
      // NO debe tocar intervinientes, documentos, pagos, etc.

      // Construir payload solo con campos básicos para actualización específica
      const body = {
        clientType: values.clientType,
        responsible: userRole || "Sistema",
        department: values.department,
        city: values.city,
        personType: values.personType,
        jurisdiction: values.jurisdiction,
        processType: values.processType,
        despachoJudicial: values.despachoJudicial,
        radicado: values.numeroRadicado,
        country: values.country || "COLOMBIA",
        location: values.location,
      };

      const result = await updateCaso(caseId, body);

      if ("record" in result) {
        toast.success("Información general actualizada exitosamente");
        // Refrescar caso completo
        await getCasoById(caseId);
      } else {
        // Manejo específico para errores de transición de estado
        const errorMsg = Array.isArray((result as any).message)
          ? (result as any).message.join(", ")
          : (result as any).message || "";

        if (errorMsg.includes("Transición de estado inválida")) {
          console.error(
            "[SAVE][InformacionGeneral] Error de transición de estado:",
            result,
          );
          toast.error(
            "No se puede actualizar: el caso está en un estado que no permite modificaciones. Contacte al administrador si necesita cambiar el estado.",
          );
        } else {
          const status = (result as any)?.statusCode
            ? `${(result as any).statusCode}: `
            : "";
          const errDetail = (result as any).error
            ? ` (${(result as any).error})`
            : "";
          const finalMsg = `${status}${errorMsg}${errDetail}`.trim();
          console.error("[SAVE][InformacionGeneral] API Error:", result);
          toast.error(finalMsg || "Error al actualizar información general");
        }
      }
    } catch (err: any) {
      console.error("Error saving general info (exception):", err);
      // Si la excepción contiene información de respuesta, extraerla
      const status = err?.statusCode || err?.response?.status || null;
      const serverMsg =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data ||
        null;

      // Detectar específicamente errores de transición de estado
      const msgStr =
        typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
      if (msgStr && msgStr.includes("Transición de estado inválida")) {
        toast.error(
          "No se puede actualizar: el caso está en un estado que no permite modificaciones. Contacte al administrador si necesita cambiar el estado.",
        );
      } else if (status || serverMsg) {
        const s = status ? `${status}: ` : "";
        const m =
          typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
        toast.error(`${s}${m}`);
      } else {
        toast.error("Error al actualizar información general");
      }
    }
  };

  // Handler para guardar un interviniente individual (create o update según tenga _id)
  const saveInterviniente = async (index: number) => {
    const interviniente = form.getValues(`intervinientes.${index}`);
    if (!interviniente) return;
    try {
      if ((interviniente as any)._id) {
        await updateIntervener((interviniente as any)._id, {
          record: caseId || "",
          intervenerType: interviniente.interventionType || "",
          name: interviniente.name || "",
          documentType: interviniente.documentType || "",
          document: interviniente.documentNumber || "",
          email: interviniente.electronicAddress || "",
          contact: interviniente.contact || "",
        });
        toast.success("Interviniente actualizado");
      } else {
        if (!caseId) {
          toast.warning("Guarda el caso antes de agregar intervinientes");
          return;
        }
        const res = await createIntervener({
          record: caseId || "",
          intervenerType: interviniente.interventionType,
          name: interviniente.name,
          documentType: interviniente.documentType,
          document: interviniente.documentNumber,
          email: interviniente.electronicAddress || "",
          contact: interviniente.contact || "",
        } as CreateIntervenerBody);
        if ("intervener" in res) {
          toast.success("Interviniente creado");
          // refrescar
          await getCasoById(caseId);
        }
      }
    } catch (err: any) {
      console.error("Error saving intervener:", err);
      toast.error(err?.message || "Error al guardar interviniente");
    }
  };

  // Handler para guardar parte procesal (similar a interviniente)
  const saveParteProcesal = async (part: any) => {
    try {
      // Mapear posibles nombres de campo desde el formulario
      const mappedDocument = part.document || part.documentNumber || "";
      const mappedEmail = part.email || part.electronicAddress || "";

      // Validación cliente antes de llamar a la API para evitar errores 4xx
      const errors: string[] = [];

      if (!part.name?.trim()) {
        errors.push("El campo 'name' es requerido");
      }

      if (
        !mappedDocument ||
        typeof mappedDocument !== "string" ||
        !mappedDocument.trim()
      ) {
        errors.push("El campo 'document' es requerido y debe ser texto válido");
      }

      if (!part.partType?.trim()) {
        errors.push("El campo 'partType' es requerido");
      }

      if (!part.documentType?.trim()) {
        errors.push("El campo 'documentType' es requerido");
      }

      // Simple email validation si se proporciona
      if (mappedEmail && mappedEmail.trim()) {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(mappedEmail)) {
          errors.push("El campo 'email' debe ser un email válido");
        }
      }

      if (errors.length > 0) {
        errors.forEach((e) => toast.error(e));
        console.error("[saveParteProcesal] Errores de validación:", errors);
        return;
      }

      if (!caseId || typeof caseId !== "string" || caseId.trim() === "") {
        toast.error(
          "No se encontró el ID del caso para asociar la parte procesal. Guarda el caso primero.",
        );
        return;
      }

      const payload = {
        record: caseId,
        partType: part.partType,
        name: part.name.trim(),
        documentType: part.documentType?.trim() || "CC", // Asegurar que no sea string vacío
        document: mappedDocument.trim(),
        email: mappedEmail?.trim() || "",
        contact: part.contact?.trim() || "",
      } as CreateProceduralPartBody;

      if (part._id) {
        // Actualizar existente
        const result = await updateProceduralPart(part._id, payload);
        toast.success("Parte procesal actualizada exitosamente");
      } else {
        // Crear nueva
        const res = await createProceduralPart(payload);

        if ("proceduralPart" in res) {
          toast.success("Parte procesal creada exitosamente");
          // Refrescar caso para obtener las partes procesales actualizadas
          await getCasoById(caseId);
        } else {
          const msg = Array.isArray((res as any).message)
            ? (res as any).message.join(", ")
            : (res as any).message;
          console.error("[saveParteProcesal] Error en creación:", res);
          toast.error(msg || "Error al crear parte procesal");
          return;
        }
      }
    } catch (err: any) {
      console.error("Error saving procedural part:", err);
      const status = err?.statusCode || err?.response?.status || null;
      const serverMsg =
        err?.message ||
        err?.response?.data?.message ||
        err?.response?.data ||
        null;

      if (status || serverMsg) {
        const s = status ? `${status}: ` : "";
        const m =
          typeof serverMsg === "string" ? serverMsg : JSON.stringify(serverMsg);
        toast.error(`${s}${m}`);
      } else {
        toast.error("Error al guardar parte procesal");
      }
    }
  };

  // Guarda todos los intervinientes (crea o actualiza según _id)
  const saveIntervinientes = async () => {
    try {
      const intervinientes = form.getValues("intervinientes") || [];

      if (!caseId) {
        toast.warning("Guarda el caso antes de agregar intervinientes");
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;
      let errors: string[] = [];

      for (const [index, iv] of intervinientes.entries()) {
        try {
          // Mapear campos debido a inconsistencia entre tipos FormData y API
          const intervenerType =
            (iv as any).intervenerType || iv.interventionType;
          const document = (iv as any).document || iv.documentNumber;
          const email = (iv as any).email || iv.electronicAddress;

          // Validar campos requeridos usando los campos mapeados
          if (
            !iv.name?.trim() ||
            !intervenerType?.trim() ||
            !document?.trim() ||
            !iv.documentType?.trim()
          ) {
            console.error(
              `[saveIntervinientes] Interviniente ${
                index + 1
              } falla validación:`,
              {
                name: !!iv.name?.trim(),
                intervenerType: !!intervenerType?.trim(),
                document: !!document?.trim(),
                documentType: !!iv.documentType?.trim(),
              },
            );
            errors.push(
              `Interviniente ${
                index + 1
              }: faltan campos obligatorios (nombre, tipo de intervención, documento, tipo de documento)`,
            );
            continue;
          }

          const payload: CreateIntervenerBody = {
            record: caseId,
            intervenerType: intervenerType,
            name: iv.name,
            documentType: iv.documentType?.trim() || "CC",
            document: document,
            email: email || "",
            contact: iv.contact || "",
          };

          if ((iv as any)._id) {
            // Actualizar existente
            const result = await updateIntervener((iv as any)._id, payload);

            if (result && !result.statusCode) {
              updatedCount++;
            } else {
              const msg = Array.isArray((result as any)?.message)
                ? (result as any).message.join(", ")
                : (result as any)?.message || "Error desconocido";
              errors.push(
                `Error actualizando interviniente ${index + 1}: ${msg}`,
              );
              console.error(
                "[saveIntervinientes] Error actualizando interviniente:",
                result,
              );
            }
          } else {
            // Crear nuevo
            const res = await createIntervener(payload);
            if ("intervener" in res && res.intervener) {
              createdCount++;
            } else {
              const msg = Array.isArray((res as any).message)
                ? (res as any).message.join(", ")
                : (res as any).message;
              errors.push(`Error creando interviniente ${index + 1}: ${msg}`);
              console.error(
                "[saveIntervinientes] Error creando interviniente:",
                res,
              );
            }
          }
        } catch (err: any) {
          console.error(
            `[saveIntervinientes] Error procesando interviniente ${index + 1}:`,
            err,
          );
          errors.push(
            `Error procesando interviniente ${index + 1}: ${
              err?.message || "Error desconocido"
            }`,
          );
        }
      }

      // Mostrar resultados
      if (errors.length > 0) {
        console.error("[saveIntervinientes] Errores encontrados:", errors);
        toast.error(`Se encontraron errores: ${errors.join("; ")}`);
      }

      if (createdCount > 0 || updatedCount > 0) {
        const successMsg = [];
        if (createdCount > 0)
          successMsg.push(`${createdCount} interviniente(s) creado(s)`);
        if (updatedCount > 0)
          successMsg.push(`${updatedCount} interviniente(s) actualizado(s)`);

        toast.success(successMsg.join(" y "));

        // Refrescar caso para obtener la información actualizada
        await getCasoById(caseId);
      } else if (errors.length === 0) {
        toast.info("No hay intervinientes para procesar");
      }
    } catch (err: any) {
      console.error("Error saving interveners batch:", err);
      toast.error(err?.message || "Error al guardar intervinientes");
    }
  };

  // Handler para guardar payments (envía todos los payments actuales como payload de create/update según existencia)
  const savePayments = async () => {
    try {
      const values = form.getValues();
      const payments = values.payments || [];

      if (!caseId) {
        toast.warning("Guarda el caso antes de agregar pagos");
        return;
      }

      if (payments.length === 0) {
        toast.info("No hay pagos para procesar");
        return;
      }

      let createdCount = 0;
      let updatedCount = 0;
      let errors: string[] = [];

      // Procesar cada payment individualmente
      for (const [index, p] of payments.entries()) {
        try {
          // Validar campos requeridos
          if (!p.value || p.value <= 0) {
            errors.push(`Pago ${index + 1}: el valor debe ser mayor a 0`);
            continue;
          }

          if (!p.causationDate || !p.paymentDate) {
            errors.push(`Pago ${index + 1}: faltan fechas de causación o pago`);
            continue;
          }

          const payload = {
            record: { _id: caseId }, // Estructura de objeto como espera la API
            successBonus: values.includeSuccessPremium || false,
            bonusPercentage: values.successPremiumPercentage || 0,
            bonusPrice: values.successPremiumPrice || 0,
            bonusCausationDate: toISO8601ForPayments(
              values.successPremiumCausationDate,
            ),
            bonusPaymentDate: toISO8601ForPayments(
              values.successPremiumPaymentDate,
            ),
            notes: "",
            paymentValues: [
              {
                value: p.value,
                causationDate: toISO8601ForPayments(p.causationDate),
                paymentDate: toISO8601ForPayments(p.paymentDate),
              } as PaymentValue,
            ],
          } as CreatePaymentBody;

          if ((p as any)._id) {
            // Actualizar existente
            const updateRes = await updatePayment((p as any)._id, payload);

            if ("record" in updateRes) {
              updatedCount++;
            } else {
              const msg = Array.isArray((updateRes as any).message)
                ? (updateRes as any).message.join(", ")
                : (updateRes as any).message;
              errors.push(`Error actualizando pago ${index + 1}: ${msg}`);
              console.error(
                `[savePayments] Error actualizando pago ${(p as any)._id}:`,
                updateRes,
              );
            }
          } else {
            // Crear nuevo
            const res = await createPayment(payload);

            if ("payment" in res && res.payment) {
              createdCount++;
            } else {
              const msg = Array.isArray((res as any).message)
                ? (res as any).message.join(", ")
                : (res as any).message;
              errors.push(`Error creando pago ${index + 1}: ${msg}`);
              console.error(
                `[savePayments] Error creando pago ${index + 1}:`,
                res,
              );
            }
          }
        } catch (err: any) {
          console.error(
            `[savePayments] Error procesando pago ${index + 1}:`,
            err,
          );
          errors.push(
            `Error procesando pago ${index + 1}: ${
              err?.message || "Error desconocido"
            }`,
          );
        }
      }

      // Mostrar resultados
      if (errors.length > 0) {
        console.error("[savePayments] Errores encontrados:", errors);
        toast.error(`Se encontraron errores: ${errors.join("; ")}`);
      }

      if (createdCount > 0 || updatedCount > 0) {
        const successMsg = [];
        if (createdCount > 0)
          successMsg.push(`${createdCount} pago(s) creado(s)`);
        if (updatedCount > 0)
          successMsg.push(`${updatedCount} pago(s) actualizado(s)`);

        toast.success(successMsg.join(" y "));

        // Refrescar caso para obtener la información actualizada
        await getCasoById(caseId);
      } else if (errors.length === 0) {
        toast.info("No hay pagos para procesar");
      }

      // Recalcular total después de guardar
      setTimeout(() => calculateTotalAmount(), 100);
    } catch (err: any) {
      console.error("[savePayments] Catch Error:", err);
      console.error("[savePayments] Error type:", typeof err);
      console.error("[savePayments] Error message:", err?.message);
      console.error("[savePayments] Error response:", err?.response);
      console.error("[savePayments] Error data:", err?.response?.data);

      // Si el error tiene detalles específicos, mostrarlos
      if (err?.message && Array.isArray(err.message)) {
        console.error("[savePayments] Detailed errors:");
        err.message.forEach((msg: string, index: number) => {
          console.error(`  Error ${index + 1}: ${msg}`);
        });
        toast.error(`Errores de validación: ${err.message.join(", ")}`);
      } else {
        toast.error(err?.message || "Error al guardar pagos");
      }
    }
  };

  // Función para guardar solo el nuevo pago agregado
  const saveNewPayment = async () => {
    try {
      const isCreationMode = !caseId || caseId === "" || caseId === "new";
      const tempPago = form.getValues("tempPago");

      // Validar campos requeridos
      if (!tempPago?.value || tempPago.value <= 0) {
        toast.error("El valor debe ser mayor a 0");
        return;
      }

      if (!tempPago.causationDate || !tempPago.paymentDate) {
        toast.error("Faltan fechas de causación o pago");
        return;
      }

      // En modo creación, agregar al array y mostrar
      if (isCreationMode) {
        // Datos del pago
        const nuevoPago = {
          value: tempPago.value,
          causationDate: tempPago.causationDate,
          paymentDate: tempPago.paymentDate,
        };

        // Agregar al array de pagos en el formulario
        const pagosActuales = form.getValues("payments");
        const pagosArray = Array.isArray(pagosActuales) ? pagosActuales : [];
        const nuevosPagos = [...pagosArray, nuevoPago];
        form.setValue("payments", nuevosPagos);

        // Agregar al estado local para mostrar visualmente
        const nuevoItem = {
          _id: `temp_${Date.now()}`,
          value: nuevoPago.value,
          causationDate: nuevoPago.causationDate,
          paymentDate: nuevoPago.paymentDate,
        };
        setPagosLocales((prev) => [...prev, nuevoItem]);

        // Limpiar el formulario temporal
        form.setValue("tempPago", {
          value: 0,
          causationDate: getCurrentDate(),
          paymentDate: getCurrentDate(),
        });

        toast.success("Pago agregado al formulario");
        setShowPagoForm(false);

        // Recalcular total
        setTimeout(() => calculateTotalAmount(), 100);
        return;
      }

      // En modo edición, usar la API normalmente
      if (!caseId) {
        toast.warning("Guarda el caso antes de agregar pagos");
        return;
      }

      const values = form.getValues();
      const payload = {
        record: { _id: caseId },
        successBonus: values.includeSuccessPremium || false,
        bonusPercentage: values.successPremiumPercentage || 0,
        bonusPrice: values.successPremiumPrice || 0,
        bonusCausationDate: toISO8601ForPayments(
          values.successPremiumCausationDate,
        ),
        bonusPaymentDate: toISO8601ForPayments(
          values.successPremiumPaymentDate,
        ),
        notes: "",
        paymentValues: [
          {
            value: tempPago.value,
            causationDate: toISO8601ForPayments(tempPago.causationDate),
            paymentDate: toISO8601ForPayments(tempPago.paymentDate),
          } as PaymentValue,
        ],
      } as CreatePaymentBody;

      // Crear el pago
      const res = await createPayment(payload);

      if ("payment" in res && res.payment) {
        toast.success("Pago creado exitosamente");

        // Limpiar el formulario temporal
        form.setValue("tempPago", {
          value: 0,
          causationDate: getCurrentDate(),
          paymentDate: getCurrentDate(),
        });

        // Recargar caso para mostrar el pago guardado
        await getCasoById(caseId);

        // Recalcular total
        setTimeout(() => calculateTotalAmount(), 100);
      } else {
        const msg = Array.isArray((res as any).message)
          ? (res as any).message.join(", ")
          : (res as any).message;
        toast.error(`Error creando pago: ${msg}`);
        console.error("[saveNewPayment] Error:", res);
      }
    } catch (err: any) {
      console.error("[saveNewPayment] Error:", err);
      toast.error(err?.message || "Error al guardar el pago");
    }
  };

  // Guardar todos los documentos: createDocument para docs locales, refresh caso
  const saveDocuments = async () => {
    try {
      if (!caseId) {
        toast.warning("Guarda el caso antes de agregar documentos");
        return;
      }

      if (localDocuments.length === 0) {
        toast.info("No hay documentos locales para guardar");
        return;
      }

      let createdCount = 0;
      let errors: string[] = [];

      // Subir documentos locales (localDocuments) usando createDocument
      for (const [index, doc] of localDocuments.entries()) {
        try {
          // Validar campos requeridos
          if (!doc.category?.trim() || !doc.document?.trim()) {
            errors.push(
              `Documento ${
                index + 1
              }: faltan campos obligatorios (categoría, documento)`,
            );
            continue;
          }

          const payload: CreateDocumentBody = {
            recordId: caseId,
            category: doc.category.trim(),
            documentType: doc.documentType?.trim() || "",
            document: doc.document.trim(),
            subdocument: normalizeSubdocument(doc.subdocument),
            settledDate: doc.settledDate || new Date().toISOString(),
            consecutive:
              doc.consecutive ||
              `DOC-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            responsibleType: doc.responsibleType?.trim() || "Sistema",
            responsible: doc.responsible?.trim() || "Sistema",
            observations: doc.observations?.trim() || "",
          } as any;

          const result = await createDocument(payload);

          if ("document" in result) {
            createdCount++;
          } else {
            const msg = Array.isArray((result as any).message)
              ? (result as any).message.join(", ")
              : (result as any).message;
            errors.push(`Error creando documento ${index + 1}: ${msg}`);
            console.error(
              `[saveDocuments] Error creando documento ${index + 1}:`,
              result,
            );
          }
        } catch (err: any) {
          console.error(
            `[saveDocuments] Error procesando documento ${index + 1}:`,
            err,
          );
          errors.push(
            `Error procesando documento ${index + 1}: ${
              err?.message || "Error desconocido"
            }`,
          );
        }
      }

      // Mostrar resultados
      if (errors.length > 0) {
        console.error("[saveDocuments] Errores encontrados:", errors);
        toast.error(`Se encontraron errores: ${errors.join("; ")}`);
      }

      if (createdCount > 0) {
        toast.success(`${createdCount} documento(s) guardado(s) exitosamente`);

        // Limpiar documentos locales después del éxito
        setLocalDocuments([]);

        // Refrescar caso para obtener la información actualizada
        await getCasoById(caseId);
      } else if (errors.length === 0) {
        toast.info("No hay documentos para procesar");
      }
    } catch (err: any) {
      console.error("Error saving documents batch:", err);
      toast.error(err?.message || "Error al guardar documentos");
    }
  };

  const removeDocument = async (index: number) => {
    const allDocuments = [...documents, ...localDocuments];
    const document = allDocuments[index];

    if (document._id && caseId) {
      // Eliminar de la API si el documento ya está guardado
      try {
        await deleteCaseDocument(document._id);
        toast.success("Documento eliminado exitosamente");
        // Recargar el caso para obtener la lista actualizada
        await getCasoById(caseId);
      } catch (error) {
        toast.error("Error al eliminar el documento");
      }
    } else {
      // Eliminar de documentos locales si aún no está guardado
      if (index < documents.length) {
        // Es un documento de la API - no deberíamos llegar aquí sin caseId
        toast.error("No se puede eliminar el documento");
      } else {
        // Es un documento local
        const localIndex = index - documents.length;
        setLocalDocuments((prev) => prev.filter((_, i) => i !== localIndex));
      }
    }
  };

  // El consecutivo ahora lo genera el backend al guardar
  const generateConsecutive = () => {
    // intencionalmente vacío
  };

  // Handler seguro para rellenar el formulario con datos de prueba
  const handleTestFill = () => {
    try {
      form.reset({
        clientType: "Didi",
        internalCode: "",
        department: "Atlántico",
        city: "Bogotá",
        processType: "Proceso Ejecutivo",
        creationDate: new Date().toISOString().split("T")[0],
        jurisdiction: "PENAL CIRCUITO",
        despachoJudicial: "Juzgado 1 Civil del Circuito de Bogotá",
        processNumber: "",
        numeroRadicado: "",
        demandantePart: {
          name: "Juan Pérez",
          documentType: "CC",
          documentNumber: "12345678",
          electronicAddress: "juan.perez@yopmail.com",
          contact: "3001112222",
        },
        demandadoPart: {
          name: "Empresa S.A.",
          documentType: "NIT",
          documentNumber: "800123456-7",
          electronicAddress: "empresa@yopmail.com",
          contact: "3204445555",
        },
        intervinientes: [
          {
            name: "Carlos Gómez",
            documentType: "CC",
            documentNumber: "87654321",
            interventionType: "Apoderado",
            contact: "3112223333",
            electronicAddress: "carlos@yopmail.com",
          },
        ],
        includeSuccessPremium: false,
        payments: [
          {
            value: 60,
            causationDate: new Date().toISOString().split("T")[0],
            paymentDate: new Date().toISOString().split("T")[0],
          },
        ],
        successPremiumPercentage: 20,
        successPremiumPrice: 30,
        successPremiumCausationDate: new Date().toISOString().split("T")[0],
        successPremiumPaymentDate: new Date().toISOString().split("T")[0],
        totalAmount: 60,
      } as any);

      const exampleDoc = {
        _id: `local-test-${Date.now()}`,
        category: "Demanda",
        documentType: "Escrito",
        document: "Demanda",
        subdocument: "Impulso procesal",
        settledDate: new Date().toISOString(),
        consecutive: `DOC-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 4)}`,
        responsibleType: "Abogado",
        responsible: "Juan Pérez",
        observations: "Documento de prueba generado por botón",
      } as any;

      setLocalDocuments((prev) => {
        return [...prev, exampleDoc];
      });

      toast.success(
        "Formulario rellenado con datos de prueba. Sube el/los archivos manualmente antes de enviar.",
      );
    } catch (err) {
      console.error("Error en handleTestFill:", err);
      toast.error("No se pudo rellenar el formulario de prueba");
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1 p-2 sm:p-3 md:p-6 min-w-0 overflow-x-hidden">
          <div className="max-w-4xl mx-auto min-w-0">
            {/* Header */}
            <div className="mb-4 sm:mb-6 md:mb-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">
                    {isCreateMode
                      ? "Crear Nuevo Caso"
                      : isEditMode
                        ? "Editar Caso"
                        : "Ver Detalles del Caso"}
                  </h1>
                  <p className="text-gray-600 mt-2 text-xs sm:text-sm md:text-base">
                    {isCreateMode
                      ? "Completa la información para crear un nuevo expediente"
                      : isEditMode
                        ? "Modifica la información del expediente"
                        : "Información detallada del expediente"}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-shrink-0">
                  {isViewMode && (
                    <Button
                      className="elena-button-primary w-full sm:w-auto text-xs sm:text-sm"
                      onClick={() =>
                        router.push(
                          `/dashboard/informacion-caso?mode=edit&id=${caseId}`,
                        )
                      }
                    >
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      Editar
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Barra de progreso para creación de casos */}
            {isCreatingCase && (
              <Card className="elena-card mb-6 border-pink-200">
                <CardHeader className="pb-4">
                  <CardTitle className="text-pink-600 flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                    Creando caso...
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Barra de progreso principal */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-pink-500 to-pink-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${creationProgress}%` }}
                    ></div>
                  </div>

                  {/* Detalle de pasos */}
                  <div className="space-y-2">
                    {creationSteps.map((step, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-3 text-sm"
                      >
                        <div className="flex-shrink-0">
                          {step.status === "pending" && (
                            <div className="w-4 h-4 border border-gray-300 rounded-full"></div>
                          )}
                          {step.status === "loading" && (
                            <div className="w-4 h-4 border-2 border-pink-600 border-t-transparent rounded-full animate-spin"></div>
                          )}
                          {step.status === "success" && (
                            <div className="w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                          {step.status === "error" && (
                            <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                              <svg
                                className="w-2.5 h-2.5 text-white"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>
                        <span
                          className={`font-medium ${
                            step.status === "success"
                              ? "text-green-700"
                              : step.status === "error"
                                ? "text-red-700"
                                : step.status === "loading"
                                  ? "text-pink-600"
                                  : "text-gray-500"
                          }`}
                        >
                          {step.step}
                        </span>
                        {step.message && (
                          <span
                            className={`text-xs ${
                              step.status === "success"
                                ? "text-green-600"
                                : step.status === "error"
                                  ? "text-red-600"
                                  : "text-gray-500"
                            }`}
                          >
                            - {step.message}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="text-center text-sm text-gray-600 mt-4">
                    {creationProgress === 100
                      ? "Proceso completado"
                      : `Progreso: ${Math.round(creationProgress)}%`}
                  </div>
                </CardContent>
              </Card>
            )}

            <Form {...form}>
              <form
                onSubmit={(e) => {
                  // Llamar al handler de envío de react-hook-form
                  return form.handleSubmit(onSubmit)(e);
                }}
                className="space-y-4 sm:space-y-6 md:space-y-8"
              >
                {/* Información general del caso */}
                <Card className="elena-card">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Información general del caso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="clientType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Tipo Cliente
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isFieldDisabled}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue placeholder="Selecciona tipo de cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {clientTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="internalCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Código interno
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Se genera automáticamente"
                                className="border-gray-300"
                                {...field}
                                disabled
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="department"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Departamento
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue placeholder="Selecciona departamento" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(() => {
                                  return departments.map((dept, index) => (
                                    <SelectItem
                                      key={`dept-${dept.codigo}-${index}`}
                                      value={dept.nombre}
                                    >
                                      {dept.nombre}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Ciudad
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue placeholder="Selecciona ciudad" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {(() => {
                                  const currentCityValue = field.value;
                                  // Filtrar ciudades duplicadas y crear keys únicas
                                  const uniqueCities = availableCities.filter(
                                    (city, index, self) =>
                                      index ===
                                      self.findIndex(
                                        (c) => c.nombre === city.nombre,
                                      ),
                                  );
                                  return uniqueCities.map((city, index) => (
                                    <SelectItem
                                      key={`city-${city.codigo}-${city.nombre}-${index}`}
                                      value={normalizeCityName(city.nombre)}
                                    >
                                      {city.nombre}
                                    </SelectItem>
                                  ));
                                })()}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="personType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Tipo persona
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue placeholder="Seleccione una opción" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent className="max-h-60">
                                {personTypes.map((type) => (
                                  <SelectItem
                                    key={type}
                                    value={type}
                                    className="text-sm"
                                  >
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="creationDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Fecha de creación
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                selected={field.value || ""}
                                onSelect={(date) => field.onChange(date || "")}
                                placeholder="Seleccionar fecha"
                                disabled={isViewMode}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="location"
                        render={({ field }) => {
                          return (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Ubicación del expediente
                              </FormLabel>
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isViewMode}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Seleccione una opción" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {ubicacionesExpediente.map((ubicacion) => (
                                    <SelectItem
                                      key={ubicacion}
                                      value={ubicacion}
                                    >
                                      {ubicacion}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                      <FormField
                        control={form.control}
                        name="jurisdiction"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Jurisdicción
                            </FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={field.onChange}
                              disabled={isViewMode}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-300">
                                  <SelectValue placeholder="Seleccione una opción" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {jurisdictions.map((jurisdiccion) => (
                                  <SelectItem
                                    key={jurisdiccion}
                                    value={jurisdiccion}
                                  >
                                    {jurisdiccion}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <FormField
                        control={form.control}
                        name="processType"
                        render={({ field }) => {
                          const currentJurisdiction =
                            form.watch("jurisdiction");
                          const currentProcessType = field.value;

                          let availableProcessTypes = currentJurisdiction
                            ? getProcessTypesByJurisdiction(currentJurisdiction)
                            : [];

                          // SIEMPRE incluir el valor actual si existe
                          if (
                            currentProcessType &&
                            !availableProcessTypes.includes(currentProcessType)
                          ) {
                            availableProcessTypes = [
                              currentProcessType,
                              ...availableProcessTypes,
                            ];
                          }

                          return (
                            <FormItem>
                              <FormLabel className="text-gray-700 font-medium">
                                Tipo de proceso
                              </FormLabel>
                              <Select
                                value={field.value || ""}
                                onValueChange={field.onChange}
                                disabled={isViewMode || !currentJurisdiction}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300 w-full">
                                    <SelectValue
                                      placeholder={
                                        !currentJurisdiction
                                          ? "Selecciona primero una jurisdicción"
                                          : "Seleccione un tipo de proceso"
                                      }
                                    />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {availableProcessTypes.length === 0 ? (
                                    <SelectItem value="none" disabled>
                                      {!currentJurisdiction
                                        ? "Selecciona primero una jurisdicción"
                                        : "No hay tipos de proceso para esta jurisdicción"}
                                    </SelectItem>
                                  ) : (
                                    availableProcessTypes.map((type, index) => (
                                      <SelectItem
                                        key={`${type}-${index}`}
                                        value={type}
                                      >
                                        {type}
                                      </SelectItem>
                                    ))
                                  )}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          );
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="despachoJudicial"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Despacho judicial
                            </FormLabel>
                            {(() => {
                              return null;
                            })()}
                            {showManualDespacho ? (
                              <FormControl>
                                <Input
                                  {...field}
                                  value={field.value || manualDespacho}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setManualDespacho(value);
                                    field.onChange(value);
                                  }}
                                  placeholder="Escriba el despacho judicial"
                                  disabled={isViewMode}
                                  className="border-gray-300"
                                />
                              </FormControl>
                            ) : (
                              <Select
                                value={field.value}
                                onValueChange={field.onChange}
                                disabled={isViewMode}
                              >
                                <FormControl>
                                  <SelectTrigger className="border-gray-300">
                                    <SelectValue placeholder="Selecciona despacho judicial" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {(() => {
                                    return availableDespachos.map(
                                      (despacho) => (
                                        <SelectItem
                                          key={despacho}
                                          value={despacho}
                                        >
                                          {despacho}
                                        </SelectItem>
                                      ),
                                    );
                                  })()}
                                </SelectContent>
                              </Select>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="numeroRadicado"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Número de radicado
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Número de radicado del proceso"
                                className="border-gray-300"
                                {...field}
                                disabled={isViewMode}
                                onChange={(e) => {
                                  // Solo permitir números y guiones
                                  const value = e.target.value.replace(
                                    /[^0-9\-]/g,
                                    "",
                                  );
                                  field.onChange(value);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                  {/* Botón guardar Información general (solo en edición) */}
                  {isEditMode && (
                    <div className="flex justify-end m-3">
                      <Button
                        type="button"
                        className="elena-button-primary"
                        onClick={saveInformacionGeneral}
                      >
                        Guardar
                      </Button>
                    </div>
                  )}
                </Card>

                {/* Partes procesales */}
                <Card className="elena-card">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Partes procesales
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Lista de Demandantes */}
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-pink-600">
                          Demandantes
                        </h3>
                      </div>

                      {/* Lista de demandantes existentes */}
                      {((caseId &&
                        (caso?.proceduralParts?.filter(
                          (p) => p.partType === "demandante",
                        )?.length || 0) > 0) ||
                        (!caseId && demandantes.length > 0)) && (
                        <div className="space-y-3">
                          <div className="grid gap-3">
                            {(caseId
                              ? caso?.proceduralParts?.filter(
                                  (p) => p.partType === "demandante",
                                )
                              : demandantes
                            )?.map((demandante, idx) => (
                              <div
                                key={demandante._id || idx}
                                className="flex items-center justify-between p-4 rounded-md bg-pink-50 border border-pink-200"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-pink-100 text-pink-800">
                                      Demandante
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span
                                      className="font-medium truncate block"
                                      title={demandante.name}
                                    >
                                      {demandante.name}
                                    </span>
                                    <div className="text-gray-500 text-xs mt-1">
                                      <span
                                        className="truncate inline-block max-w-[100px]"
                                        title={demandante.documentType}
                                      >
                                        ({demandante.documentType})
                                      </span>
                                      <span
                                        className="ml-2 truncate inline-block max-w-[120px]"
                                        title={getDocumentNumber(demandante)}
                                      >
                                        {getDocumentNumber(demandante)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {getEmailAddress(demandante) && (
                                      <div
                                        className="truncate"
                                        title={`Email: ${getEmailAddress(
                                          demandante,
                                        )}`}
                                      >
                                        Email: {getEmailAddress(demandante)}
                                      </div>
                                    )}
                                    {demandante.contact && (
                                      <div
                                        className="truncate"
                                        title={`Tel: ${demandante.contact}`}
                                      >
                                        Tel: {demandante.contact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(isEditMode || isCreateMode) && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Cargar datos en el formulario para editar
                                        form.setValue("tempDemandante", {
                                          name: demandante.name,
                                          documentType: demandante.documentType,
                                          documentNumber:
                                            getDocumentNumber(demandante),
                                          electronicAddress:
                                            getEmailAddress(demandante),
                                          contact: demandante.contact,
                                        });
                                        setEditingDemandante(
                                          demandante as ProceduralPart,
                                        );
                                        setShowDemandanteForm(true);
                                      }}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        const isCreationMode =
                                          !caseId ||
                                          caseId === "" ||
                                          caseId === "new";

                                        if (
                                          window.confirm(
                                            "¿Estás seguro de eliminar este demandante?",
                                          )
                                        ) {
                                          if (isCreationMode) {
                                            // En modo creación, eliminar solo del estado local
                                            setDemandantes((prev) =>
                                              prev.filter(
                                                (d) => d._id !== demandante._id,
                                              ),
                                            );
                                            // También eliminar de los datos del formulario
                                            const demandantesForm =
                                              form.getValues(
                                                "demandantePart",
                                              ) || [];
                                            const updatedDemandantes =
                                              demandantesForm.filter(
                                                (d: any) =>
                                                  d.name !== demandante.name ||
                                                  getDocumentNumber(d) !==
                                                    getDocumentNumber(
                                                      demandante,
                                                    ),
                                              );
                                            form.setValue(
                                              "demandantePart",
                                              updatedDemandantes,
                                            );
                                            toast.success(
                                              "Demandante eliminado del formulario",
                                            );
                                          } else if (
                                            demandante._id &&
                                            !demandante._id.startsWith("temp_")
                                          ) {
                                            // En modo edición y con ID real, usar API
                                            try {
                                              await deleteProceduralPart(
                                                demandante._id,
                                              );
                                              toast.success(
                                                "Demandante eliminado exitosamente",
                                              );
                                              if (caseId)
                                                await getCasoById(caseId);
                                            } catch (err: any) {
                                              console.error(
                                                "Error deleting demandante:",
                                                err,
                                              );
                                              toast.error(
                                                err?.message ||
                                                  "Error al eliminar demandante",
                                              );
                                            }
                                          } else {
                                            // Caso edge: ID temporal en modo edición
                                            setDemandantes((prev) =>
                                              prev.filter(
                                                (d) => d._id !== demandante._id,
                                              ),
                                            );
                                            toast.success(
                                              "Demandante eliminado del formulario",
                                            );
                                          }
                                        }
                                      }}
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botón Agregar Demandante */}
                      {(isEditMode || isCreateMode) && (
                        <div className="flex justify-start">
                          <Button
                            type="button"
                            variant="outline"
                            className="elena-button-secondary"
                            onClick={() => {
                              // Limpiar formulario temporal y mostrar
                              form.setValue("tempDemandante", {
                                name: "",
                                documentType: "",
                                documentNumber: "",
                                electronicAddress: "",
                                contact: "",
                              });
                              setEditingDemandante(null);
                              setShowDemandanteForm(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Demandante
                          </Button>
                        </div>
                      )}

                      {/* Formulario de Demandante */}
                      {showDemandanteForm && (isEditMode || isCreateMode) && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="text-md font-semibold text-gray-700 mb-4">
                            {editingDemandante
                              ? "Editar Demandante"
                              : "Nuevo Demandante"}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="tempDemandante.name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Nombre completo
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Nombre completo del demandante"
                                      className="border-gray-300"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandante.documentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Tipo de Documento
                                  </FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-300">
                                        <SelectValue placeholder="Seleccionar opción" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {documentTypes.map((type) => (
                                        <SelectItem
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandante.documentNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Documento *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Número de documento (requerido)"
                                      className="border-gray-300"
                                      {...field}
                                      onChange={(e) => {
                                        const documentType = form.getValues(
                                          "tempDemandante.documentType",
                                        );
                                        let value = e.target.value;

                                        // Validar según el tipo de documento
                                        if (documentType === "Pasaporte") {
                                          // Permitir letras y números para pasaporte
                                          value = value.replace(
                                            /[^A-Za-z0-9]/g,
                                            "",
                                          );
                                        } else {
                                          // Solo números para otros tipos
                                          value = value.replace(/[^0-9]/g, "");
                                        }

                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandante.electronicAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Dirección Electrónica
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="correo@ejemplo.com"
                                      className="border-gray-300"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandante.contact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Contacto
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Número de teléfono"
                                      className="border-gray-300"
                                      {...field}
                                      onChange={(e) => {
                                        // Solo permitir números
                                        const value = e.target.value.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowDemandanteForm(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              className="elena-button-primary"
                              onClick={async () => {
                                try {
                                  const isCreationMode =
                                    !caseId ||
                                    caseId === "" ||
                                    caseId === "new";
                                  const demandante =
                                    form.getValues("tempDemandante");

                                  // Validar campos requeridos usando el esquema Zod
                                  if (!demandante?.name?.trim()) {
                                    toast.error(
                                      "El nombre del demandante es requerido",
                                    );
                                    return;
                                  }

                                  if (!demandante?.documentType?.trim()) {
                                    toast.error(
                                      "El tipo de documento es requerido",
                                    );
                                    return;
                                  }

                                  if (!demandante?.documentNumber?.trim()) {
                                    toast.error(
                                      "El número de documento es requerido",
                                    );
                                    return;
                                  }
                                  // Datos del demandante
                                  const demandanteData = {
                                    name: demandante.name,
                                    documentType: demandante.documentType || "",
                                    documentNumber:
                                      demandante.documentNumber || "",
                                    electronicAddress:
                                      demandante.electronicAddress || "",
                                    contact: demandante.contact || "",
                                  };
                                  // En modo creación, manejar creación y edición local
                                  if (isCreationMode) {
                                    if (
                                      editingDemandante &&
                                      editingDemandante._id?.startsWith("temp_")
                                    ) {
                                      // Actualizar en el array de demandantes del formulario
                                      const demandantesActuales =
                                        form.getValues("demandantePart") || [];
                                      const demandantesArray = Array.isArray(
                                        demandantesActuales,
                                      )
                                        ? demandantesActuales
                                        : [];
                                      const updatedArray = demandantesArray.map(
                                        (d: any) => {
                                          // Buscar por name y documentNumber ya que son únicos
                                          if (
                                            d.name === editingDemandante.name &&
                                            getDocumentNumber(d) ===
                                              getDocumentNumber(
                                                editingDemandante,
                                              )
                                          ) {
                                            return demandanteData;
                                          }
                                          return d;
                                        },
                                      );
                                      form.setValue(
                                        "demandantePart",
                                        updatedArray,
                                      );

                                      // Actualizar en el estado local para mostrar visualmente
                                      setDemandantes((prev) =>
                                        prev.map((item) => {
                                          if (
                                            item._id === editingDemandante._id
                                          ) {
                                            return {
                                              ...item,
                                              name: demandanteData.name,
                                              documentType:
                                                demandanteData.documentType ||
                                                "CC",
                                              documentNumber:
                                                demandanteData.documentNumber ||
                                                "",
                                              electronicAddress:
                                                demandanteData.electronicAddress ||
                                                "",
                                              contact:
                                                demandanteData.contact || "",
                                            };
                                          }
                                          return item;
                                        }),
                                      );

                                      toast.success(
                                        "Demandante actualizado en el formulario",
                                      );
                                    } else {
                                      // Agregar al array de demandantes en el formulario
                                      const demandantesActuales =
                                        form.getValues("demandantePart");
                                      const demandantesArray = Array.isArray(
                                        demandantesActuales,
                                      )
                                        ? demandantesActuales
                                        : [];
                                      const nuevosDemandantes = [
                                        ...demandantesArray,
                                        demandanteData,
                                      ];
                                      form.setValue(
                                        "demandantePart",
                                        nuevosDemandantes,
                                      );
                                      // Agregar al estado local para mostrar visualmente
                                      const nuevoItem: UnifiedPart = {
                                        _id: `temp_${Date.now()}`,
                                        name: demandanteData.name,
                                        documentType:
                                          demandanteData.documentType || "CC",
                                        documentNumber:
                                          demandanteData.documentNumber || "",
                                        electronicAddress:
                                          demandanteData.electronicAddress ||
                                          "",
                                        contact: demandanteData.contact || "",
                                        partType: "demandante",
                                      };
                                      setDemandantes((prev) => [
                                        ...prev,
                                        nuevoItem,
                                      ]);

                                      toast.success(
                                        "Demandante agregado al formulario",
                                      );
                                    }

                                    // Limpiar el formulario temporal
                                    form.setValue("tempDemandante", {
                                      name: "",
                                      documentType: "",
                                      documentNumber: "",
                                      electronicAddress: "",
                                      contact: "",
                                    });

                                    setShowDemandanteForm(false);
                                    setEditingDemandante(null);
                                    return;
                                  }
                                  // En modo edición, usar la API normalmente
                                  const partToSave: any = {
                                    record: caseId || "",
                                    partType: "demandante",
                                    name: demandante.name,
                                    documentType: demandante.documentType || "",
                                    document: demandante.documentNumber || "",
                                    email: demandante.electronicAddress || "",
                                    contact: demandante.contact || "",
                                  };

                                  if (
                                    editingDemandante &&
                                    editingDemandante._id
                                  ) {
                                    const demandantesActuales =
                                      form.getValues("demandantePart") || [];
                                    const demandantesArray = Array.isArray(
                                      demandantesActuales,
                                    )
                                      ? demandantesActuales
                                      : [];
                                    const updatedArray = demandantesArray.map(
                                      (d: any) => {
                                        // Buscar por name y documentNumber ya que son únicos
                                        if (
                                          d.name === editingDemandante.name &&
                                          getDocumentNumber(d) ===
                                            getDocumentNumber(editingDemandante)
                                        ) {
                                          return demandanteData;
                                        }
                                        return d;
                                      },
                                    );
                                    form.setValue(
                                      "demandantePart",
                                      updatedArray,
                                    );
                                    // Actualizar existente
                                    await updateProceduralPart(
                                      editingDemandante._id,
                                      partToSave,
                                    );
                                    toast.success(
                                      "Demandante actualizado exitosamente",
                                    );
                                  } else {
                                    // Crear nuevo
                                    const res =
                                      await createProceduralPart(partToSave);
                                    if ("proceduralPart" in res) {
                                      toast.success(
                                        "Demandante creado exitosamente",
                                      );
                                    } else {
                                      const msg = Array.isArray(
                                        (res as any).message,
                                      )
                                        ? (res as any).message.join(", ")
                                        : (res as any).message;
                                      toast.error(
                                        msg || "Error al crear demandante",
                                      );
                                      return;
                                    }
                                  }

                                  setShowDemandanteForm(false);
                                  setEditingDemandante(null);
                                  if (caseId) await getCasoById(caseId);
                                } catch (err: any) {
                                  console.error(
                                    "Error saving demandante:",
                                    err,
                                  );
                                  toast.error(
                                    err?.message ||
                                      "Error al guardar demandante",
                                  );
                                }
                              }}
                            >
                              {editingDemandante ? "Guardar" : "Crear"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Lista de Demandados */}
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-pink-600">
                          Demandados
                        </h3>
                      </div>

                      {/* Lista de demandados existentes */}
                      {((caseId &&
                        (caso?.proceduralParts?.filter(
                          (p) => p.partType === "demandada",
                        )?.length || 0) > 0) ||
                        (!caseId && demandadas.length > 0)) && (
                        <div className="space-y-3">
                          <div className="grid gap-3">
                            {(caseId
                              ? caso?.proceduralParts?.filter(
                                  (p) => p.partType === "demandada",
                                )
                              : demandadas
                            )?.map((demandado, idx) => (
                              <div
                                key={demandado._id || idx}
                                className="flex items-center justify-between p-4 rounded-md bg-blue-50 border border-blue-200"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Demandado
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span
                                      className="font-medium truncate block"
                                      title={demandado.name}
                                    >
                                      {demandado.name}
                                    </span>
                                    <div className="text-gray-500 text-xs mt-1">
                                      <span
                                        className="truncate inline-block max-w-[100px]"
                                        title={demandado.documentType}
                                      >
                                        ({demandado.documentType})
                                      </span>
                                      <span
                                        className="ml-2 truncate inline-block max-w-[120px]"
                                        title={getDocumentNumber(demandado)}
                                      >
                                        {getDocumentNumber(demandado)}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {getEmailAddress(demandado) && (
                                      <div
                                        className="truncate"
                                        title={`Email: ${getEmailAddress(
                                          demandado,
                                        )}`}
                                      >
                                        Email: {getEmailAddress(demandado)}
                                      </div>
                                    )}
                                    {demandado.contact && (
                                      <div
                                        className="truncate"
                                        title={`Tel: ${demandado.contact}`}
                                      >
                                        Tel: {demandado.contact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(isEditMode || isCreateMode) && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Cargar datos en el formulario para editar
                                        form.setValue("tempDemandado", {
                                          name: demandado.name,
                                          documentType: demandado.documentType,
                                          documentNumber:
                                            getDocumentNumber(demandado),
                                          electronicAddress:
                                            getEmailAddress(demandado),
                                          contact: demandado.contact,
                                        });
                                        setEditingDemandado(
                                          demandado as ProceduralPart,
                                        );
                                        setShowDemandadoForm(true);
                                      }}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        const isCreationMode =
                                          !caseId ||
                                          caseId === "" ||
                                          caseId === "new";

                                        if (
                                          window.confirm(
                                            "¿Estás seguro de eliminar este demandado?",
                                          )
                                        ) {
                                          if (isCreationMode) {
                                            setDemandadas((prev) =>
                                              prev.filter(
                                                (d) => d._id !== demandado._id,
                                              ),
                                            );
                                            // También eliminar de los datos del formulario
                                            const demandadosForm =
                                              form.getValues("demandadoPart") ||
                                              [];
                                            const updatedDemandados =
                                              demandadosForm.filter(
                                                (d: any) =>
                                                  d.name !== demandado.name ||
                                                  getDocumentNumber(d) !==
                                                    getDocumentNumber(
                                                      demandado,
                                                    ),
                                              );
                                            form.setValue(
                                              "demandadoPart",
                                              updatedDemandados,
                                            );
                                            toast.success(
                                              "Demandado eliminado del formulario",
                                            );
                                          } else if (
                                            demandado._id &&
                                            !demandado._id.startsWith("temp_")
                                          ) {
                                            // En modo edición y con ID real, usar API
                                            try {
                                              await deleteProceduralPart(
                                                demandado._id,
                                              );
                                              toast.success(
                                                "Demandado eliminado exitosamente",
                                              );
                                              if (caseId)
                                                await getCasoById(caseId);
                                            } catch (err: any) {
                                              console.error(
                                                "Error deleting demandado:",
                                                err,
                                              );
                                              toast.error(
                                                err?.message ||
                                                  "Error al eliminar demandado",
                                              );
                                            }
                                          } else {
                                            // Caso edge: ID temporal en modo edición
                                            setDemandadas((prev) =>
                                              prev.filter(
                                                (d) => d._id !== demandado._id,
                                              ),
                                            );
                                            toast.success(
                                              "Demandado eliminado del formulario",
                                            );
                                          }
                                        }
                                      }}
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botón Agregar Demandado */}
                      {(isEditMode || isCreateMode) && (
                        <div className="flex justify-start">
                          <Button
                            type="button"
                            variant="outline"
                            className="elena-button-secondary"
                            onClick={() => {
                              // Limpiar formulario y mostrar
                              form.setValue("tempDemandado", {
                                name: "",
                                documentType: "",
                                documentNumber: "",
                                electronicAddress: "",
                                contact: "",
                              });
                              setEditingDemandado(null);
                              setShowDemandadoForm(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Demandado
                          </Button>
                        </div>
                      )}

                      {/* Formulario de Demandado */}
                      {showDemandadoForm && (isEditMode || isCreateMode) && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="text-md font-semibold text-gray-700 mb-4">
                            {editingDemandado
                              ? "Editar Demandado"
                              : "Nuevo Demandado"}
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="tempDemandado.name"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Nombre completo
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Razón social de la empresa"
                                      className="border-gray-300"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandado.documentType"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Tipo de Documento
                                  </FormLabel>
                                  <Select
                                    value={field.value}
                                    onValueChange={field.onChange}
                                  >
                                    <FormControl>
                                      <SelectTrigger className="border-gray-300">
                                        <SelectValue placeholder="Seleccionar opción" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {documentTypes.map((type) => (
                                        <SelectItem
                                          key={type.value}
                                          value={type.value}
                                        >
                                          {type.label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandado.documentNumber"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Documento *
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Número de identificación (requerido)"
                                      className="border-gray-300"
                                      {...field}
                                      onChange={(e) => {
                                        const documentType = form.getValues(
                                          "tempDemandado.documentType",
                                        );
                                        let value = e.target.value;

                                        // Validar según el tipo de documento
                                        if (documentType === "Pasaporte") {
                                          // Permitir letras y números para pasaporte
                                          value = value.replace(
                                            /[^A-Za-z0-9]/g,
                                            "",
                                          );
                                        } else {
                                          // Solo números para otros tipos
                                          value = value.replace(/[^0-9]/g, "");
                                        }

                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandado.electronicAddress"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Dirección Electrónica
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="correo@empresa.com"
                                      className="border-gray-300"
                                      {...field}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="tempDemandado.contact"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel className="text-gray-700 font-medium">
                                    Contacto
                                  </FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder="Número de teléfono"
                                      className="border-gray-300"
                                      {...field}
                                      onChange={(e) => {
                                        // Solo permitir números
                                        const value = e.target.value.replace(
                                          /[^0-9]/g,
                                          "",
                                        );
                                        field.onChange(value);
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowDemandadoForm(false)}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              className="elena-button-primary"
                              onClick={async () => {
                                try {
                                  const isCreationMode =
                                    !caseId ||
                                    caseId === "" ||
                                    caseId === "new";
                                  const demandado =
                                    form.getValues("tempDemandado");

                                  if (!demandado?.name?.trim()) {
                                    toast.error(
                                      "El nombre del demandado es requerido",
                                    );
                                    return;
                                  }

                                  if (!demandado?.documentType?.trim()) {
                                    toast.error(
                                      "El tipo de documento es requerido",
                                    );
                                    return;
                                  }

                                  if (!demandado?.documentNumber?.trim()) {
                                    toast.error(
                                      "El número de documento es requerido",
                                    );
                                    return;
                                  }
                                  const nuevoDemandado = {
                                    name: demandado.name,
                                    documentType:
                                      demandado.documentType?.trim() || "CC",
                                    documentNumber:
                                      demandado.documentNumber || "",
                                    electronicAddress:
                                      demandado.electronicAddress || "",
                                    contact: demandado.contact || "",
                                  };
                                  // En modo creación, manejar creación y edición local
                                  if (isCreationMode) {
                                    // Datos del demandado

                                    if (
                                      editingDemandado &&
                                      editingDemandado._id?.startsWith("temp_")
                                    ) {
                                      // Actualizar en el array de demandados del formulario
                                      const demandadosActuales =
                                        form.getValues("demandadoPart") || [];
                                      const demandadosArray = Array.isArray(
                                        demandadosActuales,
                                      )
                                        ? demandadosActuales
                                        : [];
                                      const updatedArray = demandadosArray.map(
                                        (d: any) => {
                                          // Buscar por name y documentNumber ya que son únicos
                                          if (
                                            d.name === editingDemandado.name &&
                                            getDocumentNumber(d) ===
                                              getDocumentNumber(
                                                editingDemandado,
                                              )
                                          ) {
                                            return nuevoDemandado;
                                          }
                                          return d;
                                        },
                                      );
                                      form.setValue(
                                        "demandadoPart",
                                        updatedArray,
                                      );

                                      // Actualizar en el estado local para mostrar visualmente
                                      setDemandadas((prev) =>
                                        prev.map((item) => {
                                          if (
                                            item._id === editingDemandado._id
                                          ) {
                                            return {
                                              ...item,
                                              name: nuevoDemandado.name,
                                              documentType:
                                                nuevoDemandado.documentType,
                                              documentNumber:
                                                nuevoDemandado.documentNumber,
                                              electronicAddress:
                                                nuevoDemandado.electronicAddress,
                                              contact: nuevoDemandado.contact,
                                            };
                                          }
                                          return item;
                                        }),
                                      );

                                      toast.success(
                                        "Demandado actualizado en el formulario",
                                      );
                                    } else {
                                      // Agregar al array de demandados en el formulario
                                      const demandadosActuales =
                                        form.getValues("demandadoPart");
                                      const demandadosArray = Array.isArray(
                                        demandadosActuales,
                                      )
                                        ? demandadosActuales
                                        : [];
                                      const nuevosDemandados = [
                                        ...demandadosArray,
                                        nuevoDemandado,
                                      ];
                                      form.setValue(
                                        "demandadoPart",
                                        nuevosDemandados,
                                      );

                                      // Agregar al estado local para mostrar visualmente
                                      const nuevoItem: UnifiedPart = {
                                        _id: `temp_${Date.now()}`,
                                        name: nuevoDemandado.name,
                                        documentType:
                                          nuevoDemandado.documentType,
                                        documentNumber:
                                          nuevoDemandado.documentNumber,
                                        electronicAddress:
                                          nuevoDemandado.electronicAddress,
                                        contact: nuevoDemandado.contact,
                                        partType: "demandada",
                                      };
                                      setDemandadas((prev) => [
                                        ...prev,
                                        nuevoItem,
                                      ]);

                                      toast.success(
                                        "Demandado agregado al formulario",
                                      );
                                    }

                                    // Limpiar el formulario temporal
                                    form.setValue("tempDemandado", {
                                      name: "",
                                      documentType: "",
                                      documentNumber: "",
                                      electronicAddress: "",
                                      contact: "",
                                    });

                                    setShowDemandadoForm(false);
                                    setEditingDemandado(null);
                                    return;
                                  }

                                  // En modo edición, usar la API normalmente
                                  const partToSave: any = {
                                    record: caseId || "",
                                    partType: "demandada",
                                    name: demandado.name,
                                    documentType:
                                      demandado.documentType?.trim() || "CC",
                                    document: demandado.documentNumber || "",
                                    email: demandado.electronicAddress || "",
                                    contact: demandado.contact || "",
                                  };

                                  if (
                                    editingDemandado &&
                                    editingDemandado._id
                                  ) {
                                    // Actualizar en el array de demandados del formulario
                                    const demandadosActuales =
                                      form.getValues("demandadoPart") || [];
                                    const demandadosArray = Array.isArray(
                                      demandadosActuales,
                                    )
                                      ? demandadosActuales
                                      : [];
                                    const updatedArray = demandadosArray.map(
                                      (d: any) => {
                                        // Buscar por name y documentNumber ya que son únicos
                                        if (
                                          d.name === editingDemandado.name &&
                                          getDocumentNumber(d) ===
                                            getDocumentNumber(editingDemandado)
                                        ) {
                                          return nuevoDemandado;
                                        }
                                        return d;
                                      },
                                    );
                                    form.setValue(
                                      "demandadoPart",
                                      updatedArray,
                                    );
                                    // Actualizar existente
                                    await updateProceduralPart(
                                      editingDemandado._id,
                                      partToSave,
                                    );
                                    toast.success(
                                      "Demandado actualizado exitosamente",
                                    );
                                  } else {
                                    // Crear nuevo
                                    const res =
                                      await createProceduralPart(partToSave);
                                    if ("proceduralPart" in res) {
                                      toast.success(
                                        "Demandado creado exitosamente",
                                      );
                                    } else {
                                      const msg = Array.isArray(
                                        (res as any).message,
                                      )
                                        ? (res as any).message.join(", ")
                                        : (res as any).message;
                                      toast.error(
                                        msg || "Error al crear demandado",
                                      );
                                      return;
                                    }
                                  }

                                  setShowDemandadoForm(false);
                                  setEditingDemandado(null);
                                  if (caseId) await getCasoById(caseId);
                                } catch (err: any) {
                                  console.error("Error saving demandado:", err);
                                  toast.error(
                                    err?.message ||
                                      "Error al guardar demandado",
                                  );
                                }
                              }}
                            >
                              {editingDemandado ? "Guardar" : "Crear"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Intervinientes */}
                <Card className="elena-card">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Intervinientes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Lista de Intervinientes */}
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Lista de intervinientes existentes */}
                      {((caseId && (caso?.interveners?.length || 0) > 0) ||
                        (!caseId && intervinientesLocales.length > 0)) && (
                        <div className="space-y-3">
                          <div className="grid gap-3">
                            {(caseId
                              ? caso?.interveners
                              : intervinientesLocales
                            )?.map((interviniente, idx) => (
                              <div
                                key={interviniente._id || idx}
                                className="flex items-center justify-between p-4 rounded-md bg-green-50 border border-green-200"
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                      {interviniente.intervenerType ||
                                        "Interviniente"}
                                    </span>
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span
                                      className="font-medium truncate block"
                                      title={interviniente.name}
                                    >
                                      {interviniente.name}
                                    </span>
                                    <div className="text-gray-500 text-xs mt-1">
                                      <span
                                        className="truncate inline-block max-w-[100px]"
                                        title={interviniente.documentType}
                                      >
                                        ({interviniente.documentType})
                                      </span>
                                      <span
                                        className="ml-2 truncate inline-block max-w-[120px]"
                                        title={interviniente.document}
                                      >
                                        {interviniente.document}
                                      </span>
                                    </div>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {interviniente.email && (
                                      <div
                                        className="truncate"
                                        title={`Email: ${interviniente.email}`}
                                      >
                                        Email: {interviniente.email}
                                      </div>
                                    )}
                                    {interviniente.contact && (
                                      <div
                                        className="truncate"
                                        title={`Tel: ${interviniente.contact}`}
                                      >
                                        Tel: {interviniente.contact}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {(isEditMode || isCreateMode) && (
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        // Cargar datos en el formulario temporal para editar
                                        form.setValue("tempInterviniente", {
                                          name: interviniente.name,
                                          documentType:
                                            interviniente.documentType,
                                          documentNumber:
                                            interviniente.document,
                                          interventionType:
                                            interviniente.intervenerType,
                                          electronicAddress:
                                            interviniente.email,
                                          contact: interviniente.contact,
                                        });
                                        setEditingInterviniente(interviniente);
                                        setShowIntervinienteForm(true);
                                      }}
                                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={async () => {
                                        const isCreationMode =
                                          !caseId ||
                                          caseId === "" ||
                                          caseId === "new";

                                        if (
                                          window.confirm(
                                            "¿Estás seguro de eliminar este interviniente?",
                                          )
                                        ) {
                                          if (isCreationMode) {
                                            setIntervinientesLocales(
                                              (prev: any[]) =>
                                                prev.filter(
                                                  (i: any) =>
                                                    i._id !== interviniente._id,
                                                ),
                                            );
                                            // También eliminar de los datos del formulario
                                            const intervinientesForm =
                                              form.getValues(
                                                "intervinientes",
                                              ) || [];
                                            const updatedIntervinientes =
                                              intervinientesForm.filter(
                                                (i: any) =>
                                                  i.name !==
                                                    interviniente.name ||
                                                  i.document !==
                                                    interviniente.document,
                                              );
                                            form.setValue(
                                              "intervinientes",
                                              updatedIntervinientes,
                                            );
                                            toast.success(
                                              "Interviniente eliminado del formulario",
                                            );
                                          } else if (
                                            interviniente._id &&
                                            !interviniente._id.startsWith(
                                              "temp_",
                                            )
                                          ) {
                                            // En modo edición y con ID real, usar API
                                            try {
                                              await deleteIntervener(
                                                interviniente._id,
                                              );
                                              toast.success(
                                                "Interviniente eliminado exitosamente",
                                              );
                                              if (caseId)
                                                await getCasoById(caseId);
                                            } catch (err: any) {
                                              console.error(
                                                "Error deleting interviniente:",
                                                err,
                                              );
                                              toast.error(
                                                err?.message ||
                                                  "Error al eliminar interviniente",
                                              );
                                            }
                                          } else {
                                            // Caso edge: ID temporal en modo edición
                                            setIntervinientesLocales(
                                              (prev: any[]) =>
                                                prev.filter(
                                                  (i: any) =>
                                                    i._id !== interviniente._id,
                                                ),
                                            );
                                            toast.success(
                                              "Interviniente eliminado del formulario",
                                            );
                                          }
                                        }
                                      }}
                                      className="text-red-600 border-red-300 hover:bg-red-50"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Botón Agregar Interviniente */}
                      {(isEditMode || isCreateMode) && (
                        <div className="flex justify-start">
                          <Button
                            type="button"
                            variant="outline"
                            className="elena-button-secondary"
                            onClick={() => {
                              // Limpiar formulario temporal y mostrar
                              form.setValue("tempInterviniente", {
                                name: "",
                                documentType: "",
                                documentNumber: "",
                                interventionType: "",
                                contact: "",
                                electronicAddress: "",
                              });
                              setEditingInterviniente(null);
                              setShowIntervinienteForm(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Interviniente
                          </Button>
                        </div>
                      )}

                      {/* Formulario de Interviniente */}
                      {showIntervinienteForm &&
                        (isEditMode || isCreateMode) && (
                          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                            <h4 className="text-md font-semibold text-gray-700 mb-4">
                              {editingInterviniente
                                ? "Editar Interviniente"
                                : "Nuevo Interviniente"}
                            </h4>
                            {/* Formulario simple sin mapeo */}
                            <div className="space-y-2 sm:space-y-3 md:space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.name"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Nombre completo
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Nombre completo del representante legal"
                                          className="border-gray-300"
                                          {...field}
                                          disabled={isViewMode}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.documentType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Tipo de Documento
                                      </FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isViewMode}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="border-gray-300">
                                            <SelectValue placeholder="Seleccionar opción" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {documentTypes.map((type) => (
                                            <SelectItem
                                              key={type.value}
                                              value={type.value}
                                            >
                                              {type.label}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.documentNumber"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Documento *
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Número de documento del interviniente (requerido)"
                                          className="border-gray-300"
                                          {...field}
                                          disabled={isViewMode}
                                          onChange={(e) => {
                                            const documentType = form.getValues(
                                              "tempInterviniente.documentType",
                                            );
                                            let value = e.target.value;

                                            // Validar según el tipo de documento
                                            if (documentType === "Pasaporte") {
                                              // Permitir letras y números para pasaporte
                                              value = value.replace(
                                                /[^A-Za-z0-9]/g,
                                                "",
                                              );
                                            } else {
                                              // Solo números para otros tipos
                                              value = value.replace(
                                                /[^0-9]/g,
                                                "",
                                              );
                                            }

                                            field.onChange(value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.interventionType"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Tipo de Intervención
                                      </FormLabel>
                                      <Select
                                        onValueChange={field.onChange}
                                        defaultValue={field.value}
                                        disabled={isViewMode}
                                      >
                                        <FormControl>
                                          <SelectTrigger className="border-gray-300">
                                            <SelectValue placeholder="Apoderado" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {interventionTypes.map((type) => (
                                            <SelectItem key={type} value={type}>
                                              {type}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.contact"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Contacto
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="Número de teléfono del interviniente"
                                          className="border-gray-300"
                                          {...field}
                                          disabled={isViewMode}
                                          onChange={(e) => {
                                            // Solo permitir números
                                            const value =
                                              e.target.value.replace(
                                                /[^0-9]/g,
                                                "",
                                              );
                                            field.onChange(value);
                                          }}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <FormField
                                  control={form.control}
                                  name="tempInterviniente.electronicAddress"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel className="text-gray-700 font-medium">
                                        Correo Electrónico
                                      </FormLabel>
                                      <FormControl>
                                        <Input
                                          placeholder="ejemplo@correo.com"
                                          className="border-gray-300"
                                          {...field}
                                          disabled={isViewMode}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            </div>

                            <div className="flex justify-end gap-2 mt-4">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setShowIntervinienteForm(false)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="button"
                                className="elena-button-primary"
                                onClick={async () => {
                                  try {
                                    const isCreationMode =
                                      !caseId ||
                                      caseId === "" ||
                                      caseId === "new";
                                    const interviniente =
                                      form.getValues("tempInterviniente");

                                    if (!interviniente?.name?.trim()) {
                                      toast.error(
                                        "El nombre del interviniente es requerido",
                                      );
                                      return;
                                    }

                                    if (!interviniente?.documentType?.trim()) {
                                      toast.error(
                                        "El tipo de documento es requerido",
                                      );
                                      return;
                                    }

                                    if (
                                      !interviniente?.documentNumber?.trim()
                                    ) {
                                      toast.error(
                                        "El número de documento es requerido",
                                      );
                                      return;
                                    }

                                    if (
                                      !interviniente?.interventionType?.trim()
                                    ) {
                                      toast.error(
                                        "El tipo de intervención es requerido",
                                      );
                                      return;
                                    }

                                    // En modo creación, manejar creación y edición local
                                    if (isCreationMode) {
                                      // Datos del interviniente
                                      const nuevoInterviniente = {
                                        name: interviniente.name,
                                        documentType:
                                          interviniente.documentType?.trim() ||
                                          "CC",
                                        documentNumber:
                                          interviniente.documentNumber || "",
                                        interventionType:
                                          interviniente.interventionType,
                                        contact: interviniente.contact || "",
                                        electronicAddress:
                                          interviniente.electronicAddress || "",
                                      };

                                      if (
                                        editingInterviniente &&
                                        editingInterviniente._id?.startsWith(
                                          "temp_",
                                        )
                                      ) {
                                        // Actualizar en el array de intervinientes del formulario
                                        const intervinientesActuales =
                                          form.getValues("intervinientes") ||
                                          [];
                                        const intervinientesArray =
                                          Array.isArray(intervinientesActuales)
                                            ? intervinientesActuales
                                            : [];
                                        const updatedArray =
                                          intervinientesArray.map((i: any) => {
                                            // Buscar por name y document ya que son únicos
                                            if (
                                              i.name ===
                                                editingInterviniente.name &&
                                              i.document ===
                                                editingInterviniente.document
                                            ) {
                                              return nuevoInterviniente;
                                            }
                                            return i;
                                          });
                                        form.setValue(
                                          "intervinientes",
                                          updatedArray,
                                        );

                                        // Actualizar en el estado local para mostrar visualmente
                                        setIntervinientesLocales((prev) =>
                                          prev.map((item: any) => {
                                            if (
                                              item._id ===
                                              editingInterviniente._id
                                            ) {
                                              return {
                                                ...item,
                                                name: nuevoInterviniente.name,
                                                documentType:
                                                  nuevoInterviniente.documentType,
                                                document:
                                                  nuevoInterviniente.documentNumber,
                                                email:
                                                  nuevoInterviniente.electronicAddress,
                                                contact:
                                                  nuevoInterviniente.contact,
                                                intervenerType:
                                                  nuevoInterviniente.interventionType,
                                              };
                                            }
                                            return item;
                                          }),
                                        );

                                        toast.success(
                                          "Interviniente actualizado en el formulario",
                                        );
                                      } else {
                                        // Agregar al array de intervinientes en el formulario
                                        const intervinientesActuales =
                                          form.getValues("intervinientes");
                                        const intervinientesArray =
                                          Array.isArray(intervinientesActuales)
                                            ? intervinientesActuales
                                            : [];
                                        const nuevosIntervinientes = [
                                          ...intervinientesArray,
                                          nuevoInterviniente,
                                        ];
                                        form.setValue(
                                          "intervinientes",
                                          nuevosIntervinientes,
                                        );

                                        // Agregar al estado local para mostrar visualmente
                                        const nuevoItem = {
                                          _id: `temp_${Date.now()}`,
                                          name: nuevoInterviniente.name,
                                          documentType:
                                            nuevoInterviniente.documentType,
                                          document:
                                            nuevoInterviniente.documentNumber,
                                          email:
                                            nuevoInterviniente.electronicAddress,
                                          contact: nuevoInterviniente.contact,
                                          intervenerType:
                                            nuevoInterviniente.interventionType,
                                        };
                                        setIntervinientesLocales((prev) => [
                                          ...prev,
                                          nuevoItem,
                                        ]);

                                        toast.success(
                                          "Interviniente agregado al formulario",
                                        );
                                      }

                                      // Limpiar el formulario temporal
                                      form.setValue("tempInterviniente", {
                                        name: "",
                                        documentType: "",
                                        documentNumber: "",
                                        interventionType: "",
                                        contact: "",
                                        electronicAddress: "",
                                      });

                                      setShowIntervinienteForm(false);
                                      setEditingInterviniente(null);
                                      return;
                                    }

                                    // En modo edición
                                    if (editingInterviniente) {
                                      // Actualizando interviniente existente
                                      const intervinientesActuales =
                                        form.getValues("intervinientes") || [];
                                      const intervinientesArray = Array.isArray(
                                        intervinientesActuales,
                                      )
                                        ? intervinientesActuales
                                        : [];

                                      // Encontrar el índice del interviniente que se está editando
                                      // Buscar por múltiples criterios para mayor compatibilidad
                                      const editIndex =
                                        intervinientesArray.findIndex(
                                          (iv: any) => {
                                            // Criterio 1: _id exacto
                                            if (
                                              iv._id &&
                                              editingInterviniente._id &&
                                              iv._id ===
                                                editingInterviniente._id
                                            ) {
                                              return true;
                                            }
                                            // Criterio 2: tempId (para intervinientes locales)
                                            if (
                                              iv.tempId &&
                                              (editingInterviniente as any)
                                                .tempId &&
                                              iv.tempId ===
                                                (editingInterviniente as any)
                                                  .tempId
                                            ) {
                                              return true;
                                            }
                                            // Criterio 3: combinación de nombre y documento como fallback
                                            if (
                                              iv.name ===
                                                editingInterviniente.name &&
                                              (iv.documentNumber ||
                                                iv.document) ===
                                                editingInterviniente.document
                                            ) {
                                              return true;
                                            }
                                            return false;
                                          },
                                        );

                                      // Crear el objeto actualizado
                                      const intervinienteActualizado = {
                                        _id: editingInterviniente._id,
                                        name: interviniente.name,
                                        documentType:
                                          interviniente.documentType,
                                        documentNumber:
                                          interviniente.documentNumber,
                                        interventionType:
                                          interviniente.interventionType,
                                        contact: interviniente.contact || "",
                                        electronicAddress:
                                          interviniente.electronicAddress || "",
                                      };

                                      if (editIndex >= 0) {
                                        // Actualizar el interviniente existente
                                        const nuevosIntervinientes = [
                                          ...intervinientesArray,
                                        ];
                                        nuevosIntervinientes[editIndex] =
                                          intervinienteActualizado;
                                        form.setValue(
                                          "intervinientes",
                                          nuevosIntervinientes,
                                        );
                                      } else {
                                        // Si no se encuentra, agregarlo (caso edge)
                                        const nuevosIntervinientes = [
                                          ...intervinientesArray,
                                          intervinienteActualizado,
                                        ];
                                        form.setValue(
                                          "intervinientes",
                                          nuevosIntervinientes,
                                        );
                                      }
                                    } else {
                                      const nuevoInterviniente = {
                                        name: interviniente.name,
                                        documentType:
                                          interviniente.documentType?.trim() ||
                                          "CC",
                                        documentNumber:
                                          interviniente.documentNumber || "",
                                        interventionType:
                                          interviniente.interventionType,
                                        contact: interviniente.contact || "",
                                        electronicAddress:
                                          interviniente.electronicAddress || "",
                                      };

                                      // Agregar al array de intervinientes en el formulario
                                      const intervinientesActuales =
                                        form.getValues("intervinientes");
                                      const intervinientesArray = Array.isArray(
                                        intervinientesActuales,
                                      )
                                        ? intervinientesActuales
                                        : [];
                                      const nuevosIntervinientes = [
                                        ...intervinientesArray,
                                        nuevoInterviniente,
                                      ];
                                      form.setValue(
                                        "intervinientes",
                                        nuevosIntervinientes,
                                      );
                                    }

                                    // Ahora guardar usando la función normal
                                    await saveIntervinientes();
                                    setShowIntervinienteForm(false);
                                    setEditingInterviniente(null);
                                  } catch (err: any) {
                                    console.error(
                                      "Error saving intervinientes:",
                                      err,
                                    );
                                    toast.error(
                                      err?.message ||
                                        "Error al guardar intervinientes",
                                    );
                                  }
                                }}
                              >
                                Guardar
                              </Button>
                            </div>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>

                {/* Documentación del proceso */}
                <Card className="elena-card">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Documentación del proceso
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Tabla de documentos */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      {/* Header de la tabla */}
                      <div className="bg-gray-50 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 border-b border-gray-200">
                        <div>
                          <span className="inline-block rounded-full bg-pink-50 text-pink-600 px-3 py-1 text-xs font-medium">
                            Consecutivo
                          </span>
                        </div>
                        <div>
                          <span className="inline-block rounded-full bg-pink-50 text-pink-600 px-3 py-1 text-xs font-medium">
                            Responsable
                          </span>
                        </div>
                        <div>
                          <span className="inline-block rounded-full bg-pink-50 text-pink-600 px-3 py-1 text-xs font-medium">
                            Fecha radicación
                          </span>
                        </div>
                        <div>
                          <span className="inline-block rounded-full bg-pink-50 text-pink-600 px-3 py-1 text-xs font-medium">
                            Acciones
                          </span>
                        </div>
                      </div>

                      {/* Filas de borradores (opacos, incompletos) */}
                      {draftDocuments.map((doc, index) => (
                        <div
                          key={`draft-${doc.id}-${index}`}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 border-b border-gray-100 items-center bg-gray-100 opacity-60"
                        >
                          <div className="text-pink-600 font-medium text-sm">
                            <span
                              className="truncate block"
                              title={`${doc.document} (${doc.category})`}
                            >
                              {doc.document} ({doc.category})
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            <span
                              className="truncate block"
                              title={
                                (doc as any).responsibleType ||
                                doc.responsible ||
                                "—"
                              }
                            >
                              {(doc as any).responsibleType ||
                                doc.responsible ||
                                "—"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            {formatToDisplay(doc.settledDate) || "—"}
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className="text-xs">
                              Borrador
                            </Badge>
                          </div>
                        </div>
                      ))}

                      {/* Filas de documentos de la API */}
                      {documents.map((doc, index) => (
                        <div
                          key={`api-${doc._id || doc.consecutive}-${index}`}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 items-center"
                        >
                          <div className="text-pink-600 font-medium text-sm">
                            <span
                              className="truncate block"
                              title={doc.consecutive || "—"}
                            >
                              {doc.consecutive || "—"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            <span
                              className="truncate block"
                              title={doc.responsibleType || "—"}
                            >
                              {doc.responsibleType || "—"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            {formatToDisplay(doc.settledDate) || "—"}
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-gray-600 hover:text-gray-900 p-1 h-auto"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                downloadDocument(doc);
                              }}
                              title="Descargar documento"
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            {!isViewMode && (
                              <>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-blue-600 hover:text-blue-700 p-1 h-auto"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    editDocument(doc);
                                  }}
                                  title="Editar documento"
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 p-1 h-auto"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    removeDocument(index);
                                  }}
                                  title="Eliminar documento"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}

                      {/* Filas de documentos locales (antes de guardar el caso) */}
                      {localDocuments.map((doc, index) => (
                        <div
                          key={`local-${doc.consecutive}-${index}`}
                          className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 p-3 border-b border-gray-100 hover:bg-gray-50 items-center bg-yellow-50"
                        >
                          <div className="text-pink-600 font-medium text-sm">
                            <span
                              className="truncate block"
                              title={doc.consecutive || "—"}
                            >
                              {doc.consecutive || "—"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            <span
                              className="truncate block"
                              title={doc.responsibleType || "—"}
                            >
                              {doc.responsibleType || "—"}
                            </span>
                          </div>
                          <div className="text-gray-600 text-sm">
                            {formatToDisplay(doc.settledDate) || "—"}
                          </div>
                          <div className="flex items-center gap-2 justify-end">
                            <Badge variant="outline" className="text-xs">
                              Pendiente de guardar
                            </Badge>
                            {!isViewMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 p-1 h-auto"
                                onClick={() =>
                                  removeDocument(documents.length + index)
                                }
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Botón Agregar documento */}
                    <div className="flex justify-start">
                      {!isViewMode && (
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            // toggle inline form visibility
                            setShowDocumentForm((v) => !v);
                            // reset the small document fields when opening
                            setDocumentForm({
                              categoria: "",
                              documentType: "",
                              subdocumento: "",
                              fechaRadicacion: "",
                              consecutivo: "",
                              tipoResponsable: "",
                              responsable: "",
                              observaciones: "",
                            });
                            // Limpiar estado de edición para asegurar que es un documento nuevo
                            setEditingDocument(null);
                          }}
                          className="elena-button-secondary"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Agregar Documento
                        </Button>
                      )}
                    </div>

                    {/* Formulario de agregar documentos - inline toggled (solo en create/edit) */}
                    {!isViewMode && showDocumentForm && (
                      <div className="border border-gray-200 rounded-lg p-6 bg-gray-50 space-y-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">
                          {editingDocument
                            ? "Editar Documento"
                            : "Nuevo Documento"}
                        </h3>

                        {/* Layout responsive mejorado: 
              - sm: 1 columna (stack)
              - md: 2 columnas (dos filas como solicitaste)
              - lg: 4 columnas (una fila completa)
               Se elimina la configuración de 5 columnas para distribuir mejor los 4 campos. */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Tipo de Documento
                            </Label>
                            <Select
                              value={documentForm.documentType || ""}
                              onValueChange={(value) =>
                                setDocumentForm({
                                  ...documentForm,
                                  documentType: value,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Selecciona tipo de documento" />
                              </SelectTrigger>
                              <SelectContent>
                                {documentoOptions.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Select de categoría */}
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Categoría
                            </Label>
                            <Select
                              value={documentForm.categoria || ""}
                              onValueChange={(value) =>
                                setDocumentForm({
                                  ...documentForm,
                                  categoria: value,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Selecciona categoría" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Documento del proceso">
                                  Documento del proceso
                                </SelectItem>
                                <SelectItem value="Documento contraparte">
                                  Documento contraparte
                                </SelectItem>
                                <SelectItem value="Documento general">
                                  Documento general
                                </SelectItem>
                                <SelectItem value="Documento juzgado">
                                  Documento juzgado
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* El valor de 'document' se toma del select 'Tipo de documento'. */}

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Subdocumento
                            </Label>
                            <Select
                              value={documentForm.subdocumento || ""}
                              onValueChange={(value) =>
                                setDocumentForm({
                                  ...documentForm,
                                  subdocumento: value,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="Selecciona subdocumento" />
                              </SelectTrigger>
                              <SelectContent>
                                {subdocumentoOptions.map((doc) => (
                                  <SelectItem key={doc} value={doc}>
                                    {doc}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Fecha radicación
                            </Label>
                            {/* Se asegura ancho suficiente para que la fecha completa no se corte */}
                            <div
                              className="relative x w-full"
                              style={{ minWidth: "120px" }}
                            >
                              <DatePicker
                                selected={documentForm.fechaRadicacion || ""}
                                onSelect={(date) =>
                                  setDocumentForm({
                                    ...documentForm,
                                    fechaRadicacion: date || "",
                                  })
                                }
                                placeholder="Seleccionar fecha"
                              />
                            </div>
                          </div>
                        </div>

                        {/* <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center">
                            <Button
                              className="elena-button-primary"
                              type="button"
                              disabled
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Generar Consecutivo (backend)
                            </Button>
                            <div className="ml-4 flex items-center">
                              <Input
                                placeholder="Se genera automáticamente"
                                className="border-gray-300 text-center"
                                value={documentForm.consecutivo || ""}
                                readOnly
                                disabled
                              />
                              <Copy className="w-4 h-4 ml-2 text-gray-300" />
                            </div>
                          </div>
                          <p className="text-xs text-gray-500">
                            El consecutivo se asigna automáticamente en el
                            backend al guardar el caso o el documento.
                          </p>
                        </div> */}

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Tipo de Responsable
                            </Label>
                            <Select
                              value={documentForm.tipoResponsable}
                              onValueChange={(value) =>
                                setDocumentForm({
                                  ...documentForm,
                                  tipoResponsable: value,
                                })
                              }
                            >
                              <SelectTrigger className="border-gray-300">
                                <SelectValue placeholder="" />
                              </SelectTrigger>
                              <SelectContent>
                                {responsibleTypes.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {type}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-700 font-medium">
                              Responsable
                            </Label>
                            <Input
                              placeholder="Responsable"
                              className="border-gray-300"
                              value={documentForm.responsable}
                              onChange={(e) =>
                                setDocumentForm({
                                  ...documentForm,
                                  responsable: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <div className="space-y-1 sm:space-y-2">
                          <Label className="text-gray-700 font-medium">
                            Observaciones
                          </Label>
                          <Textarea
                            placeholder="Observaciones"
                            value={documentForm.observaciones}
                            onChange={(e) =>
                              setDocumentForm({
                                ...documentForm,
                                observaciones: e.target.value,
                              })
                            }
                            disabled={isViewMode}
                          />
                        </div>

                        {/* File Upload Area */}
                        <div
                          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                            isDragOver
                              ? "border-pink-500 bg-pink-100"
                              : "border-pink-300 bg-pink-50 hover:bg-pink-100"
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() =>
                            document.getElementById("file-upload")?.click()
                          }
                        >
                          <Upload className="w-12 h-12 mx-auto text-pink-400 mb-4" />
                          <p className="text-gray-700 mb-2">
                            Sube tus documentos o{" "}
                            <span className="text-pink-600 underline cursor-pointer font-medium">
                              búscalos
                            </span>
                          </p>
                          <p className="text-sm text-gray-500">
                            Max 10 MB por archivo
                          </p>
                          <p className="text-sm text-gray-500">
                            Soporta archivos: pdf, JPG, PNG, xlsx, doc, and zip
                            files
                          </p>
                          <p className="text-sm text-gray-500">
                            Max file size: 100 MB
                          </p>
                          <input
                            type="file"
                            multiple
                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx,.zip"
                            className="hidden"
                            id="file-upload"
                            onChange={(e) => handleFileUpload(e.target.files)}
                          />
                        </div>

                        {/* Lista de archivos subidos con progreso */}
                        {uploadedFiles.length > 0 && (
                          <div className="space-y-4 my-6">
                            {uploadedFiles.map((file) => (
                              <div
                                key={file.id}
                                className="bg-white border border-gray-200 rounded-lg p-4"
                              >
                                <div className="flex justify-between items-center mb-2">
                                  <span className="text-gray-700">
                                    {file.name}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-gray-500 hover:text-red-600"
                                    onClick={() => removeUploadedFile(file.id)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="text-xs text-gray-500 mb-2">
                                  {file.size}
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div
                                    className="bg-pink-600 h-1.5 rounded-full transition-all duration-300"
                                    style={{ width: `${file.progress}%` }}
                                  ></div>
                                </div>
                                <div className="text-right text-xs text-gray-500 mt-1">
                                  {file.progress}%
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Botones de acción */}
                        <div className="flex justify-center gap-4 pt-4">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowDocumentForm(false);
                              setEditingDocument(null);
                              setDocumentForm({
                                categoria: "",
                                documentType: "",
                                subdocumento: "",
                                fechaRadicacion: "",
                                consecutivo: "",
                                tipoResponsable: "",
                                responsable: "",
                                observaciones: "",
                              });
                              setUploadedFiles([]);
                            }}
                          >
                            Cancelar
                          </Button>
                          {!isCreateMode && (
                            <Button
                              type="button"
                              className="elena-button-primary"
                              disabled={documentSaving}
                              onClick={async () => {
                                setDocumentSaving(true);
                                try {
                                  await saveDocument();
                                  setShowDocumentForm(false);
                                  setEditingDocument(null);
                                  setDocumentForm({
                                    categoria: "",
                                    documentType: "",
                                    subdocumento: "",
                                    fechaRadicacion: "",
                                    consecutivo: "",
                                    tipoResponsable: "",
                                    responsable: "",
                                    observaciones: "",
                                  });
                                  setUploadedFiles([]);
                                } catch (err) {
                                  toast.error("Error al guardar documento");
                                } finally {
                                  setDocumentSaving(false);
                                }
                              }}
                            >
                              {documentSaving ? "Guardando..." : "Guardar"}
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Datos de pago */}
                <Card className="elena-card">
                  <CardHeader>
                    <CardTitle className="text-gray-900">
                      Datos de pago
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 sm:space-y-6 md:space-y-8">
                    {/* Sección de prima de éxito - AHORA ESTÁ ARRIBA */}
                    <div className="flex flex-col items-center justify-between">
                      <span className="text-gray-900 font-medium text-lg py-4">
                        ¿Este caso incluye prima de éxito?
                      </span>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-6">
                          <FormField
                            control={form.control}
                            name="includeSuccessPremium"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                  <RadioGroup
                                    value={field.value ? "si" : "no"}
                                    onValueChange={(value) => {
                                      field.onChange(value === "si");
                                      setTimeout(
                                        () => calculateTotalAmount(),
                                        100,
                                      );
                                    }}
                                    className="flex gap-6"
                                  >
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="si"
                                        id="si"
                                        className="w-6 h-6 border-2 border-pink-600 text-pink-600"
                                      />
                                      <Label
                                        htmlFor="si"
                                        className="text-gray-900 font-medium text-lg"
                                      >
                                        SÍ
                                      </Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <RadioGroupItem
                                        value="no"
                                        id="no"
                                        className="w-6 h-6 border-2 border-gray-400 text-gray-400"
                                      />
                                      <Label
                                        htmlFor="no"
                                        className="text-gray-500 text-lg"
                                      >
                                        NO
                                      </Label>
                                    </div>
                                  </RadioGroup>
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </div>
                        <div className="flex items-center gap-2 border border-pink-600 px-4 py-2 rounded-lg text-pink-600">
                          <span className="text-lg"></span>
                          <span className="font-medium">Notas</span>
                        </div>
                      </div>
                    </div>

                    {/* Mostrar campos de prima de éxito solo si está seleccionado "SÍ" */}
                    {form.watch("includeSuccessPremium") && (
                      <div className="space-y-3 sm:space-y-4 md:space-y-6">
                        {/* Porcentaje y precio de prima de éxito */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-900 font-medium text-base">
                              Porcentaje de la prima de éxito
                            </Label>
                            <FormField
                              control={form.control}
                              name="successPremiumPercentage"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="35%"
                                      className="border-gray-300 text-base py-3"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(
                                          Number(
                                            e.target.value.replace("%", ""),
                                          ),
                                        );
                                        setTimeout(
                                          () => calculateTotalAmount(),
                                          100,
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-900 font-medium text-base">
                              Precio de la prima de éxito
                            </Label>
                            <FormField
                              control={form.control}
                              name="successPremiumPrice"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="12.000.000"
                                      className="border-gray-300 text-base py-3"
                                      {...field}
                                      onChange={(e) => {
                                        field.onChange(
                                          Number(
                                            e.target.value.replace(/\./g, ""),
                                          ),
                                        );
                                        setTimeout(
                                          () => calculateTotalAmount(),
                                          100,
                                        );
                                      }}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Fechas de prima de éxito */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-8">
                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-600 text-sm">
                              Fecha de causación
                            </Label>
                            <FormField
                              control={form.control}
                              name="successPremiumCausationDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <DatePicker
                                      selected={field.value || ""}
                                      onSelect={(date) =>
                                        field.onChange(date || "")
                                      }
                                      placeholder="Seleccionar fecha"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <div className="space-y-1 sm:space-y-2">
                            <Label className="text-gray-600 text-sm">
                              Fecha de pago
                            </Label>
                            <FormField
                              control={form.control}
                              name="successPremiumPaymentDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <DatePicker
                                      selected={field.value || ""}
                                      onSelect={(date) =>
                                        field.onChange(date || "")
                                      }
                                      placeholder="Seleccionar fecha"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Lista de Pagos - AHORA ESTÁ EN EL MEDIO */}
                    <div className="space-y-2 sm:space-y-3 md:space-y-4">
                      {/* Lista de pagos locales en modo creación */}
                      {isCreateMode && pagosLocales.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Pagos en el Formulario
                          </h4>
                          <div className="grid gap-3">
                            {pagosLocales.map((pago, idx) => (
                              <div
                                key={pago._id || idx}
                                className="flex items-center justify-between p-4 rounded-md bg-blue-50 border border-blue-200"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      Pago {idx + 1}
                                    </span>
                                    {/* <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                                      En caché local
                                    </span> */}
                                  </div>
                                  <div className="text-sm text-gray-700">
                                    <span className="font-medium">
                                      Valor: $
                                      {pago.value?.toLocaleString() || "N/A"}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {pago.causationDate && (
                                      <span>
                                        Fecha causación:{" "}
                                        {formatToDisplay(pago.causationDate)}
                                      </span>
                                    )}
                                    {pago.paymentDate && (
                                      <span className="ml-3">
                                        Fecha pago:{" "}
                                        {formatToDisplay(pago.paymentDate)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      // Remover del estado local
                                      setPagosLocales((prev) =>
                                        prev.filter((_, i) => i !== idx),
                                      );
                                      // Remover del array del formulario
                                      const pagosActuales =
                                        form.getValues("payments") || [];
                                      const nuevosPagos = pagosActuales.filter(
                                        (_, i) => i !== idx,
                                      );
                                      form.setValue("payments", nuevosPagos);
                                      // Recalcular total
                                      setTimeout(
                                        () => calculateTotalAmount(),
                                        100,
                                      );
                                    }}
                                    className="text-red-600 border-red-300 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Lista de pagos existentes */}
                      {(caso?.payments?.length || 0) > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-lg font-semibold text-gray-900">
                            Pagos Agregados
                          </h4>
                          <div className="grid gap-3">
                            {caso?.payments
                              ?.filter((pago) => pago.paymentValues.length > 0)
                              .map((pago, idx) => (
                                <div
                                  key={pago._id || idx}
                                  className="flex items-center justify-between p-4 rounded-md bg-yellow-50 border border-yellow-200"
                                >
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                        Pago {idx + 1}
                                      </span>
                                    </div>
                                    <div className="text-sm text-gray-700">
                                      <span className="font-medium">
                                        Valor: $
                                        {pago.paymentValues?.[0]?.value?.toLocaleString() ||
                                          "N/A"}
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {pago.paymentValues?.[0]
                                        ?.causationDate && (
                                        <span>
                                          Fecha causación:{" "}
                                          {formatToDisplay(
                                            pago.paymentValues[0].causationDate,
                                          )}
                                        </span>
                                      )}
                                      {pago.paymentValues?.[0]?.paymentDate && (
                                        <span className="ml-3">
                                          Fecha pago:{" "}
                                          {formatToDisplay(
                                            pago.paymentValues[0].paymentDate,
                                          )}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {isEditMode && (
                                    <div className="flex gap-2">
                                      <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                          if (
                                            pago._id &&
                                            window.confirm(
                                              "¿Estás seguro de eliminar este pago?",
                                            )
                                          ) {
                                            try {
                                              await deletePayment(pago._id);
                                              toast.success(
                                                "Pago eliminado exitosamente",
                                              );
                                              if (caseId)
                                                await getCasoById(caseId);
                                              // Recalcular total después de eliminar
                                              setTimeout(
                                                () => calculateTotalAmount(),
                                                100,
                                              );
                                            } catch (err: any) {
                                              console.error(
                                                "Error deleting pago:",
                                                err,
                                              );
                                              toast.error(
                                                err?.message ||
                                                  "Error al eliminar pago",
                                              );
                                            }
                                          }
                                        }}
                                        className="text-red-600 border-red-300 hover:bg-red-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Botón Agregar Pago */}
                      {(isEditMode || isCreateMode) && (
                        <div className="flex justify-start">
                          <Button
                            type="button"
                            variant="outline"
                            className="elena-button-secondary"
                            onClick={() => {
                              // Limpiar formulario temporal y mostrar
                              form.setValue("tempPago", {
                                value: 0,
                                causationDate: getCurrentDate(),
                                paymentDate: getCurrentDate(),
                              });
                              setShowPagoForm(true);
                            }}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Agregar Pago
                          </Button>
                        </div>
                      )}

                      {/* Formulario de Pago */}
                      {showPagoForm && (isEditMode || isCreateMode) && (
                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                          <h4 className="text-md font-semibold text-gray-700 mb-4">
                            Nuevo Pago
                          </h4>

                          {/* Solo mostrar el último pago agregado */}
                          <div className="space-y-4 mb-6">
                            <div className="flex items-center justify-between mb-4">
                              <h5 className="text-sm font-medium text-gray-600">
                                Nuevo Pago
                              </h5>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  const payments =
                                    form.getValues("payments") || [];
                                  if (payments.length > 0) {
                                    removePayment(payments.length - 1); // Remover el último pago
                                  }
                                  setShowPagoForm(false);
                                }}
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                              <FormField
                                control={form.control}
                                name="tempPago.value"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                      Valor
                                    </FormLabel>
                                    <FormControl>
                                      <Input
                                        placeholder="34.000.000"
                                        className="border-gray-300"
                                        {...field}
                                        onChange={(e) => {
                                          field.onChange(
                                            Number(
                                              e.target.value.replace(/\./g, ""),
                                            ),
                                          );
                                          setTimeout(
                                            () => calculateTotalAmount(),
                                            100,
                                          );
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tempPago.causationDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                      Fecha de causación
                                    </FormLabel>
                                    <FormControl>
                                      <DatePicker
                                        selected={field.value || ""}
                                        onSelect={(date) =>
                                          field.onChange(date || "")
                                        }
                                        placeholder="Seleccionar fecha"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="tempPago.paymentDate"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel className="text-gray-700 font-medium">
                                      Fecha de Pago
                                    </FormLabel>
                                    <FormControl>
                                      <DatePicker
                                        selected={field.value || ""}
                                        onSelect={(date) =>
                                          field.onChange(date || "")
                                        }
                                        placeholder="Seleccionar fecha"
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>

                          <div className="flex justify-end gap-2 mt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                // Solo cerrar el formulario
                                setShowPagoForm(false);
                              }}
                            >
                              Cancelar
                            </Button>
                            <Button
                              type="button"
                              className="elena-button-primary"
                              onClick={async () => {
                                try {
                                  await saveNewPayment();
                                  setShowPagoForm(false);
                                  // Recalcular total después de guardar
                                  setTimeout(() => calculateTotalAmount(), 100);
                                } catch (err: any) {
                                  console.error("Error saving payment:", err);
                                  toast.error(
                                    err?.message || "Error al guardar el pago",
                                  );
                                }
                              }}
                            >
                              Guardar
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Monto Total - AHORA ESTÁ AL FINAL */}
                    <div className="space-y-1 sm:space-y-2">
                      <Label className="text-gray-900 font-medium text-lg">
                        Monto Total
                      </Label>
                      <FormField
                        control={form.control}
                        name="totalAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="$0"
                                className="border-gray-300 bg-yellow-100 text-yellow-700 font-semibold text-lg py-3"
                                value={
                                  field.value
                                    ? `$${field.value.toLocaleString()}`
                                    : "$0"
                                }
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex justify-between">
                  <Button
                    variant="destructive"
                    className="bg-red-600 hover:bg-red-700"
                    type="button"
                    onClick={() => router.back()}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  {!isViewMode && (
                    <Button
                      type="submit"
                      className="elena-button-primary"
                      disabled={isCaseLoading || isCreatingCase}
                      onClick={async (e) => {
                        // Forzar validación del formulario antes de proceder
                        const isValid = await form.trigger();
                        const errors = form.formState.errors;
                        const values = form.getValues();
                        const printErrorsWithValues = (
                          errors: any,
                          path = "",
                        ) => {
                          Object.entries(errors).forEach(
                            ([key, value]: any) => {
                              const currentPath = path ? `${path}.${key}` : key;

                              if (value?.message) {
                                toast.error(`${currentPath}: ${value.message}`);
                              } else if (typeof value === "object") {
                                printErrorsWithValues(value, currentPath);
                              }
                            },
                          );
                        };

                        if (!isValid) {
                          printErrorsWithValues(errors);
                        }
                      }}
                    >
                      {isCaseLoading || isCreatingCase ? (
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          {isCaseLoading && (isEditMode || isViewMode)
                            ? "Cargando datos..."
                            : isCreatingCase
                              ? isEditMode
                                ? "Actualizando datos..."
                                : "Creando caso..."
                              : isEditMode
                                ? "Actualizando..."
                                : "Creando..."}
                        </div>
                      ) : isEditMode ? (
                        "Actualizar datos"
                      ) : isViewMode ? null : (
                        "Crear expediente"
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>

            {/* Formulario de agregar documentos duplicado eliminado */}
            {/* Botón para guardar documentos locales (solo en edición) */}
            {isEditMode && localDocuments.length > 0 && (
              <div className="flex justify-end mt-3">
                <Button
                  type="button"
                  className="elena-button-primary"
                  onClick={saveDocuments}
                >
                  Guardar Documentos
                </Button>
              </div>
            )}

            {/* modal removed - inline toggled form used instead */}
          </div>
        </div>

        {/* Sidebar - Historial de Actuaciones - Solo visible en desktop */}
        {/* Sidebar reducido 20% (antes w-80 ~320px, ahora w-64 ~256px) para dar más espacio al formulario */}
        <div className="hidden lg:block w-[26rem] bg-gray-50 p-6 border-l border-gray-200">
          <div className="space-y-6">
            <div className="flex flex-col space-y-2 items-center justify-between mb-4">
              <h2 className="text-md font-semibold text-pink-600">
                Historial de Actuaciones
              </h2>
            </div>

            <div className="border-b border-gray-300 mb-4"></div>

            {/* Indicador de carga */}
            {/* {loadingActuaciones && (
              <div className="text-xs text-gray-500 mb-3 text-center">
                Cargando actuaciones...
              </div>
            )} */}

            {/* Indicador de orden cronológico */}
            {actuacionesMonolegal.length > 0 && !loadingActuaciones && (
              <div className="text-xs text-gray-500 mb-3 text-center">
                Ordenadas cronológicamente (más reciente primero) -{" "}
                {actuacionesMonolegal.length} actuaciones
              </div>
            )}

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
  {/* Mostrar actuaciones de Monolegal */}
  {actuacionesMonolegal.length > 0 ? (
    actuacionesMonolegal.map((p: any) => (
      <div
        key={p._id || (p as any).id}
        className="bg-white rounded-lg p-4 shadow-sm"
      >
        <div className="space-y-2">      
          <div className="flex items-center justify-between">
           <span
  className={`px-2 py-0.5 text-xs rounded border-l-4 ${
    p.fuente === "Unificada"
      ? "bg-pink-50 text-pink-700 border-pink-500"
      : "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-500"
  }`}
>
  {p.fuente || p.tipoFuente}
</span>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-600 hover:text-gray-900 p-1 h-auto"
                onClick={() => {
                  setSelectedPerformance(p);
                  setShowPerformanceDetailModal(true);
                }}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 p-1 h-auto"
                onClick={async () => {
                  if (!p._id && !(p as any).id) return;
                  const id = p._id || (p as any).id;
                  if (!caseId) return;
                  if (!window.confirm("¿Eliminar actuación?")) return;
                  try {
                    await deletePerformance(id);
                    toast.success("Actuación eliminada");
                    await getCasoById(caseId);
                  } catch (err) {
                    console.error("Error eliminando actuación:", err);
                    toast.error("No se pudo eliminar actuación");
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="text-pink-600 font-medium text-base">
            {p.textoActuacion ||
              p.actuacion ||
              p.performanceType ||
              "Actuación"}{" "}
            -{" "}
            <span className="text-gray-600">
              {p.fechaDeActuacion ? formatToDisplay(p.fechaDeActuacion) : ""}
            </span>
          </div>

          {/* ✅ Anotación en la tercera línea */}
          <p className="text-sm text-gray-600 line-clamp-3">
            {p.anotacion || "Sin anotación"}
          </p>
        </div>
      </div>
    ))
  ) : (
    <div className="text-sm text-gray-500">
      No hay actuaciones registradas
    </div>
  )}
</div>
            {/* Botón Agregar Actuación */}
            {!showPerformanceForm && (
              <div className="flex flex-col gap-2 items-center">
                <Button
                  type="button"
                  className="elena-button-primary"
                  onClick={() => setShowPerformanceForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Actuación
                </Button>
              </div>
            )}

            {/* Formulario de actuaciones - visible cuando showPerformanceForm es true */}
            {showPerformanceForm && (
              <Card className="p-4 elena-card">
                <h3 className="font-semibold text-pink-600 mb-4">
                  Actuaciones procesales
                </h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Estado de Actuación
                    </Label>
                    <Select
                      value={
                        (documentForm &&
                          (documentForm as any).estadoActuacion) ||
                        ""
                      }
                      onValueChange={(value) => {
                        setDocumentForm(
                          (prev) =>
                            ({ ...prev, estadoActuacion: value }) as any,
                        );
                      }}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Selecciona estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {(() => {
                          const currentState = caso?.estado;
                          const allStates = [
                            {
                              value: "Demanda radicada",
                              label: "Demanda radicada",
                            },
                            {
                              value: "Inadmite demanda",
                              label: "Inadmite demanda",
                            },
                            {
                              value: "Subsana demanda",
                              label: "Subsana demanda",
                            },
                            {
                              value: "Admite demanda",
                              label: "Admite demanda",
                            },
                            {
                              value: "Notificación personal de la demanda",
                              label: "Notificación personal de la demanda",
                            },
                            {
                              value: "Contestación de la demanda",
                              label: "Contestación de la demanda",
                            },
                            {
                              value: "Inadmite contestación de la demanda",
                              label: "Inadmite contestación de la demanda",
                            },
                            {
                              value:
                                "Admisión de la contestación de la demanda",
                              label:
                                "Admisión de la contestación de la demanda",
                            },
                            {
                              value: "Subsana contestación de la demanda",
                              label: "Subsana contestación de la demanda",
                            },
                            {
                              value: "Fija audiencia",
                              label: "Fija audiencia",
                            },
                            {
                              value: "Celebra audiencia # 1",
                              label: "Celebra audiencia # 1",
                            },
                            {
                              value: "Celebra audiencia # 2",
                              label: "Celebra audiencia # 2",
                            },
                            {
                              value: "Celebra audiencia + 2",
                              label: "Celebra audiencia + 2",
                            },
                            {
                              value: "Conciliación y proceso conciliado",
                              label: "Conciliación y proceso conciliado",
                            },
                            { value: "Archivado", label: "Archivado" },
                            {
                              value: "Radica impulso procesal",
                              label: "Radica impulso procesal",
                            },
                            {
                              value: "Retiro de la demanda",
                              label: "Retiro de la demanda",
                            },
                            {
                              value: "Finalizado por Sentencia",
                              label: "Finalizado por Sentencia",
                            },
                            {
                              value: "Finalizado por Rechazo",
                              label: "Finalizado por Rechazo",
                            },
                            { value: "Otro", label: "Otro" },
                          ];

                          // Filtrar estados válidos según el estado actual
                          const validStates =
                            currentState === "ADMITE"
                              ? allStates.filter((s) =>
                                  [
                                    "NOTIFICACION_PERSONAL",
                                    "ARCHIVADO",
                                    "RETIRO_DEMANDA",
                                  ].includes(s.value),
                                )
                              : allStates;

                          return validStates.map((state) => (
                            <SelectItem key={state.value} value={state.value}>
                              {state.label}{" "}
                              {state.value === currentState
                                ? "(Estado actual)"
                                : ""}
                            </SelectItem>
                          ));
                        })()}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Fecha de creación
                    </Label>
                    <DatePicker
                      selected={
                        (documentForm &&
                          (documentForm as any).fechaActuacion) ||
                        ""
                      }
                      onSelect={(date) => {
                        setDocumentForm(
                          (prev) =>
                            ({ ...prev, fechaActuacion: date || "" }) as any,
                        );
                      }}
                      placeholder="Seleccionar fecha"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Responsable
                    </Label>
                    <Select
                      value={
                        (documentForm &&
                          (documentForm as any).responsableActuacion) ||
                        ""
                      }
                      onValueChange={(value) => {
                        setDocumentForm(
                          (prev) =>
                            ({ ...prev, responsableActuacion: value }) as any,
                        );
                      }}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Selecciona responsable" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Juzgado">Juzgado</SelectItem>
                        <SelectItem value="Demandante">Demandante</SelectItem>
                        <SelectItem value="Demandado">Demandado</SelectItem>
                        <SelectItem value="Tercero">Tercero</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Observaciones
                    </Label>
                    <Textarea
                      placeholder="Observaciones sobre la actuación..."
                      rows={3}
                      value={
                        (documentForm &&
                          (documentForm as any).observacionesActuacion) ||
                        ""
                      }
                      onChange={(e) => {
                        setDocumentForm(
                          (prev) =>
                            ({
                              ...prev,
                              observacionesActuacion: e.target.value,
                            }) as any,
                        );
                      }}
                      className="border-gray-300"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Relacionar documento
                    </Label>
                    <Select
                      value={
                        (documentForm &&
                          (documentForm as any).documentoRelacion) ||
                        ""
                      }
                      onValueChange={(value) => {
                        setDocumentForm(
                          (prev) =>
                            ({ ...prev, documentoRelacion: value }) as any,
                        );
                      }}
                    >
                      <SelectTrigger className="border-gray-300">
                        <SelectValue placeholder="Selecciona documento" />
                      </SelectTrigger>
                      <SelectContent>
                        {/* Listar documentos del caso */}
                        {(caso?.documents || []).map((d) => (
                          <SelectItem
                            key={d._id || d.consecutive}
                            value={d.document}
                          >
                            {d.document}{" "}
                            {d.consecutive ? `(${d.consecutive})` : ""}
                          </SelectItem>
                        ))}
                        {/* Incluir documentos locales si los hay */}
                        {localDocuments.map((d) => (
                          <SelectItem
                            key={d._id || d.consecutive}
                            value={d.document}
                          >
                            {d.document}{" "}
                            {d.consecutive ? `(${d.consecutive})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs"
                      onClick={() => {
                        setShowPerformanceForm(false);
                        // Limpiar campo de actuación en documentForm
                        setDocumentForm(
                          (prev) => ({ ...prev, documentoRelacion: "" }) as any,
                        );
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button
                      className="elena-button-primary text-xs"
                      onClick={async () => {
                        if (!caseId) {
                          toast.error(
                            "Guarda el caso antes de agregar actuaciones",
                          );
                          return;
                        }
                        // Leer valores del formulario de actuación
                        const estadoActuacion =
                          (documentForm &&
                            (documentForm as any).estadoActuacion) ||
                          "";
                        const responsableActuacion =
                          (documentForm &&
                            (documentForm as any).responsableActuacion) ||
                          "Sistema";
                        const observacionesActuacion =
                          (documentForm &&
                            (documentForm as any).observacionesActuacion) ||
                          "";
                        const relatedDoc =
                          (documentForm &&
                            (documentForm as any).documentoRelacion) ||
                          "";

                        // Validar que se haya seleccionado un estado
                        if (!estadoActuacion) {
                          toast.error("Selecciona un estado de actuación");
                          return;
                        }

                        const currentState = caso?.estado;
                        if (currentState === estadoActuacion) {
                          toast.error(
                            `El caso ya está en estado "${estadoActuacion}". Selecciona un estado diferente.`,
                          );
                          return;
                        }

                        const payload = {
                          record: caseId,
                          performanceType: estadoActuacion,
                          responsible: responsableActuacion,
                          observation: relatedDoc
                            ? `${observacionesActuacion} | Documento relacionado: ${relatedDoc}`
                            : observacionesActuacion,
                          forceTransition: false,
                        };

                        try {
                          const res = await createPerformance(payload as any);
                          if ("performance" in res) {
                            toast.success("Actuación creada");
                            // refrescar caso
                            await getCasoById(caseId);
                            // ocultar formulario y limpiar campo
                            setShowPerformanceForm(false);
                            setDocumentForm(
                              (prev) =>
                                ({ ...prev, documentoRelacion: "" }) as any,
                            );
                          } else {
                            const msg = Array.isArray((res as any).message)
                              ? (res as any).message.join(", ")
                              : (res as any).message;
                            toast.error(msg || "Error al crear actuación");
                          }
                        } catch (err: any) {
                          console.error("Error creando actuación:", err);
                          toast.error(
                            err?.message || "Error al crear actuación",
                          );
                        }
                      }}
                    >
                      Guardar
                    </Button>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Botón flotante para móviles - Actuaciones */}
      <div className="lg:hidden fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setShowMobileActuaciones(true)}
          className="bg-pink-600 hover:bg-pink-700 text-white rounded-full w-14 h-14 shadow-lg"
          size="icon"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </Button>
      </div>

      {/* Sidebar móvil para actuaciones */}
      {showMobileActuaciones && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
          onClick={() => setShowMobileActuaciones(false)}
        >
          <div
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-pink-600">
                Actuaciones
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMobileActuaciones(false)}
                className="p-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </Button>
            </div>

            <div className="p-4 overflow-y-auto h-full">
              {/* Indicador de orden cronológico */}
              {caso?.performances && caso.performances.length > 0 && (
                <div className="text-xs text-gray-500 mb-3 text-center">
                  Ordenadas cronológicamente (más reciente primero)
                </div>
              )}

              <div className="space-y-4">
                {/* Mostrar actuaciones cargadas en el caso si existen - ordenadas cronológicamente */}
                {caso?.performances && caso.performances.length > 0 ? (
                  [...caso.performances]
                    .sort((a, b) => {
                      // Ordenar por fecha de creación (más reciente primero)
                      const dateA = new Date(a.createdAt || 0).getTime();
                      const dateB = new Date(b.createdAt || 0).getTime();
                      return dateB - dateA;
                    })
                    .map((p) => (
                      <div
                        key={p._id || (p as any).id}
                        className="bg-gray-50 rounded-lg p-3 shadow-sm"
                      >
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="text-pink-600 font-medium text-sm">
                              {p.performanceType || "Actuación"} -{" "}
                              <span className="text-gray-600">
                                {p.createdAt
                                  ? formatToDisplay(p.createdAt)
                                  : ""}
                              </span>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-gray-600 hover:text-gray-900 p-1 h-auto"
                                onClick={() => {
                                  setSelectedPerformance(p);
                                  setShowPerformanceDetailModal(true);
                                }}
                              >
                                <Eye className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700 p-1 h-auto"
                                onClick={async () => {
                                  if (!p._id && !(p as any).id) return;
                                  const id = p._id || (p as any).id;
                                  if (!caseId) return;
                                  if (!window.confirm("¿Eliminar actuación?"))
                                    return;
                                  try {
                                    await deletePerformance(id);
                                    toast.success("Actuación eliminada");
                                    await getCasoById(caseId);
                                  } catch (err) {
                                    console.error(
                                      "Error eliminando actuación:",
                                      err,
                                    );
                                    toast.error("Error al eliminar actuación");
                                  }
                                }}
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="text-sm text-gray-600">
                            {p.observation || "Sin descripción"}
                          </div>
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="text-sm text-gray-500 text-center py-4">
                    No hay actuaciones registradas
                  </div>
                )}
              </div>

              {/* Botón Agregar Actuación */}
              {!showPerformanceForm && !isViewMode && (
                <div className="flex justify-center mt-6">
                  <Button
                    onClick={() => setShowPerformanceForm(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar Actuación
                  </Button>
                </div>
              )}

              {/* Formulario de actuaciones - solo visible cuando showPerformanceForm es true */}
              {showPerformanceForm && !isViewMode && (
                <Card className="p-4 mt-4">
                  <h3 className="font-semibold text-pink-600 mb-4 text-sm">
                    Actuaciones procesales
                  </h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Estado de Actuación
                      </label>
                      <Select
                        value={performanceForm.estadoActuacion}
                        onValueChange={(value) =>
                          setPerformanceForm({
                            ...performanceForm,
                            estadoActuacion: value,
                          })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecciona estado" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const currentState = caso?.estado;
                            const allStates = [
                              {
                                value: "Demanda radicada",
                                label: "Demanda radicada",
                              },
                              {
                                value: "Inadmite demanda",
                                label: "Inadmite demanda",
                              },
                              {
                                value: "Subsana demanda",
                                label: "Subsana demanda",
                              },
                              {
                                value: "Admite demanda",
                                label: "Admite demanda",
                              },
                              {
                                value: "Notificación personal de la demanda",
                                label: "Notificación personal de la demanda",
                              },
                              {
                                value: "Contestación de la demanda",
                                label: "Contestación de la demanda",
                              },
                              {
                                value: "Inadmite contestación de la demanda",
                                label: "Inadmite contestación de la demanda",
                              },
                              {
                                value:
                                  "Admisión de la contestación de la demanda",
                                label:
                                  "Admisión de la contestación de la demanda",
                              },
                              {
                                value: "Subsana contestación de la demanda",
                                label: "Subsana contestación de la demanda",
                              },
                              {
                                value: "Fija audiencia",
                                label: "Fija audiencia",
                              },
                              {
                                value: "Celebra audiencia # 1",
                                label: "Celebra audiencia # 1",
                              },
                              {
                                value: "Celebra audiencia # 2",
                                label: "Celebra audiencia # 2",
                              },
                              {
                                value: "Celebra audiencia + 2",
                                label: "Celebra audiencia + 2",
                              },
                              {
                                value: "Conciliación y proceso conciliado",
                                label: "Conciliación y proceso conciliado",
                              },
                              { value: "Archivado", label: "Archivado" },
                              {
                                value: "Radica impulso procesal",
                                label: "Radica impulso procesal",
                              },
                              {
                                value: "Retiro de la demanda",
                                label: "Retiro de la demanda",
                              },
                              {
                                value: "Finalizado por Sentencia",
                                label: "Finalizado por Sentencia",
                              },
                              {
                                value: "Finalizado por Rechazo",
                                label: "Finalizado por Rechazo",
                              },
                              { value: "Otro", label: "Otro" },
                            ];

                            // Filtrar estados válidos según el estado actual
                            const validStates =
                              currentState === "ADMITE"
                                ? allStates.filter((s) =>
                                    [
                                      "NOTIFICACION_PERSONAL",
                                      "ARCHIVADO",
                                      "RETIRO_DEMANDA",
                                    ].includes(s.value),
                                  )
                                : allStates;

                            return validStates.map((state) => (
                              <SelectItem key={state.value} value={state.value}>
                                {state.label}{" "}
                                {state.value === currentState
                                  ? "(Estado actual)"
                                  : ""}
                              </SelectItem>
                            ));
                          })()}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Fecha de creación
                      </label>
                      <DatePicker
                        selected={performanceForm.fechaActuacion}
                        onSelect={(date) =>
                          setPerformanceForm({
                            ...performanceForm,
                            fechaActuacion: date || "",
                          })
                        }
                        placeholder="Seleccionar fecha"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Responsable
                      </label>
                      <Select
                        value={performanceForm.responsableActuacion}
                        onValueChange={(value) =>
                          setPerformanceForm({
                            ...performanceForm,
                            responsableActuacion: value,
                          })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecciona responsable" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Juzgado">Juzgado</SelectItem>
                          <SelectItem value="Demandante">Demandante</SelectItem>
                          <SelectItem value="Demandado">Demandado</SelectItem>
                          <SelectItem value="Tercero">Tercero</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Observaciones
                      </label>
                      <Textarea
                        value={performanceForm.observacionesActuacion}
                        onChange={(e) =>
                          setPerformanceForm({
                            ...performanceForm,
                            observacionesActuacion: e.target.value,
                          })
                        }
                        placeholder="Observaciones sobre la actuación..."
                        className="text-sm"
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">
                        Relacionar documento
                      </label>
                      <Select
                        value={performanceForm.documentoRelacion}
                        onValueChange={(value) =>
                          setPerformanceForm({
                            ...performanceForm,
                            documentoRelacion: value,
                          })
                        }
                      >
                        <SelectTrigger className="text-sm">
                          <SelectValue placeholder="Selecciona documento" />
                        </SelectTrigger>
                        <SelectContent>
                          {/* Listar documentos del caso */}
                          {(caso?.documents || []).map((d) => (
                            <SelectItem
                              key={d._id || d.consecutive}
                              value={d.document}
                            >
                              {d.document}{" "}
                              {d.consecutive ? `(${d.consecutive})` : ""}
                            </SelectItem>
                          ))}
                          {/* Incluir documentos locales si los hay */}
                          {localDocuments.map((d) => (
                            <SelectItem
                              key={d._id || d.consecutive}
                              value={d.document}
                            >
                              {d.document}{" "}
                              {d.consecutive ? `(${d.consecutive})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setShowPerformanceForm(false);
                          setPerformanceForm({
                            performanceType: "",
                            description: "",
                            date: "",
                            estadoActuacion: "",
                            fechaActuacion: "",
                            responsableActuacion: "",
                            observacionesActuacion: "",
                            documentoRelacion: "",
                          });
                        }}
                        className="flex-1 text-xs"
                      >
                        Cancelar
                      </Button>
                      <Button
                        size="sm"
                        className="elena-button-primary flex-1 text-xs"
                        onClick={async () => {
                          if (!caseId) {
                            toast.error(
                              "Guarda el caso antes de agregar actuaciones",
                            );
                            return;
                          }
                          // Leer valores del formulario de actuación
                          const estadoActuacion =
                            performanceForm.estadoActuacion;
                          const responsableActuacion =
                            performanceForm.responsableActuacion || "Sistema";
                          const observacionesActuacion =
                            performanceForm.observacionesActuacion || "";
                          const relatedDoc =
                            performanceForm.documentoRelacion || "";

                          // Validar que se haya seleccionado un estado
                          if (!estadoActuacion) {
                            toast.error("Completa todos los campos requeridos");
                            return;
                          }

                          const currentState = caso?.estado;
                          if (currentState === estadoActuacion) {
                            toast.error(
                              `El caso ya está en estado "${estadoActuacion}". Selecciona un estado diferente.`,
                            );
                            return;
                          }

                          const payload = {
                            record: caseId,
                            performanceType: estadoActuacion,
                            responsible: responsableActuacion,
                            observation: relatedDoc
                              ? `${observacionesActuacion} | Documento relacionado: ${relatedDoc}`
                              : observacionesActuacion,
                            forceTransition: false,
                          };

                          try {
                            const res = await createPerformance(payload as any);
                            if ("performance" in res) {
                              toast.success("Actuación creada");
                              // refrescar caso
                              await getCasoById(caseId);
                              // ocultar formulario
                              setShowPerformanceForm(false);
                              setPerformanceForm({
                                performanceType: "",
                                description: "",
                                date: "",
                                estadoActuacion: "",
                                fechaActuacion: "",
                                responsableActuacion: "",
                                observacionesActuacion: "",
                                documentoRelacion: "",
                              });
                            } else {
                              const msg = Array.isArray((res as any).message)
                                ? (res as any).message.join(", ")
                                : (res as any).message;
                              toast.error(msg || "Error al crear actuación");
                            }
                          } catch (err: any) {
                            console.error("Error creando actuación:", err);
                            toast.error(
                              err?.message || "Error al crear actuación",
                            );
                          }
                        }}
                      >
                        Guardar
                      </Button>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de Detalles de Actuación */}
      <Dialog
        open={showPerformanceDetailModal}
        onOpenChange={setShowPerformanceDetailModal}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-pink-600 text-xl font-semibold">
              Detalle de Actuación
            </DialogTitle>
          </DialogHeader>

          {selectedPerformance && (
            <div className="space-y-6 py-4">
              {/* Información Principal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Tipo de Actuación
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900 font-medium">
                      {(selectedPerformance as any).textoActuacion ||
                        (selectedPerformance as any).actuacion ||
                        selectedPerformance.performanceType ||
                        "No especificado"}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Número de Proceso
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {(selectedPerformance as any).numProceso ||
                        caso?.radicado ||
                        "No especificado"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Fechas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Fecha de Actuación
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {(selectedPerformance as any).fechaDeActuacion
                        ? formatToDisplay(
                            (selectedPerformance as any).fechaDeActuacion,
                          )
                        : selectedPerformance.createdAt
                          ? formatToDisplay(selectedPerformance.createdAt)
                          : "No especificada"}
                    </span>
                  </div>
                </div>

                {/* <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">
                    Fecha de Creación en Monolegal
                  </Label>
                  <div className="p-3 bg-gray-50 rounded-lg border">
                    <span className="text-gray-900">
                      {(selectedPerformance as any).fechaCreacion
                        ? formatToDisplay(
                            (selectedPerformance as any).fechaCreacion
                          )
                        : "No especificada"}
                    </span>
                  </div>
                </div> */}
              </div>

              {/* Anotación / Observaciones */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-medium">Anotación</Label>
                <div className="p-4 bg-gray-50 rounded-lg border min-h-[100px]">
                  <span className="text-gray-900 whitespace-pre-wrap">
                    {(selectedPerformance as any).anotacion ||
                      selectedPerformance.observation ||
                      "Sin anotación"}
                  </span>
                </div>
              </div>

              {/* Términos (si existen) */}
              {/* {((selectedPerformance as any).fechaIniciaTermino ||
                (selectedPerformance as any).fechaFinalizaTermino) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Inicio de Término
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {(selectedPerformance as any).fechaIniciaTermino
                          ? formatToDisplay(
                              (selectedPerformance as any).fechaIniciaTermino
                            )
                          : "No especificada"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-700 font-medium">
                      Fin de Término
                    </Label>
                    <div className="p-3 bg-gray-50 rounded-lg border">
                      <span className="text-gray-900">
                        {(selectedPerformance as any).fechaFinalizaTermino
                          ? formatToDisplay(
                              (selectedPerformance as any).fechaFinalizaTermino
                            )
                          : "No especificada"}
                      </span>
                    </div>
                  </div>
                </div>
              )} */}

              {/* Estado de la Actuación */}
              <div className="bg-pink-50 border border-pink-200 rounded-lg p-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                  <span className="text-pink-700 font-medium">
                    {(selectedPerformance as any).textoActuacion ||
                      (selectedPerformance as any).actuacion ||
                      selectedPerformance.performanceType ||
                      "Actuación"}
                  </span>
                  {(selectedPerformance as any).conDocumentos && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      Con documentos
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setShowPerformanceDetailModal(false)}
              className="elena-button-secondary"
            >
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
