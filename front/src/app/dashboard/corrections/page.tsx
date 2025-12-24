"use client";

import dynamic from "next/dynamic";

const CorrectionsView = dynamic(
  () => import("@/views/CorrectionsView/CorrectionView")
);

export default function AudienciasPage() {
  return <CorrectionsView />;
}
