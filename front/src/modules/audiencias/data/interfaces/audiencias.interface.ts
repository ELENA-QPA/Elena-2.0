import { Lawyer } from "./lawyers.interface";

export type Estado =
    | "Programada"
    | "Celebrada"
    | "No_celebrada"
    | "Conciliada";

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
  abogado: string;
}

export interface AudienceInterface{
  _id: string;
  record: string;
  lawyer: Lawyer;
  state: string;
  start: Date;
  end: Date;
  link?: string;
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

export interface AudienceOrchestratorResponse {
  audience : AudienceInterface,  
  record: RecordAudience
}
