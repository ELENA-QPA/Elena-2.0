/**
 * Flujo para seleccionar tipo de procesos (activos o finalizados)
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { formatProcessList } from '../services/legal/index.js';
import { legalProcessDetailsFlow } from './legal-process-details.flow.js';
import { legalFinalizedProcessesFlow } from './legal-finalized-processes.flow.js';
import { legalDocumentHandlerFlow } from './legal-document-handler.flow.js';
import { legalPdfSummaryFlow } from './legal-pdf-summary.flow.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';

const PROCESS_SELECTION_OPTIONS = [
  'Ver procesos activos',
  'Ver procesos finalizados',
  'Recibir un resumen en PDF'
];

const ALTERNATIVE_PROCESS_OPTIONS = [
  'Ver procesos activos',
  'Ver procesos finalizados'
];

// Flujo para manejar las opciones de selección
export const legalProcessSelectionFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    // Primer addAction: Capturar respuesta del usuario (cuando viene desde el flujo normal)
    .addAction({ capture: true }, async (ctx, { state }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PROCESS_SELECTION', 'PROCESS_SELECTION');
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PROCESS_SELECTION') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        const userInput = ctx.body.trim();
        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_PROCESS_SELECTION');
        
        // Guardar la respuesta del usuario en el estado para el siguiente addAction
        await state.update({ _userResponse: userInput });
    })
    // Segundo addAction: Procesar la respuesta (sin capture, usa el estado)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PROCESS_SELECTION', 'PROCESS_SELECTION');

        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PROCESS_SELECTION') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }

        // Obtener la respuesta del usuario del estado
        const userInput = stateData._userResponse || '';
        
        // Limpiar la respuesta del estado
        await state.update({ _userResponse: null });
        
        logger.debug('Estado actual del usuario', logContext);

        // Generar opciones dinámicas basadas en los procesos disponibles
        const dynamicOptions = [];
        if (stateData.currentProcesses.totalActive > 0) {
            dynamicOptions.push("Ver procesos activos");
        }
        if (stateData.currentProcesses.totalFinalized > 0) {
            dynamicOptions.push("Ver procesos finalizados");
        }
        if ((stateData.currentProcesses.totalActive + stateData.currentProcesses.totalFinalized) > 0) {
            dynamicOptions.push('Recibir un resumen en PDF');
        }

        // Validar que sea una opción válida según las opciones dinámicas
        const maxOptions = dynamicOptions.length;
        const validOptions = Array.from({ length: maxOptions }, (_, i) => (i + 1).toString());
        
        if (!validOptions.includes(userInput)) {
            logger.warn(`Opción inválida: "${userInput}"`, logContext);
            const fallbackMessage = generateOptionsMessage(
                `❌ Opción no válida. Por favor, responde con ${validOptions.join(', ')}.`,
                dynamicOptions
            );
            return fallBack(fallbackMessage);
        }

        if (!stateData.currentProcesses) {
            logger.warn('No hay procesos cargados en el estado', logContext);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de error
            await showTypingIndicator(provider, ctx, 800);
            
            await flowDynamic('❌ No se encontraron procesos. Por favor, envía tu número de identificación nuevamente.');
            return gotoFlow(legalDocumentHandlerFlow);
        }

        let selectedProcessType: 'active' | 'finalized';
        let processesToShow;

        // Determinar qué opción fue seleccionada dinámicamente
        const optionIndex = parseInt(userInput) - 1;
        const selectedOption = dynamicOptions[optionIndex];

        if (selectedOption.includes('procesos activos')) {
            selectedProcessType = 'active';
            processesToShow = stateData.currentProcesses.activeProcesses;
            logger.info('Seleccionado: procesos activos', logContext);

            if (processesToShow.length === 0) {
                logger.warn('No hay procesos activos', logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje de no procesos activos
                await showTypingIndicator(provider, ctx, 800);
                
                const noActiveMessage = generateOptionsMessage(
                    '📋 No tienes procesos activos en este momento.\n\n¿Quieres consultar otro tipo de procesos?',
                    ALTERNATIVE_PROCESS_OPTIONS
                );
                await flowDynamic(noActiveMessage);
                logger.botResponse('No hay procesos activos y mostró opciones', ctx.from, 'LEGAL_PROCESS_SELECTION');
                return;
            }

            // Actualizar estado para procesos activos
            await state.update({
                selectedProcessType,
                currentFlow: 'LEGAL_PROCESS_DETAILS'
            });
            logger.info('Estado actualizado: LEGAL_PROCESS_DETAILS', logContext);

            // Mostrar indicador de "escribiendo" antes de mostrar procesos activos
            await showTypingIndicator(provider, ctx, 1000);
            
            // Mostrar lista de procesos activos
            const processListMessage = formatProcessList(processesToShow, selectedProcessType);
            await flowDynamic(processListMessage);
            
            // Ofrecer opciones claras sin conflicto de números
            let optionsMessage = `💡 *Opciones disponibles:*\n\n• Escribe el *número del proceso* (1-${processesToShow.length}) para ver sus detalles`;
            
            if (stateData.currentProcesses.totalFinalized > 0) {
                optionsMessage += '\n• Escribe *FINALIZADOS* para ver procesos finalizados';
            }
            
            optionsMessage += '\n• Escribe *PDF* para recibir un resumen completo';
            optionsMessage += '\n• Escribe *MENU* para volver al inicio';
            
            await flowDynamic(optionsMessage);
            
            // Cambiar el estado a uno que maneje estas opciones
            await state.update({
                currentFlow: 'LEGAL_PROCESS_DETAILS_OR_OPTIONS',
                selectedProcessType
            });
            
            logger.botResponse('Mostró lista de procesos activos y opciones', ctx.from, 'LEGAL_PROCESS_SELECTION');
            logger.info('Estado actualizado: LEGAL_PROCESS_DETAILS_OR_OPTIONS', logContext);

            // Redirigir al flujo de detalles que ahora manejará ambas opciones
            return gotoFlow(legalProcessDetailsFlow);

        } else if (selectedOption.includes('procesos finalizados')) {
            selectedProcessType = 'finalized';
            processesToShow = stateData.currentProcesses.finalizedProcesses;
            logger.info('Seleccionado: procesos finalizados', logContext);

            if (processesToShow.length === 0) {
                logger.warn('No hay procesos finalizados', logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje de no procesos finalizados
                await showTypingIndicator(provider, ctx, 800);
                
                const noFinalizedMessage = generateOptionsMessage(
                    '📋 No tienes procesos finalizados en este momento.\n\n¿Quieres consultar otro tipo de procesos?',
                    ALTERNATIVE_PROCESS_OPTIONS
                );
                await flowDynamic(noFinalizedMessage);
                logger.botResponse('No hay procesos finalizados y mostró opciones', ctx.from, 'LEGAL_PROCESS_SELECTION');
                return;
            }

            // Mostrar indicador de "escribiendo" antes de redirigir a procesos finalizados
            await showTypingIndicator(provider, ctx, 1000);
            
            // Actualizar estado para procesos finalizados
            await state.update({
                selectedProcessType,
                currentFlow: 'LEGAL_FINALIZED_PROCESSES'
            });
            logger.info('Estado actualizado: LEGAL_FINALIZED_PROCESSES', logContext);

            // Redirigir al flujo de procesos finalizados
            logger.info('Redirigiendo a legalFinalizedProcessesFlow', logContext);
            return gotoFlow(legalFinalizedProcessesFlow);

        } else if (selectedOption.includes('resumen en PDF')) {
            // Opción PDF: Generar resumen PDF
            logger.info('Seleccionado: resumen PDF', logContext);

            // Mostrar indicador de "escribiendo" antes de redirigir a resumen PDF
            await showTypingIndicator(provider, ctx, 1000);

            // Actualizar estado para resumen PDF
            await state.update({
                currentFlow: 'LEGAL_PDF_SUMMARY'
            });
            logger.info('Estado actualizado: LEGAL_PDF_SUMMARY', logContext);

            // Redirigir al flujo de resumen PDF
            logger.info('Redirigiendo a legalPdfSummaryFlow', logContext);
            return gotoFlow(legalPdfSummaryFlow);
        }
    });

