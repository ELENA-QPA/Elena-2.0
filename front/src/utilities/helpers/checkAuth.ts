import { getCookie } from 'cookies-next'
import { CookiesKeysEnum } from '@/utilities/enums'

export type AuthStatus = "checking" | "authenticated" | "unauthenticated"
export type UserRole = "admin" | "user" | null

export const checkAuth = (): {status: AuthStatus, role: UserRole} => {
    const token = getCookie(CookiesKeysEnum.token);
    const user = getCookie('user');
    
    let role: UserRole = null

    const isAdminFromRoles = (roles: any) => {
        if (Array.isArray(roles)) {
            return roles.some((r) =>
                ["admin", "administrator", "Administrador", "Admin", "ADMIN"].includes(String(r))
            )
        }
        return ["admin", "administrator", "Administrador", "Admin", "ADMIN"].includes(String(roles))
    }

    
    try {
      const rolesRaw = localStorage.getItem('roles');
      
      if (rolesRaw) {
        const parsed = JSON.parse(rolesRaw)
        role = isAdminFromRoles(parsed) ? "admin" : "user"
        return { status: token || user ? "authenticated" : "unauthenticated", role }
        }
    } catch (roleError) {
      console.error("[LocalStorage Role Parse Error]:", roleError);
    }


    try {
        const localUser = localStorage.getItem("user")
        if (localUser) {
            const parsedUser = JSON.parse(localUser)
            const roles = parsedUser.rol ?? parsedUser.roles ?? []
            role = isAdminFromRoles(roles) ? "admin" : "user"
        }
    } catch (e) {
      console.warn("[localStorage Parse Error]:", e);
    }

    if (!token && !user) {
        return { status: "unauthenticated", role }
    }

    return { status: "authenticated", role }
  }