"use client";

import Image from "next/image";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full bg-black mt-auto py-3">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-2 md:space-y-0">
          {/* Logo Section */}
          <div className="flex items-center">
            <Image
              src="/logo ELENA.png"
              alt="Elena Footer Logo"
              width={120}
              height={24}
              className="object-contain brightness-0 invert"
            />
          </div>
          
          {/* Copyright and Links */}
          <div className="flex flex-col md:flex-row items-center space-y-1 md:space-y-0 md:space-x-6">
            <p className="text-gray-300 text-sm">
              © {new Date().getFullYear()} Elena. Todos los derechos reservados.
            </p>
            <div className="flex space-x-4 text-sm">
              <Link 
                href="/privacy" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Política de Privacidad
              </Link>
              <Link 
                href="/terms" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Términos de Uso
              </Link>
              <Link 
                href="/contact" 
                className="text-gray-400 hover:text-white transition-colors"
              >
                Contacto
              </Link>
            </div>
          </div>
        </div>
        
        {/* Divider */}
        {/* <div className="border-t border-gray-700 mt-6 pt-6">
          <div className="text-center text-gray-400 text-xs">
            Sistema de Gestión de Casos Judiciales - Elena v2.0
          </div>
        </div> */}
      </div>
    </footer>
  );
};
