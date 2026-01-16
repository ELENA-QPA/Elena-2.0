import "dotenv/config";
import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  WASocket,
  proto,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import * as QRCode from "qrcode";
import { createServer } from "http";
import { join } from "path";
import { existsSync, mkdirSync, createReadStream, readdirSync } from "fs";
import { config } from "./config/env.js";
import { lawyerNotificationService } from "./services/lawyer-notification.service.js";
import { pdfGeneratorService } from "./services/pdf-generator.service.js";
import { LegalApiServiceFactory } from "./services/legal/index.js";
import {
  toClientProcesses,
  toProcessDetails,
  formatProcessList,
  formatProcessDetails,
  toAllProcessDetails,
} from "./services/legal/adapters.js";
import {
  generateOptionsMessage,
  generateDocumentOptionsMessage,
  generateProcessOptionsMessage,
  generateErrorAlternativesMessage,
} from "./utils/message-utils.js";

// ============================================
// TIPOS Y CONSTANTES
// ============================================

interface UserState {
  currentFlow: string;
  selectedOption?: string;
  currentDocument?: string;
  documentType?: string;
  currentProcesses?: any;
  selectedProcessType?: string;
  selectedProcess?: any;
  clientName?: string;
}

const userStates = new Map<string, UserState>();

const DOCUMENT_TYPES = [
  "Cédula de Ciudadanía",
  "Permiso Especial de Permanencia",
  "Permiso de protección temporal",
  "NIT",
  "Pasaporte",
  "Cédula de extranjería",
];

const HELLO_OPTIONS = [
  "¿Tienes actualmente un proceso con nosotros?",
  "¿Quieres iniciar un proceso con nosotros?",
];

const PROFILE_OPTIONS = [
  "¿Eres Rappitendero?",
  "¿Eres una empresa?",
  "¿Otro perfil? (independiente, particular, etc.)",
];

// ============================================
// GESTIÓN DE ESTADO
// ============================================

function getState(userId: string): UserState {
  if (!userStates.has(userId)) {
    userStates.set(userId, { currentFlow: "IDLE" });
  }
  return userStates.get(userId)!;
}

function updateState(userId: string, updates: Partial<UserState>): void {
  const current = getState(userId);
  userStates.set(userId, { ...current, ...updates });
}

function resetState(userId: string): void {
  userStates.set(userId, { currentFlow: "IDLE" });
}

// ============================================
// UTILIDADES
// ============================================

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendTyping(
  sock: WASocket,
  jid: string,
  duration: number = 1200
): Promise<void> {
  try {
    await sock.sendPresenceUpdate("composing", jid);
    await delay(duration);
    await sock.sendPresenceUpdate("paused", jid);
  } catch (error) {
    console.warn("Error mostrando typing:", error);
  }
}

async function sendMessage(
  sock: WASocket,
  jid: string,
  text: string
): Promise<void> {
  await sock.sendMessage(jid, { text });
}

async function sendMediaMessage(
  sock: WASocket,
  jid: string,
  text: string,
  mediaUrl: string
): Promise<void> {
  await sock.sendMessage(jid, {
    document: { url: mediaUrl },
    mimetype: "application/pdf",
    fileName: mediaUrl.split("/").pop() || "documento.pdf",
    caption: text,
  });
}

// ============================================
// MANEJADOR PRINCIPAL DE MENSAJES
// ============================================

async function handleMessage(
  sock: WASocket,
  msg: proto.IWebMessageInfo
): Promise<void> {
  if (!msg.message || msg.key.fromMe) return;

  const jid = msg.key.remoteJid!;
  const userId = jid.replace("@s.whatsapp.net", "");
  const text =
    msg.message.conversation || msg.message.extendedTextMessage?.text || "";
  const userName = msg.pushName || "";

  if (!text) return;

  const state = getState(userId);
  const input = text.trim().toLowerCase();

  // Comandos globales de reinicio
  if (["menu", "inicio", "reiniciar", "start"].includes(input)) {
    resetState(userId);
    await handleWelcome(sock, jid, userName);
    return;
  }

  // Router de flujos basado en estado
  switch (state.currentFlow) {
    case "IDLE":
      await handleWelcome(sock, jid, userName);
      break;
    case "HELLO_SELECTION":
      await handleHelloSelection(sock, jid, text, userId);
      break;
    case "DATA_AUTHORIZATION":
      await handleDataAuthorization(sock, jid, text, userId, userName);
      break;
    case "NEW_PROCESS_PROFILE":
      await handleNewProcessProfile(sock, jid, text, userId, userName);
      break;
    case "WAITING_DOCUMENT_TYPE":
      await handleDocumentType(sock, jid, text, userId);
      break;
    case "WAITING_DOCUMENT":
      await handleDocumentNumber(sock, jid, text, userId);
      break;
    case "LEGAL_PROCESS_SELECTION":
      await handleProcessSelection(sock, jid, text, userId);
      break;
    case "LEGAL_PROCESS_DETAILS":
    case "LEGAL_PROCESS_DETAILS_OR_OPTIONS":
      await handleProcessDetails(sock, jid, text, userId);
      break;
    case "LEGAL_FINALIZED_PROCESSES":
      await handleFinalizedProcesses(sock, jid, text, userId, userName);
      break;
    case "LEGAL_PDF_CONFIRMATION":
      await handlePdfConfirmation(sock, jid, text, userId);
      break;
    case "PDF_SUMMARY_OPTIONS":
      await handlePdfSummaryOptions(sock, jid, text, userId, userName);
      break;
    case "MAIN_OPTIONS":
      await handleMainOptions(sock, jid, text, userId);
      break;
    default:
      await handleWelcome(sock, jid, userName);
  }
}

