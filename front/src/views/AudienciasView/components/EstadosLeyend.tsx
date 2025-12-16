import { Estado, LegendColors } from "@/data/interfaces/audiencias.interface";

export function EstadosLeyenda() {
  return (
    <div className="flex gap-2">
      {Object.entries(LegendColors).map(([estado, color]) => (
        <LeyendaItem 
          key={estado}
          estado={estado as Estado}
          color={color}
        />
      ))}
    </div>
  );
}

function LeyendaItem({ estado, color }: { estado: Estado; color: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-center px-1 py-1 rounded-md hover:bg-gray-200">
      <div className={`w-3 h-3 rounded-full ${color}`} />
      <span className="text-xs text-black">{estado.replace("_", " ")}</span>
    </div>
  );
}
