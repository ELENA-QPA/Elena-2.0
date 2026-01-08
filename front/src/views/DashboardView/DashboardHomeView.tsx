"use client";

import Image from "next/image";
import Link from "next/link";
import { AppBar } from "@/components/appbar";
import { Footer } from "@/components/footer";
import {
  FileText,
  BarChart3,
  Settings,
  Users,
  CalendarDays,
  Scale,
  History,
} from "lucide-react";
import { getUserCookiesClient } from "@/utilities/helpers/handleUserCookies/getUserCookieClient";
import { UserRole } from "@/utilities/enums/user-roles.enum";
import { useEffect, useState } from "react";

export default function DashboardHomeView() {
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    // Obtener el rol del usuario desde las cookies
    const user = getUserCookiesClient();

    // El user en localStorage tiene "rol" (array) no "role" (string)
    let userRoleFromStorage = null;

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

      if (user.roles && Array.isArray(user.roles) && user.roles.length > 0) {
        userRoleFromStorage = user.roles[0]; // Tomar el primer rol del array
        console.log("[DASHBOARD] User roles from array:", userRoleFromStorage);
      }
      // Fallback: verificar si tiene el campo "rol" como array
      else if (user.rol && Array.isArray(user.rol) && user.rol.length > 0) {
        userRoleFromStorage = user.rol[0]; // Tomar el primer rol del array
        console.log("[DASHBOARD] User rol from array:", userRoleFromStorage);
      }
      // Fallback: verificar si tiene "role" como string
      else if (user.role) {
        userRoleFromStorage = user.role;
        console.log("[DASHBOARD] User role from string:", userRoleFromStorage);
      }
      // Fallback adicional: verificar si "rol" es string
      else if (user.rol && typeof user.rol === "string") {
        userRoleFromStorage = user.rol;
        console.log("[DASHBOARD] User rol from string:", userRoleFromStorage);
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

  // Función para verificar si el usuario es administrador
  const isAdmin = userRole === UserRole.ADMINISTRADOR;

  // Debug: Verificar la comparación
  console.log("[DASHBOARD] Role comparison:", {
    userRole,
    expectedRole: UserRole.ADMINISTRADOR,
    isAdmin,
    comparison: `"${userRole}" === "${UserRole.ADMINISTRADOR}"`,
  });

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Usar el componente AppBar unificado */}
      <AppBar />

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

            {/* Opciones dentro de la card */}
            <div className="grid grid-cols-2 gap-2">
              <Link
                href="/dashboard/expedientes"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Gestión Expedientes</span>
              </Link>

              <Link
                href="/dashboard/audiencias"
                className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                <CalendarDays className="w-4 h-4" />
                <span>Audiencias</span>
              </Link>
              <div className="inline-block whitespace-nowrap">
                <Link
                  href="/dashboard/monolegal/importar"
                  className="inline-flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-pink-700 transition-colors"
                >
                  <History className="w-4 h-4" />
                  <span>Historial de sincronización</span>
                </Link>
              </div>
            </div>
          </div>
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
              className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              Ingresar
            </Link>
          </div>

          {/* Tarjeta Audiencias*/}
          {/* <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-start transition-all hover:shadow-lg">
            <div className="flex items-center justify-between w-full mb-6">
              <div className="flex flex-col">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Audiencias</h2>
                <p className="text-gray-600 text-sm leading-relaxed">
                  Consulta y gestiona las audiencias programadas.
                </p>
              </div>
              <div className="w-16 h-16 rounded-full border-2 border-pink-200 bg-pink-50 flex items-center justify-center flex-shrink-0 ml-4">
                <CalendarDays className="w-8 h-8 text-pink-600" />
              </div>
            </div>
            <Link 
              href="/dashboard/audiencias" 
              className="bg-gray-900  text-white px-6 py-3 rounded-lg font-medium hover:bg-pink-700 transition-colors"
            >
              Ingresar
            </Link>
          </div> */}

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
                className="bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
              >
                Ingresar
              </Link>
            </div>
          )}
        </div>
      </main>

      {/* Usar el componente Footer unificado */}
      <Footer />
    </div>
  );
}
