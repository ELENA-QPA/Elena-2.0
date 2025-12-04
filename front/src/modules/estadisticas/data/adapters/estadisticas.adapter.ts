import {
  ActiveInactiveByMonthResponse,
  ActiveInactiveByMonthSuccessResponse,
  LawsuitsHearingsByMonthResponse,
  LawsuitsHearingsByMonthSuccessResponse,
  ProcessesByStateResponse,
  ProcessesByStateSuccessResponse,
  ProcessesByStateYearResponse,
  ProcessesByStateYearSuccessResponse,
  FinishedProcessesByStateYearResponse,
  FinishedProcessesByStateYearSuccessResponse,
} from "../interfaces/estadisticas.interface";

// ====== MAPPERS FOR SUCCESS RESPONSES ======

export const mapActiveInactiveByMonthResponse = (
  data: any
): ActiveInactiveByMonthSuccessResponse => {
  try {
    console.log("[ADAPTER][mapActiveInactiveByMonthResponse] Input:", data);
    
    // Verificar si los datos vienen en la estructura esperada o necesitan adaptación
    const rawData = data.statistics || data;
    
    const mappedData: ActiveInactiveByMonthResponse = {
      year: data.year || new Date().getFullYear(),
      activeProcesses: data.activeProcesses || 0,
      inactiveProcesses: data.inactiveProcesses || 0,
      totalProcesses: data.totalProcesses || data.total || 0,
      filterType: data.filterType || data.type,
      monthlyMetrics: (data.monthlyMetrics || data.monthlyData || []).map((metric: any) => ({
        month: metric.month || 0,
        monthName: metric.monthName || "",
        activeProcesses: metric.activeProcesses || metric.active || 0,
        inactiveProcesses: metric.inactiveProcesses || metric.inactive || 0,
        totalProcesses: metric.totalProcesses || metric.total || metric.count || 0,
      })),
      summary: {
        mostActiveMonth: {
          month: data.summary?.mostActiveMonth?.month || 0,
          monthName: data.summary?.mostActiveMonth?.monthName || "",
          activeProcesses: data.summary?.mostActiveMonth?.activeProcesses || 0,
          inactiveProcesses: data.summary?.mostActiveMonth?.inactiveProcesses || 0,
          totalProcesses: data.summary?.mostActiveMonth?.totalProcesses || 0,
        },
      },
    };

    const result = { data: mappedData };
    console.log("[ADAPTER][mapActiveInactiveByMonthResponse] Output:", result);
    return result;
  } catch (error) {
    console.error("[ADAPTER][mapActiveInactiveByMonthResponse] Error:", error);
    console.error("[ADAPTER][mapActiveInactiveByMonthResponse] Input data:", data);
    throw new Error(`Error mapping active inactive by month response: ${error}`);
  }
};

export const mapLawsuitsHearingsByMonthResponse = (
  data: any
): LawsuitsHearingsByMonthSuccessResponse => {
  try {
    console.log("[ADAPTER][mapLawsuitsHearingsByMonthResponse] Input:", data);
    
    const mappedData: LawsuitsHearingsByMonthResponse = {
      year: data.year || new Date().getFullYear(),
      filedLawsuits: {
        total: data.filedLawsuits?.total || 0,
        metric: (data.filedLawsuits?.metric || []).map((item: any) => ({
          month: item.month || 0,
          monthName: item.monthName || "",
          count: item.count || 0,
        })),
      },
      scheduledHearings: {
        total: data.scheduledHearings?.total || 0,
        metric: (data.scheduledHearings?.metric || []).map((item: any) => ({
          month: item.month || 0,
          monthName: item.monthName || "",
          count: item.count || 0,
        })),
      },
      summary: {
        totalLawsuits: data.summary?.totalLawsuits || 0,
        totalHearings: data.summary?.totalHearings || 0,
      },
    };

    const result = { data: mappedData };
    console.log("[ADAPTER][mapLawsuitsHearingsByMonthResponse] Output:", result);
    return result;
  } catch (error) {
    console.error("[ADAPTER][mapLawsuitsHearingsByMonthResponse] Error:", error);
    console.error("[ADAPTER][mapLawsuitsHearingsByMonthResponse] Input data:", data);
    throw new Error(`Error mapping lawsuits hearings by month response: ${error}`);
  }
};

