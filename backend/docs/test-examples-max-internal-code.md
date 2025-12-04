# Ejemplos de Prueba para la API de Mayor Código Interno

## Configuración Base
- **URL Base**: `http://localhost:3000`
- **Puerto por defecto**: 3000
- **Autenticación**: JWT Bearer Token requerido

## Ejemplos de Prueba

### 1. Prueba con Postman

#### Headers
```
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

#### Request
```
POST http://localhost:3000/records/max-internal-code
```

#### Body (JSON)
```json
{
  "processType": "Ordinario"
}
```

### 2. Prueba con cURL

```bash
curl -X POST \
  http://localhost:3000/records/max-internal-code \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "processType": "Ordinario"
  }'
```

### 3. Prueba con JavaScript/Fetch

```javascript
const apiUrl = 'http://localhost:3000/records/max-internal-code';
const token = 'YOUR_JWT_TOKEN';

const requestData = {
  processType: 'Ordinario'
};

fetch(apiUrl, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(requestData)
})
.then(response => response.json())
.then(data => {
  console.log('Respuesta:', data);
})
.catch(error => {
  console.error('Error:', error);
});
```

### 4. Diferentes Casos de Prueba

#### Caso 1: Tipo de proceso existente con registros
```json
{
  "processType": "Ordinario"
}
```

**Respuesta esperada (200)**:
```json
{
  "message": "Mayor código interno encontrado para el tipo de proceso: Ordinario",
  "maxInternalCode": "ORD-2025-015",
  "processType": "Ordinario"
}
```

#### Caso 2: Tipo de proceso sin registros
```json
{
  "processType": "Extraordinario"
}
```

**Respuesta esperada (200)**:
```json
{
  "message": "No se encontraron registros para el tipo de proceso: Extraordinario",
  "maxInternalCode": null,
  "processType": "Extraordinario"
}
```

#### Caso 3: Campo vacío (Error)
```json
{
  "processType": ""
}
```

**Respuesta esperada (400)**:
```json
{
  "statusCode": 400,
  "message": ["processType must not be empty"],
  "error": "Bad Request"
}
```

#### Caso 4: Campo faltante (Error)
```json
{}
```

**Respuesta esperada (400)**:
```json
{
  "statusCode": 400,
  "message": ["processType must not be empty"],
  "error": "Bad Request"
}
```

## Notas para Testing

1. **Autenticación**: Asegúrate de tener un token JWT válido
2. **Base de datos**: La API consulta la colección de `records` en MongoDB
3. **Ordenamiento**: Los resultados se ordenan por `internalCode` de forma descendente
4. **Filtrado**: Solo busca registros que coincidan exactamente con el `processType`
5. **Respuesta**: Siempre retorna el registro con el mayor `internalCode` encontrado

## Tipos de Proceso Comunes

Algunos ejemplos de valores para `processType`:
- "Ordinario"
- "Abreviado"
- "Ejecutivo"
- "Verbal"
- "Especial"
- "Monitorio"
- "Extraordinario"

## Swagger/OpenAPI

Una vez que la aplicación esté ejecutándose, puedes acceder a la documentación interactiva en:
- **URL**: `http://localhost:3000/api`
- **Endpoint**: `POST /records/max-internal-code`
