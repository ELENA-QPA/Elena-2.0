# Migración de Base de Datos QP Alliance

## 📋 Descripción

Scripts para migrar datos desde archivos CSV a MongoDB para el proyecto QP Alliance. Los datos se migran en el siguiente orden:

1. **Records** - Casos principales con información general
2. **Procedural Parts** - Demandantes y demandados relacionados a cada caso
3. **Performances** - Actuaciones procesales de cada caso

## 🗂️ Archivos CSV

Los siguientes archivos CSV están listos para la migración:

- `src/scripts/records-migrated.csv` - Records con campos agregados (user, processType, jurisdiction)
- `src/scripts/procedural-parts-migrated.csv` - Partes procesales separadas por demandante/demandado
- `src/scripts/performances-migrated.csv` - Actuaciones con campos ajustados al modelo

## 🚀 Instalación

1. **Instalar dependencias:**
```bash
npm install mongodb csv-parse
```

2. **Configurar variables de entorno (opcional):**
```bash
export MONGO_URI="mongodb://localhost:27017"
export DB_NAME="qp_alliance"
```

## ▶️ Ejecución

### Migración Completa (Recomendado)
```bash
node src/scripts/master-migration.js
```

### Migración Individual

**Solo Records:**
```bash
node src/scripts/migration-records.js
```

**Solo Procedural Parts:**
```bash
node src/scripts/migration-procedural-parts.js
```

**Solo Performances:**
```bash
node src/scripts/migration-performances.js
```

## 🔧 Funcionamiento

### 1. Records
- Crea un mapeo `internalCode` → `ObjectId` en la colección `migration_mappings`
- Agrega campos predeterminados:
  - `user`: "68f02d20f248052e96ceea8b"
  - `processType`: "Declarativo"
  - `jurisdiction`: "Ordinario"
  - `personType`: "Natural"
  - `country`: "Colombia"

### 2. Procedural Parts
- Usa el mapeo para relacionar con Records por `internalCode`
- Separa demandantes y demandados en registros individuales
- Campos: `partType`, `name`, `documentType`, `document`, `email`, `contact`

### 3. Performances
- Usa el mapeo para relacionar con Records por `internalCode`
- Convierte fechas DD/MM/YY a formato Date
- Campos: `performanceType`, `responsible`, `createdAt`

## 📊 Estructura de Datos

### Record Entity
```typescript
{
  user: ObjectId,
  clientType: string,
  internalCode: string,
  department: string,
  personType: string,
  jurisdiction: string,
  location: string,
  processType: string,
  office: string,
  settled: string,
  city: string,
  country: string
}
```

### ProceduralPart Entity
```typescript
{
  record: ObjectId,
  partType: 'demandante' | 'demandada',
  name: string,
  documentType: string,
  document: string,
  email: string,
  contact: string
}
```

### Performance Entity
```typescript
{
  record: ObjectId,
  performanceType: string,
  responsible: string,
  observation: string,
  createdAt: Date
}
```

## ⚠️ Notas Importantes

- **Orden de migración**: Los Records deben migrarse primero para crear el mapeo
- **Relaciones**: Las otras colecciones usan `internalCode` para encontrar el `ObjectId` del Record
- **Limpieza**: Cada script limpia su colección antes de insertar datos nuevos
- **Validación**: Se omiten registros sin `internalCode` válido o datos incompletos

## 🔍 Verificación

Después de la migración, verifica:

1. **Mapeo creado:**
```javascript
db.migration_mappings.find({type: 'internalCode_to_objectId'}).limit(5)
```

2. **Records insertados:**
```javascript
db.records.countDocuments()
```

3. **Relaciones correctas:**
```javascript
db.proceduralparts.aggregate([
  {$lookup: {from: 'records', localField: 'record', foreignField: '_id', as: 'recordData'}},
  {$limit: 5}
])
```

## 🐛 Troubleshooting

- **Error de conexión**: Verificar que MongoDB esté ejecutándose
- **Archivos no encontrados**: Los CSV deben estar en `src/scripts/`
- **Fechas inválidas**: Se usa fecha actual como fallback
- **Caracteres especiales**: Los archivos están en UTF-8