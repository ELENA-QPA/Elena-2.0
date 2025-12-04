"use client";

import type React from "react";
import { usePathname } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider, useSidebar, SidebarInset } from "@/components/ui/sidebar";
import { AppBar } from "@/components/appbar";
import { IUser } from "@/data/interfaces/user.interface";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  user: IUser;
}

function DashboardContent({ children, user }: DashboardLayoutClientProps) {
  const { state } = useSidebar();

  return (
    <SidebarInset className="flex-1 bg-white min-w-0">
      <AppBar user={user} className="fixed top-0 right-0 left-0 z-30 bg-white border-b shadow-sm" />
      <main className="mt-16 p-2 sm:p-4 md:p-6 bg-white min-h-screen overflow-x-hidden">{children}</main>
    </SidebarInset>
  );
}

export function DashboardLayoutClient({ children, user }: DashboardLayoutClientProps) {
  const pathname = usePathname();
  const isHomePage = pathname === "/dashboard";

  if (isHomePage) {
    // Para la página home, no mostrar sidebar, solo retornar children
    return <>{children}</>;
  }

  // Para todas las demás páginas del dashboard, mostrar sidebar y AppBar
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white overflow-x-hidden">
        <AppSidebar />
        <DashboardContent user={user}>
          {children}
        </DashboardContent>
      </div>
    </SidebarProvider>
  );
}
