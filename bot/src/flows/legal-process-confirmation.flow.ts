/**
 * Flujo para confirmar si el usuario quiere consultar otro proceso
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { legalProcessSelectionFlow } from './legal-process-selection.flow.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';

const PROCESS_TYPE_OPTIONS = [
  'Ver procesos activos',
  'Ver procesos finalizados'
];

export const legalProcessConfirmationFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    // Primer addAction: Capturar respuesta del usuario (cuando viene desde el flujo normal)
    .addAction({ capture: true }, async (ctx, { state }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PROCESS_CONFIRMATION', 'PROCESS_CONFIRMATION');
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PROCESS_CONFIRMATION') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        const userInput = ctx.body.trim().toLowerCase();
        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_PROCESS_CONFIRMATION');
        
        // Guardar la respuesta del usuario en el estado para el siguiente addAction
        await state.update({ _userResponse: userInput });
    })
    // Segundo addAction: Procesar la respuesta (sin capture, usa el estado)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PROCESS_CONFIRMATION', 'PROCESS_CONFIRMATION');
        
        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PROCESS_CONFIRMATION') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }
        
        // Obtener la respuesta del usuario del estado
        const userInput = stateData._userResponse || '';
        
        // Limpiar la respuesta del estado
        await state.update({ _userResponse: null });
        
        logger.debug('Estado actual del usuario', logContext);
        
        // Verificar respuestas afirmativas (texto y números)
        const affirmativeResponses = ['sí', 'si', 'yes', 'y', 'ok', 'okay', 'perfecto', 'bien', '1'];
        const negativeResponses = ['no', 'n', 'cancelar', 'cancel', '2'];
        
        if (affirmativeResponses.includes(userInput)) {
            logger.info('Usuario confirmó consultar otro proceso', logContext);
            
            // Mostrar indicador de "escribiendo" antes de mostrar opciones
            await showTypingIndicator(provider, ctx, 800);
            
            // Actualizar estado y mostrar opciones de tipo de proceso
            await state.update({ currentFlow: 'LEGAL_PROCESS_SELECTION' });
            logger.info('Estado actualizado: LEGAL_PROCESS_SELECTION', logContext);
            
            const processTypeMessage = generateOptionsMessage(
                '¿Qué tipo de procesos quieres consultar?',
                PROCESS_TYPE_OPTIONS
            );
            await flowDynamic(processTypeMessage);
            logger.botResponse('Mostró opciones de tipo de proceso', ctx.from, 'LEGAL_PROCESS_CONFIRMATION');
            
            // Redirigir al flujo de selección
            logger.info('Redirigiendo a legalProcessSelectionFlow', logContext);
            return gotoFlow(legalProcessSelectionFlow);
            
        } else if (negativeResponses.includes(userInput)) {
            logger.info('Usuario canceló consultar otro proceso', logContext);
            
            // Mostrar indicador de "escribiendo" antes de la despedida
            await showTypingIndicator(provider, ctx, 1000);
            
            logger.flowEnd('CONVERSATION_END', ctx.from);
            await flowDynamic('¡Gracias por usar ELENA - QPAlliance! 👋');
            logger.botResponse('Despedida final', ctx.from, 'LEGAL_PROCESS_CONFIRMATION');
            return endFlow();
            
        } else {
            logger.warn(`Respuesta inválida: "${userInput}"`, logContext);
            return fallBack('❌ Por favor, responde con "1" o "sí" para consultar otro proceso, o "2" o "no" para terminar.');
        }
    });
