"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";



export function ConfirmAccount() {
  
  async function onSubmit() {
    console.log("OK");
  }

  return (
    <Card className="w-full max-w-[440px] rounded-xl p-6">
      <CardHeader className="text-center space-y-2 pb-6">
        <div className="mx-auto w-24 h-24 relative mb-4">
          <Image
            src="/illustration-email.png"
            alt="Email confirmation illustration"
            width={96}
            height={96}
            priority
          />
        </div>
        <CardTitle className="text-2xl font-bold">¡Casi llegamos!</CardTitle>
        <p className="text-sm text-muted-foreground">
          Revisa tu bandeja de entrada de correo electrónico y confirma tu
          cuenta
        </p>
      </CardHeader>

      <div className="w-full border-b my-2" />

      <CardFooter className="flex flex-col items-center pt-6">
        <p className="text-sm text-muted-foreground mb-4">
          ¿No recibiste ningún correo?
        </p>
        <Button
          variant="outline"
          className="bg-white text-blue-600 w-full hover:bg-gray-50"
          // onClick={() => /* lógica para reenviar código */}
        >
          Reenviar confirmación
        </Button>
      </CardFooter>
    </Card>
  );
}
