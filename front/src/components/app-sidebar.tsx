"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Home,
  FileText,
  Users,
  Settings,
  User,
  BookOpen,
  Menu,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import Image from "next/image"

// Definir las rutas que aún no tienen integración completa con APIs
const pendingIntegrationRoutes = [
  "/dashboard/informacion-caso",
]

// Items principales de QP Alliance
const mainItems = [
  {
    title: "Inicio",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Expedientes",
    href: "/dashboard/expedientes", 
    icon: FileText,
  },
  // {
  //   title: "Información del Caso",
  //   href: "/dashboard/informacion-caso",
  //   icon: BookOpen,
  // },
  {
    title: "Equipo de Trabajo",
    href: "/dashboard/equipo",
    icon: Users,
  },
  
  {
    title: "Audiencias",
    href: "/dashboard/audiencias",
    icon: Users,
  },
]

// Items de configuración (al fondo)
const configItems = [
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: Settings,
  },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar rol del usuario
  useEffect(() => {
    const checkUserRole = () => {
      try {
        const userDataString = localStorage.getItem("user");
        if (userDataString) {
          const userData = JSON.parse(userDataString);
          const userRoles = userData.rol || userData.roles || [];
          
          // Verificar si el usuario tiene rol de administrador
          const isUserAdmin = Array.isArray(userRoles) 
            ? (userRoles.includes('admin') || 
               userRoles.includes('administrator') || 
               userRoles.includes('Administrador') ||
               userRoles.includes('Admin') ||
               userRoles.includes('ADMIN'))
            : (userRoles === 'admin' || 
               userRoles === 'administrator' || 
               userRoles === 'Administrador' ||
               userRoles === 'Admin' ||
               userRoles === 'ADMIN');
          
          setIsAdmin(isUserAdmin);
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, []);

  return (
    <Sidebar 
      variant="sidebar" 
      collapsible="icon"
      className="bg-slate-900 border-r border-slate-800 shadow-xl"
    >
      <SidebarHeader className="p-4 flex items-center justify-between bg-slate-900 border-b border-slate-700 relative">
        <Link href="/dashboard" className="flex items-center gap-2 min-w-0 flex-1">
          <Image
            src="/logo ELENA.png"
            alt="Elena Logo"
            width={state === "collapsed" ? 32 : 120}
            height={32}
            style={{ width: 'auto', height: 'auto' }}
            className="object-contain transition-all duration-200"
          />
          {state !== "collapsed" && (
            <span className="text-xl font-bold ml-2 text-white">Elena</span>
          )}
        </Link>
        
      </SidebarHeader>
      <SidebarContent className={`${state === "collapsed" ? "pt-20" : "pt-32"} md:pt-32 pt-20 p-3 pb-6 flex flex-col h-full bg-slate-900`}>
        <SidebarMenu className="space-y-2 flex-1">
          {mainItems
            .filter(item => {
              // Filtrar "Equipo de Trabajo" para usuarios no administradores
              if (item.title === "Equipo de Trabajo") {
                return isAdmin;
              }
              return true; // Mostrar todos los demás elementos
            })
            .map((item) => {
            const isActive = pathname === item.href;
            const menuButton = (
              <SidebarMenuButton asChild isActive={isActive}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500' 
                      : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                >
                  <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`} />
                  {state !== "collapsed" && (
                    <span className={`font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                      {item.title}
                    </span>
                  )}
                </Link>
              </SidebarMenuButton>
            );

            return (
              <SidebarMenuItem key={item.href}>
                {state === "collapsed" ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      {menuButton}
                    </TooltipTrigger>
                    <TooltipContent side="right" className="ml-2">
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  menuButton
                )}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
        
        {/* Items de configuración al fondo */}
        <div className="border-t border-slate-700 pt-3 mt-3">
          <SidebarMenu className="space-y-2">
            {configItems.map((item) => {
              const isActive = pathname === item.href;
              const menuButton = (
                <SidebarMenuButton asChild isActive={isActive}>
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md ring-1 ring-blue-500' 
                        : 'hover:bg-slate-800 text-slate-300 hover:text-white'
                      }`}
                  >
                    <item.icon className={`h-5 w-5 transition-colors ${isActive ? 'text-white' : 'text-blue-400 group-hover:text-blue-300'}`} />
                    {state !== "collapsed" && (
                      <span className={`font-medium transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                        {item.title}
                      </span>
                    )}
                  </Link>
                </SidebarMenuButton>
              );

              return (
                <SidebarMenuItem key={item.href}>
                  {state === "collapsed" ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {menuButton}
                      </TooltipTrigger>
                      <TooltipContent side="right" className="ml-2">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    menuButton
                  )}
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
