"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { AcceptInvitationForm } from "@/modules/auth/components/accept-invitation-form";
import { Loader2 } from "lucide-react";

function AcceptInvitationContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      console.log('Token recibido:', token);
    }
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">QP Alliance</h1>
          <p className="text-gray-600">
            {token ? 'Acepta tu invitación para unirte al equipo' : 'Invitación no válida'}
          </p>
        </div>
        
        <AcceptInvitationForm initialToken={token || ''} />
        
        {!token && (
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-yellow-800 text-sm text-center">
              No se encontró un token válido en la URL. Por favor, utiliza el enlace completo enviado a tu correo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
        <p className="mt-2 text-gray-600">Cargando invitación...</p>
      </div>
    </div>
  );
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AcceptInvitationContent />
    </Suspense>
  );
}
