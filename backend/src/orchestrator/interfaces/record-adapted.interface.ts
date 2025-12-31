export interface ProceduralPartAdapted {
  name: string;
  email?: string;
  contact?: string;
}

export interface ProceduralPartsAdapted {
  plaintiff: ProceduralPartAdapted | null;
  defendant: ProceduralPartAdapted | null;
}

export interface RecordAdapted {
  _id: string;
  internalCode: string;
  office: string;
  settled: string;
  proceduralParts: ProceduralPartsAdapted;
  client: string;
}

export interface RecordAdaptedResponse {
  record: RecordAdapted;
}

export interface InternalCodeInterface {
  internalCode: string;
}
