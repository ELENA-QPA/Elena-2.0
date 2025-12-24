"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { NotificationResponse } from "../data/notification.interface";
import { apiUrls } from "@/config/protocols/http/api_urls";

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationResponse[]>(
    []
  );
  const [count, setCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    console.log(
      "[WebSocket] Intentando conectar a:",
      apiUrls.notifications.websocket
    );

    const socketInstance = io(apiUrls.notifications.websocket, {
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      console.log("[WebSocket] ✅ Conectado exitosamente");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[WebSocket] ❌ Desconectado");
      setIsConnected(false);
    });

    socketInstance.on(
      "newNotification",
      (notification: NotificationResponse) => {
        console.log(
          "[WebSocket] 🔔 Nueva notificación recibida:",
          notification
        );
        setNotifications((prev) => [notification, ...prev]);
        setCount((prev) => prev + 1);
      }
    );

    socketInstance.on("notificationDeleted", (notificationId: string) => {
      console.log(
        "[WebSocket] 🗑️ Evento de eliminación recibido:",
        notificationId
      );
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== notificationId);
        console.log(
          "[WebSocket] Estado actualizado, notificaciones restantes:",
          filtered.length
        );
        return filtered;
      });
      setCount((prev) => Math.max(0, prev - 1));
    });

    socketInstance.on("connect_error", (error) => {
      console.error("[WebSocket] ❌ Error de conexión:", error);
    });

    setSocket(socketInstance);

    return () => {
      console.log("[WebSocket] Desconectando...");
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        console.log(
          "[API] Cargando notificaciones desde:",
          apiUrls.notifications.getAll
        );
        const response = await fetch(apiUrls.notifications.getAll);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: NotificationResponse[] = await response.json();
        console.log("[API] ✅ Notificaciones cargadas:", data.length);
        setNotifications(data);
        setCount(data.length);
      } catch (error) {
        console.error("[API] ❌ Error al cargar notificaciones:", error);
      }
    };

    fetchNotifications();
  }, []);

  const deleteNotification = async (id: string): Promise<void> => {
    try {
      const url = `${apiUrls.notifications.delete}/${id}`;
      console.log("[API] 🗑️ Intentando eliminar notificación:", id);
      console.log("[API] URL DELETE:", url);

      const response = await fetch(url, {
        method: "DELETE",
      });

      console.log("[API] Response status:", response.status);

      if (response.status === 204) {
        console.log("[API] ✅ Notificación eliminada exitosamente (204)");
      } else if (!response.ok) {
        throw new Error(`Error al eliminar notificación: ${response.status}`);
      }

      console.log("[API] Esperando evento WebSocket...");
    } catch (error) {
      console.error("[API] ❌ Error al eliminar notificación:", error);
      throw error;
    }
  };

  return {
    notifications,
    count,
    isConnected,
    deleteNotification,
  };
};
