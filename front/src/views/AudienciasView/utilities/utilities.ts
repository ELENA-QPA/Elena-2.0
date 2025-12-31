import { LegendColors } from "@/modules/audiencias/data/interfaces/audiencias.interface";

export function getColorLegend(cliente: string): string {
  return LegendColors[cliente] || LegendColors["Otro"];
}

const formatDateForBackend = (dateInput: string | Date): string => {
  if (typeof dateInput === "string") {
    return dateInput.slice(0, 16);
  }

  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, "0");
  const day = String(dateInput.getDate()).padStart(2, "0");
  const hours = String(dateInput.getHours()).padStart(2, "0");
  const minutes = String(dateInput.getMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};