// ============================================
// FLUJO: BIENVENIDA
// ============================================

async function handleWelcome(
  sock: WASocket,
  jid: string,
  userName: string
): Promise<void> {
  const userId = jid.replace("@s.whatsapp.net", "");

  await sendTyping(sock, jid, 1200);

  const message = generateOptionsMessage(
    "👋 ¡Hola! Bienvenido/a a ELENA – QPAlliance, tu asistente legal virtual.\n\nAntes de continuar, cuéntame:",
    HELLO_OPTIONS
  );

  await sendMessage(sock, jid, message);
  updateState(userId, { currentFlow: "HELLO_SELECTION" });
}

async function handleHelloSelection(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const option = input.trim();

  if (option !== "1" && option !== "2") {
    await sendMessage(
      sock,
      jid,
      "❌ Opción inválida. Por favor, responde con 1 o 2."
    );
    return;
  }

  updateState(userId, {
    currentFlow: "DATA_AUTHORIZATION",
    selectedOption: option,
  });

  await sendTyping(sock, jid, 2000);

  const authMessage = `Antes de continuar, queremos contarte que de conformidad con la Ley 1581 de 2012 y demás normas aplicables en Colombia, los datos personales que suministres a través de este canal serán recolectados, almacenados y tratados por Alliance, con la finalidad de prestar asesoría jurídica, gestionar procesos legales, enviarte notificaciones sobre el estado de tus trámites y facilitar la comunicación contigo. Tus datos serán manejados de manera confidencial y segura, y no serán compartidos con terceros sin tu autorización expresa, salvo en los casos previstos por la ley. Como titular de la información, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento.

¿Aceptas el tratamiento de tus datos personales conforme a nuestra política de privacidad?
👉 Responde:
1️⃣ Sí, acepto
2️⃣ No acepto`;

  await sendMessage(sock, jid, authMessage);
}

async function handleDataAuthorization(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string,
  userName: string
): Promise<void> {
  const normalized = input.trim().toLowerCase();
  const state = getState(userId);

  const affirmative = ["1", "sí", "si", "acepto"];
  const negative = ["2", "no", "rechazo", "no acepto"];

  if (affirmative.includes(normalized)) {
    await sendTyping(sock, jid, 1000);
    await sendMessage(
      sock,
      jid,
      "✅ ¡Perfecto! Gracias por aceptar nuestra política de privacidad.\n\nAhora continuemos con tu solicitud..."
    );

    if (state.selectedOption === "1") {
      updateState(userId, { currentFlow: "WAITING_DOCUMENT_TYPE" });
      await handleDocumentHandler(sock, jid, userId);
    } else {
      updateState(userId, { currentFlow: "NEW_PROCESS_PROFILE" });
      await handleNewProcess(sock, jid, userId);
    }
  } else if (negative.includes(normalized)) {
    await sendTyping(sock, jid, 1500);
    await sendMessage(
      sock,
      jid,
      "Gracias por tu respuesta, en esta ocasión no podemos seguir adelante con tu solicitud debido a que no hay aceptación del tratamiento de datos personales.\n\nSi cambias de opinión en el futuro, puedes contactarnos nuevamente.\n\n¡Que tengas un excelente día! 👋"
    );
    resetState(userId);
  } else {
    await sendMessage(
      sock,
      jid,
      "❌ Opción inválida. Por favor, responde con 1, 2, sí, no, acepto o no acepto."
    );
  }
}

// ============================================
// FLUJO: NUEVO PROCESO
// ============================================

async function handleNewProcess(
  sock: WASocket,
  jid: string,
  userId: string
): Promise<void> {
  await sendTyping(sock, jid, 1200);

  const message = generateOptionsMessage(
    "¡Excelente noticia! 🎉\n\nQueremos acompañarte en este camino legal y asegurarnos de que recibas la mejor orientación.\n\nPara comenzar, dime por favor:",
    PROFILE_OPTIONS
  );

  await sendMessage(sock, jid, message);
}

