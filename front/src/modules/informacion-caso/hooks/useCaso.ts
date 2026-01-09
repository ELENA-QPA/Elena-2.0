import { useCallback, useMemo, useState } from "react";

import container from "@/lib/di/container";
import { CasoRepository } from "../data/repositories/caso.repository";
import {
  Caso,
  CreateCasoBody,
  UpdateDocumentBody,
  CreateDocumentBody,
  CreateIntervenerBody,
  CreateProceduralPartBody,
  CreatePaymentBody,
  CreateParameterBody,
  SearchParametersBody,
  CreateCasoSuccessResponse,
  GetCasoSuccessResponse,
  CasosPaginatedResponse,
  CreateDocumentSuccessResponse,
  CreateIntervenerSuccessResponse,
  CreateProceduralPartSuccessResponse,
  CreatePaymentSuccessResponse,
  CreateParameterSuccessResponse,
  ParametersPaginatedResponse,
  FileUploadResponse,
  MultipleFileUploadResponse,
  FileInfoResponse,
  ErrorResponse,
} from "../data/interfaces/caso.interface";

export function useCaso() {
  const [caso, setCaso] = useState<Caso | null>(null);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const casoRepository = useMemo(() => container.get(CasoRepository), []);

  const createCaso = async (
    data: CreateCasoBody,
    token?: string
  ): Promise<CreateCasoSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][createCaso]: Iniciando creación de caso");
      // Si no se pasa token, dejar que el repository use las cookies automáticamente
      const response = await casoRepository.createCaso(data, token);
      console.log("[USECASO][createCaso][Response]:", response);

      if ("record" in response) {
        console.log("[USECASO][createCaso][Success]: Caso creado exitosamente");
        return response;
      } else {
        console.error("[USECASO][createCaso][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createCaso][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al crear caso";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const getAllCasos = async (
    limit: number = 50,
    offset: number = 0
  ): Promise<CasosPaginatedResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await casoRepository.getAllCasos(limit, offset);

      if ("records" in response) {
        setCasos(response.records);
        return response;
      } else {
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error inesperado al cargar casos";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const getCasoById = async (
    id: string,
    token?: string
  ): Promise<GetCasoSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      const response = await casoRepository.getCasoById(id, token);

      if ("record" in response) {
        setCaso(response.record);
        return response;
      } else {
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error inesperado al cargar caso";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  // Actuaciones / Performances
  const createPerformance = async (data: any): Promise<any> => {
    setLoading(true);
    setError(null);
    try {
      const response = await casoRepository.createPerformance(data);
      if ("performance" in response) {
        // actualizar estado local
        setCaso((prev) => {
          if (!prev) return prev;
          const perf = response.performance as any;
          const existing = prev.performances || [];
          return { ...prev, performances: [...existing, perf] } as any;
        });
        return response;
      } else {
        const errMsg = Array.isArray((response as any).message)
          ? (response as any).message.join(", ")
          : (response as any).message;
        setError(errMsg);
        return response;
      }
    } catch (err: any) {
      const errorMsg = err.message || "Error inesperado al crear actuación";
      setError(errorMsg);
      return { statusCode: 500, message: errorMsg, error: "Unknown" };
    } finally {
      setLoading(false);
    }
  };

  const deletePerformance = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][deletePerformance]:", id);
      const response = await casoRepository.deletePerformance(id);
      console.log("[USECASO][deletePerformance][Response]:", response);
      if ("message" in response) {
        // remover del estado local
        setCaso((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            performances: (prev.performances || []).filter(
              (p) => p._id !== id && (p as any).id !== id
            ),
          } as any;
        });
        return response;
      } else {
        const errMsg = Array.isArray((response as any).message)
          ? (response as any).message.join(", ")
          : (response as any).message;
        setError(errMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][deletePerformance][Error]:", err);
      setError(err.message || "Error inesperado al eliminar actuación");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Actualizar información general del caso (PATCH /api/records/{id})
  const updateCaso = async (
    id: string,
    data: any
  ): Promise<GetCasoSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][updateCaso]: Iniciando actualización de caso", {
        id,
        data,
      });
      const response = await casoRepository.updateCaso(id, data);
      console.log("[USECASO][updateCaso][Response]:", response);
      if ("record" in response) {
        console.log("[USECASO][updateCaso][Success]: Caso actualizado");
        // Actualizar estado local con el nuevo caso
        setCaso(response.record);
        return response;
      } else {
        console.error("[USECASO][updateCaso][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][updateCaso][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al actualizar caso";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteCaso = async (
    id: string
  ): Promise<{ message: string } | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][deleteCaso]: Iniciando eliminación de caso", {
        id,
      });
      const response = await casoRepository.deleteCaso(id);
      console.log("[USECASO][deleteCaso][Response]:", response);

      if ("message" in response && !("statusCode" in response)) {
        console.log(
          "[USECASO][deleteCaso][Success]: Caso eliminado exitosamente"
        );
        // Remover caso del estado local si existe
        setCasos((prev) => prev.filter((caso) => caso._id !== id));
        if (caso && caso._id === id) {
          setCaso(null);
        }
        return response;
      } else {
        console.error("[USECASO][deleteCaso][Error]:", response);
        const errorMsg = Array.isArray((response as ErrorResponse).message)
          ? ((response as ErrorResponse).message as string[]).join(", ")
          : ((response as ErrorResponse).message as string);
        setError(errorMsg);
        return response as ErrorResponse;
      }
    } catch (err: any) {
      console.error("[USECASO][deleteCaso][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al eliminar caso";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  // Documentos
  const updateDocument = async (id: string, data: UpdateDocumentBody) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][updateDocument]: Iniciando actualización de documento",
        { id }
      );
      const response = await casoRepository.updateDocument(id, data);
      console.log("[USECASO][updateDocument][Success]: Documento actualizado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][updateDocument][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const createDocument = async (
    data: CreateDocumentBody
  ): Promise<CreateDocumentSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][createDocument]: Iniciando creación de documento",
        data
      );
      const response = await casoRepository.createDocument(data);
      console.log("[USECASO][createDocument][Response]:", response);

      if ("document" in response) {
        console.log(
          "[USECASO][createDocument][Success]: Documento creado exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][createDocument][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createDocument][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al crear documento";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteDocument = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][deleteDocument]: Iniciando eliminación de documento",
        { id }
      );
      const response = await casoRepository.deleteDocument(id);
      console.log("[USECASO][deleteDocument][Success]: Documento eliminado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][deleteDocument][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Intervinientes
  const createIntervener = async (
    data: CreateIntervenerBody
  ): Promise<CreateIntervenerSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][createIntervener]: Iniciando creación de interviniente"
      );
      const response = await casoRepository.createIntervener(data);
      console.log("[USECASO][createIntervener][Response]:", response);

      if ("record" in response) {
        console.log(
          "[USECASO][createIntervener][Success]: Interviniente creado exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][createIntervener][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createIntervener][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al crear interviniente";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const updateIntervener = async (id: string, data: CreateIntervenerBody) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][updateIntervener]: Iniciando actualización de interviniente",
        { id }
      );
      const response = await casoRepository.updateIntervener(id, data);
      console.log(
        "[USECASO][updateIntervener][Success]: Interviniente actualizado"
      );
      return response;
    } catch (err: any) {
      console.error("[USECASO][updateIntervener][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteIntervener = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][deleteIntervener]: Iniciando eliminación de interviniente",
        { id }
      );
      const response = await casoRepository.deleteIntervener(id);
      console.log(
        "[USECASO][deleteIntervener][Success]: Interviniente eliminado"
      );
      return response;
    } catch (err: any) {
      console.error("[USECASO][deleteIntervener][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Partes Procesales
  const createProceduralPart = async (
    data: CreateProceduralPartBody
  ): Promise<CreateProceduralPartSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][createProceduralPart]: Iniciando creación de parte procesal"
      );
      const response = await casoRepository.createProceduralPart(data);
      console.log("[USECASO][createProceduralPart][Response]:", response);

      if ("proceduralPart" in response) {
        console.log(
          "[USECASO][createProceduralPart][Success]: Parte procesal creada exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][createProceduralPart][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createProceduralPart][Catch Error]:", err);
      const errorMsg =
        err.message || "Error inesperado al crear parte procesal";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const updateProceduralPart = async (
    id: string,
    data: CreateProceduralPartBody
  ) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][updateProceduralPart]: Iniciando actualización de parte procesal",
        { id }
      );
      const response = await casoRepository.updateProceduralPart(id, data);
      console.log(
        "[USECASO][updateProceduralPart][Success]: Parte procesal actualizada"
      );
      return response;
    } catch (err: any) {
      console.error("[USECASO][updateProceduralPart][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteProceduralPart = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][deleteProceduralPart]: Iniciando eliminación de parte procesal",
        { id }
      );
      const response = await casoRepository.deleteProceduralPart(id);
      console.log(
        "[USECASO][deleteProceduralPart][Success]: Parte procesal eliminada"
      );
      return response;
    } catch (err: any) {
      console.error("[USECASO][deleteProceduralPart][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Pagos
  const createPayment = async (
    data: CreatePaymentBody
  ): Promise<CreatePaymentSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][createPayment]: Iniciando creación de pago");
      const response = await casoRepository.createPayment(data);
      console.log("[USECASO][createPayment][Response]:", response);

      if ("record" in response) {
        console.log(
          "[USECASO][createPayment][Success]: Pago creado exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][createPayment][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createPayment][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al crear pago";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const updatePayment = async (id: string, data: CreatePaymentBody) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][updatePayment]: Iniciando actualización de pago", {
        id,
      });
      const response = await casoRepository.updatePayment(id, data);
      console.log("[USECASO][updatePayment][Success]: Pago actualizado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][updatePayment][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePayment = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][deletePayment]: Iniciando eliminación de pago", {
        id,
      });
      const response = await casoRepository.deletePayment(id);
      console.log("[USECASO][deletePayment][Success]: Pago eliminado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][deletePayment][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Parámetros
  const createParameter = async (
    data: CreateParameterBody
  ): Promise<CreateParameterSuccessResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][createParameter]: Iniciando creación de parámetro"
      );
      const response = await casoRepository.createParameter(data);
      console.log("[USECASO][createParameter][Response]:", response);

      if ("record" in response) {
        console.log(
          "[USECASO][createParameter][Success]: Parámetro creado exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][createParameter][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][createParameter][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al crear parámetro";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const searchParameters = async (
    data: SearchParametersBody,
    limit: number = 10,
    offset: number = 0
  ): Promise<ParametersPaginatedResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][searchParameters]: Iniciando búsqueda de parámetros",
        { data, limit, offset }
      );
      const response = await casoRepository.searchParameters(
        data,
        limit,
        offset
      );
      console.log("[USECASO][searchParameters][Response]:", response);

      if ("records" in response && Array.isArray(response.records)) {
        console.log(
          "[USECASO][searchParameters][Success]: Parámetros encontrados",
          { count: response.records.length }
        );
        return response as ParametersPaginatedResponse;
      } else {
        console.error("[USECASO][searchParameters][Error]:", response);
        const errorResponse = response as ErrorResponse;
        const errorMsg = Array.isArray(errorResponse.message)
          ? errorResponse.message.join(", ")
          : errorResponse.message;
        setError(errorMsg);
        return errorResponse;
      }
    } catch (err: any) {
      console.error("[USECASO][searchParameters][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al buscar parámetros";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteParameter = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][deleteParameter]: Iniciando eliminación de parámetro",
        { id }
      );
      const response = await casoRepository.deleteParameter(id);
      console.log("[USECASO][deleteParameter][Success]: Parámetro eliminado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][deleteParameter][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Archivos
  const uploadSingleFile = async (
    file: File
  ): Promise<FileUploadResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][uploadSingleFile]: Iniciando subida de archivo", {
        fileName: file.name,
        fileSize: file.size,
      });
      const response = await casoRepository.uploadSingleFile(file);
      console.log("[USECASO][uploadSingleFile][Response]:", response);

      if ("record" in response) {
        console.log(
          "[USECASO][uploadSingleFile][Success]: Archivo subido exitosamente"
        );
        return response;
      } else {
        console.error("[USECASO][uploadSingleFile][Error]:", response);
        const errorMsg = Array.isArray(response.message)
          ? response.message.join(", ")
          : response.message;
        setError(errorMsg);
        return response;
      }
    } catch (err: any) {
      console.error("[USECASO][uploadSingleFile][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al subir archivo";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const uploadMultipleFiles = async (
    files: File[]
  ): Promise<MultipleFileUploadResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][uploadMultipleFiles]: Iniciando subida de archivos",
        { fileCount: files.length }
      );
      const response = await casoRepository.uploadMultipleFiles(files);
      console.log("[USECASO][uploadMultipleFiles][Response]:", response);

      if ("records" in response && Array.isArray(response.records)) {
        console.log(
          "[USECASO][uploadMultipleFiles][Success]: Archivos subidos exitosamente",
          { count: response.records.length }
        );
        return response as MultipleFileUploadResponse;
      } else {
        console.error("[USECASO][uploadMultipleFiles][Error]:", response);
        const errorResponse = response as ErrorResponse;
        const errorMsg = Array.isArray(errorResponse.message)
          ? errorResponse.message.join(", ")
          : errorResponse.message;
        setError(errorMsg);
        return errorResponse;
      }
    } catch (err: any) {
      console.error("[USECASO][uploadMultipleFiles][Catch Error]:", err);
      const errorMsg = err.message || "Error inesperado al subir archivos";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  const deleteFile = async (s3Key: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log("[USECASO][deleteFile]: Iniciando eliminación de archivo", {
        s3Key,
      });
      const response = await casoRepository.deleteFile(s3Key);
      console.log("[USECASO][deleteFile][Success]: Archivo eliminado");
      return response;
    } catch (err: any) {
      console.error("[USECASO][deleteFile][Error]:", err);
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getFileInfo = async (): Promise<FileInfoResponse | ErrorResponse> => {
    setLoading(true);
    setError(null);
    try {
      console.log(
        "[USECASO][getFileInfo]: Iniciando obtención de información de archivos"
      );
      const response = await casoRepository.getFileInfo();
      console.log("[USECASO][getFileInfo][Response]:", response);

      if ("records" in response && Array.isArray(response.records)) {
        console.log(
          "[USECASO][getFileInfo][Success]: Información de archivos obtenida",
          { count: response.records.length }
        );
        return response as FileInfoResponse;
      } else {
        console.error("[USECASO][getFileInfo][Error]:", response);
        const errorResponse = response as ErrorResponse;
        const errorMsg = Array.isArray(errorResponse.message)
          ? errorResponse.message.join(", ")
          : errorResponse.message;
        setError(errorMsg);
        return errorResponse;
      }
    } catch (err: any) {
      console.error("[USECASO][getFileInfo][Catch Error]:", err);
      const errorMsg =
        err.message || "Error inesperado al obtener información de archivos";
      setError(errorMsg);
      return {
        statusCode: 500,
        message: errorMsg,
        error: "Unknown Error",
      };
    } finally {
      setLoading(false);
    }
  };

  // Actuaciones de Monolegal
  const getActuacionesMonolegal = useCallback(
    async (radicado: string): Promise<any[]> => {
      setLoading(true);
      setError(null);
      try {
        const response = await casoRepository.getActuacionesMonolegal(radicado);
        return response;
      } catch (err: any) {
        setError(err.message || "Error al obtener actuaciones");
        return [];
      } finally {
        setLoading(false);
      }
    },
    [casoRepository]
  );

  return {
    caso,
    casos,
    loading,
    error,
    createCaso,
    getAllCasos,
    getCasoById,
    updateCaso,
    deleteCaso,
    updateDocument,
    createDocument,
    deleteDocument,
    createIntervener,
    updateIntervener,
    deleteIntervener,
    createProceduralPart,
    updateProceduralPart,
    deleteProceduralPart,
    createPayment,
    updatePayment,
    deletePayment,
    createParameter,
    searchParameters,
    deleteParameter,
    uploadSingleFile,
    uploadMultipleFiles,
    deleteFile,
    getFileInfo,
    createPerformance,
    deletePerformance,
    getActuacionesMonolegal,
  };
}
