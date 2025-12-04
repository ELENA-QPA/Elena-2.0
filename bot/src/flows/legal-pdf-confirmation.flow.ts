/**
 * Flujo para confirmar y enviar PDF del proceso
 */

import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { mainOptionsFlow } from './main-options.flow.js';
import { legalDocumentHandlerFlow } from './legal-document-handler.flow.js';
import { pdfGeneratorService } from '../services/pdf-generator.service.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { showTypingIndicator } from '../utils/index.js';

export const legalPdfConfirmationFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
    .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
        const userInput = ctx.body.trim().toLowerCase();
        const stateData = await state.getMyState();
        const logContext = createLogContext(ctx, 'LEGAL_PDF_CONFIRMATION', 'PDF_CONFIRMATION');

        logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_PDF_CONFIRMATION');
        logger.debug('Estado actual del usuario', logContext);

        // Solo procesar si estamos en el estado correcto
        if (stateData.currentFlow !== 'LEGAL_PDF_CONFIRMATION') {
            logger.debug('No estamos en estado correcto, ignorando entrada', logContext);
            return;
        }

        // Verificar respuestas afirmativas
        const affirmativeResponses = ['1', 'sí', 'si', 'yes', 'y', 'ok', 'okay', 'perfecto', 'bien'];
        const negativeResponses = ['2', 'no', 'n', 'cancelar', 'cancel'];

        if (affirmativeResponses.includes(userInput)) {
            logger.info('Usuario confirmó generación de PDF', logContext);

            if (!stateData.selectedProcess) {
                logger.warn('No hay proceso seleccionado en el estado', logContext);
                
                // Mostrar indicador de "escribiendo" antes del mensaje de error
                await showTypingIndicator(provider, ctx, 800);
                
                await flowDynamic('❌ No se encontró el proceso seleccionado. Por favor, intenta nuevamente.');
                return gotoFlow(legalDocumentHandlerFlow);
            }

            // Mostrar indicador de "escribiendo" antes de generar PDF
            await showTypingIndicator(provider, ctx, 1200);

            // Preparar y generar PDF dinámicamente
            await flowDynamic('📄 Generando el reporte personalizado...', { delay: 200 });
            logger.botResponse('Generando el reporte personalizado...', ctx.from, 'LEGAL_PDF_CONFIRMATION');

            try {
                // Generar PDF usando el servicio
                const pdfResult = await pdfGeneratorService.generateProcessReport(
                    stateData.selectedProcess,
                    stateData.clientName || 'Cliente'
                );
                logger.info(`PDF generado exitosamente: ${pdfResult.filename}`, logContext);

                // Mostrar indicador de "escribiendo" antes de enviar PDF
                await showTypingIndicator(provider, ctx, 1000);

                // Enviar el PDF
                await flowDynamic([
                    {
                        body: `📄 Aquí tienes el reporte personalizado del proceso #${stateData.selectedProcess.internalCode}:`,
                        media: pdfResult.url
                    }
                ]);
                logger.botResponse('PDF enviado al usuario', ctx.from, 'LEGAL_PDF_CONFIRMATION');

                // Eliminar el PDF del servidor después de enviarlo
                setTimeout(() => {
                    const deleted = pdfGeneratorService.deletePdf(pdfResult.filename);
                    if (deleted) {
                        logger.debug('PDF eliminado del servidor', logContext);
                    }
                }, 5000); // Esperar 5 segundos para asegurar que se descargó

            } catch (error) {
                logger.error('Error generando PDF', logContext, error as Error);
                
                // Mostrar indicador de "escribiendo" antes del mensaje de error
                await showTypingIndicator(provider, ctx, 1000);
                
                await flowDynamic('❌ Lo siento, hubo un error generando el reporte.');
                logger.botResponse('Error generando PDF', ctx.from, 'LEGAL_PDF_CONFIRMATION');

                // Actualizar estado y redirigir al menú de opciones principales
                await state.update({ currentFlow: 'MAIN_OPTIONS' });
                logger.info('Estado actualizado: MAIN_OPTIONS', logContext);
                logger.info('Redirigiendo a mainOptionsFlow', logContext);
                return gotoFlow(mainOptionsFlow);
            }

            // PDF enviado exitosamente, redirigir al menú de opciones principales
            await state.update({ currentFlow: 'MAIN_OPTIONS' });
            logger.info('Estado actualizado: MAIN_OPTIONS (después de enviar PDF)', logContext);
            logger.info('Redirigiendo a mainOptionsFlow', logContext);
            return gotoFlow(mainOptionsFlow);

        } else if (negativeResponses.includes(userInput)) {
            logger.info('Usuario canceló generación de PDF', logContext);
            
            // Mostrar indicador de "escribiendo" antes del mensaje de cancelación
            await showTypingIndicator(provider, ctx, 800);
            
            await flowDynamic('Entendido. No se generará el PDF.');
            logger.botResponse('Usuario canceló PDF', ctx.from, 'LEGAL_PDF_CONFIRMATION');

            // Actualizar estado y redirigir al menú de opciones principales
            await state.update({ currentFlow: 'MAIN_OPTIONS' });
            logger.info('Estado actualizado: MAIN_OPTIONS', logContext);
            logger.info('Redirigiendo a mainOptionsFlow', logContext);
            return gotoFlow(mainOptionsFlow);

        } else {
            logger.warn(`Respuesta inválida: "${userInput}"`, logContext);
            return fallBack('❌ Por favor, responde con "sí" para recibir el PDF o "no" para cancelar.');
        }
    });
