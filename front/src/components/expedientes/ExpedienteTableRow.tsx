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

const ExpedienteTableRow = memo(({ caso, userRole, onDelete }: ExpedienteTableRowProps) => {
  const handleDelete = async () => {
    if (confirm('¿Está seguro de que desea eliminar este expediente? Esta acción no se puede deshacer y eliminará toda la información relacionada (documentos, intervinientes, partes procesales, etc.).')) {
      try {
        await onDelete(caso._id!);
      } catch (error: any) {
        console.error('Error eliminando expediente:', error);
        toast.error(error?.message || 'Error inesperado al eliminar el expediente');
      }
    }
  };

  return (
    <TableRow key={caso._id} className="bg-white hover:bg-gray-50">
      {/* # */}
      <TableCell className="font-medium bg-white">
        <span className="font-semibold">{caso.internalCode}</span>
      </TableCell>
      
      {/* Nombre Completo */}
      <TableCell className="bg-white max-w-[200px]">
        <div className="flex flex-col">
          <span className="font-medium truncate" title={`${caso.user?.name} ${caso.user?.lastname}`}>
            {caso.proceduralParts[0]?.name!}
          </span>
        </div>
      </TableCell>
      
      {/* Radicado */}
      <TableCell className="bg-white max-w-[120px]">
        <span className="truncate block" title={caso.numeroRadicado || 'N/A'}>
          {caso.settled || 'N/A'}
        </span>
      </TableCell>
      
      {/* Ubicación Expediente */}
      <TableCell className="bg-white max-w-[150px]">
        <span className="truncate block" title={caso.location || 'N/A'}>
          {caso.location || 'N/A'}
        </span>
      </TableCell>
      
      {/* Despacho */}
      <TableCell className="bg-white max-w-[200px]">
        <span className="truncate block" title={caso.office || 'N/A'}>
          {caso.office || 'N/A'}
        </span>
      </TableCell>
      
      {/* Ciudad */}
      <TableCell className="bg-white max-w-[120px]">
        <span className="truncate block" title={caso.city || 'N/A'}>
          {caso.city || 'N/A'}
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
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          caso.type === 'ACTIVO' ? 'bg-green-100 text-green-800' :
          caso.type === 'INACTIVO' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {caso.type || 'N/A'}
        </span>
      </TableCell>
      
      {/* Estado */}
      <TableCell className="bg-white">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          caso.estado === 'ADMITE' ? 'bg-blue-100 text-blue-800' :
          caso.estado === 'FINALIZADO' ? 'bg-green-100 text-green-800' :
          caso.estado === 'EN PROCESO' ? 'bg-yellow-100 text-yellow-800' :
          caso.estado === 'SUSPENDIDO' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {caso.estado || 'N/A'}
        </span>
      </TableCell>
      
      {/* Actualizado */}
      <TableCell className="bg-white">
        <div className="flex flex-col gap-1">
          <span className="font-medium">
            {(caso.updatedAt || caso.createdAt) ? new Date(caso.updatedAt ?? caso.createdAt ?? '').toLocaleDateString('es-ES') : 'N/A'}
          </span>
          <span className="text-xs text-gray-500">
            {(caso.updatedAt || caso.createdAt) ? new Date(caso.updatedAt ?? caso.createdAt ?? '').toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            }) : ''}
          </span>
        </div>
      </TableCell>
      
      <TableCell className="text-right bg-white">
        <div className="flex items-center justify-end gap-2">
          {/* Ver detalles - Disponible para todos */}
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
          
          {/* Editar - Solo para administradores */}
          {userRole === 'admin' && (
            <Link href={`/dashboard/informacion-caso?mode=edit&id=${caso._id}`}>
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
          
          {/* Eliminar - Solo para administradores */}
          {userRole === 'admin' && (
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
});

ExpedienteTableRow.displayName = 'ExpedienteTableRow';

export default ExpedienteTableRow;












