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

// {
//   "audiences": [
//     // 1: Audiencia completamente válida
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-24T10:00:00Z",
//       "end": "2025-12-24T12:00:00Z",
//       "state": "Programada",
//       "monto": 1500,
//       "link": "https://meet.google.com/abc-defg-hij"
//     },

//     //2: MongoId inválido en 'record' (se eliminará el campo)
//     {
//       "record": "invalid-mongo-id",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-26T09:00:00Z",
//       "end": "2025-12-26T11:00:00Z",
//       "state": "Programada"
//     },

//     // 3: Falta campo requerido 'end' (is_valid = false, crea notificación)
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-27T14:00:00Z",
//       "state": "Programada",
//       "monto": 2000
//     },

//     // 4: Fecha inválida en 'start' (se eliminará el campo)
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "not-a-valid-date",
//       "end": "2025-12-28T16:00:00Z",
//       "state": "Programada"
//     },

//     // 5: Faltan múltiples campos requeridos (is_valid = false, crea notificación)
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "state": "Programada",
//       "monto": 500
//     },

//     // 6: Todos los MongoIds inválidos (se eliminan ambos)
//     {
//       "record": "123",
//       "lawyer": "abc",
//       "start": "2025-12-29T10:00:00Z",
//       "end": "2025-12-29T12:00:00Z",
//       "state": "Programada"
//     },

//     // 7: Campos opcionales válidos
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-20T08:00:00Z",
//       "end": "2025-12-20T10:00:00Z",
//       "state": "Conciliada",
//       "link": "https://zoom.us/j/123456789",
//       "monto": 3000
//     },

//     // 8: Formato de fecha alternativo válido
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-21",
//       "end": "2025-12-22",
//       "state": "Programada"
//     },

//     // 9: Solo un campo requerido presente
//     {
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "state": "Programada"
//     },

//     // 10: Mínimo viable válido
//     {
//       "record": "694621811f9fb4b60b7d5691",
//       "lawyer": "6946205b1f9fb4b60b7d5667",
//       "start": "2025-12-23T15:00:00Z",
//       "end": "2025-12-23T17:00:00Z"
//     }
//   ]
// }
