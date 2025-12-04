import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando información del expediente...</p>
        </div>
      </div>
    </div>
  );
}












