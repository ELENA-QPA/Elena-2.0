/**
 * Flujo para generar y enviar resumen PDF de todos los procesos
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { LegalApiServiceFactory, toAllProcessDetails } from '../services/legal/index.js';
import { pdfGeneratorService } from '../services/pdf-generator.service.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateErrorAlternativesMessage, generateOptionsMessage, showTypingIndicator } from '../utils/index.js';
import { newProcessFlow } from './new-process.flow.js';
import { legalProcessSelectionFlow } from './legal-process-selection.flow.js';

export const legalPdfSummaryFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PDF_SUMMARY', 'GENERATE_SUMMARY');

        logger.userAction('Usuario solicitó resumen PDF de todos los procesos', ctx.from, 'LEGAL_PDF_SUMMARY');
        logger.debug('Estado actual del usuario', logContext);

        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PDF_SUMMARY') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }

        const documentNumber = stateData.currentDocument;
        if (!documentNumber) {
            logger.warn('No hay número de documento en el estado', logContext);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de error
            await showTypingIndicator(provider, ctx, 800);
            
            await flowDynamic('❌ No se encontró el número de documento. Por favor, intenta nuevamente.');
            return;
        }

        // Mostrar indicador de "escribiendo" antes de generar PDF
        await showTypingIndicator(provider, ctx, 1200);

        // Preparar y generar PDF dinámicamente
        await flowDynamic('📄 Generando el resumen completo de todos tus procesos...', { delay: 200 });
        logger.botResponse('Generando el resumen completo...', ctx.from, 'LEGAL_PDF_SUMMARY');

        try {
            // Consultar API para obtener todos los casos con detalles
            const legalApiService = LegalApiServiceFactory.create();
            
            logger.info(`🔍 [LEGAL_PDF_SUMMARY] Llamando a getAllCasesWithDetails...`, logContext);
            const allCasesResponse = await legalApiService.getAllCasesWithDetails(documentNumber);
            
            logger.info(`Datos obtenidos para resumen PDF: ${allCasesResponse.active?.length || 0} activos, ${allCasesResponse.finalized?.length || 0} finalizados`, logContext);

            // Usar adapter para transformar datos
            const allProcesses = toAllProcessDetails(allCasesResponse);
            
            if (allProcesses.length === 0) {
                logger.error(`❌ [LEGAL_PDF_SUMMARY] No se encontraron procesos después de transformar datos`, logContext);
                throw new Error('No se encontraron procesos para generar el resumen');
            }

            // Usar el primer cliente como nombre principal
            const clientName = allProcesses[0].clientName;

            // Generar PDF usando el servicio con todos los casos
            logger.info(`📄 [LEGAL_PDF_SUMMARY] Iniciando generación de PDF con ${allProcesses.length} procesos...`, logContext);
            const pdfResult = await pdfGeneratorService.generateProcessReport(
                allProcesses,
                clientName
            );
            logger.info(`✅ [LEGAL_PDF_SUMMARY] PDF resumen generado exitosamente: ${pdfResult.filename}`, logContext);
            logger.info(`📁 [LEGAL_PDF_SUMMARY] Detalles del PDF: filename=${pdfResult.filename}, url=${pdfResult.url}`, logContext);

            // Mostrar indicador de "escribiendo" antes de enviar PDF
            await showTypingIndicator(provider, ctx, 1000);

            // Enviar el PDF
            await flowDynamic([
                {
                    body: `📄 Aquí tienes el resumen completo de todos tus procesos asociados al documento ${documentNumber}:`,
                    media: pdfResult.url
                }
            ]);
            logger.botResponse('PDF resumen enviado al usuario', ctx.from, 'LEGAL_PDF_SUMMARY');

            // Eliminar el PDF del servidor después de enviarlo
            setTimeout(() => {
                const deleted = pdfGeneratorService.deletePdf(pdfResult.filename);
                if (deleted) {
                    logger.debug('PDF resumen eliminado del servidor', logContext);
                }
            }, 5000); // Esperar 5 segundos para asegurar que se descargó

            // Mostrar indicador de "escribiendo" antes de mostrar opciones
            await showTypingIndicator(provider, ctx, 800);

            // Mostrar opciones después de enviar el PDF
            await flowDynamic(generateErrorAlternativesMessage(
                '¿Qué te gustaría hacer ahora?',
                [
                    'Consultar otro tipo de procesos',
                    '¿Quieres iniciar un proceso con nosotros?',
                    '¿Prefieres hablar directamente con un abogado?'
                ]
            ));
            logger.botResponse('Mostró opciones después de enviar PDF', ctx.from, 'LEGAL_PDF_SUMMARY');

            // Actualizar estado para manejar las opciones
            await state.update({ currentFlow: 'PDF_SUMMARY_OPTIONS' });
            logger.info('Estado actualizado: PDF_SUMMARY_OPTIONS', logContext);

        } catch (error) {
            logger.error('❌ [LEGAL_PDF_SUMMARY] Error generando PDF resumen', logContext, error as Error);
            
            // Log detallado del error
            if (error instanceof Error) {
                logger.error(`❌ [LEGAL_PDF_SUMMARY] Mensaje de error: ${error.message}`, logContext);
                logger.error(`❌ [LEGAL_PDF_SUMMARY] Stack trace: ${error.stack}`, logContext);
            } else {
                logger.error(`❌ [LEGAL_PDF_SUMMARY] Error no es instancia de Error:`, logContext, error);
            }
            
            // Log del estado actual
            logger.info(`📊 [LEGAL_PDF_SUMMARY] Estado actual del usuario: currentFlow=${stateData.currentFlow}, currentDocument=${stateData.currentDocument}, hasCurrentProcesses=${!!stateData.currentProcesses}`, logContext);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de error
            await showTypingIndicator(provider, ctx, 1000);
            
            await flowDynamic(generateErrorAlternativesMessage(
                '❌ Lo siento, hubo un error generando el resumen.\n¿Qué te gustaría hacer?',
                [
                    'Quieres intentarlo nuevamente',
                    '¿Quieres iniciar un proceso con nosotros?',
                    '¿Prefieres hablar directamente con un abogado?'
                ]
            ));
            logger.botResponse('Error generando PDF resumen y mostró opciones', ctx.from, 'LEGAL_PDF_SUMMARY');

            // Actualizar estado para permitir nueva consulta
            await state.update({ currentFlow: 'IDLE' });
            logger.info('Estado actualizado: IDLE', logContext);
        }
    })
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PDF_SUMMARY', 'SUCCESS_OPTION_SELECTION');

        // Solo procesar si estamos en estado PDF_SUMMARY_OPTIONS (después de enviar PDF exitosamente)
        if (stateData.currentFlow !== 'PDF_SUMMARY_OPTIONS') {
            logger.debug('No estamos en estado PDF_SUMMARY_OPTIONS, ignorando entrada', logContext);
            return;
        }

        logger.userAction(`Usuario escribió en opciones de éxito: "${userInput}"`, ctx.from, 'LEGAL_PDF_SUMMARY');

        switch (userInput) {
            case '1':
                console.log('🟢 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Consultar otro tipo de procesos');
                logger.info('Usuario quiere consultar otro tipo de procesos', logContext);
                
                // Mostrar indicador de "escribiendo" antes de redirigir
                await showTypingIndicator(provider, ctx, 800);
                
                // Determinar qué opción corresponde según los procesos disponibles
                // Si solo hay procesos activos, esa será la opción 1
                // Si solo hay finalizados, esa será la opción 1
                // Si hay ambos, activos será 1 y finalizados será 2
                // eslint-disable-next-line no-case-declarations
                const optionToSelect = '1'; // Por defecto, seleccionar la primera opción disponible
                
                // Actualizar estado y simular respuesta para que legalProcessSelectionFlow la procese
                await state.update({ 
                    currentFlow: 'LEGAL_PROCESS_SELECTION',
                    selectedProcessType: null,
                    _userResponse: optionToSelect // Simular que el usuario seleccionó la opción 1
                });
                
                // Redirigir al step 1 (segundo addAction sin capture) que procesará _userResponse
                logger.info('Redirigiendo a legalProcessSelectionFlow step 1 con respuesta simulada', logContext);
                return gotoFlow(legalProcessSelectionFlow, 1);

            case '2':
                console.log('🟢 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Iniciar proceso');
                logger.info('Usuario quiere iniciar un nuevo proceso', logContext);
                
                // Mostrar indicador de "escribiendo" antes de confirmar
                await showTypingIndicator(provider, ctx, 800);
                
                await state.update({
                    currentFlow: 'NEW_PROCESS_PROFILE',
                    selectedOption: '2'
                });
                await flowDynamic('🎉 ¡Excelente! Te ayudo a iniciar un nuevo proceso...');
                return gotoFlow(newProcessFlow);

            case '3':
                console.log('🟢 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Hablar con abogado');
                logger.info('Usuario quiere hablar directamente con abogado', logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje final
                await showTypingIndicator(provider, ctx, 1000);
                
                await state.update({ currentFlow: 'IDLE' });
                return endFlow('👨‍💼 Perfecto, te conecto con uno de nuestros abogados especializados.\n\nUn abogado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas.');

            default:
                console.log('🟢 [LEGAL_PDF_SUMMARY] Opción inválida en éxito:', userInput);
                logger.warn(`Opción inválida en manejo de éxito: "${userInput}"`, logContext);
                return fallBack('❌ Opción inválida. Por favor, responde con 1, 2 o 3.');
        }
    })
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
        const userInput = ctx.body.trim();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PDF_SUMMARY', 'ERROR_OPTION_SELECTION');

        // Solo procesar si estamos en estado IDLE (después de un error)
        if (stateData.currentFlow !== 'IDLE') {
            logger.debug('No estamos en estado IDLE, ignorando entrada', logContext);
            return;
        }

        logger.userAction(`Usuario escribió en opciones de error: "${userInput}"`, ctx.from, 'LEGAL_PDF_SUMMARY');

        switch (userInput) {
            case '1':
                console.log('🔴 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Intentar nuevamente');
                logger.info('Usuario quiere intentar generar PDF nuevamente', logContext);
                
                // Mostrar indicador de "escribiendo" antes de reintentar
                await showTypingIndicator(provider, ctx, 800);
                
                // Volver al estado de generación de PDF
                await state.update({ currentFlow: 'LEGAL_PDF_SUMMARY' });
                await flowDynamic('🔄 Perfecto, intentemos generar el resumen nuevamente...');
                
                // Redirigir al inicio del flujo para reintentar
                return gotoFlow(legalPdfSummaryFlow);

            case '2':
                console.log('🔴 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Iniciar proceso');
                logger.info('Usuario quiere iniciar un nuevo proceso', logContext);
                
                await state.update({
                    currentFlow: 'NEW_PROCESS_PROFILE',
                    selectedOption: '2'
                });
                return gotoFlow(newProcessFlow);

            case '3':
                console.log('🔴 [LEGAL_PDF_SUMMARY] Usuario seleccionó: Hablar con abogado');
                logger.info('Usuario quiere hablar directamente con abogado', logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje final
                await showTypingIndicator(provider, ctx, 1000);
                
                await state.update({ currentFlow: 'IDLE' });
                return endFlow('👨‍💼 Perfecto, te conecto con uno de nuestros abogados especializados.\n\nUn abogado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas.');

            default:
                console.log('🔴 [LEGAL_PDF_SUMMARY] Opción inválida en error:', userInput);
                logger.warn(`Opción inválida en manejo de error: "${userInput}"`, logContext);
                return fallBack('❌ Opción inválida. Por favor, responde con 1, 2 o 3.');
        }
    });
