import { Lawyer } from "./lawyers.interface";
import { z } from "zod";

export type Estado = "Programada" | "Celebrada" | "No_celebrada" | "Conciliada";

export const ESTADOS = [
  "Programada",
  "Celebrada",
  "No_celebrada",
  "Conciliada",
] as const;

export const LegendColors: Record<string, string> = {
  "RAPPI S.A.S.": "bg-orange-600",
  // Didi: "bg-blue-600",
  // Uber: "bg-gray-900",
  Otro: "bg-green-600",
};

export interface Evento {
  idEvent: string;
  title: string;
  demandante: string;
  contacto_demandante: string;
  email_demandante: string;
  demandado: string;
  despachoJudicial: string;
  start: Date;
  end: Date;
  link_teams: string;
  etiqueta: string;
  estado: Estado;
  monto_conciliado?: number;
  abogado_id: string;
  abogado: string;
  record_id: string;
}

export interface AudienceInterface {
  _id: string;
  record: string;
  lawyer: Lawyer;
  state: Estado;
  start: Date;
  end: Date;
  link?: string;
  is_valid: boolean;
  monto: number;
}

export interface AudienceBase {
  start: string;
  end: string;
  lawyer: string;
  record: string;
  link: string;
  state: Estado;
  is_valid: boolean;
  monto?: number;
}

export interface AudienceCreate extends AudienceBase {}

export interface AudienceUpdate extends Partial<AudienceBase> {}

export interface ProceduralPart {
  name: string;
  email?: string;
  contact?: string;
}

export interface ProceduralParts {
  plaintiff: ProceduralPart | null;
  defendant: ProceduralPart | null;
}

export interface RecordAudience {
  _id: string;
  etiqueta: string;
  despachoJudicial: string;
  radicado: string;
  proceduralParts: ProceduralParts;
}

export interface getRecordByInternalCodeResponse {
  record: RecordAudience;
}

export interface AudienceOrchestratorResponse {
  audience: AudienceInterface;
  record?: RecordAudience;
}

export const eventoSchema = z.object({
  title: z.string(),
  demandante: z.string().optional(),
  contacto_demandante: z.string().optional(),
  email_demandante: z.string().email().optional().or(z.literal("")),
  demandado: z.string().optional(),
  despachoJudicial: z.string().optional(),
  abogado_id: z.string(),
  record_id: z.string(),
  start: z.string(),
  end: z.string(),
  link_teams: z.string().url().optional().or(z.literal("")),
  etiqueta: z.string().optional(),
  estado: z.enum(ESTADOS),
  monto_conciliado: z.number().optional(),
});
export type EventoForm = z.infer<typeof eventoSchema>;
