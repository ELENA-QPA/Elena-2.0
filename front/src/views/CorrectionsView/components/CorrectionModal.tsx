"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Estado,
  ESTADOS,
  EventoForm,
  eventoSchema,
} from "@/modules/audiencias/data/interfaces/audiencias.interface";
import { useAudience } from "@/modules/audiencias/hooks/useAudience";
import { mapEventoFormToAudienceUpdate } from "@/modules/audiencias/data/adapters/audience.adapter";
import { NotificationResponse } from "@/modules/notifications/data/notification.interface";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { useLawyers } from "@/modules/audiencias/hooks/useLawyers";
import { useNotifications } from "@/modules/notifications/hooks/useNotifications";

interface NotificationCorrectionModalProps {
  open: boolean;
  notification: NotificationResponse;
  currentIndex: number;
  totalNotifications: number;
  onClose: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onCorrectionSuccess: () => void;
}

const DEFAULT_FORM_VALUES: EventoForm = {
  title: "",
  demandante: "",
  contacto_demandante: "",
  email_demandante: "",
  demandado: "",
  juzgado: "",
  abogado_id: "",
  codigo_interno: "",
  link_teams: "",
  estado: "Programada",
  start: "",
  end: "",
  monto_conciliado: 0,
  record_id: "",
};

export const estadoLabels: Record<Estado, string> = {
  Programada: "Programada",
  Celebrada: "Celebrada",
  No_celebrada: "No Celebrada",
  Conciliada: "Conciliada",
};

