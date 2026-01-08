import { LoginForm } from "@/modules/auth/components/login-form";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="w-screen min-h-[calc(100vh-100px)]  flex flex-col lg:flex-row">
      {/* Mobile Logo Header - Only visible on mobile */}
      <div className="w-full lg:hidden flex flex-col items-center justify-center p-8 bg-gradient-to-b from-pink-400 via-pink-200 to-white">
        <Image
          src="/logo ELENA.png"
          alt="Elena Logo"
          width={200}
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
      <div className="w-full hidden lg:flex flex-1 bg-gradient-to-br from-pink-50 to-purple-50 items-center justify-center p-12">
        <div className="text-center max-w-lg">
          {/* Elena Logo */}
          <div className="mb-8">
            <Image
              src="/logo ELENA.png"
              alt="Elena Logo"
              width={300}
              height={80}
              className="mx-auto object-contain"
            />
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
