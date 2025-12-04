/**
 * Servicio para notificar al abogado sobre nuevas solicitudes
 */

import { BaileysProvider } from '@builderbot/provider-baileys';
import { config } from '../config/env.js';
import { generateLawyerContextMessage, generateLawyerExistingProcessMessage } from '../utils/message-utils.js';

class LawyerNotificationService {
  private static instance: LawyerNotificationService;
  private provider: BaileysProvider | null = null;

  private constructor() {}

  public static getInstance(): LawyerNotificationService {
    if (!LawyerNotificationService.instance) {
      LawyerNotificationService.instance = new LawyerNotificationService();
    }
    return LawyerNotificationService.instance;
  }

  /**
   * Establece el provider del bot
   */
  public setProvider(provider: BaileysProvider): void {
    this.provider = provider;
  }

  /**
   * Envía notificación al abogado
   * @param clientNumber Número de teléfono del cliente
   * @param clientName Nombre del cliente (opcional)
   * @param profile Perfil del cliente (Empresa, Otro, etc.) - Solo para nuevos procesos
   * @param requestType Tipo de solicitud
   * @param lawyerType Tipo de abogado: 'new' para nuevos procesos, 'existing' para procesos en andamiento
   * @param documentNumber Número de documento del cliente - Solo para procesos existentes
   */
  public async notifyLawyer(
    clientNumber: string, 
    clientName: string | null, 
    profile: string, 
    requestType: string,
    lawyerType: 'new' | 'existing' = 'new',
    documentNumber?: string
  ): Promise<boolean> {
    try {
      if (!this.provider) {
        console.warn('⚠️ [LAWYER_NOTIFICATION] Provider no configurado');
        return false;
      }

      // Seleccionar el número del abogado según el tipo
      const lawyerNumber = lawyerType === 'new' ? config.lawyerNumber : config.lawyerNumberExisting;

      if (!lawyerNumber) {
        console.warn(`⚠️ [LAWYER_NOTIFICATION] Número del abogado ${lawyerType} no configurado`);
        return false;
      }

      // Generar mensaje según el tipo de abogado
      let contextMessage: string;
      if (lawyerType === 'existing' && documentNumber) {
        contextMessage = generateLawyerExistingProcessMessage(clientNumber, clientName, documentNumber, requestType);
      } else {
        contextMessage = generateLawyerContextMessage(clientNumber, clientName, profile, requestType);
      }
      
      // Verificar si el provider tiene el método sendText
      if (typeof this.provider.sendText !== 'function') {
        console.error('❌ [LAWYER_NOTIFICATION] Provider no tiene método sendText');
        return false;
      }

      // Enviar mensaje al abogado
      await this.provider.sendText(lawyerNumber, contextMessage);
      console.log(`✅ [LAWYER_NOTIFICATION] Mensaje enviado al abogado ${lawyerType} exitosamente`);
      
      return true;
    } catch (error) {
      console.error('❌ [LAWYER_NOTIFICATION] Error enviando mensaje al abogado:', error);
      return false;
    }
  }
}

export const lawyerNotificationService = LawyerNotificationService.getInstance();
