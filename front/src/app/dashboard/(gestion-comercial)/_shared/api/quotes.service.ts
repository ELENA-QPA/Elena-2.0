import { getCookie } from 'cookies-next';
import type { IQuote, IQuoteWithMeta } from '../types/quotes.types';

interface QuotesResponse {
  data: IQuoteWithMeta[];
  total: number;
}

export const getQuotes = async (): Promise<QuotesResponse> => {
  const token = getCookie('token');

  if (!token) {
    throw new Error('No se pudo obtener el token de acceso');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener las cotizaciones');
  }

  return response.json();
};

export const createQuote = async (payload: IQuote): Promise<IQuote | void> => {
  const token = getCookie('token');

  if (!token) {
    throw new Error('No se pudo obtener el token de acceso');
  }

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al crear la cotizacion');
  }

  return response.json();
};

export const getQuoteById = async (id: string): Promise<IQuoteWithMeta> => {
  const token = getCookie('token');
  if (!token) throw new Error('No se pudo obtener el token de acceso');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al obtener la cotización');
  }

  return response.json();
};

export const updateQuote = async (
  id: string,
  payload: any
): Promise<IQuoteWithMeta> => {
  const token = getCookie('token');
  if (!token) throw new Error('No se pudo obtener el token de acceso');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al actualizar la cotización');
  }

  return response.json();
};

export const pushTimelineEvent = async (
  id: string,
  event: { type: string; detail: string }
): Promise<void> => {
  const token = getCookie('token');
  if (!token) return;

  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/timeline`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(event),
  });
};

export const downloadQuotePdf = async (
  id: string,
  quoteId: string | undefined
): Promise<void> => {
  const token = getCookie('token');
  if (!token) throw new Error('No se pudo obtener el token de acceso');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/pdf`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) throw new Error('Error al descargar el PDF');

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cotizacion-${quoteId}.pdf`;
  a.click();
  window.URL.revokeObjectURL(url);
};

export const deleteQuote = async (id: string): Promise<void> => {
  const token = getCookie('token');
  if (!token) throw new Error('No se pudo obtener el token de acceso');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al eliminar la cotización');
  }
};

export const sendQuote = async (id: string, email?: string): Promise<any> => {
  const token = getCookie('token');
  if (!token) throw new Error('No se pudo obtener el token de acceso');

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/api/quotes/${id}/send`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ email }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Error al enviar la cotización');
  }

  return response.json();
};
