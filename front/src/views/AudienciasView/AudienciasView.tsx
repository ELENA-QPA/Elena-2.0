"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, RefreshCw, Plus} from "lucide-react"
import { AudienceCalendar} from "./components/AudienceCalendar"
import Link from "next/link";
import { EstadosLeyenda } from "./components/EstadosLeyend"
import { EventModal } from "./components/EventModal"
import { Evento, EventoForm } from "@/modules/audiencias/data/interfaces/audiencias.interface"
import dayjs from "dayjs"
import { useAuth } from "@/utilities/helpers/auth/useAuth"
import { useLawyers } from "@/modules/audiencias/hooks/useLawyers"
import { useAudience } from "@/modules/audiencias/hooks/useAudience"


export default function AudienciasView() {
  
  const [initialEventData, setInitialEventData] = useState<Partial<EventoForm>>()
  const [showEventModal, setShowEventModal] = useState(false)
  const [editingMode, setEditingMode] = useState(false);

  const { role, isLoading, isAuthenticated, id } = useAuth();
  const { audiences, fetchAudiencesByLawyer, fetchAllAudiences } = useAudience();
  const ableToEdit = role !== 'Administrador';
  const { lawyersRecord, loadLawyers } = useLawyers()

  useEffect(() => {
    loadLawyers()
    fetchAllAudiences();
  }, []) 

  const formatForInput = (date?: Date) =>
    date ? dayjs(date).format("YYYY-MM-DDTHH:mm") : "";

  const handleRetry = () => {
  }


  console.log("aud ", audiences);
  const handleCloseModal = () => {
    setShowEventModal(false);
    setInitialEventData(undefined);
    fetchAllAudiences();
  }

  const handleSelectEvent = (event: Evento) => {
    const string_start = formatForInput(event.start);
    const string_end = formatForInput(event.end);
    setInitialEventData({
      ...event,
      start: string_start,
      end: string_end
    });
    setEditingMode(true);
    setShowEventModal(true);
  };

  const handleSelectSlot = (slot: { start: Date; end: Date }) => {
    setInitialEventData({
      start: formatForInput(slot.start),
      end: formatForInput(slot.end),
    });
    setShowEventModal(true);
    setEditingMode(false);
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Loader2 className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    )}

  if (!isAuthenticated) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertDescription>
            <div className="space-y-4">
              <div>
                <p className="font-semibold">No estás autenticado</p>
                <p>Para acceder a las audiencias, necesitas iniciar sesión.</p>
              </div>
              <div className="flex gap-2">
                <Link href="/login">
                  <Button className="bg-pink-600 hover:bg-pink-700 text-white">
                    Ir al login
                  </Button>
                </Link>
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reintentar
                </Button>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      </div>
    )
  }


  return (
    <>
      <div className="p-2 sm:p-4 md:p-6 min-w-0 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="min-w-0 flex-1">
            <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold truncate">Calendario de audiencias</h1>
            <p className="text-gray-600 mt-1 text-xs sm:text-sm">
              Ver las audiencias programadas en el sistema.
              {role && (
                <span className="ml-1 sm:ml-2 text-xs sm:text-sm">
                  • Rol:
                  <span className={`font-medium ${role === 'Administrador' ? 'text-green-600' : 'text-blue-600'}`}>
                    {role === 'Administrador' ? 'Admin' : 'Usuario'}
                  </span>
                </span>
              )}
            </p>

            <EstadosLeyenda />
          </div>
          <Button 
            className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg w-full sm:w-auto text-xs sm:text-sm" 
            onClick={() => {
              setEditingMode(false);
              setShowEventModal(true);
            }}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden xs:inline">Nueva Audiencia</span>
            <span className="xs:hidden">Nuevo</span>
          </Button>
        </div>

        <AudienceCalendar 
          onSelectSlot={handleSelectSlot}
          onSelectEvent={handleSelectEvent}
          events = {audiences}
        />
        
        <EventModal 
          open={showEventModal}
          onClose={handleCloseModal} 
          initialData={initialEventData}
          lawyersRecord={lawyersRecord}
          isEditable={ableToEdit}
          editing={editingMode}
        />
      </div>
    </> 
  )
}