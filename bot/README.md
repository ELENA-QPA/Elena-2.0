# Bot ELENA - WP Alliance

Bot de consulta de procesos legales desarrollado con BuilderBot para WhatsApp, integrado con la API real de QP Alliance.

## 🎯 Objetivo

ELENA es un bot inteligente que permite a los clientes consultar sus procesos legales de manera rápida y eficiente a través de WhatsApp, conectándose directamente con la base de datos de QP Alliance. Además, facilita el inicio de nuevos procesos legales y la comunicación directa con abogados especializados.

## 🚀 Funcionalidades

### Flujo Conversacional Principal

1. **Bienvenida y Autorización**: El bot saluda, presenta opciones principales y solicita autorización de datos personales
2. **Consulta de Procesos Existentes**: Busca procesos activos y finalizados por documento usando la API real
3. **Inicio de Nuevos Procesos**: Guía al usuario para iniciar procesos según su perfil (Rappitendero, Empresa, Otro)
4. **Comunicación Directa**: Conecta con abogados especializados
5. **Selección de Tipo**: Permite elegir entre procesos activos, finalizados o resumen PDF
6. **Detalles de Proceso**: Muestra información detallada y actualizada de un proceso específico
7. **Generación de PDFs**: Crea y envía PDFs dinámicos con información completa
8. **Consulta Adicional**: Permite consultar otros procesos o finalizar la sesión

### Guión de Conversación Actualizado

```
Cliente: Hola
ELENA: 👋 ¡Hola! Bienvenido/a a ELENA – WP Alliance, tu asistente legal virtual.
       Antes de continuar, cuéntame:
       1️⃣ ¿Tienes actualmente un proceso con nosotros?
       2️⃣ ¿Quieres iniciar un proceso con nosotros?
       3️⃣ ¿Prefieres hablar directamente con un abogado?

Cliente: 1
ELENA: Antes de continuar, queremos contarte que de conformidad con la Ley 1581 de 2012...
       ¿Aceptas el tratamiento de tus datos personales conforme a nuestra política de privacidad?
       👉 Responde:
       1️⃣ Sí, acepto
       2️⃣ No acepto

Cliente: 1
ELENA: ✅ ¡Perfecto! Gracias por aceptar nuestra política de privacidad.
       Ahora continuemos con tu solicitud...
       Con gusto. Para consultar, por favor indícame el tipo de documento de identificación:
       1️⃣ Cédula de Ciudadanía
       2️⃣ Permiso Especial de Permanencia
       3️⃣ Permiso de protección temporal
       4️⃣ NIT
       5️⃣ Pasaporte
       6️⃣ Cédula de extranjería

Cliente: 1
ELENA: ¡Perfecto! Para brindarte la información que requieres, indícame tu número de identificación.
       (sin puntos, comas, ni guiones)

Cliente: 12345678
ELENA: 🔍 Consultando tus procesos...
       ✅ Encontré 9 procesos asociados a tu identificación 12345678. Elige una opción:
       1️⃣ Ver procesos activos
       2️⃣ Ver procesos finalizados
       3️⃣ Recibir un resumen en PDF

Cliente: 1
ELENA: 📂 Procesos activos:
       1. Proceso #U003
          • Estado: ADMITE
          • Última actualización: 27/08/2025
       2. Proceso #D002
          • Estado: RADICADO
          • Última actualización: 28/08/2025
       
       Responde con el número de radicado para ver detalles o escribe MENÚ para regresar.

Cliente: 1
ELENA: 🔍 Obteniendo detalles del proceso...
       📄 Proceso #U003
       • Estado: ADMITE
       • Jurisdicción: CIVIL CIRCUITO
       • Tipo: Proceso Verbal
       • Demandantes: Juan Pérez
       • Demandados: Empresa S.A.
       • Última actualización: 27/08/2025
       
       ¿Quieres recibir el PDF de este proceso?
       1️⃣ Sí
       2️⃣ No

Cliente: 1
ELENA: 📄 Generando el reporte personalizado...
       📄 Aquí tienes el reporte personalizado del proceso #U003:
       [PDF adjunto]
       
       ¿Quieres consultar otro proceso?
       1️⃣ Sí, consultar otro
       2️⃣ No, terminar

Cliente: 2
ELENA: ¡Gracias por usar ELENA - WP Alliance! 👋
```

