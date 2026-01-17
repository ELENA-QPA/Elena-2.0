import axios from "axios";
import { NextRequest, NextResponse } from "next/server";
import { apiUrls } from "./config/protocols/http/api_urls";
import { routes } from "./config";
import { UserRole, UserRoleBase } from "./utilities/enums/user-roles.enum";

type UserRoleType = UserRole | string; // Permitir tanto enum como string para compatibilidad

export async function middleware(request: NextRequest) {
  let token = request.cookies.get("token")?.value;
  const res = NextResponse.next();
  const pathName = request.nextUrl.pathname;

  // Si navega al login, elimina las cookies automáticamente
  if (pathName === "/login") {
    console.log("[MIDDLEWARE][Login Route]: Limpiando cookies");
    res.cookies.delete("user");
    res.cookies.delete("token");
    return res;
  }

  // Si navega al registro, verificar que sea administrador
  if (pathName === "/register") {
    // Si no hay token, redirigir al login
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    try {
      // Verificar que el usuario sea administrador
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}${apiUrls.profile.getMe}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          timeout: 10000,
        }
      );

      const user = response.data;
      const role: UserRoleType = Array.isArray(user.rol)
        ? user.rol[0]
        : user.rol || user.role;

      // Solo permitir acceso a administradores
      if (role !== UserRoleBase.ADMINISTRADOR) {
        return NextResponse.redirect(new URL("/no-autorizado", request.url));
      }

      // Si es administrador, permitir acceso
      return res;
    } catch (error: any) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
  }

  // Si no hay token, redirigir al login
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const response = await axios.get(
      `${process.env.NEXT_PUBLIC_API_URL}${apiUrls.profile.getMe}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000, // 10 segundos timeout
      }
    );

    // Adaptar el usuario según la respuesta del login
    // Si el rol viene como array, tomamos el primero
    let user = response.data;
    // ✅ CORREGIDO: El backend envía "roles" (plural), no "rol" (singular)
    let role: UserRoleType = Array.isArray(user.roles)
      ? user.roles[0]
      : user.roles || user.rol || user.role;
    // Si el token viene en el body, lo actualizamos
    if (user.token) {
      token = user.token;
    }

    // Asegurar que el rol se guarde correctamente en el objeto user
    // Normalizar el formato del rol para el frontend
    const normalizedUser = {
      ...user,
      // ✅ CORREGIDO: Usar "roles" del backend y normalizar para frontend
      roles: Array.isArray(user.roles)
        ? user.roles
        : user.roles
        ? [user.roles]
        : [],
      rol: Array.isArray(user.roles)
        ? user.roles
        : user.roles
        ? [user.roles]
        : [], // Para compatibilidad con localStorage
      role: role, // Agregar también en formato string para compatibilidad
    };

    // Guardar token y usuario en cookies
    const userEncoded = Buffer.from(JSON.stringify(normalizedUser)).toString(
      "base64"
    );
    res.cookies.set("user", userEncoded);
    res.cookies.set("token", token ?? "", {
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 días
      sameSite: "lax",
      // NO httpOnly
      // secure: process.env.NODE_ENV === 'production', // solo en prod
    });

    // Redirección inicial desde root
    if (pathName === "/") {
      console.log("[MIDDLEWARE][Root Redirect]: Redirigiendo a dashboard");
      return NextResponse.redirect(new URL(routes.dashboard, request.url));
    }

    // Control de acceso basado en roles
    // Solo los analistas y usuarios básicos tienen restricciones
    if (role !== UserRoleBase.ADMINISTRADOR) {
      if (pathName !== "/" && !pathName.startsWith("/dashboard")) {
        return NextResponse.redirect(new URL("/no-autorizado", request.url));
      }
    }
    // Administradores y Asistentes Legales tienen acceso total

    return res;
  } catch (error: any) {
    console.error("[MIDDLEWARE][Error]:", {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      code: error.code,
    });

    // Limpiar cookies inválidas antes de redirigir
    res.cookies.delete("user");
    res.cookies.delete("token");
    res.cookies.delete("role");

    // Distinguir entre errores de conectividad y errores de autenticación
    if (
      error.code === "ECONNABORTED" ||
      error.code === "ENOTFOUND" ||
      error.code === "ECONNREFUSED"
    ) {
      console.log(
        "[MIDDLEWARE][Connectivity Error]: Error de conectividad, permitiendo acceso temporal"
      );
      // En caso de error de conectividad, podríamos permitir acceso temporal
      // pero para seguridad, mejor redirigir a login
    } else if (
      error.response?.status === 401 ||
      error.response?.status === 403
    ) {
      console.log("[MIDDLEWARE][Auth Error]: Token inválido o expirado");
    } else {
      console.log(
        "[MIDDLEWARE][Unknown Error]: Error desconocido de validación"
      );
    }

    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/", "/login", "/register", "/dashboard/:path*"],
};
