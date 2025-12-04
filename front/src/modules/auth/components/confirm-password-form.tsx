"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// 1. Esquema de validación para el código de confirmación
const formSchema = z.object({
  code: z.string().nonempty("Please enter your confirmation code."),
});

export function ConfirmEmailForm() {
  // 2. Configuramos React Hook Form con Zod
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      code: "",
    },
  });

  // 3. Lógica al enviar el formulario
  async function onSubmit(values: z.infer<typeof formSchema>) {
    // Aquí iría la lógica para verificar el código de confirmación
    console.log("Confirmation Code:", values.code);
  }

  return (
    <Card className="w-full max-w-[380px] rounded-2xl py-6">
      {/* Encabezado */}
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Confirmar Email</CardTitle>
        <p className="text-sm text-gray-500 mt-2">
          Revise su correo electrónico e ingrese el código de confirmación
        </p>
      </CardHeader>

      {/* Contenido */}
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Campo: Confirmation Code */}
            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Código de confirmación</FormLabel>
                  <FormControl>
                    <Input placeholder="Entre el código" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Botón principal */}
            <Button type="submit" className="w-full">
              Confirmar Email
            </Button>
          </form>
        </Form>
      </CardContent>

      {/* Footer */}
      <CardFooter className="flex flex-col items-center">
        <div className="w-full border-b my-5" />
        <p className="text-sm text-gray-600 mb-4">
          ¿No has recibido tu código?
        </p>
        <Button
          variant="outline"
          className="bg-white text-blue-600 w-full hover:bg-gray-50"
          // onClick={() => /* lógica para reenviar código */}
        >
          Reenviar Código
        </Button>
      </CardFooter>
    </Card>
  );
}
