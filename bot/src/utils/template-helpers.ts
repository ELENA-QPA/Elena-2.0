import Handlebars from "handlebars";

/**
 * Helper para formatear fechas en Handlebars
 * Convierte ISO string a formato DD/MM/YYYY
 */
// Handlebars.registerHelper("formatDate", function (dateString: string) {
//   if (!dateString) return "N/A";

//   try {
//     const date = new Date(dateString);
//     return date.toLocaleDateString("es-CO", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     });
//   } catch (error) {
//     console.error("Error formateando fecha:", error);
//     return "Fecha inválida";
//   }
// });

/**
 * Helper para formatear fechas completas con hora
 * Convierte ISO string a formato DD/MM/YYYY HH:MM
 */
Handlebars.registerHelper("formatDateTime", function (dateString: string) {
  if (!dateString) return "N/A";

  try {
    const date = new Date(dateString);
    return date.toLocaleString("es-CO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (error) {
    console.error("Error formateando fecha y hora:", error);
    return "Fecha inválida";
  }
});

/**
 * Helper para capitalizar texto
 */
Handlebars.registerHelper("capitalize", function (text: string) {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
});

/**
 * Helper para truncar texto
 */
Handlebars.registerHelper("truncate", function (text: string, length: number) {
  if (!text) return "";
  if (text.length <= length) return text;
  return text.substring(0, length) + "...";
});

/**
 * Helper para formatear números de documento
 */
Handlebars.registerHelper("formatDocument", function (document: string) {
  if (!document) return "N/A";

  // Si es un número, formatearlo con puntos
  if (/^\d+$/.test(document)) {
    return document.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  }

  return document;
});

/**
 * Helper para obtener la fecha actual formateada
 */
Handlebars.registerHelper("currentDate", function () {
  return new Date().toLocaleDateString("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
});

/**
 * Helper para verificar si hay elementos en un array
 */
Handlebars.registerHelper("hasItems", function (array: any[]) {
  return array && array.length > 0;
});

/**
 * Helper para obtener el primer elemento de un array
 */
Handlebars.registerHelper("first", function (array: any[]) {
  if (!array || array.length === 0) return null;
  return array[0];
});

/**
 * Helper para obtener el último elemento de un array
 */
Handlebars.registerHelper("last", function (array: any[]) {
  if (!array || array.length === 0) return null;
  return array[array.length - 1];
});

/**
 * Helper para contar elementos en un array
 */
Handlebars.registerHelper("count", function (array: any[]) {
  if (!array) return 0;
  return array.length;
});

/**
 * Helper para formatear estado del proceso
 */
Handlebars.registerHelper("formatStatus", function (status: string) {
  if (!status) return "N/A";

  const statusMap: Record<string, string> = {
    RADICADO: "Radicado",
    EN_CURSO: "En curso",
    EN_ESPERA: "En espera",
    FINALIZADO: "Finalizado",
    SUSPENDIDO: "Suspendido",
  };

  return statusMap[status.toUpperCase()] || status;
});

/**
 * Helper para formatear tipo de proceso
 */
Handlebars.registerHelper("formatProcessType", function (processType: string) {
  if (!processType) return "N/A";

  const typeMap: Record<string, string> = {
    ORDINARIO_LABORAL: "Ordinario Laboral",
    PROCESO_VERBAL: "Proceso Verbal",
    PROCESO_EJECUTIVO: "Proceso Ejecutivo",
    PROCESO_CIVIL: "Proceso Civil",
    PROCESO_PENAL: "Proceso Penal",
  };

  return typeMap[processType.toUpperCase()] || processType;
});

/**
 * Helper para formatear fechas en Handlebars 
 */
Handlebars.registerHelper("formatDate", function (dateString: string) {
  if (!dateString) return "N/A";

  try {
    // Si ya está en formato DD/MM/YYYY, devolverlo tal cual
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
      return dateString;
    }

    // Si es formato ISO (2026-01-16T00:00:00 o 2026-01-16)
    if (dateString.includes("-")) {
      const date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
    }

    // Intentar parsear como fecha genérica
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString("es-CO", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    }

    // Si no se puede parsear, devolver el string original
    return dateString;
  } catch (error) {
    console.error("Error formateando fecha:", error);
    return dateString || "N/A";
  }
});

export default Handlebars;
