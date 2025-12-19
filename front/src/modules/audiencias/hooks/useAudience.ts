
import { useState } from 'react';
import container from '@/lib/di/container';
import { AudienceRepository } from '../data/repositories/audience.repository';
import { Evento } from '../data/interfaces/audiencias.interface';
import { getToken } from '@/utilities/helpers/auth/checkAuth';

export function useAudience() {
  const [audiences, setAudiences] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audienceRepository =
    container.get<AudienceRepository>('AudienceRepository');

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

  return {
    audiences,
    loading,
    error,
    fetchAllAudiences,
    fetchAudiencesByLawyer,
  };
}
