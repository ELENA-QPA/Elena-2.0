/**
 * Interfaces para los datos del template PDF
 */

export interface PdfTemplateData {
  // Información básica
  internalCode: string;
  clientName: string;
  radicado: string;
  
  // Array de procesos (nueva funcionalidad)
  processes: ProcessData[];
  
  // Fechas
  currentDate: string; // Formato: "25 de septiembre de 2025"
  date: string; // Formato: "25 de 09 de 2025"
}

export interface ProcessData {
  // Información del proceso
  internalCode: string; // Número interno único de cada proceso
  processType: string;
  jurisdiction: string;
  
  // Partes procesales
  plaintiffs: PlaintiffData[];
  defendants: DefendantData[];
  
  // Actuaciones
  performances: PerformanceData[];
}

export interface PlaintiffData {
  name: string;
  document: string;
}

export interface DefendantData {
  name: string;
}

export interface PerformanceData {
  performanceType: string;
  responsible: string;
  observation: string;
  updatedAt: string;
}
