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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import container from "@/lib/di/container";
import { AuthRepositoryImpl } from "../data/repositories/auth.repository";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { RegisterByActivationCodeSuccessResponse, ErrorResponse } from "@/modules/auth/data/interfaces/auth-responses";

const activationRegisterSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  lastname: z.string().min(2, "El apellido debe tener al menos 2 caracteres"),
  email: z.string().email("Por favor ingrese un correo electrónico válido"),
  phone: z.string().min(7, "El teléfono debe tener al menos 7 dígitos"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
  activationCode: z.string().min(4, "El código debe tener al menos 4 caracteres"),
  roles: z.array(z.string().min(1)).min(1, "Debe asignar al menos un rol"),
  registro_medico: z.string().optional(),
  entidad_de_salud: z.array(z.string()).optional(),
  central_de_mezclas: z.string().optional(),
  he_leido: z.boolean().refine((val) => val === true, "Debes aceptar los términos y condiciones"),
});

export const RegisterByActivationForm = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const form = useForm<z.infer<typeof activationRegisterSchema>>({
    resolver: zodResolver(activationRegisterSchema),
    defaultValues: {
      name: "",
      lastname: "",
      email: "",
      phone: "",
      password: "",
      activationCode: "",
      roles: ["user"], // Valor por defecto
      registro_medico: "",
      entidad_de_salud: [],
      central_de_mezclas: "",
      he_leido: false,
    },
  });

  async function onSubmit(values: z.infer<typeof activationRegisterSchema>) {
    try {
      setIsRegistering(true);
      const authRepository = container.get(AuthRepositoryImpl);
      const resp = await authRepository.registerByActivationCode(values);

      if ("token" in resp) {
        toast.success(resp.message, { position: "top-right", closeButton: true });
        setErrorMessage("");
        router.push("/auth/login");
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
        <div className="text-gray-800 font-sans text-3xl font-semibold pt-4">Registro por activación</div>
        <div className="text-gray-500 text-sm mt-2 mb-4">Completa los datos y el código de activación</div>
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
              name="activationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de activación</FormLabel>
                  <FormControl>
                    <Input placeholder="Código" {...field} disabled={isRegistering} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registro_medico"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Registro médico (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Registro médico" {...field} disabled={isRegistering} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="entidad_de_salud"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Entidad de salud (opcional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Entidades (separadas por coma)"
                      value={field.value?.join(", ") || ""}
                      onChange={(e) => field.onChange(e.target.value.split(",").map((r) => r.trim()))}
                      disabled={isRegistering}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="central_de_mezclas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Central de mezclas (opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Central de mezclas" {...field} disabled={isRegistering} />
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
                    Acepto los términos y condiciones
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
                    <span>Registrando...</span>
                    <Loader2 className="animate-spin h-4 w-4 text-white" />
                  </div>
                ) : (
                  "Registrarse"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};