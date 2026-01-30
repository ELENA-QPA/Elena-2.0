interface NotificationProvider {
  sendText: (to: string, text: string) => Promise<void>;
}

class LawyerNotificationService {
  private provider: NotificationProvider | null = null;

  setProvider(provider: NotificationProvider): void {
    this.provider = provider;
  }

  async notifyLawyer(
    userId: string,
    userName: string,
    userProfile: string,
    reason: string,
    processType: string = 'new',
    documentNumber?: string
  ): Promise<void> {
    if (!this.provider) {
      console.warn('⚠️ Proveedor de notificaciones no configurado');
      return;
    }

    const lawyerNumber = process.env.LAWYER_PHONE || '573332451523';
    
    const message = `🔔 *Nueva Solicitud de Cliente*\n\n` +
      `👤 *Usuario:* ${userName}\n` +
      `📱 *ID:* ${userId}\n` +
      `👔 *Perfil:* ${userProfile}\n` +
      `📋 *Motivo:* ${reason}\n` +
      `🔖 *Tipo:* ${processType}\n` +
      (documentNumber ? `📄 *Documento:* ${documentNumber}\n` : '') +
      `⏰ *Fecha:* ${new Date().toLocaleString('es-CO')}`;

    try {
      await this.provider.sendText(lawyerNumber, message);
      console.log('✅ Notificación enviada al abogado');
    } catch (error) {
      console.error('❌ Error enviando notificación:', error);
    }
  }
}

export const lawyerNotificationService = new LawyerNotificationService();