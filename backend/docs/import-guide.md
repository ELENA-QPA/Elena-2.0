# Guía de Importación de Datos desde Excel

## Estructura del archivo Excel

Tu archivo Excel debe tener las siguientes hojas (pestañas):

### 1. Hoja "Casos"
Columnas requeridas:
- `Codigo_Interno`: Código único del caso (ej: "CASO001", "CASO002")
- `Tipo_Cliente`: Tipo de cliente
- `Departamento`: Departamento
- `Tipo_Persona`: Tipo de persona
- `Jurisdiccion`: Jurisdicción
- `Ubicacion`: Ubicación (opcional)
- `Tipo_Proceso`: Tipo de proceso
- `Oficina`: Oficina
- `Radicado`: Número de radicado
- `Ciudad`: Ciudad (opcional)
- `Pais`: País (opcional, por defecto "Colombia")

### 2. Hoja "Partes_Procesales"
Columnas requeridas:
- `Codigo_Interno_Caso`: Código del caso al que pertenece (debe existir en la hoja Casos)
- `Tipo_Parte`: "demandante" o "demandada"
- `Nombre`: Nombre completo
- `Tipo_Documento`: Tipo de documento
- `Documento`: Número de documento
- `Email`: Correo electrónico
- `Contacto`: Número de contacto

### 3. Hoja "Actuaciones" (si existe)
Columnas requeridas según tu modelo de actuaciones.

## Cómo usar la importación

### Opción 1: Importación completa
```bash
POST /records/import/excel
Content-Type: multipart/form-data
file: [tu_archivo.xlsx]
```

### Opción 2: Importación por partes
```bash
# 1. Primero importar casos
POST /records/import/records-only
file: [tu_archivo.xlsx]

# 2. Luego importar partes procesales
POST /records/import/procedural-parts-only
file: [tu_archivo.xlsx]
```

### Opción 3: Limpiar datos (solo para desarrollo)
```bash
DELETE /records/import/clear-data
```

## Ejemplo con Postman o curl

```bash
curl -X POST \
  http://localhost:3000/records/import/excel \
  -H 'Content-Type: multipart/form-data' \
  -F 'file=@path/to/your/file.xlsx'
```

## Notas importantes

1. **Orden de importación**: Los casos deben importarse ANTES que las partes procesales, ya que estas últimas necesitan referenciar los UUIDs de los casos.

2. **Códigos internos únicos**: Asegúrate de que los códigos internos en la hoja "Casos" sean únicos.

3. **Referencias válidas**: Todos los códigos internos en "Partes_Procesales" deben existir en "Casos".

4. **Validación**: El sistema validará que los datos cumplan con los esquemas definidos.

5. **Logs**: Revisa la consola para ver el progreso y errores de importación.

## Ejemplo de estructura Excel

### Casos
| Codigo_Interno | Tipo_Cliente | Departamento | Tipo_Persona | Jurisdiccion | Tipo_Proceso | Oficina | Radicado |
|---------------|--------------|--------------|--------------|--------------|--------------|---------|----------|
| CASO001       | Empresa      | Bogotá       | Jurídica     | Civil        | Ordinario    | OF001   | 2024001  |
| CASO002       | Individual   | Medellín     | Natural      | Laboral      | Abreviado    | OF002   | 2024002  |

### Partes_Procesales
| Codigo_Interno_Caso | Tipo_Parte | Nombre        | Tipo_Documento | Documento  | Email           | Contacto    |
|--------------------|------------|---------------|----------------|------------|-----------------|-------------|
| CASO001            | demandante | Juan Pérez    | CC             | 12345678   | juan@email.com  | 3001234567  |
| CASO001            | demandada  | ABC Corp      | NIT            | 900123456  | info@abc.com    | 6017654321  |
| CASO002            | demandante | María García  | CC             | 87654321   | maria@email.com | 3007654321  |