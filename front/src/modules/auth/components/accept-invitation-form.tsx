"use client";
import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import container from "@/lib/di/container";
import { AuthRepositoryImpl } from "../data/repositories/auth.repository";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { AcceptInvitationSuccessResponse, ErrorResponse } from "@/modules/auth/data/interfaces/auth-responses";

const acceptSchema = z.object({
  token: z.string().min(10, "El token debe tener al menos 10 caracteres"),
});

interface AcceptInvitationFormProps {
  initialToken?: string;
}

export const AcceptInvitationForm = ({ initialToken = '' }: AcceptInvitationFormProps) => {
  const [isAccepting, setIsAccepting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const form = useForm<{ token: string }>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { token: initialToken },
  });

  // Actualizar el token cuando cambie la prop
  useEffect(() => {
    if (initialToken) {
      form.setValue('token', initialToken);
    }
  }, [initialToken, form]);

  async function onSubmit(values: { token: string }) {
    try {
      setIsAccepting(true);
      setErrorMessage("");
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.acceptInvitation(values.token);

      if ("_id" in resp) {
        toast.success("Invitación aceptada exitosamente", { position: "top-right", closeButton: true });
        setErrorMessage("");
        
        // Crear un objeto con los datos del usuario para pasar al registro
        const userData = {
          id: resp._id, // Incluir el _id como id
          name: resp.name,
          lastname: resp.lastname,
          email: resp.email,
          phone: resp.phone,
          roles: resp.roles,
          entidad: resp.entidad,
        };
        
        // Codificar los datos del usuario en base64 para pasarlos por URL
        const userDataEncoded = btoa(JSON.stringify(userData));
        
        // Esperar un momento antes de redirigir para que el usuario vea el mensaje
        setTimeout(() => {
          router.push(`/registro-por-invitacion?token=${encodeURIComponent(values.token)}&userData=${encodeURIComponent(userDataEncoded)}`);
        }, 1500);
      } else {
        const errorMsg = Array.isArray(resp.message) ? resp.message.join(", ") : resp.message;
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { position: "top-right", closeButton: true });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error inesperado al aceptar la invitación";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { position: "top-right", closeButton: true });
    } finally {
      setIsAccepting(false);
    }
  }

  return (
    <Card className="w-full max-w-[380px] rounded-2xl py-4 shadow-lg border-0 bg-white">
      <div className="flex flex-col justify-center place-items-center">
        <div className="text-gray-800 font-sans text-3xl font-semibold pt-4">Aceptar invitación</div>
        <div className="text-gray-500 text-sm mt-2 mb-4">
          {initialToken 
            ? "Confirma para aceptar tu invitación al equipo" 
            : "Ingresa el token recibido para aceptar la invitación"
          }
        </div>
      </div>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo oculto para el token */}
            <input type="hidden" {...form.register('token')} />
            
            <div className="text-center py-8">
              <div className="mb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Invitación válida
              </h3>
              <p className="text-gray-600 mb-6">
                Tu invitación ha sido verificada correctamente. Haz clic en el botón para aceptarla y continuar con el registro.
              </p>
            </div>

            {errorMessage && (
              <Alert variant="destructive" className="flex items-center bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="mt-1">{errorMessage}</AlertTitle>
              </Alert>
            )}
            <div className="flex justify-center">
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                disabled={isAccepting}
                type="submit"
              >
                {isAccepting ? (
                  <div className="flex flex-row justify-center items-center space-x-2">
                    <span>Aceptando...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Aceptar invitación"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};