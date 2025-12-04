import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { newProcessFlow } from './new-process.flow.js';
import { legalProcessSelectionFlow } from './legal-process-selection.flow.js';
import { logger, createLogContext } from '../services/logger.service.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';
import { lawyerNotificationService } from '../services/lawyer-notification.service.js';

const FINALIZED_PROCESS_OPTIONS = [
  'Quieres iniciar un nuevo proceso',
  // 'Tienes problemas con el pago', // COMENTADO: Funcionalidad deshabilitada temporalmente
  'Quieres consultar otro proceso',
  '¿Prefieres hablar directamente con un abogado?'
];

// COMENTADO: Funcionalidad de problemas de pago deshabilitada temporalmente
// const PAYMENT_ISSUE_OPTIONS = [
//   'Consultar la fecha estimada de pago',
//   'Contactarme con un abogado'
// ];

const PROCESS_TYPE_OPTIONS = [
  'Ver procesos activos',
  'Ver procesos finalizados'
];

export const legalFinalizedProcessesFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
    const stateData = await state.getMyState();
    const logContext = createLogContext(ctx, 'LEGAL_FINALIZED_PROCESSES', 'SHOW_FINALIZED');
    
    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'LEGAL_FINALIZED_PROCESSES') {
      console.log('🔵 [LEGAL_FINALIZED_PROCESSES] No estamos en estado correcto, ignorando');
      return;
    }
    
    console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Mostrando procesos finalizados');
    logger.flowStart('LEGAL_FINALIZED_PROCESSES', ctx.from);
    
    // Obtener datos de procesos finalizados del estado
    const finalizedProcesses = stateData.currentProcesses?.finalizedProcesses || [];
    const documentNumber = stateData.currentDocument || 'N/A';
    
    if (finalizedProcesses.length === 0) {
      await state.update({ currentFlow: 'NO_FINALIZED_PROCESSES' });
      return;
    }
    
    // Mostrar indicador de "escribiendo" antes de mostrar procesos
    await showTypingIndicator(provider, ctx, 1000);
    
    // Mostrar procesos finalizados
    let message = `✅ Encontré ${finalizedProcesses.length} proceso${finalizedProcesses.length > 1 ? 's' : ''} finalizado${finalizedProcesses.length > 1 ? 's' : ''} asociados al documento ${documentNumber}:\n\n`;
    
    finalizedProcesses.forEach((process, index) => {
      message += `Proceso #${process.internalCode}\n`;
      message += `• Estado: ${process.status}\n`;
      message += `• Última actualización: ${process.lastUpdate}\n`;
      if (index < finalizedProcesses.length - 1) {
        message += '\n';
      }
    });
    
    const optionsMessage = generateOptionsMessage('', FINALIZED_PROCESS_OPTIONS);
    message += '\n' + optionsMessage;
    
    await flowDynamic(message);
    logger.botResponse('Mostró procesos finalizados y opciones', ctx.from, 'LEGAL_FINALIZED_PROCESSES');
  })
  .addAction(async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow }) => {
    const stateData = await state.getMyState();
    
    // Manejar caso cuando no hay procesos finalizados
    if (stateData.currentFlow === 'NO_FINALIZED_PROCESSES') {
      await state.update({ currentFlow: 'IDLE' });
      return endFlow('❌ No se encontraron procesos finalizados para tu documento.');
    }
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
    const userInput = ctx.body.trim();
    const stateData = await state.getMyState();
    const logContext = createLogContext(ctx, 'LEGAL_FINALIZED_PROCESSES', 'USER_SELECTION');
    
    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'LEGAL_FINALIZED_PROCESSES') {
      console.log('🔵 [LEGAL_FINALIZED_PROCESSES] No estamos en estado correcto, ignorando');
      return;
    }
    
    console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario escribió:', userInput);
    logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_FINALIZED_PROCESSES');
    
    switch (userInput) {
      case '1':
        console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Iniciar nuevo proceso');
        
        // Mostrar indicador de "escribiendo" antes de confirmar
        await showTypingIndicator(provider, ctx, 800);
        
        await flowDynamic('✅ Perfecto, te ayudo a iniciar un nuevo proceso legal.');
        await state.update({ 
          currentFlow: 'NEW_PROCESS_PROFILE',
          selectedOption: '2'
        });
        return gotoFlow(newProcessFlow);
        
      // COMENTADO: Funcionalidad de problemas de pago deshabilitada temporalmente
      // case '2': {
      //   console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Problemas con el pago');
      //   
      //   // Mostrar indicador de "escribiendo" antes de mostrar opciones
      //   await showTypingIndicator(provider, ctx, 800);
      //   
      //   const paymentMessage = generateOptionsMessage(
      //     'Entiendo que tienes problemas con el pago.\n\n¿Qué necesitas?',
      //     PAYMENT_ISSUE_OPTIONS
      //   );
      //   await flowDynamic(paymentMessage);
      //   await state.update({ currentFlow: 'PAYMENT_ISSUES' });
      //   break;
      // }
        
      case '2': {
        console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Consultar otro proceso');
        
        // Mostrar indicador de "escribiendo" antes de mostrar opciones
        await showTypingIndicator(provider, ctx, 800);
        
        const processTypeMessage = generateOptionsMessage(
          '¡Perfecto! Te ayudo a consultar otro tipo de procesos.\n\n¿Qué tipo de procesos quieres consultar?',
          PROCESS_TYPE_OPTIONS
        );
        await flowDynamic(processTypeMessage);
        await state.update({ 
          currentFlow: 'LEGAL_PROCESS_SELECTION',
          selectedProcessType: null
        });
        return gotoFlow(legalProcessSelectionFlow);
      }
      
      case '3': {
        console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Hablar con abogado');
        logger.info('Usuario quiere hablar con abogado (procesos finalizados)', logContext);
        
        // Mostrar indicador de "escribiendo" antes del mensaje
          
        
        // Notificar al abogado de procesos existentes
        const clientNumber = ctx.from;
        
        // Obtener el nombre del cliente (la API no incluye clientName en los procesos)
        const clientName = ctx.name || null;
        const documentNumber = stateData.currentDocument || 'N/A';
        
        await lawyerNotificationService.notifyLawyer(
          clientNumber,
          clientName,
          '', // No se usa profile para procesos existentes
          'Consulta sobre procesos finalizados',
          'existing', // Usar el abogado de procesos existentes
          documentNumber // Pasar el número de documento
        );
        
        logger.info('Notificación enviada al abogado de procesos existentes', logContext);
        
        // Mostrar indicador de "escribiendo" antes del mensaje final
        await showTypingIndicator(provider, ctx, 1000);
        
        await state.update({ currentFlow: 'IDLE' });
        logger.botResponse('Confirmación de contacto con abogado', ctx.from, 'LEGAL_FINALIZED_PROCESSES');
        return endFlow('👨‍💼 Para darte un servicio ajustado a tu caso, te contactaremos con uno de nuestros abogados.');
      }
        
      default:
        console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Opción inválida:', userInput);
        return fallBack('❌ Opción inválida. Por favor, responde con 1, 2 o 3.');
    }
  })
  // COMENTADO: Funcionalidad de problemas de pago deshabilitada temporalmente
  // .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
  //   const userInput = ctx.body.trim();
  //   const stateData = await state.getMyState();
  //   const logContext = createLogContext(ctx, 'LEGAL_FINALIZED_PROCESSES', 'PAYMENT_OPTION');
  //   
  //   // Validar que estamos en el estado correcto
  //   if (stateData.currentFlow !== 'PAYMENT_ISSUES') {
  //     console.log('🔵 [LEGAL_FINALIZED_PROCESSES] No estamos en estado de problemas de pago, ignorando');
  //     return;
  //   }
  //   
  //   console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario escribió en problemas de pago:', userInput);
  //   logger.userAction(`Usuario escribió: "${userInput}"`, ctx.from, 'LEGAL_FINALIZED_PROCESSES');
  //   
  //   switch (userInput) {
  //     case '1':
  //       console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Consultar fecha de pago');
  //       
  //       // Mostrar indicador de "escribiendo" antes del mensaje final
  //       await showTypingIndicator(provider, ctx, 1000);
  //       
  //       await state.update({ currentFlow: 'IDLE' });
  //       return endFlow('📅 Para consultar la fecha estimada de pago de tu proceso, necesito revisar los detalles específicos.\n\nUn abogado especializado se pondrá en contacto contigo en las próximas 24 horas para brindarte información precisa sobre el estado de tu pago.');
  //       
  //     case '2':
  //       console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Usuario seleccionó: Contactar abogado');
  //       
  //       // Mostrar indicador de "escribiendo" antes del mensaje final
  //       await showTypingIndicator(provider, ctx, 1000);
  //       
  //       await state.update({ currentFlow: 'IDLE' });
  //       return endFlow('👨‍💼 Perfecto, te conecto con uno de nuestros abogados especializados.\n\nUn abogado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas sobre el pago.');
  //       
  //     default:
  //       console.log('🔵 [LEGAL_FINALIZED_PROCESSES] Opción inválida en problemas de pago:', userInput);
  //       return fallBack('❌ Opción inválida. Por favor, responde con 1 o 2.');
  //   }
  // });
