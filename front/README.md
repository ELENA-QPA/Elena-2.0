# QP Alliance - Sistema de Gestión Legal

<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15.2.1-black?style=for-the-badge&logo=next.js&logoColor=white" alt="Next.js"/>
  <img src="https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React"/>
  <img src="https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4.1-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS"/>
</div>

## 📋 Descripción

**QP Alliance** es una plataforma web moderna desarrollada con Next.js para la gestión integral de procesos judiciales y expedientes legales. El sistema está diseñado para firmas de abogados y profesionales del derecho que requieren una herramienta robusta para administrar casos, clientes, equipos de trabajo y generar estadísticas detalladas.

## ✨ Características Principales

### 🗂️ **Gestión de Expedientes**
- **Creación y edición** de expedientes judiciales completos
- **Sistema de búsqueda avanzada** con múltiples filtros
- **Paginación progresiva** para manejo eficiente de grandes volúmenes de datos
- **Gestión de documentos** y archivos adjuntos
- **Seguimiento de estados** del proceso judicial
- **Códigos internos** personalizables para organización

### 👥 **Administración de Equipos**
- **Sistema de roles** multinivel (Administrador, Asistente Legal, Analistas I/II/III)
- **Invitación de usuarios** por correo electrónico
- **Gestión de permisos** basada en roles
- **Administración de grupos de trabajo**

### 📊 **Panel de Estadísticas**
- **Métricas en tiempo real** de expedientes
- **Gráficos interactivos** con Recharts y ApexCharts
- **Análisis de rendimiento** del equipo

### 🔐 **Autenticación y Seguridad**
- **Autenticación JWT** con middleware personalizado
- **Protección de rutas** basada en roles
- **Cookies HttpOnly** para mayor seguridad
- **Verificación por código de activación**
- **Recuperación de contraseña** segura

### 🎨 **Interfaz de Usuario**
- **Diseño responsive** adaptable a todos los dispositivos
- **Componentes reutilizables** con shadcn/ui y Radix UI
- **Tema personalizado** con colores corporativos
- **Modo oscuro** disponible
- **Experiencia de usuario optimizada**

## 🛠️ Tecnologías Utilizadas

### **Frontend**
- **Next.js 15.2.1** - Framework de React con SSR/SSG
- **React 18** - Biblioteca de interfaz de usuario
- **TypeScript 5** - Tipado estático
- **Tailwind CSS 3.4.1** - Framework de CSS utilitario
- **Radix UI** - Componentes de UI accesibles
- **Lucide React** - Iconos modernos

### **Gestión de Estado**
- **Zustand 5.0** - Gestión de estado ligera
- **React Hook Form 7.53** - Manejo de formularios
- **Zod 3.23** - Validación de esquemas

### **Visualización de Datos**
- **Recharts 2.15** - Gráficos y visualizaciones
- **ApexCharts 4.4** - Gráficos interactivos avanzados
- **Tremor React 3.18** - Componentes de dashboard

### **Utilidades**
- **Axios 1.7.7** - Cliente HTTP
- **Date-fns 4.1** - Manipulación de fechas
- **Lodash 4.17** - Utilidades de JavaScript
- **XLSX 0.18.5** - Exportación a Excel
- **Inversify 6.0** - Inyección de dependencias

### **UI/UX**
- **Sonner 1.5** - Notificaciones toast
- **React Hot Toast 2.5** - Sistema de notificaciones
- **Vaul 1.1** - Componentes de modal
- **Next Themes 0.3** - Soporte para temas

## 🚀 Instalación y Configuración

### **Prerrequisitos**
- Node.js 18.0 o superior
- npm, yarn o pnpm
- Git

### **Instalación**

1. **Clonar el repositorio**
```bash
git clone https://github.com/qpalliance/front.git
cd front
```

2. **Instalar dependencias**
```bash
npm install
# o
yarn install
# o
pnpm install
```

3. **Configurar variables de entorno**
```bash
# Crear archivo .env.local
cp .env.example .env.local
```

4. **Variables de entorno necesarias**
```env
NEXT_PUBLIC_API_URL=https://tu-api-backend.com
NEXT_PUBLIC_API_BASE_URL=https://tu-api-backend.com
NODE_ENV=development
```

