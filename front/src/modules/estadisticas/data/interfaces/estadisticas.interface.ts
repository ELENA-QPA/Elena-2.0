// Interfaces para el módulo de estadísticas basadas en Swagger API

// Tipos de proceso
export type ProcessType = "ACTIVO" | "FINALIZADO";

// ====== REQUEST BODIES ======
export interface ActiveInactiveByMonthBody {
  year: number;
  type?: ProcessType;
}

export interface LawsuitsHearingsByMonthBody {
  year: number;
  type?: ProcessType;
}

export interface ProcessesByStateBody {
  type: ProcessType;
}

export interface ProcessesByStateYearBody {
  year: number;
  type: ProcessType;
}

export interface FinishedProcessesByStateYearBody {
  year: number;
  type: ProcessType;
}

// ====== COMMON TYPES ======
export interface DepartmentCityMetric {
  activos: number;
  finalizados: number;
  total: number;
  porcentajeActivo: number;
  rapidezMediaFijacionDemanda: number | null;
  rapidezMediaCelebraAudiencia: number | null;
}

export interface DepartmentCityData {
  [city: string]: DepartmentCityMetric;
}

export interface DepartmentCityResponse {
  records: {
    [department: string]: DepartmentCityData;
  };
}

export interface CityStatistic {
  [city: string]: number;
}

export interface DepartmentPercentage {
  department: string;
  total: number;
  porcentaje: number;
  ciudades: CityStatistic;
}

export interface PercentageByDepartmentResponse {
  total: number;
  departamentos: DepartmentPercentage[];
}

// ====== NEW APIS INTERFACES ======

// Filed Lawsuits by User
export interface FiledLawsuitsByUserBody {
  year: number;
  month: number;
  type: ProcessType;
}

export interface FiledLawsuitsByUserResponse {
  year: number;
  records: any[]; // Array vacío en el ejemplo, se puede tipear más específicamente después
}

// Documentation Statistics
export interface DocumentationStatistic {
  count: number;
  document: string;
  subdocument: string;
}

export interface DocumentationResponse {
  statistics: DocumentationStatistic[];
}

// Documentation Monthly
export interface DocumentationMonthlyBody {
  year: number;
  month: number;
  type: ProcessType;
}

export interface DocumentationPercents {
  [documentType: string]: number;
}

export interface DocumentationMonthlyResponse {
  year: number;
  month: number;
  total: number;
  percents: DocumentationPercents;
}

// Process Tracking
export interface ProcessTrackingBody {
  month: string;
  year: number;
}

export interface ProcessTrackingResponse {
  month: string;
  year: number;
  totalRadicados: number;
  states: any[]; // Array que puede contener estados, se puede tipear más específicamente después
  message?: string;
}
export interface MonthlyMetric {
  month: number;
  monthName: string;
  activeProcesses?: number;
  inactiveProcesses?: number;
  totalProcesses?: number;
  count?: number;
}

export interface MostActiveMonth {
  month: number;
  monthName: string;
  activeProcesses: number;
  inactiveProcesses: number;
  totalProcesses: number;
}

export interface StateStatistic {
  estado: string;
  count?: number;
  percentage?: number;
  totalByState?: number;
  monthlyData?: MonthlyMetric[];
}

// ====== RESPONSE INTERFACES ======
export interface ActiveInactiveByMonthResponse {
  year: number;
  activeProcesses: number;
  inactiveProcesses: number;
  totalProcesses: number;
  filterType?: ProcessType;
  monthlyMetrics: MonthlyMetric[];
  summary: {
    mostActiveMonth: MostActiveMonth;
  };
}

export interface LawsuitMetric {
  month: number;
  monthName: string;
  count: number;
}

export interface LawsuitsHearingsByMonthResponse {
  year: number;
  filedLawsuits: {
    total: number;
    metric: LawsuitMetric[];
  };
  scheduledHearings: {
    total: number;
    metric: LawsuitMetric[];
  };
  summary: {
    totalLawsuits: number;
    totalHearings: number;
  };
}

export interface ProcessesByStateResponse {
  type: ProcessType;
  total: number;
  statistics: StateStatistic[];
}

export interface ProcessesByStateYearResponse {
  type: ProcessType;
  year: number;
  total: number;
  statistics: StateStatistic[];
}

export interface FinishedProcessesByStateYearResponse {
  type: ProcessType;
  year: number;
  total: number;
  statistics: StateStatistic[];
}

// ====== SUCCESS RESPONSE WRAPPERS ======
export interface ActiveInactiveByMonthSuccessResponse {
  data: ActiveInactiveByMonthResponse;
}

export interface LawsuitsHearingsByMonthSuccessResponse {
  data: LawsuitsHearingsByMonthResponse;
}

export interface ProcessesByStateSuccessResponse {
  data: ProcessesByStateResponse;
}

export interface ProcessesByStateYearSuccessResponse {
  data: ProcessesByStateYearResponse;
}

export interface FinishedProcessesByStateYearSuccessResponse {
  data: FinishedProcessesByStateYearResponse;
}

export interface DepartmentCitySuccessResponse {
  data: DepartmentCityResponse;
}

export interface PercentageByDepartmentSuccessResponse {
  data: PercentageByDepartmentResponse;
}

export interface FiledLawsuitsByUserSuccessResponse {
  data: FiledLawsuitsByUserResponse;
}

export interface DocumentationSuccessResponse {
  data: DocumentationResponse;
}

export interface DocumentationMonthlySuccessResponse {
  data: DocumentationMonthlyResponse;
}

export interface ProcessTrackingSuccessResponse {
  data: ProcessTrackingResponse;
}

// ====== ERROR RESPONSE ======
export interface EstadisticasErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
}