async function handleNewProcessProfile(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string,
  userName: string
): Promise<void> {
  const option = input.trim();

  switch (option) {
    case "1": // Rappitendero
      await sendTyping(sock, jid, 1500);
      await sendMessage(
        sock,
        jid,
        `🙌 ¡Excelente! Estamos listos para acompañarte durante todo el proceso y brindarte el respaldo legal que necesitas.

👉 Para conocerte mejor y ofrecerte la mejor atención, te enviaré un formulario rápido que debes diligenciar y un video que te explicará a detalle en qué va a consistir tu caso.

📋 Formulario:
https://docs.google.com/forms/d/e/1FAIpQLScrONKT_avUatwpKU2Lh5iUn6FOEkVgrJkDwmvuaKj1AfM1Ng/viewform?usp=dialog

🎥 Videos explicativos:

📹 Video 1 - Introducción:
https://quinteropalacio-my.sharepoint.com/:v:/g/personal/storres_qpalliance_co/ERrRc0TKZddIpohr5x8XoaUBH6pqI9dHw3jwMzul0tR81A

📹 Video 2 - ¿Qué pasa después de la demanda?:
https://quinteropalacio-my.sharepoint.com/:v:/g/personal/storres_qpalliance_co/ESQL3wiJawNHpcpJw3WaQUUBsPyFvtU08gR-sqHpGRiJAQ

Gracias por confiar en nosotros. Una vez hayas completado el formulario, un abogado se pondrá en contacto contigo🙌.`
      );
      resetState(userId);
      break;

    case "2": // Empresa
      await sendTyping(sock, jid, 1200);
      await lawyerNotificationService.notifyLawyer(
        userId,
        userName,
        "Empresa",
        "Iniciar proceso legal empresarial"
      );
      await sendMessage(
        sock,
        jid,
        `🏢 Gracias por confiar en nosotros.

Para darte un servicio ajustado a tu caso, te contactaremos con un asesor.

Un abogado especializado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas empresariales🙌.`
      );
      resetState(userId);
      break;

    case "3": // Otro perfil
      await sendTyping(sock, jid, 1200);
      await lawyerNotificationService.notifyLawyer(
        userId,
        userName,
        "Otro perfil",
        "Iniciar proceso legal personalizado"
      );
      await sendMessage(
        sock,
        jid,
        `Perfecto 🙌.

Queremos conocer mejor tu perfil y tu caso para ofrecerte la mejor asesoría.

Para darte un servicio ajustado a tu caso, te contactaremos con un asesor.

Un abogado especializado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas🙌.`
      );
      resetState(userId);
      break;

    default:
      await sendMessage(
        sock,
        jid,
        "❌ Opción inválida. Por favor, responde con 1, 2 o 3."
      );
  }
}

// ============================================
// FLUJO: DOCUMENTO
// ============================================

async function handleDocumentHandler(
  sock: WASocket,
  jid: string,
  userId: string
): Promise<void> {
  await sendTyping(sock, jid, 1000);

  const message = generateDocumentOptionsMessage(DOCUMENT_TYPES);
  await sendMessage(sock, jid, message);
}

async function handleDocumentType(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const option = parseInt(input.trim());

  if (isNaN(option) || option < 1 || option > DOCUMENT_TYPES.length) {
    await sendMessage(
      sock,
      jid,
      `❌ Opción inválida. Por favor, responde con 1, 2, 3, 4, 5 o 6.`
    );
    return;
  }

  const selectedType = DOCUMENT_TYPES[option - 1];

  updateState(userId, {
    currentFlow: "WAITING_DOCUMENT",
    documentType: selectedType,
  });

  await sendTyping(sock, jid, 800);
  await sendMessage(
    sock,
    jid,
    `✅ Perfecto, ${selectedType} seleccionado.

¡Perfecto! Para brindarte la información que requieres, indícame tu número de identificación. (sin puntos, comas, ni guiones).`
  );
}

