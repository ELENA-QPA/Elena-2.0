"use client";

import Link from "next/link";
import { AppBar } from "@/components/appbar";
import { Footer } from "@/components/footer";
import {
  BarChart3,
  Settings,
  Users,
  CalendarDays,
  Scale,
  FileText, 
  FileEdit,
  FolderSearch,
  Search,
  ReceiptText,
  ClipboardList,
  FilePlus2,
  History,
  FolderOpen,
  ChevronRight,
} from "lucide-react";
import { getUserCookiesClient } from "@/utilities/helpers/handleUserCookies/getUserCookieClient";
import { UserRoleBase } from "@/utilities/enums/user-roles.enum";
import { useEffect, useState } from "react";
import { IUser } from "@/data/interfaces/user.interface";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardHomeView() {
  const [userRole, setUserRole] = useState<string[] | null>(null);
  const [currentUser, setCurrentUser] = useState<IUser | undefined>(undefined);
  const [isLitigiosOpen, setIsLitigiosOpen] = useState(false);
  const [isQuotesOpen, setIsQuotesOpen] = useState(false);

  useEffect(() => {
    const user = getUserCookiesClient();

    if (user) {
      console.log("[DASHBOARD] User fields check:", {
        hasRoles: !!user.roles,
        rolesType: typeof user.roles,
        rolesIsArray: Array.isArray(user.roles),
        rolesValue: user.roles,
        hasRol: !!user.rol,
        rolType: typeof user.rol,
        rolIsArray: Array.isArray(user.rol),
        rolValue: user.rol,
        hasRole: !!user.role,
        roleType: typeof user.role,
        roleValue: user.role,
      });

      setCurrentUser(user as IUser);

      let userRoleFromStorage = null;

      if (user.roles && Array.isArray(user.roles)) {
        userRoleFromStorage = user.roles;
      } else if (user.rol && Array.isArray(user.rol)) {
        userRoleFromStorage = user.rol;
      } else if (user.role) {
        userRoleFromStorage = [user.role];
      } else if (user.rol && typeof user.rol === "string") {
        userRoleFromStorage = [user.rol];
      }

      if (userRoleFromStorage) {
        setUserRole(userRoleFromStorage);
        console.log("[DASHBOARD] Final user role set:", userRoleFromStorage);
      } else {
        console.warn("[DASHBOARD] No role found in user object!");
      }
    } else {
      console.warn("[DASHBOARD] No user object found!");
    }
  }, []);

  const isAdmin = userRole?.includes(UserRoleBase.ADMINISTRADOR);

  console.log("[DASHBOARD] Role comparison:", {
    userRole,
    expectedRole: UserRoleBase.ADMINISTRADOR,
    isAdmin,
    comparison: `"${userRole}" === "${UserRoleBase.ADMINISTRADOR}"`,
  });

  const litigiosOptions = [
    {
      title: "Gestión de Expedientes",
      description: "Gestiona y consulta expedientes judiciales",
      icon: FolderOpen,
      href: "/dashboard/expedientes",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
    {
      title: "Audiencias",
      description: "Programa y administra audiencias",
      icon: CalendarDays,
      href: "/dashboard/audiencias",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
    {
      title: "Historial Sincronización",
      description: "Revisa el historial de sincronizaciones",
      icon: History,
      href: "/dashboard/monolegal/importar",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
  ];

  const quotesOptions = [
    {
      title: "Generar Cotizaciones",
      description: "Generar Cotizaciones Quanta",
      icon: FileEdit,
      href: "/dashboard/generar-cotizacion",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    },
    {
      title: "Consultar Cotizaciones",
      description: "Consultar cotizaciones creadas",
      icon: FolderSearch,
      href: "/dashboard/consultar-cotizaciones",
      color: "from-pink-500 to-pink-600",
      hoverColor: "hover:from-pink-600 hover:to-pink-700",
    }, 
  ];


  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <AppBar user={currentUser} />

      <main className="flex-1 flex flex-col items-center justify-center py-12 px-4 mt-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl">
          {/* Unidad de Litigios */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Unidad de Litigios
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Accede a las herramientas de gestión de expedientes,
                  importación de datos y audiencias.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                <Scale className="w-8 h-8 text-pink-600" />
              </div>
            </div>

            {/* Botón Ingresar */}
            <Button
              onClick={() => setIsLitigiosOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base"
            >
              Ingresar
            </Button>
          </div>

          {/* Modal de Litigios */}
          <Dialog open={isLitigiosOpen} onOpenChange={setIsLitigiosOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <Scale className="h-6 w-6 text-pink-600" />
                  </div>
                  Unidad de Litigios
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Selecciona el módulo al que deseas acceder
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                {litigiosOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Link
                      key={option.title}
                      href={option.href}
                      className="group"
                      onClick={() => setIsLitigiosOpen(false)}
                    >
                      <div
                        className={`
                        bg-gradient-to-br ${option.color} ${option.hoverColor}
                        rounded-xl p-6 text-white shadow-lg 
                        transform transition-all duration-200 
                        hover:scale-105 hover:shadow-2xl
                        cursor-pointer
                      `}
                      >
                        <div className="flex flex-col items-start space-y-3">
                          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-white/90 leading-snug">
                              {option.description}
                            </p>
                          </div>
                          <div className="flex items-center text-sm font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Acceder
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Gestión Comercial */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Gestión Comercial
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">
                  Accede a las herramientas para generar y consultar estado de las cotizaciones.                 
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                <FileText className="w-8 h-8 text-pink-600" />
              </div>
            </div>

            {/* Botón Ingresar */}
            <Button
              onClick={() => setIsQuotesOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-6 text-base"
            >
              Ingresar
            </Button>
          </div>

          {/* Modal de Cotizaciones */}
          <Dialog open={isQuotesOpen} onOpenChange={setIsQuotesOpen}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
                    <ReceiptText className="h-6 w-6 text-pink-600" />
                  </div>
                  Cotizaciones QUANTA
                </DialogTitle>
                <DialogDescription className="text-gray-600">
                  Selecciona el módulo al que deseas acceder
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mt-6">
                {quotesOptions.map((option) => {
                  const Icon = option.icon;
                  return (
                    <Link
                      key={option.title}
                      href={option.href}
                      className="group"
                      onClick={() => setIsQuotesOpen(false)}
                    >
                      <div
                        className={`
                        bg-gradient-to-br ${option.color} ${option.hoverColor}
                        rounded-xl p-6 text-white shadow-lg 
                        transform transition-all duration-200 
                        hover:scale-105 hover:shadow-2xl
                        cursor-pointer
                      `}
                      >
                        <div className="flex flex-col items-start space-y-3">
                          <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
                            <Icon className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="font-bold text-lg mb-1">
                              {option.title}
                            </h3>
                            <p className="text-sm text-white/90 leading-snug">
                              {option.description}
                            </p>
                          </div>
                          <div className="flex items-center text-sm font-medium mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            Acceder
                            <ChevronRight className="ml-1 h-4 w-4" />
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </DialogContent>
          </Dialog>

          {/* Tarjeta Estadísticas y métricas */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Estadísticas y métricas
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Consulta gráficos y datos clave sobre el estado de tus
                  expedientes, procesos y resultados.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                <BarChart3 className="w-8 h-8 text-pink-600" />
              </div>
            </div>
            <Link
              href="/dashboard/estadisticas"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              Ingresar
            </Link>
          </div>

          {/* Tarjeta Configuración */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Configuración
                </h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Administra tu cuenta, roles y equipo de trabajo jurídico.
                  Controla los parámetros del sistema.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                <Settings className="w-8 h-8 text-pink-600" />
              </div>
            </div>
            <Link
              href="/dashboard/configuracion"
              className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              Ingresar
            </Link>
          </div>

          {/* Tarjeta Equipo - Solo visible para Administradores */}
          {isAdmin && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
              <div className="flex items-center justify-between w-full mb-6">
                <div className="flex flex-col">
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Equipo
                  </h2>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Administra los miembros y roles del equipo.
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                  <Users className="w-8 h-8 text-pink-600" />
                </div>
              </div>
              <Link
                href="/dashboard/equipo"
                className="bg-pink-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
              >
                Ingresar
              </Link>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