5. **Ejecutar en desarrollo**
```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

6. **Abrir en navegador**
```
http://localhost:3000
```

## 📁 Estructura del Proyecto

```
src/
├── app/                    # App Router de Next.js 15
│   ├── (auth)/            # Grupo de rutas de autenticación
│   ├── dashboard/         # Panel principal
│   └── globals.css        # Estilos globales
├── components/            # Componentes reutilizables
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── expedientes/      # Componentes específicos de expedientes
│   └── modales/          # Componentes de modales
├── config/               # Configuraciones
│   ├── protocols/        # Configuración HTTP y APIs
│   └── routes/           # Definición de rutas
├── contexts/             # Contextos de React
├── data/                 # Interfaces y adaptadores
├── hooks/                # Hooks personalizados
├── lib/                  # Utilidades y configuraciones
├── modules/              # Módulos de negocio
│   ├── auth/             # Autenticación
│   ├── expedientes/      # Gestión de expedientes
│   ├── equipo/           # Administración de equipos
│   └── estadisticas/     # Módulo de estadísticas
├── types/                # Definiciones de tipos TypeScript
├── utilities/            # Funciones de utilidad
└── views/                # Componentes de vista principales
```

## 🎯 Funcionalidades por Módulo

### **Módulo de Autenticación**
- ✅ Login/Logout con JWT
- ✅ Registro de usuarios
- ✅ Recuperación de contraseña
- ✅ Confirmación de cuenta
- ✅ Invitación de usuarios
- ✅ Registro por invitación
- ✅ Códigos de activación

### **Módulo de Expedientes**
- ✅ CRUD completo de expedientes
- ✅ Búsqueda y filtrado avanzado
- ✅ Paginación progresiva
- ✅ Gestión de documentos
- ✅ Partes procesales e intervinientes
- ✅ Seguimiento de estados
- ✅ Exportación de datos

### **Módulo de Equipo**
- ✅ Gestión de usuarios
- ✅ Asignación de roles
- ✅ Invitación por correo
- ✅ Administración de permisos
- ✅ Grupos de trabajo

### **Módulo de Estadísticas**
- ✅ Dashboard con métricas
- ✅ Gráficos interactivos
- ✅ Reportes exportables
- ✅ Análisis de tendencias
- ✅ Filtros por fecha y tipo

## 🔐 Sistema de Roles y Permisos

| Rol | Permisos |
|-----|----------|
| **Administrador** | Acceso completo al sistema, gestión de usuarios, configuración |
| **Asistente Legal** | Gestión de expedientes, acceso a estadísticas |
| **Analista Legal I** | Consulta de expedientes, creación limitada |
| **Analista Legal II** | Consulta y edición de expedientes |
| **Analista Legal III** | Consulta y edición avanzada de expedientes |

## 🌐 API y Endpoints

### **Autenticación**
- `POST /api/auth/login` - Iniciar sesión
- `POST /api/auth/register` - Registrar usuario
- `POST /api/auth/forgotPassword` - Recuperar contraseña
- `GET /api/auth/me` - Obtener perfil del usuario

### **Expedientes**
- `GET /api/records` - Listar expedientes
- `POST /api/records/create` - Crear expediente
- `PUT /api/records/:id` - Actualizar expediente
- `DELETE /api/records/:id` - Eliminar expediente

### **Equipo**
- `GET /api/auth/my-group` - Obtener equipo
- `POST /api/auth/inviteUser` - Invitar usuario
- `GET /api/auth/byRol` - Usuarios por rol

## 🚀 Scripts Disponibles

```bash
# Desarrollo
npm run dev          # Iniciar servidor de desarrollo

# Producción
npm run build        # Construir aplicación para producción
npm run start        # Iniciar servidor de producción

# Calidad de código
npm run lint         # Ejecutar ESLint
```

## 📱 Responsive Design

La aplicación está completamente optimizada para:
- 📱 **Móviles** (320px - 768px)
- 📟 **Tablets** (768px - 1024px)
- 🖥️ **Desktop** (1024px+)
- 🖱️ **Interfaces táctiles**

## 🎨 Sistema de Diseño

### **Paleta de Colores**
```css
/* Colores principales del tema Elena */
--elena-pink: #ec4899    /* Rosa principal */
--elena-purple: #a855f7  /* Morado corporativo */
--elena-orange: #f97316  /* Naranja de acento */

/* Colores del sistema */
--primary: hsl(var(--primary))
--secondary: hsl(var(--secondary))
--background: hsl(var(--background))
```

### **Tipografía**
- **Font Family**: System fonts (Inter, sans-serif)
- **Escalas**: text-xs, text-sm, text-base, text-lg, text-xl, text-2xl, text-3xl

## 🔧 Configuración Avanzada

### **Middleware de Autenticación**
El sistema incluye un middleware personalizado que:
- ✅ Valida tokens JWT en cada request
- ✅ Gestiona cookies de sesión
- ✅ Controla acceso por roles
- ✅ Redirige rutas protegidas

### **Inyección de Dependencias**
Utiliza **Inversify** para:
- 🏗️ Arquitectura limpia y modular
- 🔄 Inversión de dependencias
- 🧪 Facilita testing unitario
- 📦 Gestión de servicios

## 🧪 Testing

```bash
# Ejecutar tests (cuando estén configurados)
npm run test

# Tests en modo watch
npm run test:watch

# Coverage de tests
npm run test:coverage
```

## 📈 Performance

### **Optimizaciones Implementadas**
- ⚡ **Server-Side Rendering** (SSR) con Next.js
- 🎯 **Lazy Loading** de componentes
- 📦 **Code Splitting** automático
- 🗜️ **Compresión de assets**
- 📱 **Progressive Web App** ready

### **Métricas de Rendimiento**
- ⚡ First Contentful Paint < 1.5s
- 🎯 Largest Contentful Paint < 2.5s
- 📊 Cumulative Layout Shift < 0.1

## 🛡️ Seguridad

### **Medidas de Seguridad Implementadas**
- 🔐 **Autenticación JWT** con refresh tokens
- 🍪 **Cookies HttpOnly** para prevenir XSS
- 🛡️ **Validación de entrada** con Zod
- 🔒 **Middleware de protección** de rutas
- 🚫 **Sanitización** de datos de usuario

## 📚 Documentación Adicional

### **Guías de Desarrollo**
- [Guía de Contribución](CONTRIBUTING.md)
- [Estándares de Código](CODE_STANDARDS.md)
- [Documentación de API](API_DOCS.md)

### **Arquitectura**
- [Arquitectura del Sistema](ARCHITECTURE.md)
- [Patrones de Diseño](DESIGN_PATTERNS.md)
- [Base de Datos](DATABASE.md)

## 🤝 Contribución

1. **Fork** el proyecto
2. **Crear** una rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** los cambios (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. **Abrir** un Pull Request

### **Convenciones de Commit**
```bash
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización de código
test: agregar o modificar tests
chore: tareas de mantenimiento
```
- **shadcn/ui** por los componentes base
- **Radix UI** por los primitivos accesibles
- **Vercel** por la plataforma de deployment
- **Tailwind CSS** por el sistema de diseño

---

<div align="center">
  <p>© 2024 QP Alliance. Todos los derechos reservados.</p>
</div>