async function handleDocumentNumber(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const documentNumber = input.trim();

  if (!/^\d{6,15}$/.test(documentNumber)) {
    await sendMessage(
      sock,
      jid,
      "❌ Por favor, envía un número de identificación válido (6-15 dígitos).\nEnvía tu número de identificación:"
    );
    return;
  }

  await sendTyping(sock, jid, 1200);
  await sendMessage(sock, jid, "🔎 Gracias. Un momento mientras verifico…..");

  try {
    const legalApiService = LegalApiServiceFactory.create();

    // Usar getAllCasesWithDetails para obtener el nombre del cliente
    const detailedResponse = await legalApiService.getAllCasesWithDetails(
      documentNumber
    );

    // La respuesta tiene 'active' y 'finalized' según TransformedDetailedCasesResponse
    const activeRecords = detailedResponse.active || [];
    const finalizedRecords = detailedResponse.finalized || [];

    // Extraer el nombre del cliente del primer proceso (activo o finalizado)
    let clientName = "Cliente";
    const firstRecord = activeRecords[0] || finalizedRecords[0];

    if (firstRecord?.proceduralParts?.plaintiffs?.[0]?.name) {
      clientName = firstRecord.proceduralParts.plaintiffs[0].name;
    }

    // FIX: Transformar a formato de clientProcesses pasando TODOS los campos
    const clientProcesses = toClientProcesses(documentNumber, {
      message: detailedResponse.message,
      active: activeRecords.map((r) => ({
        internalCode: r.internalCode,
        state: r.state || r.performances?.[0]?.performanceType || "En proceso",
        updatedAt: r.updatedAt,
        etiqueta: (r as any).etiqueta,
        radicado: (r as any).radicado,
        despachoJudicial: (r as any).despachoJudicial,
        ultimaActuacion: (r as any).ultimaActuacion,
        city: (r as any).city,
        fechaUltimaActuacion: (r as any).fechaUltimaActuacion,
        idProcesoMonolegal: (r as any).idProcesoMonolegal,
      })),
      finalized: finalizedRecords.map((r) => ({
        internalCode: r.internalCode,
        state: r.state || "Finalizado",
        updatedAt: r.updatedAt,
        etiqueta: (r as any).etiqueta,
        radicado: (r as any).radicado,
        despachoJudicial: (r as any).despachoJudicial,
        ultimaActuacion: (r as any).ultimaActuacion,
        city: (r as any).city,
        fechaUltimaActuacion: (r as any).fechaUltimaActuacion,
      })),
      totalActive: activeRecords.length,
      totalFinalized: finalizedRecords.length,
      totalRecords: activeRecords.length + finalizedRecords.length,
    });

    if (
      clientProcesses.totalActive === 0 &&
      clientProcesses.totalFinalized === 0
    ) {
      await sendTyping(sock, jid, 1000);
      await sendMessage(
        sock,
        jid,
        `❌ No se encontraron procesos para el documento ${documentNumber}.
Por favor, verifica tu número de identificación e intenta nuevamente.

Envía tu número de identificación:`
      );
      return;
    }

    // Guardar el nombre del cliente en el estado
    updateState(userId, {
      currentDocument: documentNumber,
      currentProcesses: clientProcesses,
      clientName: clientName,
      currentFlow: "LEGAL_PROCESS_SELECTION",
    });

    const dynamicOptions: string[] = [];
    const totalProcesses =
      clientProcesses.totalActive + clientProcesses.totalFinalized;

    if (clientProcesses.totalActive > 0)
      dynamicOptions.push("Ver procesos activos");
    if (clientProcesses.totalFinalized > 0)
      dynamicOptions.push("Ver procesos finalizados");
    if (totalProcesses > 0) dynamicOptions.push("Recibir un resumen en PDF");

    await sendTyping(sock, jid, 1000);

    // Saludar con el nombre del cliente
    const greeting =
      clientName !== "Cliente"
        ? `👋 ¡Hola *${clientName}*!\n\n✅ Encontré ${totalProcesses} proceso${
            totalProcesses > 1 ? "s" : ""
          } asociado${
            totalProcesses > 1 ? "s" : ""
          } a tu identificación. Elige una opción:`
        : `✅ Encontré ${totalProcesses} proceso${
            totalProcesses > 1 ? "s" : ""
          } asociado${
            totalProcesses > 1 ? "s" : ""
          } a tu identificación ${documentNumber}. Elige una opción:`;

    await sendMessage(sock, jid, greeting);
    await sendMessage(sock, jid, generateProcessOptionsMessage(dynamicOptions));
  } catch (error) {
    console.error("Error consultando procesos:", error);
    await sendTyping(sock, jid, 1000);
    await sendMessage(
      sock,
      jid,
      "❌ Error al consultar tus procesos. Por favor, verifica tu número de identificación e intenta nuevamente.\n\nEnvía tu número de identificación:"
    );
  }
}

// ============================================
// FLUJO: SELECCIÓN DE PROCESO
// ============================================

async function handleProcessSelection(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const option = input.trim();

  const dynamicOptions: string[] = [];
  if (state.currentProcesses?.totalActive > 0)
    dynamicOptions.push("Ver procesos activos");
  if (state.currentProcesses?.totalFinalized > 0)
    dynamicOptions.push("Ver procesos finalizados");
  if (
    state.currentProcesses?.totalActive +
      state.currentProcesses?.totalFinalized >
    0
  )
    dynamicOptions.push("Recibir un resumen en PDF");

  const optionIndex = parseInt(option) - 1;

  if (
    isNaN(optionIndex) ||
    optionIndex < 0 ||
    optionIndex >= dynamicOptions.length
  ) {
    await sendMessage(
      sock,
      jid,
      `❌ Opción no válida. Por favor, responde con un número del 1 al ${dynamicOptions.length}.`
    );
    return;
  }

  const selectedOption = dynamicOptions[optionIndex];

  if (selectedOption.includes("procesos activos")) {
    const processes = state.currentProcesses.activeProcesses;

    if (processes.length === 0) {
      await sendTyping(sock, jid, 800);
      await sendMessage(
        sock,
        jid,
        "📋 No tienes procesos activos en este momento."
      );
      return;
    }

    updateState(userId, {
      selectedProcessType: "active",
      currentFlow: "LEGAL_PROCESS_DETAILS_OR_OPTIONS",
    });

    await sendTyping(sock, jid, 1000);
    await sendMessage(sock, jid, formatProcessList(processes, "active"));

    let optionsMessage = `💡 *Opciones disponibles:*\n\n• Escribe el *número del proceso* (1-${processes.length}) para ver sus detalles`;
    if (state.currentProcesses.totalFinalized > 0)
      optionsMessage +=
        "\n• Escribe *FINALIZADOS* para ver procesos finalizados";
    optionsMessage += "\n• Escribe *PDF* para recibir un resumen completo";
    optionsMessage += "\n• Escribe *MENU* para volver al inicio";

    await sendMessage(sock, jid, optionsMessage);
  } else if (selectedOption.includes("procesos finalizados")) {
    updateState(userId, {
      selectedProcessType: "finalized",
      currentFlow: "LEGAL_FINALIZED_PROCESSES",
    });
    await handleFinalizedProcessesDisplay(sock, jid, userId);
  } else if (selectedOption.includes("resumen en PDF")) {
    await handlePdfSummary(sock, jid, userId);
  }
}

