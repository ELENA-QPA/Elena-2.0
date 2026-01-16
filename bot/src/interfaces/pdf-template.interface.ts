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
  etiqueta: string; // Etiqueta 
  radicado: string; // Radicado de 23 dígitos
  despachoJudicial: string; // Juzgado
  city: string; // Ciudad
  ultimaActuacion: string; // Última actuación
  fechaUltimaActuacion: string; // Fecha última actuación
  //processType: string;
  //jurisdiction: string;
  
  // Partes procesales
  plaintiffs: PlaintiffData[];
  defendants: DefendantData[];
  
  // Actuaciones
  performances: PerformanceData[];

  // Actuaciones de Monolegal (en tiempo real, sin guardar)
  actuacionesMonolegal?: ActuacionMonolegal[];
}

// Interface para las actuaciones de Monolegal
export interface ActuacionMonolegal {
  fecha: string;
  actuacion: string;
  anotacion?: string; 
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
