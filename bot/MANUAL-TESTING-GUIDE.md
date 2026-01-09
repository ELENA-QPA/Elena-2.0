# 🧪 Guía de Testing Manual - Bot ELENA QPAlliance

Esta guía está diseñada para testers que van a probar el bot a través de WhatsApp.

## 📋 Información Importante

### Datos de Prueba
- **Número de documento válido**: `12345678` (este es el único número que funciona con la API)
- **Otros números**: Cualquier otro número mostrará "sin procesos"

### Herramientas Necesarias
- **WhatsApp**: Para interactuar con el bot
- **Esta guía**: Para seguir los pasos de testing

## 🎯 Flujos Principales a Probar

### 1. Flujo de Bienvenida y Autorización

#### Caso Exitoso
```
Tester: hola
Bot: 👋 ¡Hola! Bienvenido/a a ELENA – QPAlliance, tu asistente legal virtual.
     Antes de continuar, cuéntame:
     1️⃣ ¿Tienes actualmente un proceso con nosotros?
     2️⃣ ¿Quieres iniciar un proceso con nosotros?
     3️⃣ ¿Prefieres hablar directamente con un abogado?

Tester: 1
Bot: Antes de continuar, queremos contarte que de conformidad con la Ley 1581 de 2012...
     ¿Aceptas el tratamiento de tus datos personales conforme a nuestra política de privacidad?
     👉 Responde:
     1️⃣ Sí, acepto
     2️⃣ No acepto

Tester: 1
Bot: ✅ ¡Perfecto! Gracias por aceptar nuestra política de privacidad.
     Ahora continuemos con tu solicitud...
```

#### Otras Formas de Iniciar
- **Palabras alternativas**: "inicio", "Inicio", "start", "Start"
- **Rechazo de autorización**: Responder "2" o "no" → El bot termina la conversación
- **Respuestas incorrectas**: "3", "tal vez", "no sé" → El bot pide que respondas correctamente
- **Respuestas en texto**: "sí", "no", "acepto", "rechazo"

### 2. Flujo de Consulta de Procesos Existentes

#### Selección de Tipo de Documento
```
Bot: Con gusto. Para consultar, por favor indícame el tipo de documento de identificación:
     1️⃣ Cédula de Ciudadanía
     2️⃣ Permiso Especial de Permanencia
     3️⃣ Permiso de protección temporal
     4️⃣ NIT
     5️⃣ Pasaporte
     6️⃣ Cédula de extranjería

Tester: 1
Bot: ¡Perfecto! Para brindarte la información que requieres, indícame tu número de identificación.
     (sin puntos, comas, ni guiones)
```

#### Números de Documento que Funcionan
**✅ Número que funciona:**
- `12345678` → Este número tiene procesos en la base de datos

**❌ Números que NO funcionan:**
- `12345` (muy corto) → El bot dice que es muy corto
- `1234567890123456` (muy largo) → El bot dice que es muy largo
- `1234567a` (con letras) → El bot dice que solo acepta números
- `12-34-56-78` (con guiones) → El bot dice que no acepta guiones
- `12.34.56.78` (con puntos) → El bot dice que no acepta puntos
- `12,34,56,78` (con comas) → El bot dice que no acepta comas
- `abc123` (con letras) → El bot dice que solo acepta números

#### Selección de Tipo de Proceso
```
Bot: ✅ Encontré 9 procesos asociados a tu identificación 12345678. Elige una opción:
     1️⃣ Ver procesos activos
     2️⃣ Ver procesos finalizados
     3️⃣ Recibir un resumen en PDF

Tester: 1
Bot: 📂 Procesos activos:
     1. Proceso #U003
        • Estado: ADMITE
        • Última actualización: 27/08/2025
     2. Proceso #D002
        • Estado: RADICADO
        • Última actualización: 28/08/2025
     
     Responde con el número de radicado para ver detalles o escribe MENÚ para regresar.
```

