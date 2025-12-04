"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Phone, User, Bell } from "lucide-react";
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
        "h-16 px-6 flex items-center justify-between bg-white border-b border-gray-200 shadow-sm",
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
            width={140}
            height={45}
            className="object-contain"
            priority
          />
        </Link>
      </div>

      {/* Right side - Icons and user menu */}
      <div className="flex items-center space-x-3">
        {/* Phone icon */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors"
        >
          <Phone className="h-5 w-5" />
        </Button>

        {/* Notifications */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-gray-500 hover:text-pink-600 hover:bg-pink-50 transition-colors relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
            3
          </span>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-full w-9 h-9 transition-all duration-200"
            >
              <User className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem 
              onClick={() => router.push('/dashboard/perfil')}
              className="cursor-pointer"
            >
              <User className="h-4 w-4 mr-2" />
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => router.push('/dashboard/configuracion')}
              className="cursor-pointer"
            >
              Configuración
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={logout} 
              className="text-red-600 cursor-pointer"
            >
              Cerrar Sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
