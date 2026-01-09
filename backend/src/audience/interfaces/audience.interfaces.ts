export enum EstadoAudiencia {
  PROGRAMADA = 'Programada',
  CELEBRADA = 'Celebrada',
  NO_CELEBRADA = 'No_celebrada',
  CONCILIADA = 'Conciliada',
}

export interface AudienceBase {
  _id: string;
  record?: string;
  lawyer: string;
  monto: number;
  state: string;
  start?: Date;
  end?: Date;
  link?: string;
  is_valid: boolean;
  notifications?: {
    oneMonth: { sent: boolean; sentAt?: Date };
    fifteenDays: { sent: boolean; sentAt?: Date };
    oneDay: { sent: boolean; sentAt?: Date };
  };
  month?: string;
  day?: string;
  start_time?: string;
  year?: string;
}

export interface Lawyer {
  _id: string;
  name: string;
}

export interface AudiencePopulated extends Omit<AudienceBase, 'lawyer'> {
  lawyer?: Lawyer;
}

export interface AudienceResponse {
  audience: AudiencePopulated;
}
