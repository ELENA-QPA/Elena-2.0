import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';
import { lawyerNotificationService } from '../services/lawyer-notification.service.js';

const PROFILE_OPTIONS = [
  '¿Eres Rappitendero?',
  '¿Eres una empresa?',
  '¿Otro perfil? (independiente, particular, etc.)'
];

export const newProcessFlow = addKeyword<BaileysProvider, MemoryDB>(EVENTS.ACTION)
  .addAction(async (ctx, { flowDynamic, state, provider }) => {
    const stateData = await state.getMyState();

    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'NEW_PROCESS_PROFILE') {
      console.log('🔵 [NEW_PROCESS_FLOW] No estamos en estado correcto, ignorando');
      return;
    }

    console.log('🔵 [NEW_PROCESS_FLOW] Usuario accedió a iniciar nuevo proceso');

    // Mostrar indicador de "escribiendo" antes del mensaje inicial
    await showTypingIndicator(provider, ctx, 1200);

    const profileMessage = generateOptionsMessage(
      '¡Excelente noticia! 🎉\n\nQueremos acompañarte en este camino legal y asegurarnos de que recibas la mejor orientación.\n\nPara comenzar, dime por favor:',
      PROFILE_OPTIONS
    );

    await flowDynamic(profileMessage);
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
    const userInput = ctx.body.trim();
    const stateData = await state.getMyState();

    console.log('🔵 [NEW_PROCESS_FLOW] Usuario escribió:', userInput);
    console.log('🔵 [NEW_PROCESS_FLOW] Estado actual:', stateData.currentFlow);

    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'NEW_PROCESS_PROFILE') {
      console.log('🔵 [NEW_PROCESS_FLOW] No estamos en estado correcto, ignorando');
      return;
    }

    // Procesar selección de perfil
    switch (userInput) {
      case '1':
        console.log('🔵 [NEW_PROCESS_FLOW] Usuario seleccionó: Rappitendero');
        
        // Mostrar indicador de "escribiendo" antes del mensaje largo
        await showTypingIndicator(provider, ctx, 1500);
        
        await flowDynamic([
          '🙌 ¡Excelente! Estamos listos para acompañarte durante todo el proceso y brindarte el respaldo legal que necesitas.',
          '',
          '👉 Para conocerte mejor y ofrecerte la mejor atención, te enviaré un formulario rápido que debes diligenciar y un video que te explicará a detalle en qué va a consistir tu caso.',
          '',
          '📋 Formulario:',
          'https://docs.google.com/forms/d/e/1FAIpQLScrONKT_avUatwpKU2Lh5iUn6FOEkVgrJkDwmvuaKj1AfM1Ng/viewform?usp=dialog',
          '',
          '🎥 Videos explicativos:',
          '',
          '📹 Video 1 - Introducción:',
          'https://quinteropalacio-my.sharepoint.com/:v:/g/personal/storres_qpalliance_co/ERrRc0TKZddIpohr5x8XoaUBH6pqI9dHw3jwMzul0tR81A?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=CLFTFU',
          '',
          '📹 Video 2 - ¿Qué pasa después de la demanda?:',
          'https://quinteropalacio-my.sharepoint.com/:v:/g/personal/storres_qpalliance_co/ESQL3wiJawNHpcpJw3WaQUUBsPyFvtU08gR-sqHpGRiJAQ?nav=eyJyZWZlcnJhbEluZm8iOnsicmVmZXJyYWxBcHAiOiJPbmVEcml2ZUZvckJ1c2luZXNzIiwicmVmZXJyYWxBcHBQbGF0Zm9ybSI6IldlYiIsInJlZmVycmFsTW9kZSI6InZpZXciLCJyZWZlcnJhbFZpZXciOiJNeUZpbGVzTGlua0NvcHkifX0&e=WE3oIY',
          '',
          'Gracias por confiar en nosotros. Una vez hayas completado el formulario, un abogado se pondrá en contacto contigo🙌.'
        ]);
        await state.update({ currentFlow: 'IDLE' });
        break;

      case '2': {
        console.log('🔵 [NEW_PROCESS_FLOW] Usuario seleccionó: Empresa');
        
        // Mostrar indicador de "escribiendo" antes de enviar notificación y mensaje
        await showTypingIndicator(provider, ctx, 1200);
        
        // Enviar notificación al abogado usando el servicio
        const notificationSent = await lawyerNotificationService.notifyLawyer(
          ctx.from,
          ctx.name,
          'Empresa',
          'Iniciar proceso legal empresarial'
        );
        
        if (!notificationSent) {
          console.warn('⚠️ [NEW_PROCESS_FLOW] No se pudo enviar notificación al abogado');
        }

        await flowDynamic([
          '🏢 Gracias por confiar en nosotros.',
          '',
          'Para darte un servicio ajustado a tu caso, te contactaremos con un asesor.',
          '',
          'Un abogado especializado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas empresariales🙌.'
        ]);
        await state.update({ currentFlow: 'IDLE' });
        break;
      }

      case '3': {
        console.log('🔵 [NEW_PROCESS_FLOW] Usuario seleccionó: Otro perfil');
        
        // Mostrar indicador de "escribiendo" antes de enviar notificación y mensaje
        await showTypingIndicator(provider, ctx, 1200);
        
        // Enviar notificación al abogado usando el servicio
        const notificationSent = await lawyerNotificationService.notifyLawyer(
          ctx.from,
          ctx.name,
          'Otro perfil',
          'Iniciar proceso legal personalizado'
        );
        
        if (!notificationSent) {
          console.warn('⚠️ [NEW_PROCESS_FLOW] No se pudo enviar notificación al abogado');
        }

        await flowDynamic([
          'Perfecto 🙌.',
          '',
          'Queremos conocer mejor tu perfil y tu caso para ofrecerte la mejor asesoría.',
          '',
          'Para darte un servicio ajustado a tu caso, te contactaremos con un asesor.',
          '',
          'Un abogado especializado se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas🙌.'
        ]);
        await state.update({ currentFlow: 'IDLE' });
        break;
      }

      default:
        console.log('🔵 [NEW_PROCESS_FLOW] Opción inválida:', userInput);
        return fallBack('❌ Opción inválida. Por favor, responde con 1, 2 o 3.');
    }
    return endFlow();
  });
