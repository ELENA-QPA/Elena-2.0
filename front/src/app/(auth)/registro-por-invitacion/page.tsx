import { Suspense } from "react";
import { RegisterByInvitationForm } from "@/modules/auth/components/register-by-invitation-form";

function RegisterByInvitationContent() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-4">
      <Suspense fallback={<div className="text-center">Cargando formulario...</div>}>
        <RegisterByInvitationForm />
      </Suspense>
    </div>
  );
}

export default function RegisterByInvitationPage() {
  return <RegisterByInvitationContent />;
}