export const mapProcessesByStateResponse = (
  data: any
): ProcessesByStateSuccessResponse => {
  try {
    console.log("[ADAPTER][mapProcessesByStateResponse] Input:", data);
    
    const mappedData: ProcessesByStateResponse = {
      type: data.type || "ACTIVO",
      total: data.total || 0,
      statistics: (data.statistics || []).map((stat: any) => ({
        estado: stat.estado || "",
        count: stat.count || 0,
        percentage: stat.percentage || 0,
      })),
    };

    const result = { data: mappedData };
    console.log("[ADAPTER][mapProcessesByStateResponse] Output:", result);
    return result;
  } catch (error) {
    console.error("[ADAPTER][mapProcessesByStateResponse] Error:", error);
    console.error("[ADAPTER][mapProcessesByStateResponse] Input data:", data);
    throw new Error(`Error mapping processes by state response: ${error}`);
  }
};

export const mapProcessesByStateYearResponse = (
  data: any
): ProcessesByStateYearSuccessResponse => {
  try {
    console.log("[ADAPTER][mapProcessesByStateYearResponse] Input:", data);
    
    const mappedData: ProcessesByStateYearResponse = {
      type: data.type || "ACTIVO",
      year: data.year || new Date().getFullYear(),
      total: data.total || 0,
      statistics: (data.statistics || []).map((stat: any) => ({
        estado: stat.estado || "",
        count: stat.totalByState || stat.count || 0,
        totalByState: stat.totalByState || stat.count || 0,
        percentage: stat.percentage || 0,
        monthlyData: (stat.monthlyData || []).map((monthly: any) => ({
          month: monthly.month || 0,
          monthName: monthly.monthName || "",
          count: monthly.count || 0,
        })),
      })),
    };

    const result = { data: mappedData };
    console.log("[ADAPTER][mapProcessesByStateYearResponse] Output:", result);
    return result;
  } catch (error) {
    console.error("[ADAPTER][mapProcessesByStateYearResponse] Error:", error);
    console.error("[ADAPTER][mapProcessesByStateYearResponse] Input data:", data);
    throw new Error(`Error mapping processes by state year response: ${error}`);
  }
};

export const mapFinishedProcessesByStateYearResponse = (
  data: any
): FinishedProcessesByStateYearSuccessResponse => {
  try {
    console.log("[ADAPTER][mapFinishedProcessesByStateYearResponse] Input:", data);
    
    const mappedData: FinishedProcessesByStateYearResponse = {
      type: data.type || "FINALIZADO",
      year: data.year || new Date().getFullYear(),
      total: data.total || 0,
      statistics: (data.statistics || []).map((stat: any) => ({
        estado: stat.estado || "",
        count: stat.totalByState || stat.count || 0,
        totalByState: stat.totalByState || stat.count || 0,
        percentage: stat.percentage || 0,
        monthlyData: (stat.monthlyData || []).map((monthly: any) => ({
          month: monthly.month || 0,
          monthName: monthly.monthName || "",
          count: monthly.count || 0,
        })),
      })),
    };

    const result = { data: mappedData };
    console.log("[ADAPTER][mapFinishedProcessesByStateYearResponse] Output:", result);
    return result;
  } catch (error) {
    console.error("[ADAPTER][mapFinishedProcessesByStateYearResponse] Error:", error);
    console.error("[ADAPTER][mapFinishedProcessesByStateYearResponse] Input data:", data);
    throw new Error(`Error mapping finished processes by state year response: ${error}`);
  }
};
