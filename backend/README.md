# QP Alliance Backend

API backend desarrollada con NestJS para el sistema QP Alliance. Esta aplicación proporciona servicios de gestión de documentos, autenticación, pagos y análisis de rendimiento.

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

## 🚀 Características

- **API RESTful** construida con NestJS
- **Autenticación JWT** con soporte para API Keys
- **Base de datos MongoDB** con Mongoose ODM
- **Documentación Swagger** integrada
- **Carga de archivos** con soporte AWS S3
- **Generación de documentos** PDF y Excel
- **Sistema de correos** con plantillas personalizadas
- **Validación robusta** de datos de entrada
- **Dockerización** completa del proyecto

## 🛠 Tecnologías

- **Framework**: NestJS 11
- **Base de Datos**: MongoDB con Mongoose
- **Autenticación**: JWT + Passport
- **Documentación**: Swagger/OpenAPI
- **Validación**: Class Validator + Class Transformer
- **Carga de Archivos**: AWS S3
- **Generación de Documentos**: XLSX, PDF
- **Correos**: Nodemailer con plantillas Pug
- **Testing**: Jest
- **Contenedores**: Docker + Docker Compose

## 📋 Prerrequisitos

- Node.js 20.x
- Docker y Docker Compose
- Yarn o NPM

## 🚀 Instalación y Configuración

### 1. Clonar el repositorio

```bash
git clone <repository-url>
cd backend
```

### 2. Instalar dependencias

```bash
yarn install
# o
npm install
```

### 3. Instalar NestJS CLI (opcional)

```bash
npm i -g @nestjs/cli
```

### 4. Configurar variables de entorno

Crear un archivo `.env` en la raíz del proyecto con las siguientes variables:

```env
# Base de datos
MONGODB_URI=

# Puerto de la aplicación
PORT=

# JWT
JWT_SECRET=
JWT_EXPIRATION=

# GCP
GCP_PROJECT_ID=
GCP_BUCKET_NAME=
GCP_CLIENT_EMAIL=
GCP_PRIVATE_KEY=

# REDIS
REDIS_HOST=
REDIS_PORT=

# Correo electrónico
SMTP_HOST=
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=

EMAIL_USER=
INVITATION_LINK=

# API Key for external endpoints (generate a new one for production)
API_KEY=

# Monolegal
MONOLEGAL_EMAIL=
MONOLEGAL_PASSWORD=

# OpenAI
OPENAI_API_KEY=
OPENAI_MODEL=

# Dapta
DAPTA_ENDPOINT=
DAPTA_API_KEY=
```

### 5. Levantar la base de datos y redis

```bash
docker-compose up -d
```

### 6. Ejecutar la aplicación

#### Desarrollo

```bash
yarn start:dev
# o
npm run start:dev
```

#### Producción

```bash
yarn build
yarn start:prod
# o
npm run build
npm run start:prod
```

## 📁 Estructura del Proyecto

```
src/
├── auth/              # Módulo de autenticación
├── common/            # Utilidades y middleware compartidos
├── config/            # Configuración de la aplicación
├── document/          # Gestión de documentos
├── intervener/        # Gestión de interventores
├── parameters/        # Parámetros del sistema
├── payment/           # Procesamiento de pagos
├── perfomance/        # Análisis de rendimiento
├── procedural-part/   # Partes procesales
├── records/           # Gestión de registros
├── scripts/           # Scripts de utilidad
├── templates/         # Plantillas de correo
├── app.controller.ts  # Controlador principal
├── app.module.ts      # Módulo principal
├── app.service.ts     # Servicio principal
└── main.ts           # Punto de entrada
```

## 🔗 Endpoints Principales

La API estará disponible en `http://localhost:4000/api`

- **Documentación Swagger**: `http://localhost:4000/api`
- **Autenticación**: `/api/auth`
- **Documentos**: `/api/documents`
- **Registros**: `/api/records`
- **Pagos**: `/api/payments`
- **Rendimiento**: `/api/performance`

### Autenticación

La API soporta dos tipos de autenticación:

1. **JWT Bearer Token**: Para usuarios autenticados

   ```
   Authorization: Bearer <jwt-token>
   ```

2. **API Key**: Para acceso externo
   ```
   x-api-key: <your-api-key>
   ```

## 🧪 Testing

```bash
# Tests unitarios
yarn test
# o
npm run test

# Tests en modo watch
yarn test:watch
# o
npm run test:watch

# Coverage
yarn test:cov
# o
npm run test:cov

# Tests e2e
yarn test:e2e
# o
npm run test:e2e
```

## 📚 Documentación Adicional

- [Autenticación con API Key](./docs/api-key-authentication.md)
- [API de Registros](./docs/get-my-records-api.md)
- [Guía de Importación](./docs/import-guide.md)
- [API de Código Interno Máximo](./docs/max-internal-code-api.md)
- [Gestión de Estado de Rendimiento](./docs/performance-state-management.md)
- [Ejemplos de Testing](./docs/test-examples-max-internal-code.md)

## 🐳 Docker

### Desarrollo con Docker

```bash
# Construir la imagen
docker build -t qp-alliance-backend .

# Ejecutar el contenedor
docker run -p 3000:3000 qp-alliance-backend
```

### Docker Compose (Recomendado)

```bash
# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

## 📝 Scripts Disponibles

- `yarn start` - Ejecutar en modo producción
- `yarn start:dev` - Ejecutar en modo desarrollo
- `yarn start:debug` - Ejecutar en modo debug
- `yarn build` - Construir para producción
- `yarn format` - Formatear código con Prettier
- `yarn lint` - Analizar código con ESLint
- `yarn test` - Ejecutar tests
- `yarn test:cov` - Ejecutar tests con coverage

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto es privado y está bajo licencia propietaria de QP Alliance.

## 📞 Soporte

Para soporte técnico o consultas sobre el proyecto, contactar al equipo de desarrollo.

---

**Nota**: Asegúrate de configurar correctamente las variables de entorno antes de ejecutar la aplicación en cualquier ambiente.