// ============================================
// FLUJO: DETALLES DE PROCESO
// ============================================

// ============================================
// FLUJO: DETALLES DE PROCESO (CORREGIDO)
// ============================================

async function handleProcessDetails(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const inputLower = input.trim().toLowerCase();

  if (inputLower === "finalizados" || inputLower === "finalizado") {
    updateState(userId, {
      selectedProcessType: "finalized",
      currentFlow: "LEGAL_FINALIZED_PROCESSES",
    });
    await handleFinalizedProcessesDisplay(sock, jid, userId);
    return;
  }

  if (inputLower === "pdf") {
    await handlePdfSummary(sock, jid, userId);
    return;
  }

  if (inputLower === "menu" || inputLower === "menú") {
    resetState(userId);
    await handleWelcome(sock, jid, "");
    return;
  }

  const selectedNumber = parseInt(input.trim());
  const processes =
    state.selectedProcessType === "active"
      ? state.currentProcesses.activeProcesses
      : state.currentProcesses.finalizedProcesses;

  if (
    isNaN(selectedNumber) ||
    selectedNumber < 1 ||
    selectedNumber > processes.length
  ) {
    await sendMessage(
      sock,
      jid,
      `❌ Por favor, responde con el número de la lista (1-${processes.length}).`
    );
    return;
  }

  const selectedProcess = processes[selectedNumber - 1];

  try {
    await sendTyping(sock, jid, 1200);
    await sendMessage(sock, jid, "Obteniendo detalles del proceso...");

    const legalApiService = LegalApiServiceFactory.create();
    const etiqueta = (selectedProcess as any).etiqueta;
    const processDetailsResponse = await legalApiService.getProcessDetails(
      selectedProcess.etiqueta
    );
    const processDetails = toProcessDetails(processDetailsResponse);

    (processDetails as any).etiqueta = (selectedProcess as any).etiqueta;
    (processDetails as any).radicado = (selectedProcess as any).radicado;
    (processDetails as any).despachoJudicial = (
      selectedProcess as any
    ).despachoJudicial;
    (processDetails as any).city = (selectedProcess as any).city;
    (processDetails as any).ultimaActuacion = (
      selectedProcess as any
    ).ultimaActuacion;
    (processDetails as any).fechaUltimaActuacion = (
      selectedProcess as any
    ).fechaUltimaActuacion;
    (processDetails as any).idProcesoMonolegal = (
      processDetailsResponse.record as any
    )?.idProcesoMonolegal;

    updateState(userId, {
      selectedProcess: processDetails,
      clientName: processDetails.clientName,
      currentFlow: "LEGAL_PDF_CONFIRMATION",
    });

    await sendTyping(sock, jid, 1000);
    await sendMessage(sock, jid, formatProcessDetails(processDetails));
    await sendMessage(
      sock,
      jid,
      generateOptionsMessage("¿Quieres recibir el PDF de este proceso?", [
        "Sí",
        "No",
      ])
    );
  } catch (error) {
    console.error("Error obteniendo detalles:", error);
    await sendTyping(sock, jid, 1000);
    await sendMessage(
      sock,
      jid,
      "❌ Error al obtener los detalles del proceso. Por favor, intenta nuevamente."
    );
  }
}
// ============================================
// FLUJO: PROCESOS FINALIZADOS
// ============================================

async function handleFinalizedProcessesDisplay(
  sock: WASocket,
  jid: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const finalizedProcesses = state.currentProcesses?.finalizedProcesses || [];
  const documentNumber = state.currentDocument || "N/A";

  if (finalizedProcesses.length === 0) {
    await sendMessage(
      sock,
      jid,
      "❌ No se encontraron procesos finalizados para tu documento."
    );
    resetState(userId);
    return;
  }

  await sendTyping(sock, jid, 1000);

  let message = `✅ Encontré ${finalizedProcesses.length} proceso${
    finalizedProcesses.length > 1 ? "s" : ""
  } finalizado${
    finalizedProcesses.length > 1 ? "s" : ""
  } asociados al documento ${documentNumber}:\n\n`;

  finalizedProcesses.forEach((process: any, index: number) => {
    message += `Proceso #${process.internalCode}\n• Estado: ${process.status}\n• Última actualización: ${process.lastUpdate}\n`;
    if (index < finalizedProcesses.length - 1) message += "\n";
  });

  message +=
    "\n" +
    generateOptionsMessage("", [
      "Quieres iniciar un nuevo proceso",
      "Quieres consultar otro proceso",
      "¿Prefieres hablar directamente con un abogado?",
    ]);

  await sendMessage(sock, jid, message);
}