export function NotificationCorrectionModal({
  open,
  notification,
  currentIndex,
  totalNotifications,
  onClose,
  onNext,
  onPrevious,
  onCorrectionSuccess,
}: NotificationCorrectionModalProps) {
  const {
    error,
    setError,
    fetchAudienceByInternalCode,
    fetchAudience,
    updateAudience,
  } = useAudience();

  const { lawyersRecord, loadLawyers } = useLawyers();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const { deleteNotification } = useNotifications();
  const [isSynced, setIsSynced] = useState(false);

  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (open && notification) {
      loadLawyers();
      loadAudienceData();
      setShowSuccessMessage(false);
      setIsSynced(false);
      setError(null);
    }
  }, [open, notification]);

  const toDatetimeLocal = (value?: string | Date): string => {
    if (!value) return "";
    const date = new Date(value);
    if (isNaN(date.getTime())) return "";
    return date.toISOString().slice(0, 16);
  };

  const loadAudienceData = async () => {
    try {
      const result = await fetchAudience(notification.audience_id);

      if (result.success && result.data) {
        const audience = result.data.audience;

        form.reset({
          title: result.data.record?.settled || "",
          demandante:
            result.data.record?.proceduralParts?.plaintiff?.name || "",
          contacto_demandante:
            result.data.record?.proceduralParts?.plaintiff?.contact || "",
          email_demandante:
            result.data.record?.proceduralParts?.plaintiff?.email || "",
          demandado: result.data.record?.proceduralParts?.defendant?.name || "",
          juzgado: result.data.record?.office || "",
          abogado_id: audience.lawyer?._id || "",
          codigo_interno: result.data.record?.internalCode || "",
          link_teams: audience.link || "",
          estado: audience.state,
          start: toDatetimeLocal(audience.start),
          end: toDatetimeLocal(audience.end),
          monto_conciliado: audience.monto || 0,
          record_id: audience.record || "",
        });
      }
    } catch (err) {
      setError("Error al cargar los datos de la audiencia");
    }
  };

  const estadoActual = form.watch("estado");
  const blockAmount = estadoActual !== "Conciliada";

  const handleSync = async () => {
    const internalCode = form.getValues("codigo_interno");

    if (!internalCode) {
      setError("Por favor ingresa un código interno");
      return;
    }

    const result = await fetchAudienceByInternalCode(internalCode);

    if (!result.success) {
      setError("No se encontró el registro con ese código interno");
      return;
    }

    const currentValues = form.getValues();
    const syncedData: Partial<EventoForm> = {
      ...result.data,
      start: currentValues.start,
      end: currentValues.end,
      abogado_id: currentValues.abogado_id,
      estado: currentValues.estado,
      link_teams: currentValues.link_teams,
      monto_conciliado: currentValues.monto_conciliado,
    };

    form.reset(syncedData as EventoForm);
    setIsSynced(true);
    setError(null);
  };

  const validateForm = (): boolean => {
    const values = form.getValues();
    const requiredFields = ["record_id", "abogado_id", "start", "end"];

    const missingFields = requiredFields.filter(
      (field) => !values[field as keyof EventoForm]
    );

    if (missingFields.length > 0) {
      setError(`Campos requeridos faltantes: ${missingFields.join(", ")}`);
      return false;
    }

    if (!isSynced) {
      setError("Debes sincronizar los datos antes de guardar");
      return false;
    }

    return true;
  };

  const handleSubmit = async (values: EventoForm) => {
    try {
      if (!validateForm()) {
        return;
      }

      const audienceData = mapEventoFormToAudienceUpdate(values);
      const result = await updateAudience(notification.audience_id, {
        ...audienceData,
        is_valid: true,
      });

      if (result.success) {
        setShowSuccessMessage(true);
        setError(null);
        setTimeout(async () => {
          await deleteNotification(notification._id);
          onCorrectionSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError("Ocurrió un error al actualizar la audiencia");
    }
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-sm p-6">
      <header className="flex justify-between items-start mb-4">
        <div>
          <h1 className="text-xl font-semibold">Corregir Audiencia</h1>
          <p className="text-sm text-gray-500">
            {currentIndex + 1} de {totalNotifications}
          </p>
        </div>

        <Button variant="outline" onClick={onClose}>
          Cerrar
        </Button>
      </header>

      <div className="flex items-start gap-2 p-3 mb-4 bg-yellow-50 border border-yellow-200 rounded-md">
        <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
        <span className="text-yellow-800">
          {notification.message ||
            "Esta audiencia necesita verificación y corrección"}
        </span>
      </div>

      {showSuccessMessage && (
        <div className="flex items-center gap-2 p-4 mb-4 bg-green-50 border border-green-200 rounded-md">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-green-800 font-medium">
            Corrección exitosa!{" "}
            {totalNotifications > 1
              ? "Pasando a la siguiente..."
              : "Redirigiendo..."}
          </span>
        </div>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Radicado</Label>
            <Input disabled={true} {...form.register("title")} />
          </div>
          <div>
            <Label>Código Interno *</Label>
            <Input {...form.register("codigo_interno")} />
          </div>
          <div>
            <Label>Abogado *</Label>
            <Select
              value={form.watch("abogado_id")}
              onValueChange={(v) => form.setValue("abogado_id", v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un abogado" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(lawyersRecord).length > 0 ? (
                  Object.entries(lawyersRecord).map(([name, id]) => (
                    <SelectItem
                      key={id}
                      value={id}
                      className="hover:bg-gray-200"
                    >
                      {name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-lawyers" disabled>
                    No hay abogados disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Demandante</Label>
            <Input disabled={true} {...form.register("demandante")} />
          </div>
          <div>
            <Label>Teléfono Demandante</Label>
            <Input disabled={true} {...form.register("contacto_demandante")} />
          </div>
          <div>
            <Label>Email Demandante</Label>
            <Input disabled={true} {...form.register("email_demandante")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Demandado</Label>
            <Input disabled={true} {...form.register("demandado")} />
          </div>
          <div>
            <Label>Juzgado</Label>
            <Input disabled={true} {...form.register("juzgado")} />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Inicio *</Label>
            <Input type="datetime-local" {...form.register("start")} />
          </div>
          <div>
            <Label>Fin *</Label>
            <Input type="datetime-local" {...form.register("end")} />
          </div>
        </div>

        <div>
          <Label>Link de Teams</Label>
          <Input {...form.register("link_teams")} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Monto Conciliado</Label>
            <Input
              disabled={blockAmount}
              type="number"
              {...form.register("monto_conciliado", { valueAsNumber: true })}
            />
          </div>
          <div>
            <Label>Estado</Label>
            <Select
              value={form.watch("estado")}
              onValueChange={(v) => form.setValue("estado", v as Estado)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un estado" />
              </SelectTrigger>
              <SelectContent>
                {ESTADOS.map((est) => (
                  <SelectItem
                    key={est}
                    value={est}
                    className="hover:bg-gray-200"
                  >
                    {estadoLabels[est]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 sm:justify-between">
          <Button
            type="button"
            className="bg-blue-600 hover:bg-blue-700 sm:mr-auto"
            onClick={handleSync}
            disabled={showSuccessMessage}
          >
            Sincronizar
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={currentIndex === 0 || showSuccessMessage}
            className="flex-1 sm:flex-none"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Anterior
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={onNext}
            disabled={
              currentIndex === totalNotifications - 1 || showSuccessMessage
            }
            className="flex-1 sm:flex-none"
          >
            Siguiente
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>

          <Button
            type="submit"
            className="bg-pink-600 hover:bg-pink-700 flex-1 sm:flex-none"
            disabled={showSuccessMessage}
          >
            Corregir
          </Button>
        </div>
      </form>

      {error && (
        <div className="rounded-md bg-red-100 border border-red-400 p-3 text-sm text-red-700 my-2">
          {error}
        </div>
      )}
    </div>
  );
}
