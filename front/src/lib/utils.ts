import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Reemplazar espacios con guiones
    .replace(/[^\w-]+/g, "") // Eliminar caracteres no alfanuméricos
    .replace(/--+/g, "-") // Reemplazar múltiples guiones con uno solo
    .replace(/^-+/, "") // Eliminar guiones al inicio
    .replace(/-+$/, "") // Eliminar guiones al final
}
