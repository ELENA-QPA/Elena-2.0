import dynamic from "next/dynamic";

const DashboardHomeView = dynamic(() => import("@/views/DashboardView/DashboardHomeView"));
import { getUserCookiesServer } from "@/utilities/helpers/handleUserCookies/getUserCookieServer";

export default async function DashboardPage() {
  await getUserCookiesServer(); // Si necesitas el usuario, pásalo como prop
  return <DashboardHomeView />;
}
