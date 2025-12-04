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
import { AlertCircle, EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import Link from "next/link";
import { routes } from "@/config";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import container from "@/lib/di/container";
import { AuthRepositoryImpl } from "../data/repositories/auth.repository";
import { setCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { LoginSuccessResponse, ErrorResponse } from "@/modules/auth/data/interfaces/auth-responses";
import { Label } from "@/components/ui/label";

const loginSchema = z.object({
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  entidad: z.array(z.string()).optional(),
  keepSignedIn: z.boolean().optional(),
});

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      entidad: [],
      keepSignedIn: false,
    },
  });

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    try {
      setIsLogging(true);
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.login({
        email: values.email,
        password: values.password,
      });

      // Verificar si es una respuesta exitosa o de error
      const isSuccess = 'token' in resp;
      
      if (isSuccess) {
        // Es una respuesta exitosa
        const successResp = resp as LoginSuccessResponse;
        const token = successResp.token;
        const userData = successResp.user as any;
        const message = successResp.message || (userData.name ? `Bienvenido ${userData.name}` : "Inicio de sesión exitoso");

        setCookie(CookiesKeysEnum.token, token, { maxAge: values.keepSignedIn ? 30 * 24 * 60 * 60 : undefined });
        if (userData) {
          window.localStorage.setItem("user", JSON.stringify(userData));
          if (userData.roles && userData.roles.length > 0) {
            setCookie(CookiesKeysEnum.role, userData.roles[0]);
          }
        }
        toast.success(message, { position: "top-right", closeButton: true });
        setErrorMessage("");
        router.push(routes.dashboard);
      } else {
        // Es una ErrorResponse
        const errorResp = resp as ErrorResponse;
        const errorMsg = Array.isArray(errorResp.message) ? errorResp.message.join(", ") : errorResp.message || errorResp.error || "Error al iniciar sesión";
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { position: "top-right", closeButton: true });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error inesperado al iniciar sesión";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { position: "top-right", closeButton: true });
    } finally {
      setIsLogging(false);
    }
  }

  return (
    <Card className="w-full max-w-[380px] rounded-2xl py-4 shadow-lg border-0 bg-white">
      <div className="flex flex-col justify-center place-items-center">
        <div className="text-gray-800 font-sans text-3xl font-semibold pt-4">Acceder</div>
        <div className="text-gray-500 text-sm mt-2 mb-4">Inicia sesión en tu cuenta</div>
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
                    <Input placeholder="correo@ejemplo.com" {...field} disabled={isLogging} />
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
                  <FormLabel>Contraseña</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                        disabled={isLogging}
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
              name="keepSignedIn"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="keepSignedIn"
                      className="w-4 h-4"
                      checked={field.value}
                      onChange={(e: any) => field.onChange(e.target.checked)}
                      disabled={isLogging}
                    />
                  </FormControl>
                  <FormLabel htmlFor="keepSignedIn" className="text-sm text-gray-600">
                    Mantenerme conectado
                  </FormLabel>
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
                disabled={isLogging}
                type="submit"
              >
                {isLogging ? (
                  <div className="flex flex-row justify-center items-center space-x-2">
                    <span>Iniciando...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Iniciar sesión"
                )}
              </Button>
            </div>
          </form>
        </Form>
        <div className="flex flex-col items-center mt-4 space-y-2">
          {/* <Link href={routes.auth.register} className="text-pink-600 hover:underline text-sm font-medium">
            ¿No tienes cuenta? Regístrate aquí
          </Link> */}
          <Link href={routes.auth.forgotPassword} className="text-blue-600 hover:underline text-sm font-medium">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}