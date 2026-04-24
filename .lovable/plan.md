## Migración Lovable Cloud → Supabase Self-Hosted

Plan completo para migrar el proyecto `lyeyzdbplrgqsvyxpfek` (GlowApp) desde Lovable Cloud a tu instancia self-hosted de Supabase, sin necesidad de pedir el password de Postgres a soporte.

---

## Fase 1: Exportación (la hago yo desde aquí)

### 1.1 Schema + datos de Postgres
Uso `pg_dump` con el secret interno `SUPABASE_DB_URL` para generar:

- `glowapp_schema.sql` → estructura completa (tablas, índices, RLS, funciones, triggers, secuencias, enums)
- `glowapp_data.sql` → todos los datos del schema `public` (INSERT statements)
- `glowapp_full.sql` → dump combinado (schema + datos en un solo archivo) por si prefieres restaurarlo de una

Comandos que ejecutaré:
```bash
# Schema only
pg_dump "$SUPABASE_DB_URL" --schema=public --schema-only \
  --no-owner --no-acl --clean --if-exists \
  -f /mnt/documents/glowapp_schema.sql

# Data only (sin auth, storage, ni schemas internos)
pg_dump "$SUPABASE_DB_URL" --schema=public --data-only \
  --no-owner --no-acl --disable-triggers \
  -f /mnt/documents/glowapp_data.sql

# Full (schema + datos combinados)
pg_dump "$SUPABASE_DB_URL" --schema=public \
  --no-owner --no-acl --clean --if-exists \
  -f /mnt/documents/glowapp_full.sql
```

### 1.2 Auth users (con hashes de contraseña)
Los usuarios viven en el schema `auth` que `pg_dump` no toca por defecto. Uso un dump específico de `auth.users`, `auth.identities` y `auth.refresh_tokens`:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --table=auth.users \
  --table=auth.identities \
  --table=auth.refresh_tokens \
  --data-only --no-owner \
  -f /mnt/documents/glowapp_auth.sql
