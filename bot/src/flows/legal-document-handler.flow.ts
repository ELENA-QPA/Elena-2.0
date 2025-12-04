/**
 * Flujo para manejar el número de identificación del cliente
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { LegalApiServiceFactory, toClientProcesses } from '../services/legal/index.js';
import { legalProcessSelectionFlow } from './legal-process-selection.flow.js';
import { ApiConnectionError } from '../interfaces/errors.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateDocumentOptionsMessage, generateProcessOptionsMessage, showTypingIndicator } from '../utils/index.js';

// Configuración de tipos de documentos
const DOCUMENT_TYPES = [
    'Cédula de Ciudadanía',
    'Permiso Especial de Permanencia',
    'Permiso de protección temporal',
    'NIT',
    'Pasaporte',
    'Cédula de extranjería'
];

// Configuración de opciones de procesos
const PROCESS_OPTIONS = [
    'Ver procesos activos',
    'Ver procesos finalizados',
    'Recibir un resumen en PDF'
];

// Función para obtener el tipo de documento por índice
function getDocumentTypeByIndex(index: string): string | null {
    const numIndex = parseInt(index) - 1;
    return DOCUMENT_TYPES[numIndex] || null;
}

export const legalDocumentHandlerFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_DOCUMENT_HANDLER', 'PROCESS_DOCUMENT');
        
        // Validar que estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_DOCUMENT_HANDLER') {
            console.log('🔵 [LEGAL_DOCUMENT_HANDLER] No estamos en estado correcto, ignorando');
            return;
        }
        
        logger.flowStart('LEGAL_DOCUMENT_HANDLER', ctx.from);
        logger.info('Usuario accedió a consulta de procesos existentes', { 
            userId: ctx.from, 
            flow: 'LEGAL_DOCUMENT_HANDLER', 
            action: 'PROCESS_DOCUMENT' 
        });
        
        // Mostrar indicador de "escribiendo"
        await showTypingIndicator(provider, ctx, 1000);
        
        await flowDynamic(generateDocumentOptionsMessage(DOCUMENT_TYPES));
        
        // Establecer estado para esperar tipo de documento
        await state.update({ currentFlow: 'WAITING_DOCUMENT_TYPE' });
        logger.info('Estado actualizado: WAITING_DOCUMENT_TYPE', logContext);
    })
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_DOCUMENT_HANDLER', 'USER_INPUT');
        
        // Validar que estamos en el estado correcto
        if (stateData.currentFlow !== 'WAITING_DOCUMENT_TYPE') {
            console.log('🔵 [LEGAL_DOCUMENT_HANDLER] No estamos esperando tipo de documento, ignorando');
            return;
        }
        
        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_DOCUMENT_HANDLER');

        // Validar tipo de documento seleccionado
        const selectedType = getDocumentTypeByIndex(userInput);
        if (!selectedType) {
            logger.warn(`Tipo de documento inválido: "${userInput}"`, logContext);
            const validOptions = Array.from({ length: DOCUMENT_TYPES.length }, (_, i) => i + 1).join(', ');
            return fallBack(`❌ Opción inválida. Por favor, responde con ${validOptions}.`);
        }
        
        console.log('🔵 [LEGAL_DOCUMENT_HANDLER] Tipo de documento seleccionado:', selectedType);
        logger.info(`Tipo de documento seleccionado: ${selectedType}`, logContext);
        
        // Guardar tipo de documento en el estado
        await state.update({ 
            currentFlow: 'WAITING_DOCUMENT',
            documentType: selectedType
        });
        logger.info('Estado actualizado: WAITING_DOCUMENT', logContext);
        
        // Mostrar indicador de "escribiendo" antes de confirmar
        await showTypingIndicator(provider, ctx, 800);
        
        // Solicitar número de documento
        await flowDynamic([
            `✅ Perfecto, ${selectedType} seleccionado.`,
            '',
            '¡Perfecto! Para brindarte la información que requieres, indícame tu número de identificación. (sin puntos, comas, ni guiones).'
        ]);
    })
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_DOCUMENT_HANDLER', 'USER_INPUT');
        
        // Validar que estamos en el estado correcto
        if (stateData.currentFlow !== 'WAITING_DOCUMENT') {
            console.log('🔵 [LEGAL_DOCUMENT_HANDLER] No estamos esperando documento, ignorando');
            return;
        }
        
        logger.userAction(`Usuario escribió número: "${userInput}"`, ctx.from, 'LEGAL_DOCUMENT_HANDLER');

        // Validar que sea un número de documento válido
        if (!/^\d{6,15}$/.test(userInput)) {
            logger.warn(`Número de identificación inválido: "${userInput}"`, logContext);
            return fallBack('❌ Por favor, envía un número de identificación válido (6-15 dígitos).\nEnvía tu número de identificación:');
        }

        // Redirigir al flujo de procesamiento de documento
        logger.info('Redirigiendo a legalDocumentProcessorFlow', logContext);
        return gotoFlow(legalDocumentProcessorFlow);
    });

// Flujo separado para procesar números de documento
export const legalDocumentProcessorFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_DOCUMENT_PROCESSOR', 'PROCESS_DOCUMENT');

        logger.userAction(`Usuario escribió en procesador: "${userInput}"`, ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');
        logger.debug('Estado actual del usuario', logContext);

        // Solo procesar si estamos esperando un documento
        if (stateData.currentFlow !== 'WAITING_DOCUMENT') {
            logger.debug('No estamos esperando documento, ignorando entrada', logContext);
            return;
        }

        // Validar que sea un número de documento válido
        if (!/^\d{6,15}$/.test(userInput)) {
            logger.warn(`Número de identificación inválido en procesador: "${userInput}"`, logContext);
            return fallBack('❌ Por favor, envía un número de identificación válido (6-15 dígitos).\nEnvía tu número de identificación:');
        }

        const documentNumber = userInput;
        logger.info(`Procesando documento: "${documentNumber}"`, logContext);

        try {
            // Mostrar indicador de "escribiendo" antes del mensaje de carga
            await showTypingIndicator(provider, ctx, 1200);
            
            // Mostrar mensaje de carga
            await flowDynamic('🔎 Gracias. Un momento mientras verifico…...');
            logger.botResponse('Gracias. Un momento mientras verifico...', ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');

            // Consultar API para obtener procesos
            const legalApiService = LegalApiServiceFactory.create();
            let casesResponse;
            
            try {
                casesResponse = await legalApiService.getCasesByDocument(documentNumber);
                logger.apiCall('getCasesByDocument', ctx.from, true, { 
                    documentNumber,
                    responseCount: casesResponse?.length || 0 
                });
            } catch (apiError) {
                logger.apiCall('getCasesByDocument', ctx.from, false, { 
                    documentNumber,
                    error: apiError instanceof Error ? apiError.message : 'Unknown error'
                });
                throw apiError; // Re-lanzar el error para que sea manejado por el catch principal
            }

            // Transformar respuesta a modelo de dominio
            const clientProcesses = toClientProcesses(documentNumber, casesResponse);

            // Verificar si hay procesos
            if (clientProcesses.totalActive === 0 && clientProcesses.totalFinalized === 0) {
                logger.warn(`No se encontraron procesos para el documento: "${documentNumber}"`, logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje de error
                await showTypingIndicator(provider, ctx, 1000);
                
                await flowDynamic(`❌ No se encontraron procesos para el documento ${documentNumber}.`);
                await flowDynamic('Por favor, verifica tu número de identificación e intenta nuevamente.');
                logger.botResponse('No se encontraron procesos', ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');
                return fallBack('Envía tu número de identificación:');
            }

            // Guardar en estado del bot
            await state.update({
                currentDocument: documentNumber,
                currentProcesses: clientProcesses,
                currentFlow: 'LEGAL_PROCESS_SELECTION'
            });
            logger.info('Estado actualizado: LEGAL_PROCESS_SELECTION', logContext);

            // Mostrar indicador de "escribiendo" antes de mostrar resultados
            await showTypingIndicator(provider, ctx, 1000);
            
            // Generar opciones dinámicas basadas en los procesos disponibles
            const dynamicOptions = [];
            const totalProcesses = clientProcesses.totalActive + clientProcesses.totalFinalized;
            
            if (clientProcesses.totalActive > 0) {
                dynamicOptions.push("Ver procesos activos");
            }
            
            if (clientProcesses.totalFinalized > 0) {
                dynamicOptions.push("Ver procesos finalizados");
            }
            
            // Solo mostrar opción de PDF si hay procesos
            if (totalProcesses > 0) {
                dynamicOptions.push('Recibir un resumen en PDF');
            }
            
            // Generar mensaje dinámico según el tipo de procesos encontrados
            let processTypeText = '';
            if (clientProcesses.totalActive > 0 && clientProcesses.totalFinalized > 0) {
                // Ambos tipos de procesos - no agregar texto adicional
                processTypeText = '';
            } else if (clientProcesses.totalActive > 0) {
                // Solo procesos activos
                processTypeText = ` (activo${clientProcesses.totalActive > 1 ? 's' : ''})`;
            } else if (clientProcesses.totalFinalized > 0) {
                // Solo procesos finalizados
                processTypeText = ` (finalizado${clientProcesses.totalFinalized > 1 ? 's' : ''})`;
            }
            
            const dynamicMessage = `✅ Encontré ${totalProcesses} proceso${totalProcesses > 1 ? 's' : ''}${processTypeText} asociado${totalProcesses > 1 ? 's' : ''} a tu identificación ${documentNumber}. Elige una opción:`;
            
            // Mostrar mensaje de confirmación y opciones dinámicas
            await flowDynamic(dynamicMessage);
            await flowDynamic(generateProcessOptionsMessage(dynamicOptions));
            logger.botResponse('Encontré procesos y mostró opciones dinámicas', ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');

            // Redirigir al flujo de selección
            logger.info('Redirigiendo a legalProcessSelectionFlow', logContext);
            return gotoFlow(legalProcessSelectionFlow);

        } catch (error) {
            logger.error('Error al consultar procesos', logContext, error as Error);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de error
            await showTypingIndicator(provider, ctx, 1000);
            
            // Manejar errores específicos
            if (error instanceof ApiConnectionError) {
                await flowDynamic('❌ Error de conexión con la API. Por favor, intenta nuevamente.');
                logger.botResponse('Error de conexión con la API', ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');
            } else {
                await flowDynamic('❌ Error al consultar tus procesos. Por favor, verifica tu número de identificación e intenta nuevamente.');
                logger.botResponse('Error genérico al consultar procesos', ctx.from, 'LEGAL_DOCUMENT_PROCESSOR');
            }
            
            await flowDynamic('Envía tu número de identificación:');
            return fallBack('Envía tu número de identificación:');
        }
    });
