# API para Obtener el Mayor Código Interno por Tipo de Proceso

## Descripción
Esta API permite obtener el mayor código interno (`internalCode`) para un tipo de proceso específico (`processType`).

## Endpoint
```
POST /records/max-internal-code
```

## Autenticación
- **Requerida**: Sí
- **Tipo**: Bearer Token (JWT)

## Parámetros del Body

### Request Body
```json
{
  "processType": "string"
}
```

#### Campos
| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| processType | string | Sí | Tipo de proceso para buscar el mayor código interno |

### Ejemplo de Request
```json
{
  "processType": "Ordinario"
}
```

## Respuestas

### Éxito (200) - Con registros encontrados
```json
{
  "message": "Mayor código interno encontrado para el tipo de proceso: Ordinario",
  "maxInternalCode": "INT-2025-015",
  "processType": "Ordinario"
}
```

### Éxito (200) - Sin registros encontrados
```json
{
  "message": "No se encontraron registros para el tipo de proceso: Extraordinario",
  "maxInternalCode": null,
  "processType": "Extraordinario"
}
```

### Error (400) - Bad Request
```json
{
  "statusCode": 400,
  "message": ["processType must not be empty"],
  "error": "Bad Request"
}
```

### Error (401) - Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### Error (500) - Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Error interno del servidor al buscar el mayor código interno",
  "error": "Internal Server Error"
}
```

## Ejemplo de uso con cURL

```bash
curl -X POST \
  http://localhost:3000/records/max-internal-code \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "processType": "Ordinario"
  }'
```

## Notas
- La API busca el registro con el mayor `internalCode` para el `processType` especificado
- Si no existen registros para el tipo de proceso especificado, retorna `maxInternalCode: null`
- El ordenamiento se realiza de forma descendente por el campo `internalCode`
- Solo se requiere autenticación JWT, no hay restricciones adicionales por roles
