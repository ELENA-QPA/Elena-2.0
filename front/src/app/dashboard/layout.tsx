import type React from "react";
import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { DashboardLayoutClient } from "@/components/dashboard-layout-client";
import { getUserCookiesServer } from "@/utilities/helpers/handleUserCookies/getUserCookieServer";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "QP Alliance Dashboard",
  description: "Sistema de gestión de expedientes judiciales",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUserCookiesServer();

  return (
    <DashboardLayoutClient user={user!}>
      {children}
    </DashboardLayoutClient>
  );
}