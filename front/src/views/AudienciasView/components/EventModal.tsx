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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

// import { eventoSchema, EventoForm } from "@/data/schemas/evento.schema";
import { Estado } from "@/modules/audiencias/data/interfaces/audiencias.interface";
import { z } from "zod";
import { useEffect } from "react";

export const ESTADOS = [
  "Programada",
  "Celebrada",
  "No_celebrada",
  "Conciliada",
] as const satisfies Estado[];

export const estadoLabels: Record<Estado, string> = {
  Programada: "Programada",
  Celebrada: "Celebrada",
  No_celebrada: "No celebrada",
  Conciliada: "Conciliada",
};

export const eventoSchema = z.object({
  title: z.string().min(1),
  demandante: z.string().min(1),
  demandado: z.string().min(1),
  juzgado: z.string().min(1),
  abogado: z.string(),

  start: z.string(),
  end: z.string(),

  link_teams: z.string().url().optional().or(z.literal("")),
  codigo_interno: z.string().optional(),

  estado: z.enum(ESTADOS),

  monto_conciliado: z.coerce.number().optional(),
});
export type EventoForm = z.infer<typeof eventoSchema>;

interface EventModalProps {
  open: boolean;
  onClose: () => void;
  onCreate?: (evento: EventoForm) => void;
  initialData?: Partial<EventoForm>;
  lawyersRecord?: Record<string, string>;
}

export function EventModal({ open, onClose, onCreate, initialData, lawyersRecord = {} }: EventModalProps) {
  
  const form = useForm<EventoForm>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      title: "",
      demandante: "",
      demandado: "",
      juzgado: "",
      abogado: "",
      codigo_interno: "",
      link_teams: "",
      estado: "Programada",
      start: "",
      end: "",
    },
  });

 useEffect(() => {
  form.reset({
    ...initialData,
  });
  
}, [open]);



  const submit = (values: EventoForm) => {
    onCreate?.(values);
    form.reset();
  };

  const closeModal = () => {
    form.reset();
    onClose();
  };

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={closeModal}>
      <DialogContent 
        className="sm:max-w-2xl"
        onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Crear Evento</DialogTitle>
          <DialogDescription>Completa los campos para crear un nuevo evento.</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Radicado</Label>
              <Input {...form.register("title")} />
              {errors.title && <p className="text-red-500 text-xs">{errors.title.message}</p>}
            </div>

          <div>
              <Label>Abogado</Label>
              <Select
                value={form.watch("abogado")}
                onValueChange={(v) => form.setValue("abogado", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un abogado" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(lawyersRecord).length > 0 ? (
                    Object.entries(lawyersRecord).map(([name, id]) => (
                      <SelectItem key={id} value={id}>
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
              {errors.abogado && <p className="text-red-500 text-xs">{errors.abogado.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Demandante</Label>
              <Input {...form.register("demandante")} />
            </div>

            <div>
              <Label>Demandado</Label>
              <Input {...form.register("demandado")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Juzgado</Label>
              <Input {...form.register("juzgado")} />
            </div>

            <div>
              <Label>Código Interno</Label>
              <Input {...form.register("codigo_interno")} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inicio</Label>
              <Input type="datetime-local" {...form.register("start")} />
            </div>
            <div>
              <Label>Fin</Label>
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
              <Input type="number" {...form.register("monto_conciliado")} />
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
                    <SelectItem key={est} value={est}>
                      {estadoLabels[est]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={closeModal}>Cancelar</Button>
            <Button type="submit" className="bg-pink-600 hover:bg-pink-700" onClick={closeModal}>
              Crear
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
