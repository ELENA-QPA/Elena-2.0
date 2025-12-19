import { AudienceInterface } from "src/audience/interfaces/audience.interfaces";
import { RecordAdapted } from "./record-adapted.interface";

export interface AudienceOrchestratorResponse {
  audience : AudienceInterface,  
  record: RecordAdapted;
}