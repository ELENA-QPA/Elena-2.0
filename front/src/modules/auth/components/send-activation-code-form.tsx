"use client";
import { useState } from "react";
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
import { SendActivationCodeSuccessResponse, ErrorResponse } from "@/modules/auth/data/interfaces/auth-responses";

const activationSchema = z.object({
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
});

export const SendActivationCodeForm = () => {
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const form = useForm<{ email: string }>({
    resolver: zodResolver(activationSchema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: { email: string }) {
    try {
      setIsSending(true);
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.sendActivationCodeToEmail(values);

      if ("email" in resp) {
        toast.success(resp.message, { position: "top-right", closeButton: true });
        setErrorMessage("");
        router.push("/auth/register-by-activation");
      } else {
        const errorMsg = Array.isArray(resp.message) ? resp.message.join(", ") : resp.message;
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { position: "top-right", closeButton: true });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error inesperado al enviar el código";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { position: "top-right", closeButton: true });
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Card className="w-full max-w-[380px] rounded-2xl py-4 shadow-lg border-0 bg-white">
      <div className="flex flex-col justify-center place-items-center">
        <div className="text-gray-800 font-sans text-3xl font-semibold pt-4">Enviar código de activación</div>
        <div className="text-gray-500 text-sm mt-2 mb-4">Ingresa tu correo para recibir el código de activación</div>
      </div>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} disabled={isSending} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {errorMessage && (
              <Alert variant="destructive" className="flex items-center bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="mt-1">{errorMessage}</AlertTitle>
              </Alert>
            )}
            <div className="flex justify-center">
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                disabled={isSending}
                type="submit"
              >
                {isSending ? (
                  <div className="flex flex-row justify-center items-center space-x-2">
                    <span>Enviando...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Enviar código"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};