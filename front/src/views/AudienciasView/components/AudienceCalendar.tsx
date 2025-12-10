"use client";

import { useState} from "react";
import { useMemo } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {Calendar, dayjsLocalizer, View } from "react-big-calendar";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Evento } from "@/data/interfaces/audiencias.interface";
import {EventMonth, Event} from "./Event";
import { Toolbar } from "./toolbar";

dayjs.locale("es");

export function AudienceCalendar() {
  const localizer = dayjsLocalizer(dayjs);

  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<View>("month");

  const handleView = (newView: View) => {
    setView(newView);
  };
  
  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };



  const components = useMemo(() => ({
    event: Event,
    month : { event: EventMonth },
    toolbar: Toolbar,
  }), []) as any

 const sampleEvents: Evento[] = [
  {
    title: "11001-31-05-001-2024-00001-00",
    demandante: "Juan Pérez",
    demandado: "Rappi",
    juzgado: "Juzgado 5 Civil Municipal de Bogotá",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0),
    link_teams: "https://teams.microsoft.com/l/meetup-join/ejemplo1",
    codigo_interno: "CIV-2025-001",
    resumen_hechos: "Conflicto por incumplimiento de contrato de arrendamiento.",
    estado: "Programada",
    abogado: "Ana Gómez",
  },
  {
    title: "11001-31-05-002-2024-00045-00",
    demandante: "Carlos Méndez",
    demandado: "Empresa de nombre muy largo SAS",
    juzgado: "Juzgado 2 Civil del Circuito de Bogotá",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 14, 30),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 15, 30),
    link_teams: "https://teams.microsoft.com/l/meetup-join/ejemplo2",
    codigo_interno: "CIV-2025-045",
    resumen_hechos: "Reclamación por daños y perjuicios derivados de un contrato comercial.",
    estado: "Celebrada",
    monto_conciliado: 2500000,
    abogado: "Ana Gómez",
  },
  {
    title: "11001-31-05-007-2024-00012-00",
    demandante: "Laura Ríos",
    demandado: "Bancolombia",
    juzgado: "Juzgado 7 Civil Municipal de Bogotá",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2, 11, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 2, 12, 0),
    link_teams: "https://teams.microsoft.com/l/meetup-join/ejemplo3",
    codigo_interno: "CIV-2025-012",
    resumen_hechos: "Cobros no reconocidos en productos financieros.",
    estado: "Conciliada",
    monto_conciliado: 800000,
    abogado: "Ana Gómez",
  },
  {
    title: "11001-31-05-009-2024-00087-00",
    demandante: "Pedro Torres",
    demandado: "Movistar",
    juzgado: "Juzgado 9 Civil Municipal de Bogotá",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3, 16, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 3, 17, 0),
    link_teams: "https://teams.microsoft.com/l/meetup-join/ejemplo4",
    codigo_interno: "CIV-2025-087",
    resumen_hechos: "Incumplimiento en la prestación del servicio de telecomunicaciones.",
    estado: "No_celebrada",
    abogado: "Ana Gómez",
  },
  {
    title: "11001-31-05-003-2024-00123-00",
    demandante: "Empresa ABC SAS",
    demandado: "Cliente Final",
    juzgado: "Juzgado 3 Civil del Circuito de Bogotá",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 4, 8, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 4, 9, 0),
    link_teams: "https://teams.microsoft.com/l/meetup-join/ejemplo5",
    codigo_interno: "CIV-2025-123",
    resumen_hechos: "Disputa comercial por incumplimiento de contrato B2B.",
    estado: "Programada",
    abogado: "Ana Gómez",
  },];




  return (
    <div style={{ height: 700, width: "100%" }}>
      <Calendar
        localizer={localizer}
        events={sampleEvents}
        components={components}
        startAccessor="start"
        endAccessor="end"
        date={date}
        view={view}
        onView={handleView}
        onNavigate={handleNavigate}
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        min={new Date(1970, 1, 1, 5, 0)}
        max={new Date(1970, 1, 1, 20, 0)}

        messages={{
          date: "Fecha",
          time: "Hora",
          event: "Evento",
          allDay: "Todo el día",
          noEventsInRange: "No hay eventos en este rango.",
        }}
      />
    </div>
  );
}
