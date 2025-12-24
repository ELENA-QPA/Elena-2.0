"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { NotificationCorrectionModal } from "./components/CorrectionModal";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";
import { Loader2 } from "lucide-react";

export default function NotificationCorrectionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notifications } = useNotifications();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const indexParam = searchParams.get("index");
    if (indexParam) {
      setCurrentIndex(parseInt(indexParam));
    }
    setIsLoading(false);
  }, [searchParams]);

  const handleClose = () => {
    router.push("/dashboard/audiencias");
  };

  const handleNext = () => {
    if (currentIndex < notifications.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      router.push(`/dashboard/corrections?index=${nextIndex}`);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      setCurrentIndex(prevIndex);
      router.push(`/dashboard/corrections?index=${prevIndex}`);
    }
  };
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-gray-900">
            No hay más audiencias por corregir
          </h2>
          <p className="text-gray-600">
            Todas las notificaciones han sido procesadas.
          </p>
          <button
            onClick={handleClose}
            className="mt-4 px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-md"
          >
            Volver al Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentNotification = notifications[currentIndex];

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <NotificationCorrectionModal
        open={true}
        notification={currentNotification}
        currentIndex={currentIndex}
        totalNotifications={notifications.length}
        onClose={handleClose}
        onNext={handleNext}
        onPrevious={handlePrevious}
      />
    </div>
  );
}
