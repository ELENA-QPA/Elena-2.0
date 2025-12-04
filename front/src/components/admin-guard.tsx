"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { UserRole } from '@/utilities/enums/user-roles.enum';

interface AdminGuardProps {
  children: React.ReactNode;
}

export function AdminGuard({ children }: AdminGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAdminAccess = async () => {
      try {
        // Obtener el usuario de las cookies
        const userCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('user='))
          ?.split('=')[1];

        if (!userCookie) {
          router.push('/login');
          return;
        }

        // Decodificar el usuario
        const userData = JSON.parse(atob(userCookie));
        const role = Array.isArray(userData.rol) ? userData.rol[0] : userData.rol || userData.role;

        console.log('[AdminGuard][Role Check]:', { role, isAdmin: role === UserRole.ADMINISTRADOR });

        if (role !== UserRole.ADMINISTRADOR) {
          router.push('/no-autorizado');
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('[AdminGuard][Error]:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAccess();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando permisos de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null; // El router ya redirigió
  }

  return <>{children}</>;
}
