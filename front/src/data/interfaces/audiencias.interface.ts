
export type Estado =
    | "Programada"
    | "Celebrada"
    | "No_celebrada"
    | "Conciliada";

export const EstadoColors: Record<Estado, string> = {
    Programada: "bg-pink-600",
    Celebrada: "bg-blue-600",
    No_celebrada: "bg-gray-900",
    Conciliada: "bg-green-600",
};

export interface Evento {
  title: string;
  demandante: string;
  demandado: string;
  juzgado: string;
  start: Date;
  end: Date;
  link_teams: string;
  codigo_interno: string;
  resumen_hechos: string;
  estado: Estado;
  monto_conciliado?: number;
  abogado: string;
}
