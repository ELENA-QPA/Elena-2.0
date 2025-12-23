import { getCookie } from "cookies-next";
import { CookiesKeysEnum } from "@/utilities/enums";

export interface AuthData {
  user: any | null;
  token: string;
  role: string;
  id: string;
}

export const getAuthData = (): AuthData => {
  let user = null;
  let token = "";
  let role = "";
  let id = "";

  try {
    const authToken = getCookie(CookiesKeysEnum.token);
    if (authToken) {
      token = authToken as string;
    }

    if (typeof window !== "undefined") {
      const userData = window.localStorage.getItem("user");
      if (userData) {
        user = JSON.parse(userData);
        const rol = user.rol.includes("Administrador")
          ? "Administrador"
          : user.rol[0];
        role = rol;
      }
    }
  } catch (error) {
    console.error("Error al obtener datos de autenticación:", error);
  }

  return { user, token, role, id };
};

export const isAuthenticated = (): boolean => {
  const { token } = getAuthData();
  return !!token;
};

export const getToken = (): string => {
  const authToken = getCookie(CookiesKeysEnum.token);
  return authToken ? (authToken as string) : "";
};

export const getUser = (): any | null => {
  try {
    if (typeof window !== "undefined") {
      const userData = window.localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    }
  } catch (error) {
    console.error("Error al obtener usuario:", error);
  }
  return null;
};

export const getRole = (): string => {
  const userRole = getCookie(CookiesKeysEnum.role);
  return userRole ? (userRole as string) : "";
};
