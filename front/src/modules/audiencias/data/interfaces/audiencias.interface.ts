
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
