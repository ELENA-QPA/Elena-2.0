import {
  CasesResponse,
  ProcessDetailsResponse,
  ClientProcesses,
  ProcessDetails,
  ProcessSummary,
} from "../../interfaces/legal.js";

//Transforma la respuesta de la API de casos a modelo de dominio

export function toClientProcesses(
  documentNumber: string,
  response: CasesResponse
): ClientProcesses {
  const activeProcesses: ProcessSummary[] = response.active.map((process) => ({
    internalCode: process.internalCode,
    status: process.state,
    lastUpdate: new Date(process.updatedAt).toLocaleDateString("es-CO"),
    responsible: "Por asignar",
    nextMilestone: "En proceso",
    etiqueta: (process as any).etiqueta || undefined,
    radicado: (process as any).radicado || undefined,
    despachoJudicial: (process as any).despachoJudicial || undefined,
    city: (process as any).city || undefined,
    ultimaActuacion: (process as any).ultimaActuacion || undefined,
    fechaUltimaActuacion: (process as any).fechaUltimaActuacion || undefined,
  }));

  const finalizedProcesses: ProcessSummary[] = response.finalized.map(
    (process) => ({
      internalCode: process.internalCode,
      status: process.state,
      lastUpdate: new Date(process.updatedAt).toLocaleDateString("es-CO"),
      responsible: "Finalizado",
      etiqueta: (process as any).etiqueta || undefined,
      radicado: (process as any).radicado || undefined,
      despachoJudicial: (process as any).despachoJudicial || undefined,
      city: (process as any).city || undefined,
      ultimaActuacion: (process as any).ultimaActuacion || undefined,
      fechaUltimaActuacion: (process as any).fechaUltimaActuacion || undefined,
    })
  );

  return {
    documentNumber,
    activeProcesses,
    finalizedProcesses,
    totalActive: response.totalActive,
    totalFinalized: response.totalFinalized,
  };
}

//Transforma la respuesta de detalles de proceso a modelo de dominio

export function toProcessDetails(
  response: ProcessDetailsResponse
): ProcessDetails {
  const record = response.record;

  const lastPerformance =
    record.performances && record.performances.length > 0
      ? record.performances.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )[0]
      : null;

  const status = lastPerformance?.performanceType || "Sin información";
  const nextMilestone =
    lastPerformance?.observation || "Sin información disponible";

  const clientName =
    record.proceduralParts?.plaintiffs &&
    record.proceduralParts.plaintiffs.length > 0
      ? record.proceduralParts.plaintiffs[0].name
      : "Cliente no especificado";

  return {
    id: record._id,
    internalCode: record.internalCode,
    clientName,
    jurisdiction: record.jurisdiction || "No especificada",
    processType: record.processType || "No especificado",
    settled: record.settled,
    status,
    responsible: lastPerformance?.responsible || "No asignado",
    nextMilestone,
    plaintiffs: record.proceduralParts?.plaintiffs?.map((p) => p.name) || [],
    defendants: record.proceduralParts?.defendants?.map((d) => d.name) || [],
    performances:
      record.performances?.map((perf) => ({
        id: perf._id,
        type: perf.performanceType,
        responsible: perf.responsible,
        observation: perf.observation,
        createdAt: perf.createdAt,
        updatedAt: perf.updatedAt,
      })) || [],
    etiqueta: (record as any).etiqueta || "",
    radicado: (record as any).radicado || "",
    despachoJudicial: (record as any).despachoJudicial || "",
    city: (record as any).city || "",
    ultimaActuacion: (record as any).ultimaActuacion || "",
    fechaUltimaActuacion: (record as any).fechaUltimaActuacion || "",
  };
}

//Formatea la lista de procesos para mostrar al usuario

