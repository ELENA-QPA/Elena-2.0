import {Evento} from "@/data/interfaces/audiencias.interface";
import { getColorLegend} from "../utilities/utilities";
import dayjs from "dayjs";
  
export function EventBase({ children, cliente }: { 
  children: React.ReactNode,
  cliente: string
}) {
  const color = getColorLegend(cliente);
  return (
    <div className={`
      ${color} hover:opacity-90 text-white rounded-lg 
      w-full h-full text-xs py-1 px-2
      flex flex-col gap-0.5
    `}>
      {children}
    </div>
  );
}

export function EventMonth({ event }: { event: Evento }) {

  const color = getColorLegend(event.demandado);
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2 items-start px-1 hover:bg-gray-200 rounded-md">
      <div className={`w-2 h-2 rounded-full ${color} mt-1`} />
      <div className="text-xs text-black min-w-0 whitespace-normal break-all leading-tight">
        {event.demandante} - {event.demandado}
      </div>

    </div>
  );
}



export function Event({ event }: { event: Evento }) {
  const startFormatted = dayjs(event.start).format("HH:mm");
  const endFormatted = dayjs(event.end).format("HH:mm");
  return(
    <EventBase cliente={event.demandado}>
      <span> {startFormatted} - {endFormatted} </span>
      <span> {event.demandante} - {event.demandado} </span>
      <span> {event.abogado} </span>
    </EventBase>
  );
}