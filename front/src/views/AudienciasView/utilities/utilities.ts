import { Estado, EstadoColors } from "@/data/interfaces/audiencias.interface";

export function getColorByEstado(estado: Estado): string {
  return EstadoColors[estado];
}