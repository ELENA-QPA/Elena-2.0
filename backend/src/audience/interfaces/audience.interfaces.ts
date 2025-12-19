export enum EstadoAudiencia {
    PROGRAMADA = 'Programada',
    CELEBRADA = 'Celebrada',
    NO_CELEBRADA = 'No Celebrada',
    CONCILIADA = 'Conciliada',  

}

export interface AudienceInterface{
  _id: string;
  record: string;
  lawyer: string;
  state: string;
  start: Date;
  end: Date;
  link?: string;
  is_valid: boolean;
}

export interface AudienceResponse{
    audience: AudienceInterface
}
