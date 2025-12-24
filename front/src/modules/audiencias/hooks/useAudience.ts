import { useState } from "react";
import container from "@/lib/di/container";
import { AudienceRepository } from "../data/repositories/audience.repository";
import {
  AudienceCreate,
  AudienceUpdate,
  Evento,
} from "../data/interfaces/audiencias.interface";
import { getToken } from "@/utilities/helpers/auth/checkAuth";

export function useAudience() {
  const [audiences, setAudiences] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audienceRepository =
    container.get<AudienceRepository>("AudienceRepository");

  const fetchAllAudiences = async () => {
    setLoading(true);
    try {
      const token = getToken();
      const data = await audienceRepository.getAll(token);
      setAudiences(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudience = async (AudienceId: string) => {
    setLoading(true);
    try {
      const data = await audienceRepository.getAudienceById(AudienceId);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error fetching audience:", err);
      setError(err.message || "Error fetching audiencia");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const fetchAudiencesByLawyer = async (lawyerId: string) => {
    setLoading(true);
    try {
      const data = await audienceRepository.getAllByLawyer(lawyerId);
      setAudiences(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudienceByInternalCode = async (internalCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await audienceRepository.getRecordByInternalCode(
        internalCode
      );
      setError(null);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error fetching audience:", err);
      setError(err.message || "No se encontró el código interno");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const createAudience = async (audienceData: AudienceCreate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await audienceRepository.createAudience(audienceData);
      setError(null);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error creating audience:", err);
      setError(err.message || "Error al crear la audiencia");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateAudience = async (id: string, audienceData: AudienceUpdate) => {
    setLoading(true);
    setError(null);
    try {
      const data = await audienceRepository.updateAudience(id, audienceData);
      setError(null);
      return { success: true, data };
    } catch (err: any) {
      console.error("Error updating audience:", err);
      setError(err.message || "Error al actualizar la audiencia");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    audiences,
    loading,
    error,
    setError,
    fetchAllAudiences,
    fetchAudience,
    fetchAudiencesByLawyer,
    fetchAudienceByInternalCode,
    createAudience,
    updateAudience,
  };
}