#### Respuestas Incorrectas
- **Opción incorrecta**: "4", "abc", "otro" → El bot pide que respondas correctamente
- **Comando MENÚ**: Escribir "MENÚ" → El bot regresa a la selección de tipo de proceso
- **Número de proceso incorrecto**: "99" cuando solo hay 2 procesos → El bot dice que no existe ese proceso

### 3. Flujo de Detalles de Proceso

#### Caso Exitoso
```
Tester: 1
Bot: 🔍 Obteniendo detalles del proceso...
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
```

#### Respuestas del Usuario
- **Respuesta "sí"**: El bot genera y envía el PDF del proceso
- **Respuesta "no"**: El bot pregunta si quieres consultar otro proceso
- **Respuestas incorrectas**: "tal vez", "3", "no sé" → El bot pide que respondas correctamente

### 4. Flujo de Procesos Finalizados

#### Caso Exitoso
```
Tester: 2 (desde selección de tipo de proceso)
Bot: 📋 Procesos finalizados:
     1. Proceso #D009
        • Estado: ARCHIVADO
        • Última actualización: 05/09/2025
     
     Responde con el número de radicado para ver detalles o escribe MENÚ para regresar.

Tester: 1
Bot: ✅ Encontré 1 proceso finalizado asociados al documento 12345678:
     Proceso #D009
     • Estado: ARCHIVADO
     • Última actualización: 05/09/2025
     
     ¿Qué te gustaría hacer?
     1️⃣ Quieres iniciar un nuevo proceso
     2️⃣ Tienes problemas con el pago
     3️⃣ Quieres consultar otro proceso
```

#### Sub-flujo de Problemas de Pago
```
Tester: 2
Bot: Entiendo que tienes problemas con el pago.
     ¿Qué necesitas?
     1️⃣ Consultar la fecha estimada de pago
     2️⃣ Contactarme con un abogado
```

### 5. Flujo de Resumen PDF

#### Caso Exitoso
```
Tester: 3 (desde selección de tipo de proceso)
Bot: 📄 Generando el resumen personalizado de todos tus procesos...
     📄 Aquí tienes el resumen de todos tus procesos asociados a la identificación 12345678:
     [PDF adjunto]
```

#### Casos Edge
- **Error en generación**: Debe mostrar opciones alternativas
- **Sin procesos**: Debe manejar el caso cuando no hay procesos

### 6. Flujo de Nuevo Proceso

#### Selección de Perfil
```
Tester: 2 (desde menú principal)
Bot: ¡Excelente noticia! 🎉
     Queremos acompañarte en este camino legal y asegurarnos de que recibas la mejor orientación.
     Para comenzar, dime por favor:
     1️⃣ ¿Eres Rappitendero?
     2️⃣ ¿Eres una empresa?
     3️⃣ ¿Otro perfil? (independiente, particular, etc.)
```

#### Casos por Perfil
**Rappitendero (Opción 1):**
```
Tester: 1
Bot: 🙌 ¡Excelente! Estamos listos para acompañarte durante todo el proceso...
     [ENVIAR AUTOMÁTICAMENTE EL FORMULARIO FORMS Y VIDEO EXPLICATIVO]
     https://docs.google.com/forms/d/e/1FAIpQLScrONKT_avUatwpKU2Lh5iUn6FOEkVgrJkDwmvuaKj1AfM1Ng/viewform?usp=dialog
     Gracias por confiar en nosotros. Una vez hayas completado el formulario, un abogado se pondrá en contacto contigo🙌.
```

**Empresa (Opción 2):**
```
Tester: 2
Bot: 🏢 Gracias por confiar en nosotros. Para darte un servicio ajustado a tu caso...
     https://docs.google.com/forms/d/e/1FAIpQLScrONKT_avUatwpKU2Lh5iUn6FOEkVgrJkDwmvuaKj1AfM1Ng/viewform?usp=dialog
```

**Otro Perfil (Opción 3):**
```
Tester: 3
Bot: Perfecto 🙌. Queremos conocer mejor tu perfil y tu caso...
     https://formulario.eleanabot.com
```

### 7. Flujo de Comunicación Directa

