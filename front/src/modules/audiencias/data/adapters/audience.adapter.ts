import {
  AudienceOrchestratorResponse,
  Evento,
  Estado,
  getRecordByInternalCodeResponse,
  EventoForm,
  AudienceCreate
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

export const mapAudiencesToEvents = (
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
    monto_conciliado: undefined,
    abogado_id: audience.lawyer._id,
    abogado: audience.lawyer.name,
    record_id: record._id,
  };
};

export const mapRecordToEvent = (
  api: getRecordByInternalCodeResponse
): Evento => {
  const {record} = api;

    return {
    title: record.settled ?? '',
    demandante: record.proceduralParts?.plaintiff?.name ?? '',
    contacto_demandante: record.proceduralParts?.plaintiff?.contact ?? '',
    email_demandante: record.proceduralParts?.plaintiff?.email ?? '',
    demandado: record.proceduralParts?.defendant?.name ?? '',
    juzgado: record.office,
    start: new Date(),
    end: new Date(),
    link_teams: '',
    codigo_interno: record.internalCode,
    estado: 'Programada',
    monto_conciliado: undefined,
    abogado_id: "",
    abogado: "",
    record_id: record._id,
  };
}

export const mapEventoFormToAudienceCreate = (
    formData: EventoForm,
  ): AudienceCreate => {
    const isValid = Boolean(
      formData.start &&
      formData.end &&
      formData.abogado_id &&
      formData.record_id &&
      formData.link_teams &&
      formData.estado
    );

    return {
      start: new Date(formData.start),
      end: new Date(formData.end),
      lawyer: formData.abogado_id,
      record: formData.record_id,
      link: formData.link_teams || "",
      state: formData.estado,
      is_valid: isValid,
    };
  };
