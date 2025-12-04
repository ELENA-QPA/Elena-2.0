"use client"

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function ModeSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentMode = searchParams.get("mode") || "create";
  const currentId = searchParams.get("id") || "";

  const [mode, setMode] = useState<string>(currentMode);
  const [id, setId] = useState<string>(currentId);

  useEffect(() => {
    setMode(currentMode);
    setId(currentId);
  }, [currentMode, currentId]);

  const canNavigate = useMemo(() => {
    if (mode === "create") return true;
    return id.trim().length > 0;
  }, [mode, id]);

  const go = () => {
    const base = "/dashboard/informacion-caso";
    const query = mode === "create" ? `?mode=${mode}` : `?mode=${mode}&id=${encodeURIComponent(id)}`;
    router.push(`${base}${query}`);
  };

  return (
    <div className="w-full bg-gray-50 border-b border-gray-200 mb-4">
      <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="text-sm text-gray-700">Selecciona el modo para trabajar con el expediente</div>
        <div className="flex items-center gap-2">
          <Select value={mode} onValueChange={setMode}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Modo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="create">Crear</SelectItem>
              <SelectItem value="edit">Editar</SelectItem>
              <SelectItem value="view">Ver</SelectItem>
            </SelectContent>
          </Select>
          {mode !== "create" && (
            <Input
              placeholder="ID del caso"
              value={id}
              onChange={(e) => setId(e.target.value)}
              className="w-60"
            />
          )}
          <Button onClick={go} disabled={!canNavigate} className="elena-button-primary">
            Ir
          </Button>
        </div>
      </div>
    </div>
  );
}
