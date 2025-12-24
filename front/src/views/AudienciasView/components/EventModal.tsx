"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
import { Textarea } from "@/components/ui/textarea";

// import { eventoSchema, EventoForm } from "@/data/schemas/evento.schema";
import {
  Estado,
  ESTADOS,
  EventoForm,
  eventoSchema,
} from "@/modules/audiencias/data/interfaces/audiencias.interface";
import { useEffect, useState } from "react";
import { useAudience } from "@/modules/audiencias/hooks/useAudience";
import {
  mapEventoFormToAudienceCreate,
  mapEventoFormToAudienceUpdate,
} from "@/modules/audiencias/data/adapters/audience.adapter";
import { useAuth } from "@/utilities/helpers/auth/useAuth";

export const estadoLabels: Record<Estado, string> = {
  Programada: "Programada",
  Celebrada: "Celebrada",
  No_celebrada: "No Celebrada",
  Conciliada: "Conciliada",
};

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (evento: EventoForm) => void;
  initialData?: Partial<EventoForm>;
  lawyersRecord?: Record<string, string>;
  editing: boolean;
  isEditable: boolean;
  idEvent: string;
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

export function EventModal({
  open,
  onClose,
  initialData,
  editing,
  isEditable,
  lawyersRecord = {},
  idEvent,
}: EventModalProps) {
  const {
    error,
    setError,
    fetchAudienceByInternalCode,
    createAudience,
    updateAudience,
  } = useAudience();

  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const { role } = useAuth();
  const isAdmin = role === "Administrador";

  useEffect(() => {
    if (open) {
      form.reset(initialData || DEFAULT_FORM_VALUES);
      console.log("initial", initialData);
      console.log("idEvent", idEvent);
      console.log("editing? ", editing);
      setError(null);
    }
  }, [open, initialData]);

  const estadoActual = form.watch("estado");
  const blockAmount = estadoActual !== "Conciliada";

  const handleSync = async () => {
    const internalCode = form.getValues("codigo_interno");

    if (!internalCode) {
      return;
    }

    const result = await fetchAudienceByInternalCode(internalCode);

    if (!result.success) {
      form.reset({
        ...DEFAULT_FORM_VALUES,
      });
      return;
    }

    const syncedData: Partial<EventoForm> = {
      ...result.data,
      start: initialData?.start,
      end: initialData?.end,
    };

    console.log("syn", syncedData);
    form.reset(syncedData);
  };

  const create = async (values: EventoForm) => {
    if (!values.record_id) {
      setError(
        "No se encontró el ID del registro. Por favor, sincroniza primero."
      );
      return;
    }

    const audienceData = mapEventoFormToAudienceCreate(values);
    const result = await createAudience(audienceData);

    if (result.success) {
      form.reset(DEFAULT_FORM_VALUES);
      window.location.reload();
      onClose();
    }
  };

  const edit = async (values: EventoForm) => {
    if (!idEvent) {
      setError("Error recuperando el ID del evento");
      return;
    }

    const audienceData = mapEventoFormToAudienceUpdate(values);
    const result = await updateAudience(idEvent, audienceData);

    if (result.success) {
      form.reset(DEFAULT_FORM_VALUES);
      window.location.reload();
      onClose();
    }
  };

  const submit = async (values: EventoForm) => {
    try {
      console.log("edit 2 ", editing);
      console.log("id event 2 ", idEvent);
      if (!editing) {
        await create(values);
      } else {
        console.log("llamando edit");
        await edit(values);
      }
    } catch (err: any) {
      setError("Ocurrió un error al guardar el evento");
    }
  };

  const closeModal = () => {
    form.reset();
    setError(null);
    onClose();
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent
        className="sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? "Editar Evento" : "Crear Evento"}
          </DialogTitle>
          <DialogDescription>
            Completa los campos para el evento.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Radicado</Label>
              <Input disabled={true} {...form.register("title")} />
              {errors.title && (
                <p className="text-red-500 text-xs">{errors.title.message}</p>
              )}
            </div>
            <div>
              <Label>Código Interno</Label>
              <Input disabled={editing} {...form.register("codigo_interno")} />
            </div>

            <div>
              <Label>Abogado</Label>
              {isAdmin ? (
                <Select
                  disabled={isEditable}
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
                          className="hover:bg-gray-200"
                          key={id}
                          value={id}
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
              ) : (
                <Input
                  disabled={true}
                  value="Usted ha sido asignado"
                  className="bg-gray-50 text-gray-700"
                />
              )}
              {errors.abogado_id && (
                <p className="text-red-500 text-xs">
                  {errors.abogado_id.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label>Demandante</Label>
              <Input disabled={true} {...form.register("demandante")} />
            </div>

            <div>
              <Label>Telefono Demandante</Label>
              <Input
                disabled={true}
                {...form.register("contacto_demandante")}
              />
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
              <Label>Inicio</Label>
              <Input
                disabled={isEditable}
                type="datetime-local"
                {...form.register("start")}
              />
            </div>
            <div>
              <Label>Fin</Label>
              <Input
                disabled={isEditable}
                type="datetime-local"
                {...form.register("end")}
              />
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
                {...form.register("monto_conciliado", {
                  valueAsNumber: true,
                })}
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
                      className="hover:bg-gray-200"
                      key={est}
                      value={est}
                    >
                      {estadoLabels[est]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            {!editing && (
              <Button
                type="button"
                className="bg-pink-600 hover:bg-pink-700 mr-auto"
                onClick={handleSync}
              >
                Sincronizar
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" type="button" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-pink-600 hover:bg-pink-700">
                {editing ? "Actualizar" : "Crear"}
              </Button>
            </div>
          </DialogFooter>
        </form>

        {error && (
          <div className="rounded-md bg-red-100 border border-red-400 p-3 text-sm text-red-700">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