async function handleFinalizedProcesses(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string,
  userName: string
): Promise<void> {
  const state = getState(userId);
  const option = input.trim();

  switch (option) {
    case "1":
      await sendTyping(sock, jid, 800);
      await sendMessage(
        sock,
        jid,
        "✅ Perfecto, te ayudo a iniciar un nuevo proceso legal."
      );
      updateState(userId, { currentFlow: "NEW_PROCESS_PROFILE" });
      await handleNewProcess(sock, jid, userId);
      break;
    case "2":
      await sendTyping(sock, jid, 800);
      await sendMessage(
        sock,
        jid,
        generateOptionsMessage(
          "¡Perfecto! Te ayudo a consultar otro tipo de procesos.\n\n¿Qué tipo de procesos quieres consultar?",
          ["Ver procesos activos", "Ver procesos finalizados"]
        )
      );
      updateState(userId, { currentFlow: "LEGAL_PROCESS_SELECTION" });
      break;
    case "3":
      await sendTyping(sock, jid, 1000);
      await lawyerNotificationService.notifyLawyer(
        userId,
        userName,
        "",
        "Consulta sobre procesos finalizados",
        "existing",
        state.currentDocument
      );
      await sendMessage(
        sock,
        jid,
        "👨‍💼 Para darte un servicio ajustado a tu caso, te contactaremos con uno de nuestros abogados."
      );
      resetState(userId);
      break;
    default:
      await sendMessage(
        sock,
        jid,
        "❌ Opción inválida. Por favor, responde con 1, 2 o 3."
      );
  }
}

// ============================================
// FLUJO: PDF
// ============================================

async function handlePdfConfirmation(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const inputLower = input.trim().toLowerCase();

  const affirmative = ["1", "sí", "si", "yes", "ok", "perfecto"];
  const negative = ["2", "no", "cancelar"];

  if (affirmative.includes(inputLower)) {
    if (!state.selectedProcess) {
      await sendMessage(
        sock,
        jid,
        "❌ No se encontró el proceso seleccionado. Por favor, intenta nuevamente."
      );
      return;
    }

    await sendTyping(sock, jid, 1200);
    await sendMessage(sock, jid, "📄 Generando el reporte personalizado...");

    // try {
    //   const pdfResult = await pdfGeneratorService.generateProcessReport(
    //     state.selectedProcess,
    //     state.clientName || "Cliente"
    //   );

    //   const processId =
    //     (state.selectedProcess as any).etiqueta ||
    //     state.selectedProcess.internalCode;

    //   await sendTyping(sock, jid, 1000);
    //   await sendMediaMessage(
    //     sock,
    //     jid,
    //     `📄 Aquí tienes el reporte personalizado del proceso #${processId}:`,
    //     pdfResult.url
    //   );
    //   setTimeout(() => pdfGeneratorService.deletePdf(pdfResult.filename), 5000);
    // } catch (error) {
    //   console.error("Error generando PDF:", error);
    //   await sendMessage(
    //     sock,
    //     jid,
    //     "❌ Lo siento, hubo un error generando el reporte."
    //   );
    // }

    try {
      const legalApiService = LegalApiServiceFactory.create();

      let actuaciones: any[] = [];
      const idProcesoMonolegal = (state.selectedProcess as any)
        .idProcesoMonolegal;

      if (idProcesoMonolegal) {
        try {
          actuaciones = await legalApiService.getActuaciones(
            idProcesoMonolegal
          );
        } catch (error) {
          console.warn("No se pudieron obtener actuaciones:", error);
        }
      }

      // Pasar las actuaciones al generador de PDF
      const processWithActuaciones = {
        ...state.selectedProcess,
        actuacionesMonolegal: actuaciones, // ← Las actuaciones van aquí
      };

      const pdfResult = await pdfGeneratorService.generateProcessReport(
        processWithActuaciones,
        state.clientName || "Cliente"
      );

      const processId =
        (state.selectedProcess as any).etiqueta ||
        state.selectedProcess.internalCode;

      await sendTyping(sock, jid, 1000);
      await sendMediaMessage(
        sock,
        jid,
        `📄 Aquí tienes el reporte personalizado del proceso #${processId}:`,
        pdfResult.url
      );
      setTimeout(() => pdfGeneratorService.deletePdf(pdfResult.filename), 5000);
    } catch (error) {
      console.error("Error generando PDF:", error);
      await sendMessage(
        sock,
        jid,
        "❌ Lo siento, hubo un error generando el reporte."
      );
    }

    updateState(userId, { currentFlow: "MAIN_OPTIONS" });
    await handleMainOptionsDisplay(sock, jid, userId);
  } else if (negative.includes(inputLower)) {
    await sendTyping(sock, jid, 800);
    await sendMessage(sock, jid, "Entendido. No se generará el PDF.");
    updateState(userId, { currentFlow: "MAIN_OPTIONS" });
    await handleMainOptionsDisplay(sock, jid, userId);
  } else {
    await sendMessage(
      sock,
      jid,
      '❌ Por favor, responde con "sí" para recibir el PDF o "no" para cancelar.'
    );
  }
}

