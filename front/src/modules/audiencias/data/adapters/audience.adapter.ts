import dayjs from "dayjs";
import {
  AudienceOrchestratorResponse,
  Evento,
  Estado,
  getRecordByInternalCodeResponse,
  EventoForm,
  AudienceCreate,
  AudienceBase,
  AudienceUpdate,
} from "../interfaces/audiencias.interface";

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

export const mapAudiencesToEvents: (
  api: AudienceOrchestratorResponse
) => Evento = (api) => {
  const { audience, record } = api;

  return {
    idEvent: audience._id,
    title: record?.settled ?? "",
    demandante: record?.proceduralParts?.plaintiff?.name ?? "",
    contacto_demandante: record?.proceduralParts?.plaintiff?.contact ?? "",
    email_demandante: record?.proceduralParts?.plaintiff?.email ?? "",
    demandado: record?.proceduralParts?.defendant?.name ?? "",
    juzgado: record?.office ?? "",
    start: toBigCalendarDate(audience.start),
    end: toBigCalendarDate(audience.end),
    link_teams: audience.link ?? "",
    codigo_interno: record?.internalCode ?? "",
    estado: audience.state as Estado,
    monto_conciliado: audience.monto,
    abogado_id: audience.lawyer._id,
    abogado: audience.lawyer.name,
    record_id: record?._id ?? "",
  };
};

export const mapRecordToEvent = (
  api: getRecordByInternalCodeResponse
): EventoForm => {
  const { record } = api;

  return {
    title: record.settled ?? "",
    demandante: record.proceduralParts?.plaintiff?.name ?? "",
    contacto_demandante: record.proceduralParts?.plaintiff?.contact ?? "",
    email_demandante: record.proceduralParts?.plaintiff?.email ?? "",
    demandado: record.proceduralParts?.defendant?.name ?? "",
    juzgado: record.office,
    start: dayjs(new Date()).format("YYYY-MM-DDTHH:mm"),
    end: dayjs(new Date()).format("YYYY-MM-DDTHH:mm"),
    link_teams: "",
    codigo_interno: record.internalCode,
    estado: "Programada",
    monto_conciliado: 0,
    abogado_id: "",
    record_id: record._id,
  };
};

const mapEventoFormToAudienceBase = (
  formData: Partial<EventoForm>
): Partial<AudienceBase> => {
  const base: Partial<AudienceBase> = {};

  if (formData.start) base.start = new Date(formData.start);
  if (formData.end) base.end = new Date(formData.end);
  if (formData.abogado_id) base.lawyer = formData.abogado_id;
  if (formData.record_id) base.record = formData.record_id;
  if (formData.link_teams !== undefined) base.link = formData.link_teams || "";
  if (formData.estado) base.state = formData.estado;
  if (formData.monto_conciliado !== undefined)
    base.monto = formData.monto_conciliado;

  return base;
};
export const mapEventoFormToAudienceCreate = (
  formData: EventoForm
): AudienceCreate => {
  const base = mapEventoFormToAudienceBase(formData);

  const isValid = Boolean(
    formData.start &&
      formData.end &&
      formData.abogado_id &&
      formData.record_id &&
      formData.estado &&
      formData.monto_conciliado
  );

  return {
    ...(base as AudienceBase),
    is_valid: isValid,
  };
};

export const mapEventoFormToAudienceUpdate = (
  formData: Partial<EventoForm>
): AudienceUpdate => {
  return {
    ...mapEventoFormToAudienceBase(formData),
  };
};