## 🏗️ Arquitectura Técnica

### Estructura del Proyecto

```
src/
├── config/
│   └── env.ts                   # Configuración de variables de entorno
├── interfaces/
│   ├── legal.ts                 # Interfaces TypeScript para datos legales
│   └── errors.ts               # Interfaces para manejo de errores
├── services/
│   ├── http/
│   │   └── http-client.ts       # Cliente HTTP con autenticación API
│   ├── legal/
│   │   ├── adapters.ts          # Transformadores de datos API → Dominio
│   │   ├── legal-api.service.ts # Servicios de API QP Alliance
│   │   └── index.ts             # Exportaciones de servicios
│   ├── middlewares/
│   │   ├── delete-file.middleware.ts    # Middleware para eliminar archivos
│   │   ├── list-files.middleware.ts     # Middleware para listar archivos
│   │   ├── logs-api.middleware.ts       # Middleware para logs de API
│   │   ├── logs.middleware.ts           # Middleware para logs generales
│   │   ├── qr-code.middleware.ts        # Middleware para código QR
│   │   ├── server-info.middleware.ts    # Middleware para información del servidor
│   │   ├── static-files.middleware.ts  # Middleware para archivos estáticos
│   │   └── index.ts                     # Exportaciones de middlewares
│   ├── pdf-generator.service.ts # Servicio de generación de PDFs
│   ├── static-server.service.ts # Servicio de archivos estáticos
│   └── logger.service.ts        # Servicio de logging
├── flows/
│   ├── hello.flow.ts                    # Flujo de bienvenida y autorización
│   ├── new-process.flow.ts              # Flujo para iniciar nuevos procesos
│   ├── legal-document-handler.flow.ts    # Manejo de documentos y tipos
│   ├── legal-process-selection.flow.ts  # Selección de tipo de procesos
│   ├── legal-process-details.flow.ts    # Detalles de proceso específico
│   ├── legal-finalized-processes.flow.ts # Manejo de procesos finalizados
│   ├── legal-pdf-confirmation.flow.ts   # Confirmación y envío de PDF individual
│   ├── legal-pdf-summary.flow.ts        # Generación de resumen PDF de todos los procesos
│   ├── legal-process-confirmation.flow.ts # Confirmación final de consultas
│   └── index.ts                         # Exportaciones de flujos
├── utils/
│   ├── file-utils.ts            # Utilidades para manejo de archivos
│   ├── message-utils.ts         # Utilidades para generación de mensajes
│   ├── presence.ts              # Utilidades de presencia
│   ├── template-helpers.ts      # Helpers para templates Handlebars
│   └── index.ts                 # Exportaciones de utilidades
├── templates/
│   └── process-report.hbs       # Template principal para reportes de proceso
└── app.ts                       # Configuración principal del bot
```

### Tecnologías Utilizadas

- **Framework**: BuilderBot v1.2.9
- **Proveedor**: BaileysProvider para WhatsApp
- **Base de Datos**: MemoryDB (en memoria)
- **Lenguaje**: TypeScript
- **API Externa**: QP Alliance
- **Generación de PDFs**: Puppeteer + Handlebars
- **Gestión de Estado**: Persistente por usuario con flujos conversacionales
- **Autenticación**: API Key para acceso a servicios externos
- **Servidor HTTP**: Polka (integrado con BuilderBot)
- **Archivos Estáticos**: Servicio personalizado para PDFs y assets

## 📦 Instalación y Configuración

### Requisitos Previos

- Node.js >= 20
- pnpm (recomendado) o npm
- API Key de QP Alliance (opcional para desarrollo)

## 🚀 Despliegue en Dokploy

### Configuración de Dokploy

Para desplegar el bot en Dokploy, configura los siguientes parámetros:

#### **Build Type**
- Selecciona: **Dockerfile**

#### **Docker File**
- Valor: `Dockerfile`

#### **Docker Context Path**
- Valor: `.` (punto - directorio actual)

#### **Docker Build Stage**
- Valor: `deploy` ⚠️ **Importante**: Debe coincidir con el stage final del Dockerfile

#### **Variables de Entorno**
Configura las siguientes variables en Dokploy:

```env
# API QP Alliance (REQUERIDO para producción)
API_BASE_URL=https://tu-backend-url.com/api
API_KEY=tu-api-key-real-aqui

# Configuración del bot
PORT=3008
NODE_ENV=production

# Configuración de Puppeteer para Docker
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
DOCKER=true
```