#### Caso Exitoso
```
Tester: 3 (desde menú principal)
Bot: 👌 Claro, con mucho gusto. En breve uno de nuestros asesores legales se pondrá en contacto contigo.
```

## 🔍 Qué Probar Específicamente

### Validaciones de Entrada
1. **Números de documento**:
   - ✅ Solo funciona: `12345678`
   - ❌ No funcionan: Números muy cortos, muy largos, con letras, con símbolos

2. **Opciones de menú**:
   - ✅ Funcionan: "1", "2", "3", "sí", "no"
   - ❌ No funcionan: "4", "abc", "tal vez", "no sé"

3. **Comandos especiales**:
   - ✅ "MENÚ" → Regresa al menú anterior
   - ✅ "hola", "inicio" → Reinicia la conversación

### Qué Verificar
1. **Mensajes de error**:
   - El bot debe mostrar mensajes claros cuando algo sale mal
   - No debe quedarse "colgado" esperando respuesta

2. **Generación de PDFs**:
   - Los PDFs deben generarse y enviarse correctamente
   - Si hay error, debe ofrecer opciones alternativas

3. **Navegación**:
   - El bot debe recordar dónde estás en la conversación
   - Debe poder regresar a menús anteriores

## 📊 Checklist de Testing

### ✅ Flujo Principal de Consulta
- [ ] Escribir "hola" y recibir bienvenida
- [ ] Aceptar autorización de datos personales
- [ ] Seleccionar tipo de documento (1-6)
- [ ] Escribir número `12345678` y recibir procesos
- [ ] Seleccionar tipo de proceso (1-3)
- [ ] Ver listado de procesos con formato correcto
- [ ] Seleccionar un proceso y ver detalles
- [ ] Solicitar PDF y recibirlo correctamente
- [ ] Opción de consultar otro proceso

### ✅ Flujo de Nuevo Proceso
- [ ] Seleccionar "iniciar proceso" desde menú principal
- [ ] Aceptar autorización de datos
- [ ] Seleccionar perfil (Rappitendero/Empresa/Otro)
- [ ] Recibir formulario correcto según perfil
- [ ] Mensaje de confirmación de contacto

### ✅ Flujo de Comunicación Directa
- [ ] Seleccionar "hablar con abogado" desde menú principal
- [ ] Aceptar autorización de datos
- [ ] Recibir mensaje de confirmación de contacto

### ✅ Validaciones y Errores
- [ ] Probar números de documento incorrectos
- [ ] Probar opciones de menú incorrectas
- [ ] Usar comando "MENÚ" para regresar
- [ ] Verificar mensajes de error claros
- [ ] Confirmar que el bot no se "cuelga"

### ✅ Navegación y Experiencia
- [ ] Mensajes claros y fáciles de entender
- [ ] Emojis y formato correcto
- [ ] Tiempos de respuesta apropiados
- [ ] El bot recuerda dónde estás en la conversación

## 🐛 Problemas Comunes a Verificar

1. **Bot se queda esperando**: El bot no responde después de un error
2. **Respuestas duplicadas**: El bot envía el mismo mensaje varias veces
3. **PDFs no llegan**: Los PDFs no se generan o no se envían
4. **Navegación confusa**: El bot no sabe dónde estás en la conversación
5. **Mensajes confusos**: Los mensajes de error no son claros

## 📞 Datos de Prueba

### ✅ Número que Funciona
- `12345678` → Este número tiene procesos en la base de datos

### ❌ Números que NO Funcionan
- `12345` → Muy corto
- `1234567890123456` → Muy largo  
- `12-34-56-78` → Con guiones
- `12.34.56.78` → Con puntos
- `abc123` → Con letras

## ⚠️ Notas Importantes

1. **Solo funciona el número `12345678`**: Otros números mostrarán que no tienen casos
2. **Reiniciar conversación**: Escribir "hola" o "inicio" reinicia todo
3. **PDFs**: Se eliminan automáticamente después de enviarse
4. **Errores**: El bot debe mostrar mensajes claros cuando algo sale mal

---

**Proyecto**: ELENA - QPAlliance Legal Bot
