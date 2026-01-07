import { Injectable } from '@nestjs/common';
import {
  RecordAdaptedResponse,
  RecordAdapted,
  ProceduralPartAdapted,
} from '../interfaces/record-adapted.interface';

@Injectable()
export class RecordAdapter {
  adapt(response): RecordAdaptedResponse {
    const { record } = response;

    const plaintiffs = record.proceduralParts.plaintiffs;

    const plaintiff: ProceduralPartAdapted | null =
      plaintiffs.length > 0
        ? {
            name: plaintiffs[0].name,
            email: plaintiffs[0].email,
            contact: plaintiffs[0].contact,
          }
        : null;

    const defendants = record.proceduralParts.defendants;

    const defendant: ProceduralPartAdapted | null =
      defendants.length > 0
        ? {
            name: defendants[0].name,
          }
        : null;

    const adaptedRecord: RecordAdapted = {
      _id: record._id,
      client: record.clientType,
      etiqueta: record.etiqueta,
      despachoJudicial: record.despachoJudicial,
      radicado: record.radicado,
      proceduralParts: {
        plaintiff,
        defendant,
      },
    };

    return {
      record: adaptedRecord,
    };
  }
}
