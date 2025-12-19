import {
  AudienceOrchestratorResponse,
  Evento,
  Estado
} from '../interfaces/audiencias.interface';

const toBigCalendarDate = (isoDate: string | Date): Date => {
  const date = new Date(isoDate);

  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    date.getHours(),
    date.getMinutes()
  );
};

export const mapAudienceToEvento = (
  api: AudienceOrchestratorResponse
): Evento => {
  const { audience, record } = api;

  return {
    title: record.settled ?? '',
    demandante: record.proceduralParts?.plaintiff?.name ?? '',
    contacto_demandante: record.proceduralParts?.plaintiff?.contact ?? '',
    email_demandante: record.proceduralParts?.plaintiff?.email ?? '',
    demandado: record.proceduralParts?.defendant?.name ?? '',
    juzgado: record.office,
    start: toBigCalendarDate(audience.start),
    end: toBigCalendarDate(audience.end),
    link_teams: audience.link ?? '',
    codigo_interno: record.internalCode,
    estado: audience.state as Estado,
    monto_conciliado: undefined, // if not provided yet
    abogado: "",
  };
};
