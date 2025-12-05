
export function EventCalendar({ event }) {
  return (
    <div className="bg-pink-600 hover:bg-pink-700 text-white rounded-lg w-full text-xs py-1 px-2">
        {event.title}
     </div>
  )
}

  export function EventStyleGetter(event) {
    return {
      style: {
        outline: "none",
        border: "none",
        boxShadow: "none",
      }
    };
  }