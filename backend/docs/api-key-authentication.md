# API Key Authentication

Este documento explica cómo usar la autenticación con API Key para los endpoints específicos de consulta externa.

## Endpoints Protegidos

Los siguientes endpoints requieren autenticación con API Key:

- `POST /api/records/by-client` - Obtener estado de casos por número de documento del cliente
- `POST /api/records/by-internal-code` - Obtener caso por código interno

## Configuración

### 1. Variable de Entorno

La API Key se configura mediante la variable de entorno `API_KEY` en el archivo `.env`:

```bash
API_KEY=qp-alliance-secure-api-key-2025-a7b8c9d0e1f2g3h4i5j6k7l8m9n0
```

### 2. Headers Requeridos

Para acceder a los endpoints protegidos, incluye uno de estos headers en tu request:

```bash
x-api-key: tu-api-key-aqui
# o alternativamente
api-key: tu-api-key-aqui
```

## Uso en Clientes

### cURL Example

```bash
curl -X POST "http://localhost:3002/api/records/by-client" \
  -H "Content-Type: application/json" \
  -H "x-api-key: qp-alliance-secure-api-key-2025-a7b8c9d0e1f2g3h4i5j6k7l8m9n0" \
  -d '{
    "document": "12345678"
  }'
```

### JavaScript/Fetch Example

```javascript
const response = await fetch('http://localhost:3002/api/records/by-client', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': 'qp-alliance-secure-api-key-2025-a7b8c9d0e1f2g3h4i5j6k7l8m9n0'
  },
  body: JSON.stringify({
    document: '12345678'
  })
});
```

### Postman

1. En la pestaña Headers, agrega:
   - Key: `x-api-key`
   - Value: `qp-alliance-secure-api-key-2025-a7b8c9d0e1f2g3h4i5j6k7l8m9n0`

## Respuestas de Error

### 401 - API Key Missing
```json
{
  "statusCode": 401,
  "message": "API Key is required",
  "error": "Unauthorized"
}
```

### 401 - Invalid API Key
```json
{
  "statusCode": 401,
  "message": "Invalid API Key", 
  "error": "Unauthorized"
}
```

## Swagger Documentation

Los endpoints protegidos aparecerán en Swagger con un candado 🔒 y requerirán que ingreses la API Key antes de poder probarlos.

## Seguridad

- **NUNCA** compartas la API Key en código público o repositorios
- Cambia la API Key regularmente en producción  
- Usa HTTPS en producción para proteger la API Key en tránsito
- Considera implementar rotación automática de API Keys para mayor seguridad