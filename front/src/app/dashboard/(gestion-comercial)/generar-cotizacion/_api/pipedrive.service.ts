import { getCookie } from 'cookies-next';
import type { IPipeDriveDetail, IPipeDriveSearchResult } from '../types/pipedrive.types';

export const getPipeDriveSearch = async (
  searchTerm: string
): Promise<IPipeDriveSearchResult[]> => {
  const token = getCookie('token');

  if (!token) {
    throw new Error('No se pudo obtener el token de acceso');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pipedrive/search?searchTerm=${encodeURIComponent(searchTerm)}&item_types=person&item_types=organization`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener datos de pipedrive');
  }

  return response.json();
};

export const getPipeDriveDetail = async (
  id: number,
  type: 'organization' | 'person'
): Promise<IPipeDriveDetail> => {
  const token = getCookie('token');

  if (!token) {
    throw new Error('No se pudo obtener el token de acceso');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/pipedrive/detail?id=${id}&type=${type}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener detalle de pipedrive');
  }

  return response.json();
};
