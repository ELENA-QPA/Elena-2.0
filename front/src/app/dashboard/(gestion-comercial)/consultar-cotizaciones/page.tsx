'use client';

import { useGetAllQuotes } from '../api/useQuotes';

export default function ConsultQuotesPage() {
  //Todas las cotizaciones de la base de datos
  const { data } = useGetAllQuotes();
  console.log(data);

  return <main>Hola desde la grilla de cotizaciones</main>;
}
