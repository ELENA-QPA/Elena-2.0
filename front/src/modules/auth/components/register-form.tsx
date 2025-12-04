"use client";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
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
import { Alert, AlertTitle } from "@/components/ui/alert";

const registerSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  roles: z.array(z.string().min(1)).min(1, "Debe asignar al menos un rol"),
  he_leido: z.boolean().refine((val) => val === true, "Debes aceptar los términos y condiciones"),
});

export const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      lastname: "",
      email: "",
      phone: "",
      password: "",
      roles: ["user"],
      he_leido: false,
    },
  });

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    try {
      setIsRegistering(true);
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.register(values);

      if ("token" in resp) {
        toast.success(resp.message, { position: "top-right", closeButton: true });
        setErrorMessage("");
        router.push(routes.auth.login);
      } else {
        const errorMsg = Array.isArray(resp.message) ? resp.message.join(", ") : resp.message;
        setErrorMessage(errorMsg);
        toast.error(errorMsg, { position: "top-right", closeButton: true });
      }
    } catch (error: any) {
      const errorMsg = error?.message || "Error inesperado al registrar";
      setErrorMessage(errorMsg);
      toast.error(errorMsg, { position: "top-right", closeButton: true });
    } finally {
      setIsRegistering(false);
    }
  }

  return (
    <Card className="w-full max-w-[380px] rounded-2xl py-4 shadow-lg border-0 bg-white">
      <div className="flex flex-col justify-center place-items-center">
        <div className="text-gray-800 font-sans text-3xl font-semibold pt-4">Crear una cuenta</div>
        <div className="text-gray-500 text-sm mt-2 mb-4">
          <Link href={routes.auth.login} className="text-blue-600 hover:underline">
            ¿Ya tienes una cuenta? Inicia sesión
          </Link>
        </div>
      </div>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre" {...field} disabled={isRegistering} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apellido</FormLabel>
                  <FormControl>
                    <Input placeholder="Apellido" {...field} disabled={isRegistering} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Correo electrónico</FormLabel>
                  <FormControl>
                    <Input placeholder="correo@ejemplo.com" {...field} disabled={isRegistering} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teléfono</FormLabel>
                  <FormControl>
                    <Input placeholder="Teléfono" {...field} disabled={isRegistering} />
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
                        disabled={isRegistering}
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
              name="he_leido"
              render={({ field }) => (
                <FormItem className="flex items-center space-x-2">
                  <FormControl>
                    <input
                      type="checkbox"
                      id="he_leido"
                      className="w-4 h-4"
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                      disabled={isRegistering}
                    />
                  </FormControl>
                  <FormLabel htmlFor="he_leido" className="text-sm text-gray-600">
                    He leído los términos y condiciones
                  </FormLabel>
                  <FormMessage />
                </FormItem>
              )}
            />
            <input type="hidden" value="user" {...form.register("roles.0")} />
            {errorMessage && (
              <Alert variant="destructive" className="flex items-center bg-destructive/5">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="mt-1">{errorMessage}</AlertTitle>
              </Alert>
            )}
            <div className="flex justify-center">
              <Button
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-medium"
                disabled={isRegistering}
                type="submit"
              >
                {isRegistering ? (
                  <div className="flex flex-row justify-center items-center space-x-2">
                    <span>Creando...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Crear cuenta"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-gray-600">
          Al crear una cuenta, aceptas nuestros{" "}
          <Link href="/terms" className="text-blue-600 hover:underline">
            Términos de servicio
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};