export function formatProcessList(
  processes: ProcessSummary[],
  type: "active" | "finalized"
): string {
  const typeLabel = type === "active" ? "activos" : "finalizados";
  //const emoji = type === "active" ? "📂" : "📋";

  //let message = `${emoji} *Procesos ${typeLabel}:* \n\n`;
  let message = `*Procesos ${typeLabel}:* \n\n`;

  processes.forEach((process, index) => {
    // Usar etiqueta si existe, sino usar internalCode
    const processId = (process as any).etiqueta || '';

    message += `*${index + 1}. Proceso:* #${processId}\n`;

    // Mostrar última actuación si existe
    if ((process as any).ultimaActuacion) {
      message += `   *• Última actuación:* ${(process as any).ultimaActuacion}\n`;
    }

    // Usar fechaUltimaActuacion si existe, sino usar lastUpdate
    const fechaActualizacion =
      (process as any).fechaUltimaActuacion || '';
    if (fechaActualizacion) {
      message += `   *• Fecha última actuación:* ${fechaActualizacion}\n`;
    }

    if (index < processes.length - 1) {
      message += "\n";
    }
  });
  return message;
}

//Formatea los detalles de proceso para mostrar al usuario

export function formatProcessDetails(process: ProcessDetails): string {

  const radicado = (process as any).radicado;
  const etiqueta = (process as any).etiqueta;

  let message = radicado
    ? ` *Proceso #${etiqueta || process.internalCode}*\n\n`
    : ` *Radicado:* ${radicado}\n\n`;

  // Mostrar el número de radicado
  if (etiqueta && radicado) {
    message += ` *Radicado:* #${radicado}\n`;
  }

  // Despacho Judicial
  if ((process as any).despachoJudicial) {
    message += ` *Despacho:* ${(process as any).despachoJudicial}\n`;
  }

  // Ciudad
  if ((process as any).city) {
    message += ` *Ciudad:* ${(process as any).city}\n`;
  }

  // Última actuación
  if ((process as any).ultimaActuacion) {
    message += ` *Última actuación:* ${(process as any).ultimaActuacion}\n`;
  }

  // Última actuación (fecha)
  if ((process as any).fechaUltimaActuacion) {
    message += ` *Fecha última actuación:* ${(process as any).fechaUltimaActuacion}\n`;
  }

  // Demandantes
  if (process.plaintiffs.length > 0) {
    message += ` *Demandante${
      process.plaintiffs.length > 1 ? "s" : ""
    }:* ${process.plaintiffs.join(", ")}\n`;
  }

  // Demandados
  if (process.defendants.length > 0) {
    message += ` *Demandado${
      process.defendants.length > 1 ? "s" : ""
    }:* ${process.defendants.join(", ")}\n`;
  }

  // Total de actuaciones
  // if (process.performances && process.performances.length > 0) {
  //   message += `\n *Total de actuaciones:* ${process.performances.length}`;
  // }

  return message;
}

/**
 * Transforma la respuesta de todos los casos con detalles a array de ProcessDetails
 */
export function toAllProcessDetails(allCasesResponse: any): ProcessDetails[] {
  const allProcesses: ProcessDetails[] = [];

  // Procesar casos activos
  if (allCasesResponse.active) {
    for (const caseData of allCasesResponse.active) {
      const tempResponse: ProcessDetailsResponse = {
        message: allCasesResponse.message,
        record: {
          _id: caseData._id,
          internalCode: caseData.internalCode,
          jurisdiction: caseData.jurisdiction,
          processType: caseData.processType,
          settled: caseData.settled,
          proceduralParts: caseData.proceduralParts,
          performances: caseData.performances,
          // Pasar campos adicionales
          ...caseData,
        },
      };

      const processDetails = toProcessDetails(tempResponse);
      allProcesses.push(processDetails);
    }
  }

  // Procesar casos finalizados
  if (allCasesResponse.finalized) {
    for (const caseData of allCasesResponse.finalized) {
      const tempResponse: ProcessDetailsResponse = {
        message: allCasesResponse.message,
        record: {
          _id: caseData._id,
          internalCode: caseData.internalCode,
          jurisdiction: caseData.jurisdiction,
          processType: caseData.processType,
          settled: caseData.settled,
          proceduralParts: caseData.proceduralParts,
          performances: caseData.performances,
          ...caseData,
        },
      };

      const processDetails = toProcessDetails(tempResponse);
      allProcesses.push(processDetails);
    }
  }

  return allProcesses;
}
