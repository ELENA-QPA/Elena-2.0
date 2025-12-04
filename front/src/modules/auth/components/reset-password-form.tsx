"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertCircle, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import container from "@/lib/di/container";
import { AuthRepositoryImpl } from "@/modules/auth/data/repositories/auth.repository";
import { Alert, AlertTitle } from "@/components/ui/alert";

const resetPasswordSchema = z
  .object({
    email: z.string().email("Por favor ingrese un correo electrónico válido"),
    verificationCode: z.string().min(4, "El código debe tener al menos 4 caracteres"),
    password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirma la contraseña"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export default function ResetPasswordForm() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: "",
      verificationCode: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof resetPasswordSchema>) {
    try {
      setLoading(true);
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.verifyCodeAndUpdatePassword({
        email: values.email,
        verificationCode: values.verificationCode,
        password: values.password,
      });

      if ("success" in resp) {
        toast.success(resp.message, { position: "top-right", closeButton: true });
        setErrorMessage("");
        router.push("/login");
      } else {
        const errorMsg = Array.isArray(resp.message) ? resp.message.join(", ") : resp.message;
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { position: "top-right", closeButton: true });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error inesperado al restablecer la contraseña";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { position: "top-right", closeButton: true });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <Card className="w-full max-w-[380px] rounded-2xl py-6">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Restablecer Contraseña</CardTitle>
          <p className="text-sm text-gray-500 mt-2">Ingresa el código recibido y tu nueva contraseña</p>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correo Electrónico</FormLabel>
                    <FormControl>
                      <Input placeholder="correo@ejemplo.com" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="verificationCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de verificación</FormLabel>
                    <FormControl>
                      <Input placeholder="Código recibido" {...field} disabled={loading} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nueva contraseña</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Nueva contraseña"
                          {...field}
                          disabled={loading}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon className="h-4 w-4" /> : <EyeIcon className="h-4 w-4" />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmar nueva contraseña</FormLabel>
                    <FormControl>
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="Confirmar nueva contraseña"
                        {...field}
                        disabled={loading}
                      />
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
              <Button
                type="submit"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex flex-row justify-center items-center space-x-2">
                    <span>Restableciendo...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Restablecer Contraseña"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="flex flex-col items-center">
          <div className="w-full border-b my-5" />
          <p className="text-sm text-gray-600 mb-4">¿Recordaste tu contraseña?</p>
          <Link href="/auth/login" className="w-full">
            <Button
              variant="outline"
              className="bg-white text-blue-600 w-full hover:bg-gray-50"
              disabled={loading}
            >
              Volver a iniciar sesión
            </Button>
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}