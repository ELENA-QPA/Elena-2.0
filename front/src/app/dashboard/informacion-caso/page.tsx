"use client"
console.log('?? PAGE.TSX CARGADO');

import dynamic from 'next/dynamic';
import Loading from './loading';

// Lazy loading del componente pesado con loading personalizado
const InformacionCasoView = dynamic(
  () => import("@/views/InformacionCasoView/InformacionCasoViewOld"),
  {
    loading: () => <Loading />,
    ssr: false // Deshabilitar SSR para este componente pesado
  }
);

const ModeSelector = dynamic(
  () => import("@/views/InformacionCasoView/ModeSelector"),
  {
    loading: () => <div className="h-16 animate-pulse bg-gray-200 rounded"></div>,
    ssr: true
  }
);

export default function InformacionCasoPage() {
  return (
    <div>
      {/* <ModeSelector /> */}
      <InformacionCasoView />
    </div>
  );
}