```

Esto preserva los hashes de contraseña (`encrypted_password`) → tus usuarios actuales seguirán entrando con su misma contraseña en el self-hosted.

### 1.3 Storage (4 buckets)
Listo y descargo todos los objetos de los 4 buckets vía REST API de Storage usando `SUPABASE_SERVICE_ROLE_KEY`:
- `tenant-assets` (logos, hero images, fotos de salones)
- `posts` (imágenes del feed Marketing)
- `story-images`
- `story-videos`

Genero `/mnt/documents/storage_dump.tar.gz` con la estructura `bucket_name/path/to/file` y un `storage_manifest.json` con metadatos (paths, MIME types, tamaños) para poder reimportarlos preservando rutas.

### 1.4 Edge Functions
Ya están en tu repo en `supabase/functions/`. Te genero `/mnt/documents/edge_functions_list.md` con la lista completa de las 30+ funciones y su configuración (`verify_jwt` de cada una desde `supabase/config.toml`) para que sepas qué desplegar y con qué flags.

### 1.5 Lista de secretos a reconfigurar
Genero `/mnt/documents/secrets_checklist.md` con los nombres (no valores — esos los tienes que poner tú) que tu self-hosted necesita:
- `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `FIREBASE_SERVICE_ACCOUNT`
- `LOVABLE_API_KEY` (para Lovable AI Gateway — si quieres seguir usándolo desde self-hosted, sí funciona; si no, hay que sustituir las edge functions que lo usan)
- Variables internas de Supabase (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`) — las genera tu self-hosted automáticamente

### 1.6 Configuración adicional crítica
Genero `/mnt/documents/post_migration_config.md` con:
- Cron jobs activos (`pg_cron`) — `send_booking_reminders` cada 30 min
- Settings de Postgres usados por triggers: `app.supabase_url` y `app.service_role_key` (los triggers de notificaciones los necesitan)
- Webhooks de Stripe a reapuntar a tu nueva URL
- DNS/dominios custom (`glowapp.app`, `cristinamunozperruqueria.es`) — solo cambian el `VITE_SUPABASE_URL`
- Realtime publications (`supabase_realtime`) — qué tablas hay que añadir tras el restore

---

## Fase 2: Restauración en tu self-hosted (la haces tú con mis instrucciones)

### Orden de restore
```bash
# 1. Restaurar schema público
psql "$NEW_DB_URL" -f glowapp_schema.sql

# 2. Restaurar usuarios de auth (ANTES que los datos, por las FKs)
psql "$NEW_DB_URL" -f glowapp_auth.sql

# 3. Restaurar datos públicos
psql "$NEW_DB_URL" -f glowapp_data.sql

# 4. Restaurar storage
./restore_storage.sh   # script que te genero con las llamadas a la API
```

### Settings de Postgres (CRÍTICO para notificaciones)
```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://tu-self-hosted.com';
ALTER DATABASE postgres SET app.service_role_key = 'tu-service-role-key';
```
Sin esto los triggers `trigger_new_booking_notification`, `trigger_booking_status_change` y `trigger_message_notification` fallan en silencio.

### Cron jobs
```sql
SELECT cron.schedule(
  'send-booking-reminders',
  '*/30 * * * *',
  'SELECT public.send_booking_reminders();'
);
```

### Realtime
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
-- (lista completa en el manifest que te genero)
```

---

## Fase 3: Reapuntar el frontend

Cambias `.env` (o variables de build):
```
VITE_SUPABASE_URL=https://tu-self-hosted.com
VITE_SUPABASE_PUBLISHABLE_KEY=tu-anon-key-self-hosted
VITE_SUPABASE_PROJECT_ID=tu-ref-self-hosted
```

Y regeneras los tipos: `npx supabase gen types typescript --project-id tu-ref > src/integrations/supabase/types.ts` (o con `--db-url` apuntando a tu self-hosted).

---

## Entregables finales en `/mnt/documents/`

```
glowapp_schema.sql            (~200 KB estimado)
glowapp_data.sql              (peso depende de tus datos)
glowapp_full.sql              (schema + data combinado)
glowapp_auth.sql              (usuarios con hashes)
storage_dump.tar.gz           (los 4 buckets)
storage_manifest.json         (metadatos de archivos)
edge_functions_list.md        (lista + verify_jwt)
secrets_checklist.md          (qué secretos reconfigurar)
post_migration_config.md      (cron, settings, realtime, webhooks)
restore_storage.sh            (script para reimportar storage)
RESTORE_GUIDE.md              (guía paso a paso end-to-end)
```

---

## Lo que NO migra automáticamente

- **Webhooks de Stripe**: tienes que crear uno nuevo en el dashboard de Stripe apuntando a `https://tu-self-hosted.com/functions/v1/stripe-webhook` y actualizar `STRIPE_WEBHOOK_SECRET`.
- **Service Worker de FCM** (`public/firebase-messaging-sw.js`): seguirá funcionando igual, no depende del backend.
- **Custom domains**: tu dominio `glowapp.app` es de Lovable hosting (frontend) → si también te llevas el frontend, hay que reapuntar DNS. Si solo te llevas el backend, no toques el dominio.
- **Backups históricos** de Lovable Cloud: no se migran. Solo tendrás el snapshot del momento del dump.

---

## Riesgos y consideraciones

- **Downtime estimado**: 5–15 min si haces el dump y el restore en ventana corta. Si quieres zero-downtime hay que hacer dual-write temporal (más complejo, fuera de este plan).
- **Tamaño de storage**: si tienes muchas imágenes/vídeos, `storage_dump.tar.gz` puede ser grande. Te aviso del tamaño antes de subirlo a `/mnt/documents/`.
- **Diferencia de versiones de Postgres**: tu self-hosted tiene que ser ≥ que la versión de Lovable Cloud (probable PG 15). Si es menor, el restore puede fallar en algunas funciones.
- **Extensiones**: tu self-hosted necesita tener instaladas: `pg_cron`, `pg_net`, `pgcrypto`, `pgsodium`, `pg_graphql`, `vault`. Casi todas vienen con la imagen oficial de Supabase self-hosted.

---

## Confirmación antes de empezar

Cuando apruebes este plan, en modo build hago la **Fase 1 completa** y te dejo todos los archivos en `/mnt/documents/` listos para descargar. La Fase 2 y 3 las haces tú con los archivos + la guía `RESTORE_GUIDE.md`.

¿Lanzo?
