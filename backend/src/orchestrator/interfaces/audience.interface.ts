import { AudiencePopulated } from 'src/audience/interfaces/audience.interfaces';
import { RecordAdapted } from './record-adapted.interface';

export interface AudienceOrchestratorResponse {
  audience: AudiencePopulated;
  record: RecordAdapted;
}

export interface BulkCreateResult {
  success: number;
  failed: number;
  notifications_created: number;
}

export interface FieldValidationResult {
  toDelete: string[];
  messages: string[];
}

export interface ExtractDateResponse {
  start: string | null;
  end: string | null;
}
