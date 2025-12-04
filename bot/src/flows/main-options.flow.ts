/**
 * Flujo principal de opciones después de completar acciones
 * Muestra un menú dinámico basado en el contexto del usuario
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { legalProcessSelectionFlow } from './legal-process-selection.flow.js';
import { legalPdfSummaryFlow } from './legal-pdf-summary.flow.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';

/**
 * Genera el mensaje de opciones principales basado en el contexto del usuario
 */
export function generateMainOptionsMessage(currentProcesses: any): string {
    const options = [];
    
    if (currentProcesses?.totalActive > 0) {
        options.push('Ver procesos activos');
    }
    if (currentProcesses?.totalFinalized > 0) {
        options.push('Ver procesos finalizados');
    }
    if ((currentProcesses?.totalActive + currentProcesses?.totalFinalized) > 0) {
        options.push('Recibir un resumen en PDF');
    }
    options.push('Consultar otro documento');
    options.push('Finalizar conversación');
    
    return generateOptionsMessage('💡 *¿Qué deseas hacer?*', options);
}

export const mainOptionsFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    // Primer addAction: Muestra el menú automáticamente cuando se activa el flujo
    .addAction(async (ctx, { flowDynamic, state, provider }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'MAIN_OPTIONS', 'OPTIONS_DISPLAY');
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'MAIN_OPTIONS') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        await showTypingIndicator(provider, ctx, 800);
        const optionsMessage = generateMainOptionsMessage(stateData.currentProcesses);
        await flowDynamic(optionsMessage);
        logger.botResponse('Mostró menú de opciones principales', ctx.from, 'MAIN_OPTIONS');
    })
    // Segundo addAction: Captura la respuesta del usuario y procesa la selección
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'MAIN_OPTIONS', 'OPTIONS_SELECTION');
        
        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'MAIN_OPTIONS');
        logger.debug('Estado actual del usuario', logContext);
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'MAIN_OPTIONS') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        // Construir opciones dinámicas para validación
        const dynamicOptions = [];
        if (stateData.currentProcesses?.totalActive > 0) {
            dynamicOptions.push('Ver procesos activos');
        }
        if (stateData.currentProcesses?.totalFinalized > 0) {
            dynamicOptions.push('Ver procesos finalizados');
        }
        if ((stateData.currentProcesses?.totalActive + stateData.currentProcesses?.totalFinalized) > 0) {
            dynamicOptions.push('Recibir un resumen en PDF');
        }
        dynamicOptions.push('Consultar otro documento');
        dynamicOptions.push('Finalizar conversación');
        
        // Validar entrada
        const optionNumber = parseInt(userInput);
        const maxOptions = dynamicOptions.length;
        
        if (isNaN(optionNumber) || optionNumber < 1 || optionNumber > maxOptions) {
            logger.warn(`Opción inválida: "${userInput}"`, logContext);
            const fallbackMessage = generateOptionsMessage(
                `❌ Opción no válida. Por favor, responde con un número del 1 al ${maxOptions}.`,
                dynamicOptions
            );
            return fallBack(fallbackMessage);
        }
        
        const selectedOption = dynamicOptions[optionNumber - 1];
        logger.info(`Usuario seleccionó: ${selectedOption}`, logContext);
        
        // Procesar opción seleccionada
        if (selectedOption.includes('procesos activos')) {
            logger.info('Usuario eligió ver procesos activos', logContext);
            await showTypingIndicator(provider, ctx, 1000);
            
            // Guardar la opción seleccionada en el estado y redirigir al paso 1 de legalProcessSelectionFlow
            await state.update({ 
                currentFlow: 'LEGAL_PROCESS_SELECTION',
                _userResponse: '1' // Opción 1 = Ver procesos activos
            });
            logger.info('Redirigiendo a legalProcessSelectionFlow paso 1 (procesará activos)', logContext);
            return gotoFlow(legalProcessSelectionFlow, 1);
        }
        
        if (selectedOption.includes('procesos finalizados')) {
            logger.info('Usuario eligió ver procesos finalizados', logContext);
            await showTypingIndicator(provider, ctx, 1000);
            
            // Guardar la opción seleccionada en el estado y redirigir al paso 1 de legalProcessSelectionFlow
            await state.update({ 
                currentFlow: 'LEGAL_PROCESS_SELECTION',
                _userResponse: '2' // Opción 2 = Ver procesos finalizados
            });
            logger.info('Redirigiendo a legalProcessSelectionFlow paso 1 (procesará finalizados)', logContext);
            return gotoFlow(legalProcessSelectionFlow, 1);
        }
        
        if (selectedOption.includes('resumen en PDF')) {
            logger.info('Usuario eligió recibir resumen en PDF', logContext);
            await showTypingIndicator(provider, ctx, 1000);
            await state.update({ currentFlow: 'LEGAL_PDF_SUMMARY' });
            return gotoFlow(legalPdfSummaryFlow);
        }
        
        if (selectedOption.includes('Consultar otro documento')) {
            logger.info('Usuario eligió consultar otro documento', logContext);
            await showTypingIndicator(provider, ctx, 1000);
            
            // Limpiar estado y volver al inicio
            await state.update({ 
                currentFlow: 'IDLE',
                selectedOption: null,
                currentDocument: null,
                documentType: null,
                currentProcesses: null,
                selectedProcessType: null
            });
            
            await flowDynamic('🔄 Volviendo al menú principal...');
            const { helloFlow } = await import('./hello.flow.js');
            return gotoFlow(helloFlow);
        }
        
        if (selectedOption.includes('Finalizar')) {
            logger.info('Usuario eligió terminar', logContext);
            await showTypingIndicator(provider, ctx, 1000);
            logger.flowEnd('CONVERSATION_END', ctx.from);
            await state.update({ currentFlow: 'IDLE' });
            await flowDynamic('¡Gracias por usar ELENA - WP Alliance! 👋');
            logger.botResponse('Despedida final', ctx.from, 'MAIN_OPTIONS');
            return endFlow();
        }
    });

