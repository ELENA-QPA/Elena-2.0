import { ToolbarProps, View } from "react-big-calendar";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Toolbar(props: ToolbarProps) {
  const goToBack = () => props.onNavigate("PREV");
  const goToNext = () => props.onNavigate("NEXT");
  const goToToday = () => props.onNavigate("TODAY");

  const goToView = (view: View) => props.onView(view);

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-white border-b">

      <div className="flex items-center space-x-2">
        <button onClick={goToBack} className="p-1 rounded hover:bg-gray-100">
          <ChevronLeft size={18} />
        </button>

        <button onClick={goToToday} className="px-2 py-1 text-sm bg-gray-200 rounded hover:bg-gray-300">
          Hoy
        </button>

        <button onClick={goToNext} className="p-1 rounded hover:bg-gray-100">
          <ChevronRight size={18} />
        </button>
      </div>


      <div className="font-semibold text-lg">
        {props.label}
      </div>


      <div className="flex items-center space-x-2">
        <button
          onClick={() => goToView("month")}
          className={`px-2 py-1 rounded text-sm ${
            props.view === "month" ? "bg-pink-600 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Mes
        </button>

        <button
          onClick={() => goToView("week")}
          className={`px-2 py-1 rounded text-sm ${
            props.view === "week" ? "bg-pink-600 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Semana
        </button>

        <button
          onClick={() => goToView("day")}
          className={`px-2 py-1 rounded text-sm ${
            props.view === "day" ? "bg-pink-600 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Día
        </button>

        <button
          onClick={() => goToView("agenda")}
          className={`px-2 py-1 rounded text-sm ${
            props.view === "agenda" ? "bg-pink-600 text-white" : "bg-gray-200 hover:bg-gray-300"
          }`}
        >
          Agenda
        </button>
      </div>
    </div>
  );
}
