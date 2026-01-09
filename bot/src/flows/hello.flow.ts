import { addKeyword, EVENTS } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { legalDocumentHandlerFlow } from './legal-document-handler.flow.js';
import { newProcessFlow } from './new-process.flow.js';
import { generateOptionsMessage, showTypingIndicator } from '../utils/index.js';

const HELLO_OPTIONS = [
  '¿Tienes actualmente un proceso con nosotros?',
  '¿Quieres iniciar un proceso con nosotros?',
  // '¿Prefieres hablar directamente con un abogado?'
];

export const helloFlow = addKeyword(EVENTS.WELCOME)
  .addAction(async (ctx, { flowDynamic, state, gotoFlow, provider }) => {
    const stateData = await state.getMyState();
    
    console.log('🔵 [HELLO_FLOW] Usuario escribió:', ctx.body);
    // console.log('🔵 [HELLO_FLOW] Estado actual:', stateData.currentFlow);
    
    // Si ya está en un flujo activo, no procesar
    // if (stateData.currentFlow && stateData.currentFlow !== 'IDLE') {
    //   console.log('🔵 [HELLO_FLOW] Usuario ya está en un flujo activo, ignorando');
    //   return;
    // }

    console.log('🔵 [HELLO_FLOW] Usuario inició conversación');

    // Mostrar indicador de "escribiendo"
    await showTypingIndicator(provider, ctx, 1200);

    const message = generateOptionsMessage(
      '👋 ¡Hola! Bienvenido/a a ELENA – QPAlliance, tu asistente legal virtual.\n\nAntes de continuar, cuéntame:',
      HELLO_OPTIONS
    );
    
    await flowDynamic(message);

    // Establecer estado para esperar respuesta
    await state.update({ currentFlow: 'HELLO_SELECTION' });
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, provider }) => {
    const userInput = ctx.body.trim();
    const stateData = await state.getMyState();

    console.log('🔵 [HELLO_FLOW] Usuario escribió:', userInput);
    console.log('🔵 [HELLO_FLOW] Estado actual:', stateData.currentFlow);

    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'HELLO_SELECTION') {
      console.log('🔵 [HELLO_FLOW] No estamos en estado correcto, ignorando');
      return;
    }

    // Procesar selección del usuario
    switch (userInput) {
      case '1':
        console.log('🔵 [HELLO_FLOW] Usuario seleccionó: Proceso existente');
        await state.update({
          currentFlow: 'DATA_AUTHORIZATION',
          selectedOption: '1'
        });
        break;

      case '2':
        console.log('🔵 [HELLO_FLOW] Usuario seleccionó: Iniciar nuevo proceso');
        await state.update({
          currentFlow: 'DATA_AUTHORIZATION',
          selectedOption: '2'
        });
        break;

      // case '3':
      //   console.log('🔵 [HELLO_FLOW] Usuario seleccionó: Hablar con abogado');
      //   await state.update({
      //     currentFlow: 'DATA_AUTHORIZATION',
      //     selectedOption: '3'
      //   });
      //   break;

      default:
        console.log('🔵 [HELLO_FLOW] Opción inválida:', userInput);
        return fallBack('❌ Opción inválida. Por favor, responde con 1 o 2.');
    }

    // Mostrar indicador de "escribiendo" antes del mensaje largo
    await showTypingIndicator(provider, ctx, 2000);

    // Mostrar mensaje de autorización de datos personales
    await flowDynamic('Antes de continuar, queremos contarte que de conformidad con la Ley 1581 de 2012 y demás normas aplicables en Colombia, los datos personales que suministres a través de este canal serán recolectados, almacenados y tratados por QPAlliance, con la finalidad de prestar asesoría jurídica, gestionar procesos legales, enviarte notificaciones sobre el estado de tus trámites y facilitar la comunicación contigo. Tus datos serán manejados de manera confidencial y segura, y no serán compartidos con terceros sin tu autorización expresa, salvo en los casos previstos por la ley. Como titular de la información, tienes derecho a conocer, actualizar, rectificar y solicitar la supresión de tus datos en cualquier momento.\n\n¿Aceptas el tratamiento de tus datos personales conforme a nuestra política de privacidad?\n👉 Responde:\n1️⃣ Sí, acepto\n2️⃣ No acepto');
  })
  .addAction({ capture: true }, async (ctx, { flowDynamic, state, gotoFlow, fallBack, endFlow, provider }) => {
    const userInput = ctx.body.trim();
    const stateData = await state.getMyState();

    console.log('🔵 [HELLO_FLOW] Usuario escribió en autorización:', userInput);
    console.log('🔵 [HELLO_FLOW] Estado actual:', stateData.currentFlow);

    // Validar que estamos en el estado correcto
    if (stateData.currentFlow !== 'DATA_AUTHORIZATION') {
      console.log('🔵 [HELLO_FLOW] No estamos en estado de autorización, ignorando');
      return;
    }

    // Procesar respuesta de autorización
    const normalizedInput = userInput.toLowerCase().trim();

    if (normalizedInput === '1' || normalizedInput === 'sí' || normalizedInput === 'si' || normalizedInput === 'acepto') {
      console.log('🔵 [HELLO_FLOW] Usuario aceptó tratamiento de datos');
      
      // Mostrar indicador de "escribiendo" antes de la confirmación
      await showTypingIndicator(provider, ctx, 1000);
      
      await flowDynamic('✅ ¡Perfecto! Gracias por aceptar nuestra política de privacidad.\n\nAhora continuemos con tu solicitud...');

      // Continuar con la opción seleccionada anteriormente
      switch (stateData.selectedOption) {
        case '1':
          console.log('🔵 [HELLO_FLOW] Continuando con: Proceso existente');
          await state.update({ currentFlow: 'LEGAL_DOCUMENT_HANDLER' });
          return gotoFlow(legalDocumentHandlerFlow);

        case '2':
          console.log('🔵 [HELLO_FLOW] Continuando con: Iniciar nuevo proceso');
          await state.update({
            currentFlow: 'NEW_PROCESS_PROFILE',
            selectedOption: '2'
          });
          return gotoFlow(newProcessFlow);

        // case '3':
        //   console.log('🔵 [HELLO_FLOW] Continuando con: Hablar con abogado');
        //   
        //   // Mostrar indicador de "escribiendo" antes del mensaje final
        //   await showTypingIndicator(provider, ctx, 1000);
        //   
        //   await flowDynamic('👌 Claro, con mucho gusto.\nEn breve uno de nuestros asesores legales se pondrá en contacto contigo.');
        //   await state.update({ currentFlow: 'IDLE' });
        //   return endFlow();
      }
    } else if (normalizedInput === '2' || normalizedInput === 'no' || normalizedInput === 'rechazo' || normalizedInput === 'no acepto') {
      console.log('🔵 [HELLO_FLOW] Usuario rechazó tratamiento de datos');
      
      // Mostrar indicador de "escribiendo" antes del mensaje de rechazo
      await showTypingIndicator(provider, ctx, 1500);
      
      await flowDynamic('Gracias por tu respuesta, en esta ocasión no podemos seguir adelante con tu solicitud debido a que no hay aceptación del tratamiento de datos personales.\n\nSi cambias de opinión en el futuro, puedes contactarnos nuevamente.\n\n¡Que tengas un excelente día! 👋');
      await state.update({ currentFlow: 'IDLE' });
    } else {
      console.log('🔵 [HELLO_FLOW] Opción inválida en autorización:', userInput);
      return fallBack('❌ Opción inválida. Por favor, responde con 1, 2, sí, no, acepto o no acepto.');
    }
  });
