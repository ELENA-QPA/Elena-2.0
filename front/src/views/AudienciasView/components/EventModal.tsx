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
import { DeleteConfirmationDialog } from "../../../components/modales/DeleteConfirmation";
import { ArchiveConfirmation } from "@/components/modales/ArchiveConfirmation";
import { Trash2 } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Archive } from "lucide-react";

export const estadoLabels: Record<Estado, string> = {
  Programada: "Programada",
  Celebrada: "Celebrada",
  No_celebrada: "No Celebrada",
  Conciliada: "Conciliada",
  Archivado: "Archivado",
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
  despachoJudicial: "",
  abogado_id: "",
  etiqueta: "",
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
    fetchAudienceByInternalCode: fetchAudienceByEtiqueta,
    createAudience,
    updateAudience,
    deleteAudience,
    archiveFile,
  } = useAudience();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);

  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  useEffect(() => {
    if (open) {
      form.reset(initialData || DEFAULT_FORM_VALUES);
      setError(null);
    }
  }, [open, initialData]);

  const estadoActual = form.watch("estado");
  const montoActual = form.watch("monto_conciliado");
  const isArchivado = estadoActual === "Archivado";
  const canArchive = montoActual ? montoActual > 0 : false;
  const blockAmount =
    estadoActual !== "Conciliada" && estadoActual !== "Archivado";

  const handleSync = async () => {
    const etiqueta = form.getValues("etiqueta");

    if (!etiqueta) {
      return;
    }

    const result = await fetchAudienceByEtiqueta(etiqueta);

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

    form.reset(syncedData);
  };

  const handleDelete = async () => {
    if (!idEvent) {
      setError("Error recuperando el ID del evento");
      return;
    }

    const result = await deleteAudience(idEvent);

    if (result.success) {
      form.reset(DEFAULT_FORM_VALUES);
      setShowDeleteConfirm(false);
      window.location.reload();
      onClose();
    }
  };

  const handleArchive = async () => {
    const recordId = form.getValues("record_id");
    if (!recordId) {
      setError("Error recuperando el ID del record");
      return;
    }

    const values = form.getValues();
    if (!idEvent) {
      setError("Error recuperando el ID del evento");
      return;
    }

    const audienceData = mapEventoFormToAudienceUpdate(values);
    const updateResult = await updateAudience(idEvent, audienceData);

    if (!updateResult.success) {
      setShowArchiveConfirm(false);
      return;
    }

    const result = await archiveFile(recordId);
    if (result.success) {
      setShowArchiveConfirm(false);
      window.location.reload();
      onClose();
    }
  };

  const create = async (values: EventoForm) => {
    if (!values.record_id) {
      setError(
        "No se encontró el ID del registro. Por favor, sincroniza primero.",
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
      if (!editing) {
        await create(values);
      } else {
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
    <>
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
            <div className="grid grid-cols-5 gap-4">
              <div className="col-span-2">
                <Label>Radicado</Label>
                <Input disabled={true} {...form.register("title")} />
                {errors.title && (
                  <p className="text-red-500 text-xs">{errors.title.message}</p>
                )}
              </div>
              <div>
                <Label>Código Interno</Label>
                <Input disabled={editing} {...form.register("etiqueta")} />
              </div>

              <div className="col-span-2">
                <Label>Abogado</Label>
                {!isEditable ? (
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
                <Input
                  disabled={true}
                  className="truncate"
                  {...form.register("demandante")}
                />
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
                <Input
                  disabled={true}
                  className="truncate"
                  {...form.register("despachoJudicial")}
                />
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
              <div className="flex-1">
                {!editing && (
                  <Button
                    type="button"
                    className="bg-pink-600 hover:bg-pink-700 mr-auto"
                    onClick={handleSync}
                  >
                    Sincronizar
                  </Button>
                )}
                {editing && !isEditable && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => setShowDeleteConfirm(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </Button>

                    {isArchivado && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>
                              <Button
                                type="button"
                                className="bg-pink-600 hover:bg-pink-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                onClick={() => setShowArchiveConfirm(true)}
                                disabled={!canArchive}
                              >
                                <Archive className="h-4 w-4 mr-2" />
                                Archivar
                              </Button>
                            </span>
                          </TooltipTrigger>
                          {!canArchive && (
                            <TooltipContent>
                              <p>
                                Para archivar, el monto debe ser mayor a cero
                              </p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" type="button" onClick={closeModal}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  className="bg-pink-600 hover:bg-pink-700"
                  disabled={isEditable}
                >
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

      <DeleteConfirmationDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleDelete}
      />

      <ArchiveConfirmation
        open={showArchiveConfirm}
        onOpenChange={setShowArchiveConfirm}
        onConfirm={handleArchive}
      />
    </>
  );
}
