/**
 * Flujo para reiniciar el bot con comandos específicos
 */

import { addKeyword } from '@builderbot/bot';
import { BaileysProvider } from '@builderbot/provider-baileys';
import { MemoryDB } from '@builderbot/bot';
import { showTypingIndicator } from '../utils/index.js';
import { helloFlow } from './hello.flow.js';

export const restartFlow = addKeyword<BaileysProvider, MemoryDB>(['menu', 'Menu', 'MENU', 'inicio', 'Inicio', 'reiniciar', 'Reiniciar', 'start', 'Start'])
  .addAction(async (ctx, { flowDynamic, state, gotoFlow, provider, endFlow }) => {
    console.log('🔄 [RESTART_FLOW] Usuario solicitó reinicio');
    
    // Limpiar todo el estado
    await state.update({ 
      currentFlow: 'IDLE',
      selectedOption: null,
      currentDocument: null,
      documentType: null,
      currentProcesses: null,
      selectedProcessType: null
    });
    
    // Mostrar indicador de "escribiendo" antes del mensaje
    await showTypingIndicator(provider, ctx, 800);
    
    // Mostrar mensaje de confirmación
    // endFlow('🔄 Volviendo al menú principal...');    
    // Redirigir al flujo principal
    await flowDynamic('🔄 Volviendo al menú principal...');
    return gotoFlow(helloFlow);
  });