### ⚠️ Solución de Problemas Comunes

#### **Error: "target stage could not be found"**
- **Problema**: El Docker Build Stage no coincide con el Dockerfile
- **Solución**: Verifica que el Dockerfile tenga un stage llamado `deploy`
- **Configuración**: Docker Build Stage = `deploy`

#### **Error: "FromAsCasing warnings"**
- **Problema**: Casing inconsistente en el Dockerfile
- **Solución**: Usar `AS` en mayúsculas en lugar de `as`

#### **Error de permisos o acceso**
- **Problema**: API_KEY no configurada o incorrecta
- **Solución**: Verificar que las variables de entorno estén correctamente configuradas

#### **Error: "Template no encontrado"**
- **Problema**: El template Handlebars no se encuentra en el contenedor
- **Solución**: Verificar que el Dockerfile incluya la copia de templates: `COPY --from=builder /app/src/templates ./templates`
- **Verificación**: El template debe estar en `/app/templates/process-report.hbs` dentro del contenedor

### 🔧 Configuración Recomendada

```
Build Type: Dockerfile
Docker File: Dockerfile
Docker Context Path: .
Docker Build Stage: deploy
Port: 3008
Environment: production
```

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd qpalliance

# Instalar dependencias
pnpm install

# Compilar el proyecto
pnpm run build

# Ejecutar en modo desarrollo
pnpm run dev

# Ejecutar en modo producción
pnpm run start
```

### Variables de Entorno

Crear archivo `.env` en la raíz del proyecto:

```env
# Configuración de la API QP Alliance
API_BASE_URL=https://tu-backend-url.com/api
API_KEY=tu-api-key-real-aqui

# Configuración del bot
PORT=3008
NODE_ENV=development
```

### Modos de Operación

#### 🔧 Modo Desarrollo (Mock)
- **Sin API_KEY configurada**: El bot usa datos mock para desarrollo
- **Datos simulados**: Procesos de prueba con delays realistas
- **Ideal para**: Desarrollo y testing sin acceso a la API real

#### 🚀 Modo Producción (API Real)
- **Con API_KEY configurada**: El bot se conecta a la API real de QP Alliance
- **Datos reales**: Procesos actuales de la base de datos
- **Ideal para**: Entorno de producción con datos reales

## 🔧 Comandos de Desarrollo

```bash
# Desarrollo con hot reload
pnpm run dev

# Compilar TypeScript
pnpm run build

# Ejecutar en producción
pnpm run start

