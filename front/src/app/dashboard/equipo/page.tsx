import dynamic from "next/dynamic";

const EquipoView = dynamic(() => import("@/views/EquipoView/EquipoView"));

export default function EquipoPage() {
  return <EquipoView />;
}
