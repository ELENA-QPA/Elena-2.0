import { useState, useEffect, useCallback } from "react";
import {Calendar, dayjsLocalizer } from "react-big-calendar";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useMemo } from "react";
import {EventCalendar, EventStyleGetter} from "./Event";
import dayjs from "dayjs";

export function AudienceCalendar() {
  const localizer = dayjsLocalizer(dayjs);

  const [date, setDate] = useState<Date>(new Date());
  const [view, setView] = useState<string>("month");

  const handleView = (newView: string) => {
    setView(newView);
  };
  



  const components = useMemo(() => ({
    event: EventCalendar,
  }), [])

  const sampleEvents = [
  {
    title: "Evento 1",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10, 0),
  },
  {
    title: "Evento 2 - siguiente día",
    start: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 11, 0),
    end: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 12, 0),
  },
  ];



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
        views={["month", "week", "day", "agenda"]}
        defaultView="month"
        eventPropGetter={EventStyleGetter}
      />
    </div>
  );
}
