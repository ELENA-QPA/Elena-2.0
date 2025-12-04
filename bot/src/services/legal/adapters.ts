/**
 * Adaptadores para transformar datos de API a modelos de dominio
 */

import { 
  CasesResponse, 
  ProcessDetailsResponse, 
  ClientProcesses, 
  ProcessDetails, 
  ProcessSummary 
} from '../../interfaces/legal.js';

/**
 * Transforma la respuesta de la API de casos a modelo de dominio
 */
export function toClientProcesses(documentNumber: string, response: CasesResponse): ClientProcesses {
  const activeProcesses: ProcessSummary[] = response.active.map(process => ({
    internalCode: process.internalCode,
    status: process.state, // Usar el estado real de la API
    lastUpdate: new Date(process.updatedAt).toLocaleDateString('es-CO'), // Convertir fecha ISO a formato local
    responsible: 'Por asignar', // Se asignará cuando se consulten los detalles
    nextMilestone: 'En proceso'
  }));

  const finalizedProcesses: ProcessSummary[] = response.finalized.map(process => ({
    internalCode: process.internalCode,
    status: process.state, // Usar el estado real de la API
    lastUpdate: new Date(process.updatedAt).toLocaleDateString('es-CO'), // Convertir fecha ISO a formato local
    responsible: 'Finalizado'
  }));

  return {
    documentNumber,
    activeProcesses,
    finalizedProcesses,
    totalActive: response.totalActive,
    totalFinalized: response.totalFinalized
  };
}

/**
 * Transforma la respuesta de detalles de proceso a modelo de dominio
 */
export function toProcessDetails(response: ProcessDetailsResponse): ProcessDetails {
  const record = response.record;
  
  // Obtener la última actuación ordenando por updatedAt
  const lastPerformance = record.performances && record.performances.length > 0 
    ? record.performances
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
    : null;
  
  // El estado es el performanceType de la última actuación
  const status = lastPerformance?.performanceType || 'Sin información';
  
  // Obtener el próximo hito basado en la observación de la última actuación
  const nextMilestone = lastPerformance?.observation || 'Sin información disponible';
  
  // Extraer nombre del cliente del primer demandante
  const clientName = record.proceduralParts?.plaintiffs && record.proceduralParts.plaintiffs.length > 0
    ? record.proceduralParts.plaintiffs[0].name
    : 'Cliente no especificado';

  return {
    id: record._id,
    internalCode: record.internalCode,
    clientName,
    jurisdiction: record.jurisdiction || 'No especificada',
    processType: record.processType || 'No especificado',
    settled: record.settled,
    status,
    responsible: lastPerformance?.responsible || 'No asignado',
    nextMilestone,
    plaintiffs: record.proceduralParts?.plaintiffs?.map(p => p.name) || [],
    defendants: record.proceduralParts?.defendants?.map(d => d.name) || [],
    performances: record.performances?.map(perf => ({
      id: perf._id,
      type: perf.performanceType,
      responsible: perf.responsible,
      observation: perf.observation,
      createdAt: perf.createdAt,
      updatedAt: perf.updatedAt
    })) || []
  };
}

/**
 * Formatea la lista de procesos para mostrar al usuario
 */
export function formatProcessList(processes: ProcessSummary[], type: 'active' | 'finalized'): string {
  const typeLabel = type === 'active' ? 'activos' : 'finalizados';
  const emoji = type === 'active' ? '📂' : '📋';
  
  let message = `${emoji} Procesos ${typeLabel}:\n\n`;
  
  processes.forEach((process, index) => {
    message += `${index + 1}. Proceso #${process.internalCode}\n`;
    message += `   • Estado: ${process.status}\n`;
    if (process.lastUpdate) {
      message += `   • Última actualización: ${process.lastUpdate}\n`;
    }
    if (index < processes.length - 1) {
      message += '\n';
    }
  });  
  return message;
}

/**
 * Formatea los detalles de proceso para mostrar al usuario
 */
export function formatProcessDetails(process: ProcessDetails): string {
  let message = `📄 #${process.internalCode}\n`;
  message += `• Estado: ${process.status}\n`;
  message += `• Responsable: ${process.responsible}\n`;
  message += `• Próximo hito: ${process.nextMilestone}\n`;
  message += `• Jurisdicción: ${process.jurisdiction}\n`;
  message += `• Tipo: ${process.processType}\n`;
  
  if (process.plaintiffs.length > 0) {
    message += `• Demandantes: ${process.plaintiffs.join(', ')}\n`;
  }
  
  if (process.defendants.length > 0) {
    message += `• Demandados: ${process.defendants.join(', ')}\n`;
  }
  
  // Información adicional útil
  if (process.settled && process.settled !== 'NO') {
    message += `• Estado del proceso: ${process.settled}\n`;
  }
  
  // Mostrar fecha de última actualización si está disponible
  if (process.performances && process.performances.length > 0) {
    const lastPerformance = process.performances
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
    
    if (lastPerformance) {
      const lastUpdateDate = new Date(lastPerformance.updatedAt).toLocaleDateString('es-CO');
      message += `• Última actualización: ${lastUpdateDate}\n`;
    }
  }
  
  // Mostrar número total de actuaciones
  if (process.performances && process.performances.length > 0) {
    message += `• Total de actuaciones: ${process.performances.length}\n`;
  }  
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
      // Crear un ProcessDetailsResponse temporal para usar el adapter existente
      const tempResponse: ProcessDetailsResponse = {
        message: allCasesResponse.message,
        record: {
          _id: caseData._id,
          internalCode: caseData.internalCode,
          jurisdiction: caseData.jurisdiction,
          processType: caseData.processType,
          settled: caseData.settled,
          proceduralParts: caseData.proceduralParts,
          performances: caseData.performances
        }
      };
      
      const processDetails = toProcessDetails(tempResponse);
      allProcesses.push(processDetails);
    }
  }

  // Procesar casos finalizados
  if (allCasesResponse.finalized) {
    for (const caseData of allCasesResponse.finalized) {
      // Crear un ProcessDetailsResponse temporal para usar el adapter existente
      const tempResponse: ProcessDetailsResponse = {
        message: allCasesResponse.message,
        record: {
          _id: caseData._id,
          internalCode: caseData.internalCode,
          jurisdiction: caseData.jurisdiction,
          processType: caseData.processType,
          settled: caseData.settled,
          proceduralParts: caseData.proceduralParts,
          performances: caseData.performances
        }
      };
      
      const processDetails = toProcessDetails(tempResponse);
      allProcesses.push(processDetails);
    }
  }

  return allProcesses;
}
