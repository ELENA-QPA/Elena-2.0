export interface EmailReminderData {
  to: string;
  subject: string;
  template: string;
  context: any;
}

export interface DaptaData {
  phone_number: string;
  plaintiff_name: string;
  defendant_name: string;
  audience_day: string;
  audience_month: string;
  audience_year: string;
  audience_start_time: string;
}