async function handlePdfSummary(
  sock: WASocket,
  jid: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const documentNumber = state.currentDocument;

  if (!documentNumber) {
    await sendMessage(
      sock,
      jid,
      "❌ No se encontró el número de documento. Por favor, intenta nuevamente."
    );
    return;
  }

  await sendTyping(sock, jid, 1200);
  await sendMessage(
    sock,
    jid,
    "📄 Generando el resumen completo de todos tus procesos..."
  );

  try {
    const legalApiService = LegalApiServiceFactory.create();
    const allCasesResponse = await legalApiService.getAllCasesWithDetails(
      documentNumber
    );
    const allProcesses = toAllProcessDetails(allCasesResponse);

    if (allProcesses.length === 0)
      throw new Error("No se encontraron procesos");

    const clientName = allProcesses[0].clientName;
    const pdfResult = await pdfGeneratorService.generateProcessReport(
      allProcesses,
      clientName
    );

    await sendTyping(sock, jid, 1000);
    await sendMediaMessage(
      sock,
      jid,
      `📄 Aquí tienes el resumen completo de todos tus procesos asociados al documento ${documentNumber}:`,
      pdfResult.url
    );
    setTimeout(() => pdfGeneratorService.deletePdf(pdfResult.filename), 5000);

    await sendTyping(sock, jid, 800);
    await sendMessage(
      sock,
      jid,
      generateErrorAlternativesMessage("¿Qué te gustaría hacer ahora?", [
        "Consultar otro tipo de procesos",
        "¿Quieres iniciar un proceso con nosotros?",
        "¿Prefieres hablar directamente con un abogado?",
      ])
    );

    updateState(userId, { currentFlow: "PDF_SUMMARY_OPTIONS" });
  } catch (error) {
    console.error("Error generando PDF resumen:", error);
    await sendTyping(sock, jid, 1000);
    await sendMessage(
      sock,
      jid,
      generateErrorAlternativesMessage(
        "❌ Lo siento, hubo un error generando el resumen.\n¿Qué te gustaría hacer?",
        [
          "Quieres intentarlo nuevamente",
          "¿Quieres iniciar un proceso con nosotros?",
          "¿Prefieres hablar directamente con un abogado?",
        ]
      )
    );
    updateState(userId, { currentFlow: "PDF_SUMMARY_OPTIONS" });
  }
}

async function handlePdfSummaryOptions(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string,
  userName: string
): Promise<void> {
  const state = getState(userId);
  const option = input.trim();

  switch (option) {
    case "1": {
      await sendTyping(sock, jid, 800);
      updateState(userId, { currentFlow: "LEGAL_PROCESS_SELECTION" });
      const dynamicOptions: string[] = [];
      if (state.currentProcesses?.totalActive > 0)
        dynamicOptions.push("Ver procesos activos");
      if (state.currentProcesses?.totalFinalized > 0)
        dynamicOptions.push("Ver procesos finalizados");
      dynamicOptions.push("Recibir un resumen en PDF");
      await sendMessage(
        sock,
        jid,
        generateProcessOptionsMessage(dynamicOptions)
      );
      break;
    }
    case "2":
      await sendTyping(sock, jid, 800);
      await sendMessage(
        sock,
        jid,
        "🎉 ¡Excelente! Te ayudo a iniciar un nuevo proceso..."
      );
      updateState(userId, { currentFlow: "NEW_PROCESS_PROFILE" });
      await handleNewProcess(sock, jid, userId);
      break;
    case "3":
      await sendTyping(sock, jid, 1000);
      await sendMessage(
        sock,
        jid,
        "👨‍💼 Perfecto, te conecto con uno de nuestros abogados especializados.\n\nUn abogado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas."
      );
      resetState(userId);
      break;
    default:
      await sendMessage(
        sock,
        jid,
        "❌ Opción inválida. Por favor, responde con 1, 2 o 3."
      );
  }
}

// ============================================
// FLUJO: OPCIONES PRINCIPALES
// ============================================

async function handleMainOptionsDisplay(
  sock: WASocket,
  jid: string,
  userId: string
): Promise<void> {
  const state = getState(userId);

  const options: string[] = [];
  if (state.currentProcesses?.totalActive > 0)
    options.push("Ver procesos activos");
  if (state.currentProcesses?.totalFinalized > 0)
    options.push("Ver procesos finalizados");
  if (
    state.currentProcesses?.totalActive +
      state.currentProcesses?.totalFinalized >
    0
  )
    options.push("Recibir un resumen en PDF");
  options.push("Consultar otro documento");
  options.push("Finalizar conversación");

  await sendTyping(sock, jid, 800);
  await sendMessage(
    sock,
    jid,
    generateOptionsMessage("💡 *¿Qué deseas hacer?*", options)
  );
}

