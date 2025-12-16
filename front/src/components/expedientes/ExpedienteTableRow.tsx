import React, { memo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Eye, Edit, Trash2 } from "lucide-react";
import { Caso } from "@/modules/informacion-caso/data/interfaces/caso.interface";
import { toast } from "sonner";

interface ExpedienteTableRowProps {
  caso: Caso;
  userRole: string | null;
  onDelete: (id: string) => void;
}

const ExpedienteTableRow = memo(
  ({ caso, userRole, onDelete }: ExpedienteTableRowProps) => {
    const handleDelete = async () => {
      if (
        confirm(
          "¿Está seguro de que desea eliminar este expediente? Esta acción no se puede deshacer y eliminará toda la información relacionada (documentos, intervinientes, partes procesales, etc.)."
        )
      ) {
        try {
          await onDelete(caso._id!);
        } catch (error: any) {
          console.error("Error eliminando expediente:", error);
          toast.error(
            error?.message || "Error inesperado al eliminar el expediente"
          );
        }
      }
    };

    return (
      <TableRow key={caso.internalCode} className="bg-white hover:bg-gray-50">
        {/* # - Código Interno y Etiqueta */}
        <TableCell className="font-medium bg-white">
          <div className="flex flex-col gap-1">
            <span className="font-semibold">{caso.etiqueta || "N/A"}</span>
            {caso.etiqueta && (
              <span className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded"></span>
            )}
          </div>
        </TableCell>

        {/* Nombre Completo */}
        <TableCell className="bg-white max-w-[200px]">
          <div className="flex flex-col">
            <span
              className="font-medium truncate"
              title={caso.proceduralParts?.[0]?.name || "Sin nombre"}
            >
              {caso.proceduralParts?.[0]?.name || "Sin nombre"}
            </span>
          </div>
        </TableCell>

        {/* Radicado */}
        <TableCell className="bg-white max-w-[120px]">
          <span
            className="truncate block"
            title={
              caso.radicado || caso.numeroRadicado || caso.settled || "N/A"
            }
          >
            {caso.radicado || caso.numeroRadicado || caso.settled || "N/A"}
          </span>
        </TableCell>

        {/* Ubicación Expediente */}
        <TableCell className="bg-white max-w-[150px]">
          <span className="truncate block" title={caso.location || "N/A"}>
            {caso.location || "N/A"}
          </span>
        </TableCell>

        {/* Despacho Judicial */}
        <TableCell className="bg-white max-w-[200px]">
          <span
            className="truncate block"
            title={caso.despachoJudicial || caso.office || "N/A"}
          >
            {caso.despachoJudicial || caso.office || "N/A"}
          </span>
        </TableCell>

        {/* Ciudad */}
        <TableCell className="bg-white max-w-[120px]">
          <span className="truncate block" title={caso.city || "N/A"}>
            {caso.city || "N/A"}
          </span>
        </TableCell>

        {/* Tipo de Cliente */}
        <TableCell className="bg-white max-w-[120px]">
          <span className="truncate block" title={caso.clientType}>
            {caso.clientType}
          </span>
        </TableCell>

        {/* Activo */}
        <TableCell className="bg-white">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              caso.type === "ACTIVO"
                ? "bg-green-100 text-green-800"
                : caso.type === "INACTIVO"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {caso.type || "N/A"}
          </span>
        </TableCell>

        {/* Estado */}
        <TableCell className="bg-white">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${
              caso.estado === "ADMITE"
                ? "bg-blue-100 text-blue-800"
                : caso.estado === "FINALIZADO"
                ? "bg-green-100 text-green-800"
                : caso.estado === "EN PROCESO"
                ? "bg-yellow-100 text-yellow-800"
                : caso.estado === "SUSPENDIDO"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {caso.estado || "N/A"}
          </span>
        </TableCell>

        {/* Actualizado */}
        <TableCell className="bg-white">
          <div className="flex flex-col gap-1">
            <span className="font-medium">
              {caso.fechaUltimaActuacion || caso.updatedAt || caso.createdAt
                ? (() => {
                    const date = new Date(
                      (caso.fechaUltimaActuacion || caso.updatedAt) ??
                        caso.createdAt ??
                        ""
                    );                    
                    const year = date.getUTCFullYear();
                    const month = String(date.getUTCMonth() + 1).padStart(
                      2,
                      "0"
                    );
                    const day = String(date.getUTCDate()).padStart(2, "0");
                    return `${day}/${month}/${year}`;
                  })()
                : "N/A"}
            </span>
            
          </div>
        </TableCell>

        <TableCell className="text-right bg-white">
          <div className="flex items-center justify-end gap-2">
            <Link href={`/dashboard/informacion-caso?mode=view&id=${caso._id}`}>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                title="Ver detalles"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </Link>

            {userRole === "admin" && (
              <Link
                href={`/dashboard/informacion-caso?mode=edit&id=${caso._id}`}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 rounded-lg text-gray-600 hover:text-green-600 hover:bg-green-50"
                  title="Editar"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              </Link>
            )}

            {userRole === "admin" && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50"
                title="Eliminar"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

ExpedienteTableRow.displayName = "ExpedienteTableRow";

export default ExpedienteTableRow;
