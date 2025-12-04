"use client";

import { useState, useCallback, useMemo } from "react";
import container from "@/lib/di/container";
import { EstadisticasRepository } from "../data/repositories/estadisticas.repository";
import {
  ProcessType,
  ActiveInactiveByMonthBody,
  LawsuitsHearingsByMonthBody,
  ProcessesByStateBody,
  ProcessesByStateYearBody,
  FinishedProcessesByStateYearBody,
  FiledLawsuitsByUserBody,
  DocumentationMonthlyBody,
  ProcessTrackingBody,
  ActiveInactiveByMonthResponse,
  LawsuitsHearingsByMonthResponse,
  ProcessesByStateResponse,
  ProcessesByStateYearResponse,
  FinishedProcessesByStateYearResponse,
  DepartmentCityResponse,
  PercentageByDepartmentResponse,
  FiledLawsuitsByUserResponse,
  DocumentationResponse,
  DocumentationMonthlyResponse,
  ProcessTrackingResponse,
} from "../data/interfaces/estadisticas.interface";
import { toast } from "sonner";

export const useEstadisticas = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para almacenar los datos de cada endpoint
  const [activeInactiveData, setActiveInactiveData] = useState<ActiveInactiveByMonthResponse | null>(null);
  const [lawsuitsHearingsData, setLawsuitsHearingsData] = useState<LawsuitsHearingsByMonthResponse | null>(null);
  const [processesByStateData, setProcessesByStateData] = useState<ProcessesByStateResponse | null>(null);
  const [processesByStateYearData, setProcessesByStateYearData] = useState<ProcessesByStateYearResponse | null>(null);
  const [finishedProcessesByStateYearData, setFinishedProcessesByStateYearData] = useState<FinishedProcessesByStateYearResponse | null>(null);
  const [departmentCityData, setDepartmentCityData] = useState<DepartmentCityResponse | null>(null);
  const [percentageByDepartmentData, setPercentageByDepartmentData] = useState<PercentageByDepartmentResponse | null>(null);
  const [filedLawsuitsByUserData, setFiledLawsuitsByUserData] = useState<FiledLawsuitsByUserResponse | null>(null);
  const [documentationData, setDocumentationData] = useState<DocumentationResponse | null>(null);
  const [documentationMonthlyData, setDocumentationMonthlyData] = useState<DocumentationMonthlyResponse | null>(null);
  const [processTrackingData, setProcessTrackingData] = useState<ProcessTrackingResponse | null>(null);

  const estadisticasRepository = useMemo(() => container.get(EstadisticasRepository), []);

  // Helper para manejar errores de manera consistente
  const handleError = useCallback((err: any, defaultMessage: string, showToast: boolean = true) => {
    const errorMsg = err?.message || defaultMessage;
    setError(errorMsg);
    
    // Solo mostrar toast para errores que no sean de red
    if (showToast && !errorMsg.includes("No response received") && !errorMsg.includes("Network Error")) {
      toast.error(errorMsg);
    }
    
    console.error("[ESTADISTICAS_HOOK][Error]:", err);
    // No propagar el error para evitar crashes
    return null;
  }, []);

  // Helper para obtener token del localStorage
  const getAuthToken = useCallback((): string | undefined => {
    try {
      const userDataString = localStorage.getItem("user");
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        return userData.token;
      }
    } catch (error) {
      console.error("[ESTADISTICAS_HOOK] Error getting auth token:", error);
    }
    return undefined;
  }, []);

  // Obtener estadísticas de procesos activos vs inactivos por mes
  const getActiveInactiveByMonth = useCallback(async (data: ActiveInactiveByMonthBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getActiveInactiveByMonth]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getActiveInactiveByMonth(data, token);

      if ("data" in result) {
        setActiveInactiveData(result.data);
        console.log("[ESTADISTICAS_HOOK][getActiveInactiveByMonth][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getActiveInactiveByMonth][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      return handleError(err, "Error inesperado al obtener estadísticas activos/inactivos");
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken, handleError]);

  // Obtener estadísticas de demandas y audiencias por mes
  const getLawsuitsHearingsByMonth = useCallback(async (data: LawsuitsHearingsByMonthBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getLawsuitsHearingsByMonth]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getLawsuitsHearingsByMonth(data, token);

      if ("data" in result) {
        setLawsuitsHearingsData(result.data);
        console.log("[ESTADISTICAS_HOOK][getLawsuitsHearingsByMonth][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getLawsuitsHearingsByMonth][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener estadísticas de demandas y audiencias";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getLawsuitsHearingsByMonth][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener estadísticas de procesos por estado
  const getProcessesByState = useCallback(async (data: ProcessesByStateBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getProcessesByState]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getProcessesByState(data, token);

      if ("data" in result) {
        setProcessesByStateData(result.data);
        console.log("[ESTADISTICAS_HOOK][getProcessesByState][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getProcessesByState][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener estadísticas de procesos por estado";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getProcessesByState][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener estadísticas de procesos por estado y año
  const getProcessesByStateYear = useCallback(async (data: ProcessesByStateYearBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getProcessesByStateYear]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getProcessesByStateYear(data, token);

      if ("data" in result) {
        setProcessesByStateYearData(result.data);
        console.log("[ESTADISTICAS_HOOK][getProcessesByStateYear][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getProcessesByStateYear][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener estadísticas de procesos por estado y año";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getProcessesByStateYear][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener estadísticas de procesos finalizados por estado y año
  const getFinishedProcessesByStateYear = useCallback(async (data: FinishedProcessesByStateYearBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getFinishedProcessesByStateYear]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getFinishedProcessesByStateYear(data, token);

      if ("data" in result) {
        setFinishedProcessesByStateYearData(result.data);
        console.log("[ESTADISTICAS_HOOK][getFinishedProcessesByStateYear][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getFinishedProcessesByStateYear][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener estadísticas de procesos finalizados";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getFinishedProcessesByStateYear][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener métricas por departamento y ciudad
  const getDepartmentCityMetrics = useCallback(async () => {
    try {
      console.log("[ESTADISTICAS_HOOK][getDepartmentCityMetrics]: Iniciando");
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getDepartmentCityMetrics(token);

      if ("data" in result) {
        setDepartmentCityData(result.data);
        console.log("[ESTADISTICAS_HOOK][getDepartmentCityMetrics][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getDepartmentCityMetrics][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener métricas por departamento y ciudad";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getDepartmentCityMetrics][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener porcentajes por departamento
  const getPercentageByDepartment = useCallback(async () => {
    try {
      console.log("[ESTADISTICAS_HOOK][getPercentageByDepartment]: Iniciando");
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getPercentageByDepartment(token);

      if ("data" in result) {
        setPercentageByDepartmentData(result.data);
        console.log("[ESTADISTICAS_HOOK][getPercentageByDepartment][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getPercentageByDepartment][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener porcentajes por departamento";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getPercentageByDepartment][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener demandas radicadas por usuario
  const getFiledLawsuitsByUser = useCallback(async (data: FiledLawsuitsByUserBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getFiledLawsuitsByUser]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getFiledLawsuitsByUser(data, token);

      if ("data" in result) {
        setFiledLawsuitsByUserData(result.data);
        console.log("[ESTADISTICAS_HOOK][getFiledLawsuitsByUser][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getFiledLawsuitsByUser][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener demandas radicadas por usuario";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getFiledLawsuitsByUser][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener estadísticas de documentación
  const getDocumentationStatistics = useCallback(async () => {
    try {
      console.log("[ESTADISTICAS_HOOK][getDocumentationStatistics]: Iniciando");
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getDocumentationStatistics(token);

      if ("data" in result) {
        setDocumentationData(result.data);
        console.log("[ESTADISTICAS_HOOK][getDocumentationStatistics][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getDocumentationStatistics][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener estadísticas de documentación";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getDocumentationStatistics][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener documentación mensual
  const getDocumentationMonthly = useCallback(async (data: DocumentationMonthlyBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getDocumentationMonthly]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getDocumentationMonthly(data, token);

      if ("data" in result) {
        setDocumentationMonthlyData(result.data);
        console.log("[ESTADISTICAS_HOOK][getDocumentationMonthly][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getDocumentationMonthly][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener documentación mensual";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getDocumentationMonthly][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Obtener seguimiento de procesos
  const getProcessTracking = useCallback(async (data: ProcessTrackingBody) => {
    try {
      console.log("[ESTADISTICAS_HOOK][getProcessTracking]: Iniciando", data);
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      const result = await estadisticasRepository.getProcessTracking(data, token);

      if ("data" in result) {
        setProcessTrackingData(result.data);
        console.log("[ESTADISTICAS_HOOK][getProcessTracking][Success]:", result.data);
        return result.data;
      } else {
        const errorMsg = Array.isArray(result.message) ? result.message.join(", ") : result.message;
        setError(errorMsg);
        toast.error(errorMsg);
        console.error("[ESTADISTICAS_HOOK][getProcessTracking][Error]:", result);
        throw new Error(errorMsg);
      }
    } catch (err: any) {
      const errorMsg = err?.message || "Error inesperado al obtener seguimiento de procesos";
      setError(errorMsg);
      toast.error(errorMsg);
      console.error("[ESTADISTICAS_HOOK][getProcessTracking][Catch]:", err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [estadisticasRepository, getAuthToken]);

  // Función para limpiar todos los datos
  const clearData = useCallback(() => {
    setActiveInactiveData(null);
    setLawsuitsHearingsData(null);
    setProcessesByStateData(null);
    setProcessesByStateYearData(null);
    setFinishedProcessesByStateYearData(null);
    setDepartmentCityData(null);
    setPercentageByDepartmentData(null);
    setFiledLawsuitsByUserData(null);
    setDocumentationData(null);
    setDocumentationMonthlyData(null);
    setProcessTrackingData(null);
    setError(null);
  }, []);

  return {
    // Estados
    loading,
    error,
    activeInactiveData,
    lawsuitsHearingsData,
    processesByStateData,
    processesByStateYearData,
    finishedProcessesByStateYearData,
    departmentCityData,
    percentageByDepartmentData,
    filedLawsuitsByUserData,
    documentationData,
    documentationMonthlyData,
    processTrackingData,
    
    // Métodos
    getActiveInactiveByMonth,
    getLawsuitsHearingsByMonth,
    getProcessesByState,
    getProcessesByStateYear,
    getFinishedProcessesByStateYear,
    getDepartmentCityMetrics,
    getPercentageByDepartment,
    getFiledLawsuitsByUser,
    getDocumentationStatistics,
    getDocumentationMonthly,
    getProcessTracking,
    clearData,
  };
};
