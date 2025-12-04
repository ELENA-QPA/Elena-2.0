# Módulo de Estadísticas

## Descripción
Módulo completo para manejo de estadísticas legales que proporciona datos sobre procesos activos/inactivos, demandas, audiencias y análisis por estado.

## Arquitectura
El módulo sigue la arquitectura estándar del proyecto:
- **Interfaces**: Definición de tipos y contratos API
- **Adapters**: Mapeo de respuestas de API
- **Repositories**: Lógica de comunicación con el backend
- **Hooks**: Estado y lógica de negocio para componentes

## Endpoints Implementados

### 1. Procesos Activos/Inactivos por Mes
- **Endpoint**: `GET /statistics/active-inactive-by-month`
- **Parámetros**: `{ year: number, type?: ProcessType }`
- **Respuesta**: Métricas mensuales de procesos activos e inactivos

### 2. Demandas y Audiencias por Mes
- **Endpoint**: `GET /statistics/lawsuits-hearings-by-month`
- **Parámetros**: `{ year: number, type?: ProcessType }`
- **Respuesta**: Métricas mensuales de demandas presentadas y audiencias programadas

### 3. Procesos por Estado
- **Endpoint**: `GET /statistics/processes-by-state`
- **Parámetros**: `{ type: ProcessType }`
- **Respuesta**: Distribución de procesos por ubicación geográfica

### 4. Procesos por Estado y Año
- **Endpoint**: `GET /statistics/processes-by-state-year`
- **Parámetros**: `{ year: number, type: ProcessType }`
- **Respuesta**: Análisis de procesos por estado en un año específico

### 5. Procesos Finalizados por Estado y Año
- **Endpoint**: `GET /statistics/finished-processes-by-state-year`
- **Parámetros**: `{ year: number, type: ProcessType }`
- **Respuesta**: Procesos completados por estado en un año específico

## Estructura de Archivos

```
src/modules/estadisticas/
├── data/
│   ├── interfaces/
│   │   └── estadisticas.interface.ts    # Tipos e interfaces API
│   ├── adapters/
│   │   └── estadisticas.adapter.ts      # Mapeo de respuestas
│   └── repositories/
│       └── estadisticas.repository.ts   # Comunicación con API
├── hooks/
│   └── useEstadisticas.ts              # Hook principal del módulo
└── index.ts                            # Exportaciones del módulo
```

## Hook Principal: `useEstadisticas`

### Estados Disponibles
- `loading`: Estado de carga global
- `error`: Mensaje de error si ocurre
- `activeInactiveData`: Datos de procesos activos/inactivos
- `lawsuitsHearingsData`: Datos de demandas y audiencias
- `processesByStateData`: Datos por estado
- `processesByStateYearData`: Datos por estado y año
- `finishedProcessesByStateYearData`: Datos de procesos finalizados

### Métodos Disponibles
- `getActiveInactiveByMonth(params)`: Obtener datos activos/inactivos
- `getLawsuitsHearingsByMonth(params)`: Obtener datos demandas/audiencias
- `getProcessesByState(params)`: Obtener datos por estado
- `getProcessesByStateYear(params)`: Obtener datos por estado y año
- `getFinishedProcessesByStateYear(params)`: Obtener datos finalizados
- `clearData()`: Limpiar todos los datos almacenados

## Integración con Vista

La vista `EstadisticasView` ha sido completamente integrada con el hook `useEstadisticas`:

1. **Carga automática**: Obtiene datos al montar el componente
2. **Estados de carga**: Muestra spinner mientras carga
3. **Manejo de errores**: Muestra alertas si hay problemas
4. **Datos reales**: Utiliza métricas reales de la API
5. **Fallbacks**: Mensajes cuando no hay datos disponibles

## Uso del Hook

```typescript
import { useEstadisticas } from '@/hooks';

const MyComponent = () => {
  const { 
    activeInactiveData,
    loading,
    error,
    getActiveInactiveByMonth 
  } = useEstadisticas();

  useEffect(() => {
    getActiveInactiveByMonth({ year: 2024 });
  }, []);

  // ... resto del componente
};
```

## Tipos de Proceso
- `"ACTIVO"`: Procesos en curso
- `"FINALIZADO"`: Procesos completados

## Configuración de Dependencias
El módulo está registrado en el contenedor de inyección de dependencias y configurado para usar:
- HTTPClient para comunicación con API
- Manejo de autenticación automático
- Notificaciones toast integradas
- Logging detallado para debugging

## Estado Actual
✅ **Completado y listo para uso**
- Todas las interfaces implementadas
- Adapters funcionando correctamente  
- Repository con todos los endpoints
- Hook con manejo de estado completo
- Vista integrada y funcionando
- Inyección de dependencias configurada
