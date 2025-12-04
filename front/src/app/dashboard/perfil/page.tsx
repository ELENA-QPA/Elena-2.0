import dynamic from "next/dynamic";

const PerfilView = dynamic(() => import("@/views/PerfilView/PerfilView"));

export default function PerfilPage() {
  return <PerfilView />;
}