# Linting
pnpm run lint
```

## 📄 Generación de PDFs Dinámicos

### Tecnologías Utilizadas
- **Puppeteer**: Generación de PDFs desde HTML
- **Handlebars**: Sistema de templates con helpers personalizados
- **Docker Optimizado**: Chromium nativo para mejor rendimiento

### Características
- **PDFs Personalizados**: Cada PDF incluye datos específicos del proceso
- **PDFs de Resumen**: Generación de PDFs con todos los procesos del cliente
- **Templates Flexibles**: Sistema de templates con helpers de formateo
- **Optimización Docker**: Configuración con Chromium nativo
- **Manejo de Errores**: Fallback robusto en caso de errores de generación
- **Eliminación Automática**: Los PDFs se eliminan automáticamente después del envío

### Variables de Entorno para Puppeteer

```env
# Configuración de Puppeteer para Docker
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
DOCKER=true
```

### Estructura de Templates

```
src/templates/
└── process-report.hbs    # Template principal para reportes de proceso
```

**Nota**: Los templates se copian automáticamente al contenedor Docker durante el build.

### Helpers Disponibles

- `formatDate`: Formatea fechas ISO a formato DD/MM/YYYY
- `formatProcessList`: Formatea listas de procesos con índices
- Extensible para más helpers según necesidades

### Servicios de PDF

- **`pdfGeneratorService`**: Servicio principal para generación de PDFs
- **`generateProcessReport`**: Genera PDFs individuales o de resumen
- **`deletePdf`**: Elimina PDFs del servidor automáticamente

## 🔌 Integración con API QP Alliance

### API 1 - Consulta de Procesos por Documento

**Endpoint**: `POST {API_BASE_URL}/records/by-client`

**Headers**:
```
accept: */*
x-api-key: tu-api-key
Content-Type: application/json
```

**Request**:
```json
{
  "document": "12345678"
}
```

**Response**:
```json
{
  "message": "Casos obtenidos exitosamente",
  "active": [
    { 
      "internalCode": "U003",
      "state": "ADMITE",
      "updatedAt": "2025-08-27T18:16:23.272Z"
    },
    { 
      "internalCode": "D002",
      "state": "RADICADO",
      "updatedAt": "2025-08-28T05:27:14.661Z"
    }
  ],
  "finalized": [
    { 
      "internalCode": "D009",
      "state": "ARCHIVADO",
      "updatedAt": "2025-09-05T17:10:59.243Z"
    }
  ],
  "totalActive": 9,
  "totalFinalized": 1,
  "totalRecords": 10
}
```

### API 2 - Detalles de Proceso por Código Interno

**Endpoint**: `POST {API_BASE_URL}/records/by-internal-code`

**Headers**:
```
accept: */*
x-api-key: tu-api-key
Content-Type: application/json
```

**Request**:
```json
{
  "internalCode": "U003"
}
```

**Response**:
```json
{
  "message": "Caso obtenido exitosamente",
  "record": {
    "_id": "689f48a812c4effbc9db88dd",
    "jurisdiction": "CIVIL CIRCUITO",
    "processType": "Proceso Verbal",
    "settled": "NO",
    "proceduralParts": {
      "plaintiffs": [
        {
          "name": "Juan Pérez",
          "document": "12345678",
          "documentType": "CC"
        }
      ],
      "defendants": [
        { "name": "Empresa S.A." }
      ]
    },
    "performances": [
      {
        "_id": "689f48a812c4effbc9db88eb",
        "record": "689f48a812c4effbc9db88dd",
        "performanceType": "RADICADO",
        "responsible": "Juan Pérez",
        "observation": "Radicación de demanda",
        "createdAt": "2025-08-15T14:48:08.689Z",
        "updatedAt": "2025-09-02T13:22:06.227Z",
        "document": null
      }
    ]
  }
}
```

### API 3 - Todos los Casos con Detalles (En Desarrollo)

**Endpoint**: `POST {API_BASE_URL}/records/all-cases-with-details`

**Headers**:
```
accept: */*
x-api-key: tu-api-key
Content-Type: application/json
```

**Request**:
```json
{
  "document": "12345678"
}
```

**Response**:
```json
{
  "message": "Casos obtenidos exitosamente",
  "active": [
    {
      "_id": "689f48a812c4effbc9db88dd",
      "internalCode": "U003",
      "jurisdiction": "CIVIL CIRCUITO",
      "processType": "Proceso Verbal",
      "settled": "NO",
      "proceduralParts": {
        "plaintiffs": [{ "name": "Juan Pérez" }],
        "defendants": [{ "name": "Empresa S.A." }]
      },
      "performances": [...]
    }
  ],
  "finalized": [
    {
      "_id": "68b83576dac75187caa00af8",
      "internalCode": "D009",
      "jurisdiction": "LABORAL CIRCUITO",
      "processType": "Proceso Ejecutivo",
      "settled": "11111111111111111",
      "proceduralParts": {
        "plaintiffs": [
          { "name": "Juan Pérez" },
          { "name": "Michelle Ojeda" }
        ],
        "defendants": [
          { "name": "Empresa S.A." },
          { "name": "Empresa S.A." }
        ]
      },
      "performances": [...]
    }
  ]
}
```

### 🔄 Modo Mock (Desarrollo)

Cuando no se configura `API_KEY`, el bot usa datos mock para desarrollo y testing, simulando las mismas estructuras de respuesta de la API real.

## 🎮 Uso del Bot

### Flujo Principal de Consulta
1. **Iniciar conversación**: Envía "hola", "inicio" o "menú"
2. **Autorización de datos**: Acepta el tratamiento de datos personales
3. **Seleccionar tipo de documento**: Elige entre 6 tipos de documentos disponibles
4. **Proporcionar documento**: Envía tu número de identificación (6-15 dígitos)
5. **Seleccionar tipo de consulta**: Elige entre procesos activos, finalizados o resumen PDF
6. **Ver detalles**: Selecciona el número del proceso que te interesa
7. **Recibir PDF**: Confirma con "sí" para recibir el documento
8. **Consulta adicional**: Elige si quieres consultar otro proceso o terminar

### Flujo de Nuevo Proceso
1. **Seleccionar opción**: Elige "¿Quieres iniciar un proceso con nosotros?"
2. **Autorización de datos**: Acepta el tratamiento de datos personales
3. **Seleccionar perfil**: Elige entre Rappitendero, Empresa u Otro perfil
4. **Completar formulario**: Accede al formulario específico según tu perfil
5. **Contacto con abogado**: Un abogado se pondrá en contacto contigo

### Flujo de Comunicación Directa
1. **Seleccionar opción**: Elige "¿Prefieres hablar directamente con un abogado?"
2. **Autorización de datos**: Acepta el tratamiento de datos personales
3. **Contacto directo**: Un abogado se pondrá en contacto contigo en 24 horas

## 🔄 Flujos de Navegación

- **Menú principal**: Escribe "MENÚ" en cualquier momento para regresar
- **Validación de entrada**: El bot valida números de documento (6-15 dígitos)
- **Navegación**: Usa números para seleccionar opciones
- **Flexibilidad**: Acepta tanto números ("1", "2") como texto ("sí", "no")
- **Manejo de errores**: Usa `fallBack()` para reintentos automáticos

## 🔄 Flujos de Navegación

- **Menú principal**: Escribe "MENÚ" en cualquier momento para regresar
- **Validación de entrada**: El bot valida números de documento (6-15 dígitos)
- **Tipos de documento**: Soporte para 6 tipos diferentes de identificación
- **Navegación**: Usa números para seleccionar opciones
- **Flexibilidad**: Acepta tanto números ("1", "2") como texto ("sí", "no")
- **Manejo de errores**: Usa `fallBack()` para reintentos automáticos
- **Estados persistentes**: Mantiene contexto entre flujos conversacionales
- **Autorización de datos**: Cumple con Ley 1581 de 2012 para tratamiento de datos personales

## 🚀 Características Implementadas

### ✅ Completado
- **Integración API Real**: Conexión directa con QP Alliance
- **Datos Dinámicos**: Estado real basado en `performanceType` y `updatedAt`
- **Información Completa**: Jurisdicción, tipo, demandantes, demandados, actuaciones
- **Generación de PDFs**: PDFs dinámicos individuales y de resumen
- **Templates Personalizables**: Sistema de templates con helpers de formateo
- **Docker Optimizado**: Configuración con Chromium nativo
- **Logs Detallados**: Sistema de logging con emojis de colores
- **Manejo de Errores**: Try-catch en todas las llamadas API
- **Validación Robusta**: Números de documento y opciones de usuario
- **Estado Persistente**: Contexto mantenido entre flujos conversacionales
- **Autorización de Datos**: Cumplimiento con Ley 1581 de 2012
- **Múltiples Tipos de Documento**: Soporte para 6 tipos diferentes
- **Flujos Especializados**: Nuevos procesos, comunicación directa
- **Generador de Mensajes**: Utilidades para mensajes consistentes
- **Servicios de Archivos**: Manejo de archivos estáticos y PDFs
- **Middlewares Especializados**: QR, logs, archivos, información del servidor

### 🔄 En Desarrollo
- **API de Resumen Completo**: Endpoint para obtener todos los casos con detalles
- **Mejora de Templates**: Diseño más avanzado para PDFs
- **Testing**: Tests unitarios y de integración
- **Optimización de Performance**: Mejoras en generación de PDFs

## 📝 Notas de Desarrollo

- **Arquitectura Modular**: Separación clara entre servicios, adaptadores y flujos
- **TypeScript**: Tipado completo para mayor seguridad
- **Factory Pattern**: Cambio automático entre API real y mock
- **BuilderBot v1.2.9**: Compatible con la versión más reciente
- **Estado Conversacional**: Flujos basados en estados, no en palabras clave
- **Logs Estructurados**: Sistema de logging con prefijos de colores para debugging
- **Generador de Mensajes**: Utilidades centralizadas para mensajes consistentes
- **Cumplimiento Legal**: Implementación de autorización de datos según Ley 1581 de 2012
- **Servicios Especializados**: PDFs, archivos estáticos, middlewares personalizados
- **Manejo de Errores**: Sistema robusto con fallbacks y reintentos automáticos