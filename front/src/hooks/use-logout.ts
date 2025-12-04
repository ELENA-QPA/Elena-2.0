import { deleteCookie } from "cookies-next";
import { CookiesKeysEnum, StorageKeysEnum } from "@/utilities";
import { useRouter } from "next-nprogress-bar";
import { routes } from "@/config";

export const useLogout = () => {
    const router = useRouter();

    const logout = () => {
        console.log('[LOGOUT] Iniciando proceso de logout...');
        
        try {
            // 1. Eliminar todas las cookies relacionadas con la sesión
            deleteCookie(CookiesKeysEnum.token);
            deleteCookie(CookiesKeysEnum.user);
            deleteCookie(CookiesKeysEnum.role);
            deleteCookie(CookiesKeysEnum.lastPage);
            deleteCookie(CookiesKeysEnum.coberturaSelectId);
            
            console.log('[LOGOUT] Cookies eliminadas');

            // 2. Limpiar localStorage
            if (typeof window !== 'undefined') {
                localStorage.removeItem(StorageKeysEnum.user);
                localStorage.removeItem(StorageKeysEnum.lastPage);
                console.log('[LOGOUT] LocalStorage limpiado');
            }

            // 3. Limpiar sessionStorage si se usa
            if (typeof window !== 'undefined') {
                sessionStorage.clear();
                console.log('[LOGOUT] SessionStorage limpiado');
            }

            console.log('[LOGOUT] Logout completado, redirigiendo a login...');
            
            // 4. Redirigir al login
            router.replace(routes.auth.login);
            
        } catch (error) {
            console.error('[LOGOUT] Error durante logout:', error);
            // Aún así redirigir al login
            router.replace(routes.auth.login);
        }
    };

    return { logout };
};