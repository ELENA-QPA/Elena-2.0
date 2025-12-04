/**
 * Flujo para mostrar detalles de un proceso específico
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { LegalApiServiceFactory, toProcessDetails, formatProcessDetails } from '../services/legal/index.js';
import { legalPdfConfirmationFlow } from './legal-pdf-confirmation.flow.js';
import { legalDocumentHandlerFlow } from './legal-document-handler.flow.js';
import { legalPdfSummaryFlow } from './legal-pdf-summary.flow.js';
import { legalFinalizedProcessesFlow } from './legal-finalized-processes.flow.js';
import { 
  ProcessNotFoundError, 
  ApiConnectionError, 
  InvalidApiResponseError 
} from '../interfaces/errors.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';

const PDF_CONFIRMATION_OPTIONS = [
  'Sí',
  'No'
];

export const legalProcessDetailsFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PROCESS_DETAILS', 'PROCESS_DETAILS');
        
        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_PROCESS_DETAILS');
        logger.debug('Estado actual del usuario', logContext);
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PROCESS_DETAILS' && stateData.currentFlow !== 'LEGAL_PROCESS_DETAILS_OR_OPTIONS') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        // Si estamos en estado LEGAL_PROCESS_DETAILS_OR_OPTIONS, manejar las opciones del menú
        if (stateData.currentFlow === 'LEGAL_PROCESS_DETAILS_OR_OPTIONS') {
            const userInputLower = userInput.toLowerCase();
            
            // Manejar palabras clave
            if (userInputLower === 'finalizados' || userInputLower === 'finalizado') {
                logger.info('Usuario eligió ver procesos finalizados', logContext);
                await showTypingIndicator(provider, ctx, 1000);
                await state.update({
                    selectedProcessType: 'finalized',
                    currentFlow: 'LEGAL_FINALIZED_PROCESSES'
                });
                return gotoFlow(legalFinalizedProcessesFlow);
            }
            
            if (userInputLower === 'pdf') {
                logger.info('Usuario eligió recibir resumen en PDF', logContext);
                await showTypingIndicator(provider, ctx, 1000);
                await state.update({ currentFlow: 'LEGAL_PDF_SUMMARY' });
                return gotoFlow(legalPdfSummaryFlow);
            }
            
            if (userInputLower === 'menu' || userInputLower === 'menú') {
                logger.info('Usuario eligió volver al menú principal', logContext);
                await showTypingIndicator(provider, ctx, 800);
                await state.update({
                    currentFlow: 'IDLE',
                    selectedProcessType: null,
                    currentProcesses: null
                });
                await flowDynamic('🔄 Volviendo al menú principal...');
                const { helloFlow } = await import('./hello.flow.js');
                return gotoFlow(helloFlow);
            }
            
            // Si no es una palabra clave, debe ser un número de proceso
            // Cambiar el estado para procesarlo como selección de proceso
            logger.info('Usuario escribió un número, procesando como selección de proceso', logContext);
            await state.update({ currentFlow: 'LEGAL_PROCESS_DETAILS' });
            // Continuar con el procesamiento normal
        }
        
        // Verificar que tenemos procesos cargados
        if (!stateData.currentProcesses || !stateData.selectedProcessType) {
            logger.warn('No hay procesos cargados en el estado', logContext);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de error
            await showTypingIndicator(provider, ctx, 800);
            
            await flowDynamic('❌ No se encontraron procesos. Por favor, envía tu número de identificación nuevamente.');
            return gotoFlow(legalDocumentHandlerFlow);
        }
        
        // Obtener el número seleccionado
        const selectedNumber = parseInt(userInput);
        if (isNaN(selectedNumber) || selectedNumber < 1) {
            logger.warn(`Número inválido: "${userInput}"`, logContext);
            return fallBack('❌ Por favor, responde con el número de la lista del proceso que quieres consultar.');
        }
        
        // Obtener procesos según el tipo seleccionado
        const processes = stateData.selectedProcessType === 'active' 
            ? stateData.currentProcesses.activeProcesses 
            : stateData.currentProcesses.finalizedProcesses;
        
        logger.debug(`Procesos disponibles: ${processes.length}`, logContext);
        logger.info(`Usuario seleccionó: ${selectedNumber}`, logContext);
        
        if (selectedNumber > processes.length) {
            logger.warn(`Número fuera de rango: ${selectedNumber} (máximo: ${processes.length})`, logContext);
            return fallBack(`❌ Número inválido. Solo hay ${processes.length} proceso${processes.length > 1 ? 's' : ''} disponible${processes.length > 1 ? 's' : ''}. Por favor, elige un número de la lista.`);
        }
        
        const selectedProcess = processes[selectedNumber - 1];
        logger.info(`Proceso seleccionado: "${selectedProcess.internalCode}"`, logContext);
        
        try {
            // Mostrar indicador de "escribiendo" antes de obtener detalles
            await showTypingIndicator(provider, ctx, 1200);
            
            // Mostrar mensaje de carga
            await flowDynamic('🔍 Obteniendo detalles del proceso...');
            logger.botResponse('Obteniendo detalles del proceso...', ctx.from, 'LEGAL_PROCESS_DETAILS');
            
            // Consultar detalles del proceso
            const legalApiService = LegalApiServiceFactory.create();
            logger.apiCall('getProcessDetails', ctx.from, true);
            const processDetailsResponse = await legalApiService.getProcessDetails(selectedProcess.internalCode);
            
            // Transformar respuesta a modelo de dominio
            const processDetails = toProcessDetails(processDetailsResponse);
            
            // Guardar en estado
            await state.update({ 
                selectedProcess: processDetails,
                currentFlow: 'LEGAL_PDF_CONFIRMATION'
            });
            logger.info('Estado actualizado: LEGAL_PDF_CONFIRMATION', logContext);
            
            // Mostrar indicador de "escribiendo" antes de mostrar detalles
            await showTypingIndicator(provider, ctx, 1000);
            
            // Mostrar detalles del proceso
            const detailsMessage = formatProcessDetails(processDetails);
            await flowDynamic(detailsMessage);
            
            const pdfConfirmationMessage = generateOptionsMessage(
                '¿Quieres recibir el PDF de este proceso?',
                PDF_CONFIRMATION_OPTIONS
            );
            await flowDynamic(pdfConfirmationMessage);
            logger.botResponse('Mostró detalles del proceso', ctx.from, 'LEGAL_PROCESS_DETAILS');
            
            // Redirigir al flujo de confirmación de PDF
            logger.info('Redirigiendo a legalPdfConfirmationFlow', logContext);
            return gotoFlow(legalPdfConfirmationFlow);
            
        } catch (error) {
            logger.error('Error al obtener detalles del proceso', logContext, error as Error);
            
            // Mostrar indicador de "escribiendo" antes de mostrar errores
            await showTypingIndicator(provider, ctx, 1000);
            
            // Manejar errores específicos
            if (error instanceof ProcessNotFoundError) {
                await flowDynamic(`❌ ${error.message}`);
                await flowDynamic('Por favor, verifica el código del proceso e intenta nuevamente.');
                logger.botResponse('Proceso no encontrado', ctx.from, 'LEGAL_PROCESS_DETAILS');
                return fallBack('Por favor, responde con el número de la lista del proceso que quieres consultar.');
            }
            
            if (error instanceof ApiConnectionError) {
                await flowDynamic('❌ Error de conexión con la API. Por favor, intenta nuevamente.');
                logger.botResponse('Error de conexión con la API', ctx.from, 'LEGAL_PROCESS_DETAILS');
                return fallBack('Por favor, responde con el número de la lista del proceso que quieres consultar.');
            }
            
            if (error instanceof InvalidApiResponseError) {
                await flowDynamic('❌ Error en la respuesta de la API. Por favor, intenta nuevamente.');
                logger.botResponse('Error de respuesta inválida de la API', ctx.from, 'LEGAL_PROCESS_DETAILS');
                return fallBack('Por favor, responde con el número de la lista del proceso que quieres consultar.');
            }
            
            // Error genérico
            await flowDynamic('❌ Error al obtener los detalles del proceso. Por favor, intenta nuevamente.');
            logger.botResponse('Error genérico al obtener detalles', ctx.from, 'LEGAL_PROCESS_DETAILS');
            return fallBack('Por favor, responde con el número de la lista del proceso que quieres consultar.');
        }
    });
