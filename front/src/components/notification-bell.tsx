"use client";

import React from "react";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { useRouter } from "next/navigation";

export const NotificationBell = () => {
  const router = useRouter();
  const { notifications, count } = useNotifications();

  const handleVerifyClick = (audienceId: string, notificationId: string) => {
    const index = notifications.findIndex((n) => n._id === notificationId);

    router.push(`/dashboard/corrections?index=${index >= 0 ? index : 0}`);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="secondary"
          size="icon"
          className="relative text-gray-600 hover:text-gray-900"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-semibold animate-pulse">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <div className="p-3 border-b">
          <h3 className="font-semibold text-sm">
            Notificaciones {count > 0 && `(${count})`}
          </h3>
        </div>

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            No hay notificaciones
          </div>
        ) : (
          notifications.map((notification) => (
            <DropdownMenuItem
              key={notification._id}
              className="p-4 flex flex-col items-start gap-2 cursor-pointer hover:bg-gray-100 focus:bg-gray-100 data-[highlighted]:bg-gray-100"
              onSelect={(e) => e.preventDefault()}
            >
              <div className="flex items-start gap-3 w-full">
                <div className="h-2 w-2 bg-red-500 rounded-full mt-2 flex-shrink-0 animate-pulse" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">
                    Esta audiencia necesita verificación
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    ID: {notification.audience_id.substring(0, 25)}...
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(notification.createdAt).toLocaleString("es-ES")}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                className="w-full bg-pink-600 hover:bg-pink-700 text-white"
                onClick={() =>
                  handleVerifyClick(notification.audience_id, notification._id)
                }
              >
                Verificar Ahora
              </Button>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
