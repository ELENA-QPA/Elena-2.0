import { getCookie } from 'cookies-next';
import { IQuote } from '../generar-cotizacion/types/quotes.types';

//Peticion para obtener cotizaciones
export const getQuotes = async (): Promise<IQuote[]> => {
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

//Peticion para crear cotizaciones
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
