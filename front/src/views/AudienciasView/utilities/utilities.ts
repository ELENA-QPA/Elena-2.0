import { LegendColors } from "@/modules/audiencias/data/interfaces/audiencias.interface";

export function getColorLegend(cliente: string): string {
  return LegendColors[cliente] || LegendColors["Otro"];
}