"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Phone, User } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";
import { routes } from "@/config/routes/routes";
import { useRouter } from "next-nprogress-bar";
import { IUser } from "@/data/interfaces/user.interface";

interface AppBarProps {
  user?: IUser;
  className?: string;
}

export const AppBar = ({ user, className, ...props }: AppBarProps) => {
  const router = useRouter();

  function logout() {
    deleteCookie(CookiesKeysEnum.token);
    router.replace(routes.auth.login);
  }

  return (
    <header
      className={cn(
        "h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200",
        className
      )}
      {...props}
    >
      {/* Logo */}
      <div className="flex items-center">
        <Link href="/dashboard" className="flex items-center">
          <Image
            src="/logo ELENA.png"
            alt="Elena Logo"
            width={120}
            height={40}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Right side - Icons and user menu */}
      <div className="flex items-center space-x-4">
        {/* Phone icon */}
        <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
          <Phone className="h-5 w-5" />
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full w-8 h-8"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => router.push('/dashboard/perfil')}>
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/dashboard/configuracion')}>
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem onClick={logout} className="text-red-600">
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