async function handleMainOptions(
  sock: WASocket,
  jid: string,
  input: string,
  userId: string
): Promise<void> {
  const state = getState(userId);
  const option = input.trim();

  const dynamicOptions: string[] = [];
  if (state.currentProcesses?.totalActive > 0)
    dynamicOptions.push("Ver procesos activos");
  if (state.currentProcesses?.totalFinalized > 0)
    dynamicOptions.push("Ver procesos finalizados");
  if (
    state.currentProcesses?.totalActive +
      state.currentProcesses?.totalFinalized >
    0
  )
    dynamicOptions.push("Recibir un resumen en PDF");
  dynamicOptions.push("Consultar otro documento");
  dynamicOptions.push("Finalizar conversación");

  const optionIndex = parseInt(option) - 1;

  if (
    isNaN(optionIndex) ||
    optionIndex < 0 ||
    optionIndex >= dynamicOptions.length
  ) {
    await sendMessage(
      sock,
      jid,
      `❌ Opción no válida. Por favor, responde con un número del 1 al ${dynamicOptions.length}.`
    );
    return;
  }

  const selectedOption = dynamicOptions[optionIndex];

  if (selectedOption.includes("procesos activos")) {
    updateState(userId, {
      selectedProcessType: "active",
      currentFlow: "LEGAL_PROCESS_SELECTION",
    });
    await handleProcessSelection(sock, jid, "1", userId);
  } else if (selectedOption.includes("procesos finalizados")) {
    updateState(userId, {
      selectedProcessType: "finalized",
      currentFlow: "LEGAL_FINALIZED_PROCESSES",
    });
    await handleFinalizedProcessesDisplay(sock, jid, userId);
  } else if (selectedOption.includes("resumen en PDF")) {
    await handlePdfSummary(sock, jid, userId);
  } else if (selectedOption.includes("Consultar otro documento")) {
    await sendTyping(sock, jid, 1000);
    resetState(userId);
    await sendMessage(sock, jid, "🔄 Volviendo al menú principal...");
    await handleWelcome(sock, jid, "");
  } else if (selectedOption.includes("Finalizar")) {
    await sendTyping(sock, jid, 1000);
    await sendMessage(sock, jid, "¡Gracias por usar ELENA - QPAlliance! 👋");
    resetState(userId);
  }
}

// ============================================
// SERVIDOR HTTP
// ============================================

function startHttpServer(port: number): void {
  const server = createServer((req, res) => {
    const url = req.url || "/";

    if (url === "/qr") {
      const qrPath = join(process.cwd(), "qr.png");
      if (existsSync(qrPath)) {
        res.writeHead(200, { "Content-Type": "image/png" });
        createReadStream(qrPath).pipe(res);
      } else {
        res.writeHead(200, { "Content-Type": "text/html" });
        res.end(
          '<html><body style="font-family:Arial;text-align:center;padding:50px;"><h1>⏳ Esperando QR...</h1><p>Recarga en unos segundos</p><script>setTimeout(()=>location.reload(),3000)</script></body></html>'
        );
      }
      return;
    }

    if (url === "/info" || url === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        `<!DOCTYPE html><html><head><title>ELENA Bot</title></head><body style="font-family:Arial;max-width:600px;margin:50px auto;text-align:center;"><h1>🤖 ELENA Bot</h1><p>✅ Servidor funcionando</p><p><a href="/qr">📱 Ver QR Code</a></p><p><a href="/files">📁 Ver archivos PDF</a></p></body></html>`
      );
      return;
    }

    if (url.startsWith("/public/")) {
      const filePath = join(process.cwd(), "dist", url);
      if (existsSync(filePath)) {
        res.writeHead(200, {
          "Content-Type": url.endsWith(".pdf")
            ? "application/pdf"
            : "application/octet-stream",
        });
        createReadStream(filePath).pipe(res);
      } else {
        res.writeHead(404);
        res.end("Archivo no encontrado");
      }
      return;
    }

    if (url === "/files") {
      const reportsDir = join(process.cwd(), "dist", "public", "reports");
      let files: string[] = [];
      if (existsSync(reportsDir))
        files = readdirSync(reportsDir).filter((f) => f.endsWith(".pdf"));
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(
        `<!DOCTYPE html><html><head><title>Archivos PDF</title></head><body style="font-family:Arial;max-width:800px;margin:50px auto;"><h1>📁 Archivos PDF</h1>${
          files.length === 0
            ? "<p>No hay archivos</p>"
            : "<ul>" +
              files
                .map((f) => `<li><a href="/public/reports/${f}">${f}</a></li>`)
                .join("") +
              "</ul>"
        }<p><a href="/">← Volver</a></p></body></html>`
      );
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });

  server.listen(port, () => {});
}

// ============================================
// INICIO DEL BOT
// ============================================

async function startBot(): Promise<void> {
  const sessionDir = join(process.cwd(), "bot_sessions");
  if (!existsSync(sessionDir)) mkdirSync(sessionDir, { recursive: true });

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

  const sock = makeWASocket({ auth: state, printQRInTerminal: false });

  // Configurar servicio de notificación
  lawyerNotificationService.setProvider({
    sendText: async (to: string, text: string) => {
      const jid = to.includes("@") ? to : `${to}@s.whatsapp.net`;
      await sock.sendMessage(jid, { text });
    },
  } as any);

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      const qrTerminal = await QRCode.toString(qr, {
        type: "terminal",
        small: true,
      });

      await QRCode.toFile(join(process.cwd(), "qr.png"), qr);
    }

    if (connection === "close") {
      const reason = (lastDisconnect?.error as Boom)?.output?.statusCode;

      if (reason !== DisconnectReason.loggedOut) {
        await delay(3000);
        startBot();
      } else {
        console.log(
          "Sesión cerrada. Elimina la carpeta bot_sessions y reinicia."
        );
      }
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (error) {
        console.error("Error procesando mensaje:", error);
      }
    }
  });
}

// ============================================
// MAIN
// ============================================

const PORT = parseInt(config.port?.toString() || "3008");

startHttpServer(PORT);
startBot().catch(console.error);
