export interface EmailReminderData {
  to: string;
  subject: string;
  templateName: string;
  templateData: Record<string, any>;
  metadata?: {
    entityId: string;
    entityType: string;
    reminderType: string;
  };
}
