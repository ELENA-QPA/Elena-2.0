# Sistema de Manejo de Estados para Actuaciones Judiciales

## Descripción General

Este sistema maneja los estados de las demandas (records) a través de actuaciones (performances). Cada vez que se crea una nueva actuación con un `performanceType`, se actualiza automáticamente el estado del expediente (record) y su tipo correspondiente.

## Clasificación de Estados por Tipo

### Estados ACTIVOS
- **RADICADO** - Primer estado (estado inicial)
- **INADMITIDO** - Solo después de radicado
- **SUBSANACION** - Solo después de inadmitida la demanda
- **ADMITE** - Solo después de radicado o subsanada la demanda
- **NOTIFICACION_PERSONAL** - Solo después de admitida la demanda
- **CONTESTACION_DEMANDA** - Solo después de la notificación personal
- **INADMITE_CONTESTACION** - Puede ocurrir después de contestada la demanda
- **ADMISION_CONTESTACION** - Ocurre después de la contestación o inadmisión
- **FIJA_AUDIENCIA** - Ocurre después de la admisión de la contestación

### Estados FINALIZADOS
- **CONCILIADO** - Después de fijar audiencia
- **ARCHIVADO** - En cualquier momento después de radicado
- **RETIRO_DEMANDA** - En cualquier momento después de radicado
- **FINALIZADO_SENTENCIA** - Después de fijar audiencia
- **FINALIZADO_RECHAZO** - Después de radicado o subsanación incorrecta

## Campos del Record

Cada expediente (Record) ahora tiene dos campos relacionados con el estado:

- **estado**: El estado específico actual (ej: RADICADO, ADMITE, etc.)
- **type**: El tipo de estado superior (ACTIVO o FINALIZADO)

Ambos campos se actualizan automáticamente cuando se crea una nueva actuación.

## Endpoints Principales

### Crear Actuación con Validación de Estados
```
POST /perfomance/create-with-validation
```

Crea una nueva actuación validando que la transición de estado sea válida y actualiza automáticamente el estado del expediente.

**Body:**
```json
{
  "record": "507f1f77bcf86cd799439012",
  "performanceType": "RADICADO",
  "responsible": "Juan Pérez",
  "observation": "Se radica la demanda correctamente"
}
```

### Obtener Estado Actual del Expediente
```
GET /perfomance/case/{recordId}/states/main
```

Retorna el estado actual del expediente con información adicional incluyendo el tipo:

```json
{
  "recordId": "507f1f77bcf86cd799439012",
  "currentState": "RADICADO",
  "currentType": "ACTIVO",
  "isActive": true,
  "isFinalState": false,
  "validNextStates": ["INADMITIDO", "ADMITE", "ARCHIVADO", "RETIRO_DEMANDA"],
  "lastUpdated": "2024-08-08T10:30:00.000Z",
  "stateDescription": "Primer estado - Radicación de la demanda"
}
```

### Obtener Tipo de Estado del Expediente
```
GET /perfomance/case/{recordId}/states/type
```

Retorna específicamente el tipo de estado del expediente:

```json
{
  "recordId": "507f1f77bcf86cd799439012",
  "currentState": "CONCILIADO",
  "currentType": "FINALIZADO",
  "isActive": false,
  "isFinalizado": true
}
```

### Obtener Mapeo de Estados a Tipos
```
GET /perfomance/states/types/mapping
```

Retorna el mapeo completo de todos los estados a sus tipos correspondientes.

### Obtener Estados por Tipo
```
GET /perfomance/states/types/{tipo}
```

Retorna todos los estados que pertenecen a un tipo específico (ACTIVO o FINALIZADO).

### Obtener Estadísticas de Tipos
```
GET /perfomance/states/types/statistics
```

Retorna estadísticas sobre la distribución de estados por tipo.

### Obtener Próximos Estados Válidos
```
GET /perfomance/case/{recordId}/states/next
```

Retorna los estados a los que se puede transicionar desde el estado actual.

### Validar Transición de Estado
```
GET /perfomance/case/{recordId}/states/validate/{newState}
```

Valida si se puede transicionar a un estado específico sin crear la actuación.

### Obtener Historial de Estados
```
GET /perfomance/case/{recordId}/states/history
```

Retorna el historial completo de todas las actuaciones y cambios de estado.

### Obtener Flujo Completo de Estados
```
GET /perfomance/states/flow
```

Retorna toda la información sobre estados disponibles y transiciones válidas.

## Características del Sistema

### 1. Validación Automática
- Cada nueva actuación valida automáticamente que la transición sea válida
- Se lanza excepción si se intenta una transición inválida
- Se registra auditoría de todos los cambios e intentos

### 2. Sincronización Record-Performance
- El estado del expediente (Record.estado) se actualiza automáticamente
- Las actuaciones mantienen el historial de cambios
- El estado actual siempre está en el Record para consultas rápidas

### 3. Auditoría Completa
- Logs de todos los cambios de estado
- Registro de intentos de transiciones inválidas
- Trazabilidad completa de responsables y observaciones

### 4. Estados Finales
Los siguientes estados se consideran finales:
- ARCHIVADO
- RETIRO_DEMANDA
- FINALIZADO_SENTENCIA
- FINALIZADO_RECHAZO
- CONCILIADO

### 5. Flexibilidad para Estados Especiales
- ARCHIVADO y RETIRO_DEMANDA pueden ocurrir en cualquier momento después de RADICADO
- Permite manejo de casos excepcionales manteniendo la integridad

## Ejemplo de Uso Completo

```typescript
// 1. Crear expediente (ya existente)
const recordId = "507f1f77bcf86cd799439012";

// 2. Radicar demanda (primer estado)
POST /perfomance/create-with-validation
{
  "record": recordId,
  "performanceType": "RADICADO",
  "responsible": "Secretario",
  "observation": "Demanda radicada correctamente"
}

// 3. Inadmitir demanda
POST /perfomance/create-with-validation
{
  "record": recordId,
  "performanceType": "INADMITIDO",
  "responsible": "Juez",
  "observation": "Falta documentación"
}

// 4. Subsanar demanda
POST /perfomance/create-with-validation
{
  "record": recordId,
  "performanceType": "SUBSANACION",
  "responsible": "Demandante",
  "observation": "Se subsana con documentos faltantes"
}

// 5. Admitir demanda
POST /perfomance/create-with-validation
{
  "record": recordId,
  "performanceType": "ADMITE",
  "responsible": "Juez",
  "observation": "Demanda admitida después de subsanación"
}
```

## Manejo de Errores

El sistema maneja varios tipos de errores:

### Transición Inválida (400)
```json
{
  "statusCode": 400,
  "message": "Transición de estado inválida. Estado actual: [RADICADO]. Estado solicitado: CONTESTACION_DEMANDA. Estados válidos: [INADMITIDO, ADMITE, ARCHIVADO, RETIRO_DEMANDA]"
}
```

### Expediente No Encontrado (404)
```json
{
  "statusCode": 404,
  "message": "Expediente con ID 507f1f77bcf86cd799439012 no encontrado"
}
```

## Consideraciones Técnicas

1. **Performance**: El estado actual se consulta directamente del Record, no requiere JOIN con actuaciones
2. **Consistencia**: Transacciones aseguran que Record y Performance se actualicen juntos
3. **Escalabilidad**: Los índices en `record` y `performanceType` optimizan las consultas
4. **Auditoría**: Sistema de logs robusto para cumplimiento legal

## Próximas Funcionalidades

- Dashboard de métricas de estados
- Notificaciones automáticas en cambios de estado
- Integración con sistema de plazos y vencimientos
- Reportes automáticos por estado
