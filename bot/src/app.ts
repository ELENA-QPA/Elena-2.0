import "dotenv/config"
import { createBot, createProvider, createFlow, addKeyword, EVENTS } from '@builderbot/bot'
import { MemoryDB } from '@builderbot/bot'
import { BaileysProvider } from '@builderbot/provider-baileys'
import {
    restartFlow,
    helloFlow,
    newProcessFlow,
    legalDocumentHandlerFlow,
    legalDocumentProcessorFlow,
    legalProcessSelectionFlow,
    legalProcessDetailsFlow,
    legalFinalizedProcessesFlow,
    legalPdfConfirmationFlow,
    legalPdfSummaryFlow,
    legalProcessConfirmationFlow,
    mainOptionsFlow
} from './flows/index.js'
import { configureStaticServer } from './services/static-server.service.js'
import { pdfGeneratorService } from './services/pdf-generator.service.js'
import { lawyerNotificationService } from './services/lawyer-notification.service.js'
import { config } from './config/env.js'

/** Puerto en el que se ejecutará el servidor */
const PORT = config.port

/**
 * Función principal que configura y inicia el bot ELENA
 * @async
 * @returns {Promise<void>}
 */
const main = async () => {
    /**
     * Flujo del bot con todos los flujos legales
     * @type {import('@builderbot/bot').Flow<BaileysProvider, MemoryDB>}
     */
    const adapterFlow = createFlow([
        restartFlow,    // ← Primero: comandos de reinicio
        helloFlow,       // ← Segundo: flujo principal
        newProcessFlow,
        legalDocumentHandlerFlow,
        legalDocumentProcessorFlow,
        legalProcessSelectionFlow,
        legalProcessDetailsFlow,
        legalFinalizedProcessesFlow,
        legalPdfConfirmationFlow,
        legalPdfSummaryFlow,
        legalProcessConfirmationFlow,
        mainOptionsFlow
    ]);

    /**
     * Proveedor de servicios de mensajería
     * @type {BaileysProvider}
     */
    const adapterProvider = createProvider(BaileysProvider, {
        groupsIgnore: true,
        readStatus: false,
    });

    /**
     * Base de datos en memoria para el bot
     * @type {MemoryDB}
     */
    const adapterDB = new MemoryDB();

    /**
     * Configuración y creación del bot
     * @type {import('@builderbot/bot').Bot<BaileysProvider, MemoryDB>}
     */
    const { httpServer, provider } = await createBot({
        flow: adapterFlow,
        provider: adapterProvider,
        database: adapterDB,
    });

    // Configurar el servidor HTTP con archivos estáticos
    httpServer(+PORT);
    
    // Configurar archivos estáticos en el servidor de BuilderBot
    if (provider && provider.server) {
        configureStaticServer(provider.server);
    }
    
    // Configurar el servicio de notificación al abogado
    lawyerNotificationService.setProvider(provider);
    
    console.log(`🤖 Bot ELENA - WP Alliance iniciado en puerto ${PORT}`);
    console.log('📱 Escanea el código QR para conectar WhatsApp');
    console.log(`🌐 Archivos estáticos disponibles en: ${config.baseUrl}/public/`);
    console.log(`ℹ️ Información del servidor: ${config.baseUrl}/info`);
    console.log(`📱 QR Code disponible en: ${config.baseUrl}/qr`);
};

main();
