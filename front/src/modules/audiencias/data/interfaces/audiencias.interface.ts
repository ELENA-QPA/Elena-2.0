import { Lawyer } from "./lawyers.interface";
import { z } from "zod";

export type Estado =
    | "Programada"
    | "Celebrada"
    | "No_celebrada"
    | "Conciliada";

export const ESTADOS = [
  "Programada",
  "Celebrada",
  "No_celebrada",
  "Conciliada",
] as const;

export const LegendColors: Record<string, string> = {
    Rappi: "bg-orange-600",
    Didi: "bg-blue-600",
    Uber: "bg-gray-900",
    Otro: "bg-green-600",
};

export interface Evento {
  title: string;
  demandante: string;
  contacto_demandante: string;
  email_demandante: string;
  demandado: string;
  juzgado: string;
  start: Date;
  end: Date;
  link_teams: string;
  codigo_interno: string;
  estado: Estado;
  monto_conciliado?: number;
  abogado_id: string;
  abogado: string;
  record_id: string;
}

export interface AudienceInterface{
  _id: string;
  record: string;
  lawyer: Lawyer;
  state: Estado;
  start: Date;
  end: Date;
  link?: string;
  is_valid: boolean;
}

export interface AudienceCreate{
  start: Date;
  end: Date;
  lawyer: string;
  record: string;
  link: string;
  state: Estado;
  is_valid: boolean;
}

export interface ProceduralPart {
  name: string;
  email?: string;
  contact?: string;
}

export interface ProceduralParts{
  plaintiff: ProceduralPart| null;
  defendant: ProceduralPart | null;
}

export interface RecordAudience {
  _id: string;
  internalCode: string;
  office: string;
  settled: string;
  proceduralParts: ProceduralParts;
}

export interface getRecordByInternalCodeResponse {
  record: RecordAudience;
}

export interface AudienceOrchestratorResponse {
  audience : AudienceInterface,  
  record: RecordAudience
}


export const eventoSchema = z.object({
  title: z.string(),
  demandante: z.string().min(1),
  contacto_demandante: z.string(),
  email_demandante: z.string().email(),
  demandado: z.string().min(1),
  juzgado: z.string().min(1),
  abogado_id: z.string(),
  record_id: z.string(),
  start: z.string(),
  end: z.string(),
  link_teams: z.string().url().optional().or(z.literal("")),
  codigo_interno: z.string().optional(),
  estado: z.enum(ESTADOS),
  monto_conciliado: z.coerce.number().optional(),
});
export type EventoForm = z.infer<typeof eventoSchema>;