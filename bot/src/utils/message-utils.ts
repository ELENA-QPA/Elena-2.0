/**
 * Utilidades para generar mensajes del bot
 */

/**
 * Función genérica para generar mensajes con opciones numeradas
 * @param message - Mensaje principal
 * @param options - Array de opciones
 * @returns Mensaje formateado con opciones numeradas
 */
export function generateOptionsMessage(message: string, options: string[]): string {
    const formattedOptions = options.map((option, index) => `${index + 1}️⃣ ${option}`).join('\n');
    return `${message}\n${formattedOptions}`;
}

/**
 * Genera mensaje de opciones para tipos de documentos
 * @param documentTypes - Array de tipos de documentos
 * @returns Mensaje formateado para selección de tipo de documento
 */
export function generateDocumentOptionsMessage(documentTypes: string[]): string {
    return generateOptionsMessage(
        'Con gusto. Para consultar, por favor indícame el tipo de documento de identificación con el que cuentas:',
        documentTypes
    );
}

/**
 * Genera mensaje de opciones para procesos
 * @param processOptions - Array de opciones de procesos
 * @returns Mensaje formateado para selección de tipo de proceso
 */
export function generateProcessOptionsMessage(processOptions: string[]): string {
    return generateOptionsMessage('Elige una opción:', processOptions);
}

/**
 * Genera mensaje de opciones para errores/alternativas
 * @param errorMessage - Mensaje de error principal
 * @param alternatives - Array de alternativas disponibles
 * @returns Mensaje formateado con alternativas
 */
export function generateErrorAlternativesMessage(errorMessage: string, alternatives: string[]): string {
    return generateOptionsMessage(errorMessage, alternatives);
}

/**
 * Genera mensaje de contexto para enviar al abogado (nuevos procesos)
 * @param clientNumber - Número de WhatsApp del cliente
 * @param clientName - Nombre del cliente (opcional)
 * @param profile - Perfil del cliente (Empresa, Rappitendero, etc.)
 * @param requestType - Tipo de solicitud
 * @returns Mensaje formateado para el abogado
 */
export function generateLawyerContextMessage(clientNumber: string, clientName: string | null, profile: string, requestType: string): string {
    const displayName = clientName || 'Sin nombre';
    
    // Convertir fecha a zona horaria de Colombia (America/Bogota)
    const colombiaDate = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    return `🏢 NUEVA SOLICITUD ${profile.toUpperCase()}

👤 Cliente: ${displayName}
📱 WhatsApp: ${clientNumber}
🕐 Fecha: ${colombiaDate}
📋 Perfil: ${profile}
🎯 Solicitud: ${requestType}

El cliente ha solicitado iniciar un proceso legal y necesita asesoría especializada para ${profile.toLowerCase()}. Por favor, contáctalo directamente para brindarle el servicio personalizado que requiere.

¡Gracias! 🙌`;
}

/**
 * Genera mensaje de contexto para enviar al abogado (procesos existentes/finalizados)
 * @param clientNumber - Número de WhatsApp del cliente
 * @param clientName - Nombre del cliente (opcional)
 * @param documentNumber - Número de documento del cliente
 * @param requestType - Tipo de solicitud
 * @returns Mensaje formateado para el abogado
 */
export function generateLawyerExistingProcessMessage(clientNumber: string, clientName: string | null, documentNumber: string, requestType: string): string {
    const displayName = clientName || 'Sin nombre';
    
    // Convertir fecha a zona horaria de Colombia (America/Bogota)
    const colombiaDate = new Date().toLocaleString('es-CO', {
        timeZone: 'America/Bogota',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    return `📋 CONSULTA SOBRE PROCESOS EXISTENTES

👤 Cliente: ${displayName}
📱 WhatsApp: ${clientNumber}
🆔 Documento: ${documentNumber}
🕐 Fecha: ${colombiaDate}
🎯 Consulta: ${requestType}

El cliente tiene procesos finalizados y requiere hablar con un abogado para recibir asesoría especializada. Por favor, contáctalo directamente para brindarle la atención personalizada que necesita.

¡Gracias! 🙌`;
}

/**
 * Función para simular tiempo de escritura
 * @param ms - Milisegundos a esperar
 * @returns Promise que se resuelve después del tiempo especificado
 */
export const waitT = (ms: number) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(ms);
        }, ms);
    });
};

/**
 * Función para mostrar indicador de "escribiendo" antes de enviar mensaje
 * @param provider - Provider de Baileys
 * @param ctx - Contexto del mensaje
 * @param duration - Duración del indicador en milisegundos (default: 2000)
 * @returns Promise que se resuelve cuando termina el indicador
 */
export async function showTypingIndicator(provider: any, ctx: any, duration: number = 1200): Promise<void> {
    try {
        await provider.vendor.sendPresenceUpdate('composing', ctx.key.remoteJid);
        await waitT(duration);
    } catch (error) {
        console.warn('⚠️ [TYPING_INDICATOR] Error mostrando indicador de escritura:', error);
    }
}
