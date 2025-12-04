"use client"

import dynamic from 'next/dynamic';
import Loading from '../loading';

// Lazy loading del componente pesado
const InformacionCasoFormView = dynamic(
  () => import("@/views/InformacionCasoView/InformacionCasoViewOld"),
  {
    loading: () => <Loading />,
    ssr: false // Deshabilitar SSR para este componente pesado
  }
);

export default function InformacionCasoByIdPage() {
  return <InformacionCasoFormView/>;
} 