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
    const socketInstance = io(apiUrls.notifications.websocket, {
      transports: ["websocket"],
    });

    socketInstance.on("connect", () => {
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      setIsConnected(false);
    });

    socketInstance.on(
      "newNotification",
      (notification: NotificationResponse) => {
        setNotifications((prev) => [notification, ...prev]);
        setCount((prev) => prev + 1);
      }
    );

    socketInstance.on("notificationDeleted", (notificationId: string) => {
      setNotifications((prev) => {
        const filtered = prev.filter((n) => n._id !== notificationId);
        return filtered;
      });
      setCount((prev) => Math.max(0, prev - 1));
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const response = await fetch(apiUrls.notifications.getAll);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data: NotificationResponse[] = await response.json();
        setNotifications(data);
        setCount(data.length);
      } catch (error) {}
    };

    fetchNotifications();
  }, []);

  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(`${apiUrls.notifications.delete}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Error al eliminar notificación: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { success: false };
    }
  };

  return {
    notifications,
    count,
    isConnected,
    deleteNotification,
  };
};
