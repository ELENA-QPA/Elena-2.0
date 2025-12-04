import Image from "next/image";
import { Loader2 } from "lucide-react";
import { Suspense } from "react";
import { RegisterForm } from "@/modules/auth/components";
import { AdminGuard } from "@/components/admin-guard";

export default function RegisterPage() {
  return (
    <AdminGuard>
      <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Mobile Logo Header - Only visible on mobile */}
      <div className="lg:hidden flex flex-col items-center justify-center p-8 bg-gradient-to-br from-pink-50 to-purple-50">
        <Image
          src="/logo ELENA.png"
          alt="Elena Logo"
          width={150}
          height={45}
          className="object-contain mb-2"
        />
        <p className="text-gray-600 text-xs mb-4">empowered by</p>
        <Image
          src="/logo.png"
          alt="QP Alliance Logo"
          width={200}
          height={50}
          className="object-contain"
        />
      </div>

      {/* Left side - Branding with Logos (Desktop) */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-pink-50 to-purple-50 items-center justify-center p-12">
        <div className="text-center max-w-lg">
          {/* Elena Logo */}
          <div className="mb-8">
            <Image
              src="/logo ELENA.png"
              alt="Elena Logo"
              width={200}
              height={60}
              className="mx-auto object-contain"
            />
            <p className="text-gray-600 text-sm mt-2 mb-8">empowered by</p>
          </div>
          {/* QP Alliance Logo */}
          <div className="mb-8">
            <Image
              src="/logo.png"
              alt="QP Alliance Logo"
              width={300}
              height={80}
              className="mx-auto object-contain"
            />
          </div>
          <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
            Plataforma integral para la gestión de expedientes judiciales
          </p>
        </div>
      </div>

      {/* Right side - Register Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold elena-text-gradient mb-2">Crear Cuenta</h1>
            <p className="text-gray-600">Regístrate para acceder a Elena</p>
          </div>
          
          <Suspense fallback={<Loader2 className="animate-spin h-10 w-10 text-pink-600 mx-auto" />}>
            <RegisterForm />
          </Suspense>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <a href="/login" className="text-pink-600 hover:text-pink-700 font-medium">
                Iniciar Sesión
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
    </AdminGuard>
  );
}