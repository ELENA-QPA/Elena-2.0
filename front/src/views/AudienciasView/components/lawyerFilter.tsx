"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LawyerFilterProps {
  lawyersRecord: Record<string, string>;
  onFilter: (lawyerId: string) => void;
  isVisible?: boolean;
  noLawyerValue: string;
}

export function LawyerFilter({
  lawyersRecord,
  onFilter,
  isVisible,
  noLawyerValue,
}: LawyerFilterProps) {
  const [selectedLawyerId, setSelectedLawyerId] = useState<string>("");

  const handleFilterClick = () => {
    if (selectedLawyerId) {
      onFilter(selectedLawyerId);
    }
  };

  return (
    <>
      {isVisible ? (
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <Label>Abogado</Label>
            <Select
              disabled={Object.keys(lawyersRecord).length === 0}
              value={selectedLawyerId}
              onValueChange={(val) => setSelectedLawyerId(val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un abogado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={noLawyerValue}>
                  Todos los abogados
                </SelectItem>

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
                  <SelectItem value="no-lawyers">
                    No hay abogados disponibles
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <Button
            variant="outline"
            onClick={handleFilterClick}
            disabled={!selectedLawyerId}
            className="mt-6"
          >
            Filtrar
          </Button>
        </div>
      ) : (
        <div> </div>
      )}
    </>
  );
}
