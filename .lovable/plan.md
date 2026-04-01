

# Fusionar Clientes + Agenda con Panel de Cliente en Citas

## Resumen
Eliminar la pestana "Clientes" como tab independiente y fusionarla dentro de "Agenda" como un tercer sub-tab. Ademas, al tocar una cita en el calendario, mostrar la ficha del cliente en un panel lateral.

## Cambios planificados

### 1. Ampliar AgendaSection con sub-tab "Clientes"
**Archivo:** `src/components/admin/sections/AgendaSection.tsx`
- Anadir un tercer tab: Calendario | Lista de espera | Clientes
- Importar `ClientsCRM` y renderizarlo en el tab "clients"
- El tipo `AgendaTab` pasa a ser `"calendar" | "waitlist" | "clients"`
- Icono `UserCircle` para el tab de clientes

### 2. Eliminar tab "clients" de la navegacion principal
**Archivo:** `src/pages/TenantAdmin.tsx`
- Eliminar `"clients"` del tipo `TabValue` y del array `navItems`
- Eliminar el `case "clients"` del `renderContent()`
- Eliminar import de `ClientsCRM` (se importa ahora desde AgendaSection)
- La navegacion principal pasa de 7 tabs a 6

### 3. Panel de cliente al tocar una cita en el calendario
**Archivo:** `src/components/admin/LocalCalendarCRM.tsx`
- Al hacer click en una cita, buscar si existe un cliente en la tabla `clients` que coincida por nombre o telefono
- Si existe, mostrar un Sheet/Dialog con la ficha resumida del cliente: nombre, tags, total visitas, gasto total, ultima visita, notas
- Boton para "Ver ficha completa" que cambia al sub-tab de clientes con ese cliente seleccionado
- Si no existe, ofrecer boton "Crear cliente" con los datos pre-rellenados de la cita

### 4. Comunicacion entre componentes
- `AgendaSection` recibe callback `onSelectClient` opcional para que el calendario pueda pedir abrir la ficha de un cliente concreto
- Cuando el calendario detecta un cliente, cambia al tab "clients" y pasa el ID para que `ClientsCRM` lo abra automaticamente
- `ClientsCRM` acepta prop opcional `initialClientId` para abrir directamente ese cliente

## Archivos a modificar
1. `src/components/admin/sections/AgendaSection.tsx` - Anadir tab clientes
2. `src/pages/TenantAdmin.tsx` - Eliminar tab clients de nav principal
3. `src/components/admin/LocalCalendarCRM.tsx` - Panel cliente al tocar cita
4. `src/components/admin/ClientsCRM.tsx` - Aceptar prop `initialClientId`

## Notas tecnicas
- Sin migraciones DB necesarias
- Mobile-first: Sheet para panel de cliente en movil, Dialog en desktop
- La busqueda de cliente se hace por nombre normalizado (trim + lowercase) contra la tabla `clients`
- Safe areas respetadas en todos los paneles

