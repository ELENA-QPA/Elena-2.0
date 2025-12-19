"use client";

import { useState} from "react";
import { useMemo } from "react";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {Calendar, dayjsLocalizer, View } from "react-big-calendar";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { Evento } from "@/modules/audiencias/data/interfaces/audiencias.interface";
import {EventMonth, Event} from "./Event";
import { Toolbar } from "./toolbar";

dayjs.locale("es");

interface AudienceCalendarProps {
  onSelectSlot?: (slot: { start: Date; end: Date }) => void;
  onSelectEvent?: (eventData: Evento) => void;
  events?: Evento[]
}


export function AudienceCalendar({ onSelectSlot, onSelectEvent, events }: AudienceCalendarProps) {
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


  return (
    <div style={{ height: 700, width: "100%" }}>
      <Calendar
        selectable
        localizer={localizer}
        events={events}
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

        onSelectSlot={(slot) => onSelectSlot?.(slot)}
        onSelectEvent={(event) => onSelectEvent?.(event)}

        popup
      />
    </div>
  );
}
