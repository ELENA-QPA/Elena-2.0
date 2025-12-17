"use client";

import dynamic from "next/dynamic";

const AudienciasView = dynamic(() => import("@/views/AudienciasView/AudienciasView"));

export default function AudienciasPage() {
  return <AudienciasView />;
}