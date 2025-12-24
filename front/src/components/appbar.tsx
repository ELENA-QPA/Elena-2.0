"use client";

import type React from "react";
import { cn } from "@/lib/utils";
import { Phone, User, Menu, PanelLeft } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { IUser } from "@/data/interfaces/user.interface";
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { NotificationBell } from "./notification-bell";
import { useAuth } from "@/utilities/helpers/auth/useAuth";

interface AppBarProps {
  user?: IUser;
  className?: string;
}

export const AppBar = ({ user, className, ...props }: AppBarProps) => {
  const router = useRouter();
  const { role } = useAuth();

  const isAdmin = role === "Administrador";
  // Verificar si estamos dentro de un SidebarProvider
  let hasSidebarProvider = false;
  try {
    useSidebar();
    hasSidebarProvider = true;
  } catch {
    hasSidebarProvider = false;
  }

  function logout() {
    console.log("[APPBAR][DEBUG] Cerrando sesión...");
    deleteCookie(CookiesKeysEnum.token);
    router.replace(routes.auth.login);
  }

  const handlePerfilClick = () => {
    console.log("[APPBAR][DEBUG] Función handlePerfilClick ejecutada");
    try {
      console.log(
        "[APPBAR][DEBUG] Intentando navegar a /dashboard/configuracion"
      );

      // Primero intentar con router.push nativo
      router.push("/dashboard/configuracion");
      console.log("[APPBAR][DEBUG] Comando router.push ejecutado");

      // Fallback con window.location si router.push no funciona
      setTimeout(() => {
        if (window.location.pathname !== "/dashboard/configuracion") {
          console.log(
            "[APPBAR][DEBUG] Router.push falló, usando window.location como fallback"
          );
          window.location.href = "/dashboard/configuracion";
        }
      }, 100);
    } catch (error) {
      console.error("[APPBAR][ERROR] Error en navegación:", error);
      // Fallback directo en caso de error
      window.location.href = "/dashboard/configuracion";
    }
  };

  const handleConfigClick = () => {
    console.log("[APPBAR][DEBUG] Navegando a configuración...");
    try {
      router.push("/dashboard/configuracion");

      // Fallback con window.location si router.push no funciona
      setTimeout(() => {
        if (window.location.pathname !== "/dashboard/configuracion") {
          console.log(
            "[APPBAR][DEBUG] Router.push configuración falló, usando window.location como fallback"
          );
          window.location.href = "/dashboard/configuracion";
        }
      }, 100);
    } catch (error) {
      console.error("[APPBAR][ERROR] Error navegando a configuración:", error);
      window.location.href = "/dashboard/configuracion";
    }
  };

  return (
    <header
      className={cn(
        "h-16 px-2 sm:px-4 md:px-6 flex items-center justify-between bg-white border-b border-gray-200 min-w-0",
        className
      )}
      {...props}
    >
      {/* Left side - Menu toggle and Logo */}
      <div className="flex items-center gap-1 sm:gap-2 md:gap-4 min-w-0 flex-1">
        {/* Sidebar toggle button - visible en desktop y móvil */}
        {hasSidebarProvider && (
          <SidebarTrigger className="flex-shrink-0 bg-slate-800/80 hover:bg-slate-700 text-white border border-slate-600 hover:border-slate-500 shadow-lg hover:shadow-xl h-8 w-8 rounded-md" />
        )}

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center min-w-0">
          <Image
            src="/logo ELENA.png"
            alt="Elena Logo"
            width={120}
            height={40}
            className="object-contain w-24 sm:w-28 md:w-32 lg:w-36 xl:w-40"
            priority
          />
        </Link>
      </div>

      {/* Right side - Icons and user menu */}
      <div className="flex items-center space-x-1 sm:space-x-2 md:space-x-4 flex-shrink-0">
        {/* Phone icon */}
        {/* <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
          <Phone className="h-5 w-5" />
        </Button> */}
        {isAdmin && <NotificationBell />}
        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-full w-7 h-7 sm:w-8 sm:h-8"
            >
              <User className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={handlePerfilClick}>
              Mi Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleConfigClick}>
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
