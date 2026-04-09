
# Plan corregido: arreglar de verdad el registro

## Qué está fallando ahora

1. **La validación de username/email en tiempo real está mal planteada**
   - En `/auth` se está consultando `profiles` directamente desde el cliente.
   - Como el usuario aún no ha iniciado sesión, **RLS bloquea esas lecturas**.
   - Resultado: la comprobación puede fallar en silencio y el estado visual queda mal o inconsistente.
   - Además, la unicidad actual del username parece depender de `text UNIQUE`, que **no garantiza unicidad case-insensitive** (`Pepe` vs `pepe`).

2. **“Usar mi ubicación actual” detecta la ubicación, pero no rellena bien provincia/ciudad**
   - El reverse geocoding devuelve cosas como `Cataluña`, que es comunidad autónoma, mientras el formulario espera una **provincia** como `Barcelona`.
   - El código actual solo intenta casar `state`, así que el toast sale bien, pero los selects no se rellenan.

## Implementación propuesta

### 1. Arreglar la disponibilidad de username/email desde backend
Crear una verificación pública segura para registro, en vez de leer `profiles` directamente desde el frontend.

**Haré esto:**
- Añadir una función backend/RPC pública y segura para comprobar:
  - `username_available`
  - `email_available`
- Validar y normalizar inputs en backend:
  - trim
  - lower-case
  - formato permitido
  - límites de longitud
- En `Auth.tsx`, sustituir las consultas directas a `profiles` por esta verificación.

**Resultado esperado:**
- “Disponible” solo aparecerá si el backend confirma que está libre.
- Si ya existe, se mostrará error real y nunca el check verde.

### 2. Blindar la unicidad del username en base de datos
No basta con validarlo en UI: hay que **hacerlo imposible en base de datos**.

**Haré esto:**
- Añadir una migración para garantizar unicidad real de username normalizado (`lower(username)`).
- Normalizar usernames legacy antes de aplicar la restricción si hiciera falta.
- Mantener el submit final protegido para que, aunque haya carrera entre dos registros, el segundo falle correctamente.

**Resultado esperado:**
- Un username no podrá duplicarse aunque dos usuarios intenten registrarse a la vez.
- No habrá falsos “disponible”.

### 3. Corregir la geolocalización para rellenar sola provincia y ciudad
Refactorizar `handleUseLocation` para mapear correctamente datos españoles.

**Haré esto:**
- Leer más campos del reverse geocoder:
  - `city`
  - `town`
  - `village`
  - `municipality`
  - `county`
  - `state_district`
  - `province`
  - `state`
- Normalizar nombres quitando tildes/mayúsculas para comparar mejor.
- Intentar resolver la **provincia real** primero.
- Una vez resuelta la provincia, buscar la ciudad dentro del catálogo de esa provincia.
- Si el geocoder devuelve comunidad autónoma pero no provincia, usar la ciudad detectada para inferir la provincia correcta.
- Al completar ambos valores:
  - hacer `setValue` en `province`
  - hacer `setValue` en `city`
  - disparar validación
  - limpiar búsqueda manual si procede

**Resultado esperado:**
- Si detecta `Manresa, Cataluña`, el formulario rellenará **Barcelona** y **Manresa** automáticamente.

## Archivos a tocar

- `src/pages/Auth.tsx`
  - reemplazar checks directos
  - corregir debounce/estado visual
  - arreglar autofill de ubicación
- `supabase/migrations/...`
  - función segura de disponibilidad
  - restricción de unicidad normalizada para username
- Si hace falta reforzar normalización:
  - lógica de perfil/registro en backend para guardar username en minúsculas

## Verificación

### Username
- Escribir un username ya existente:
  - no debe salir “Disponible”
  - debe salir error inline
- Escribir uno libre:
  - debe salir check verde
- Intentar registrar dos veces el mismo username:
  - la segunda debe fallar aunque pase el debounce

### Ubicación
- Pulsar “Usar mi ubicación actual”
- Si detecta una ciudad española:
  - **Provincia** debe rellenarse sola
  - **Ciudad** debe rellenarse sola
- Probar casos como:
  - ciudad + provincia
  - ciudad + comunidad autónoma
  - nombres con tildes

## Enfoque UX mobile
Mantendré el flujo actual de 3 pasos, sin añadir fricción, y revisaré que el comportamiento siga siendo cómodo en móvil y respetando safe areas.
