# Tienda de productos en el salón

Añadimos una **mini-tienda** dentro de la landing de cada tenant para vender los productos en stock, integrada con el flujo de reserva y con un panel admin en tiempo real para ver los pedidos.

## 1. Base de datos

### Tabla `products` — añadir campos
- `image_url text` — foto del producto
- `is_featured boolean default false` — para destacar en tienda
- `short_description text` — descripción corta para la card

### Nueva tabla `product_orders`
Pedidos de productos, ligados opcionalmente a una reserva.
- `tenant_id`, `user_id` (nullable para invitados)
- `booking_id` (nullable, si se añadió al confirmar una cita)
- `customer_name`, `customer_phone`
- `items jsonb` — `[{product_id, name, price, quantity}]`
- `total numeric`
- `status text` — `pending` / `ready` / `delivered` / `cancelled`
- `pickup_type text` — `with_appointment` / `pickup` 
- `notes text`
- `created_at`, `updated_at`

**RLS:**
- Cliente: ve / crea sus propios pedidos
- Admin del tenant: ve y gestiona los pedidos del tenant
- Realtime activado para notificación instantánea

### Trigger de stock
Función `decrement_product_stock()` que al insertar un `product_order` con status distinto de `cancelled`, descuenta el stock de cada item. Si algún producto no tiene stock suficiente → rechazar.

### Bucket de Storage
Nuevo bucket público `product-images` con políticas para que los admins del tenant suban imágenes en `{tenant_id}/...`.

## 2. Admin — gestionar productos con imagen

`ProductsManager.tsx`: añadir campo de subida de imagen (reusando `TenantImageUploader` o input file → bucket), y campos de "destacar en tienda" y "descripción corta".

## 3. Tienda en la landing (todos los temas)

Nuevo componente `TenantShopSection.tsx`, insertado en `TenantLanding.tsx` después de `TenantServicesSection`. Solo se renderiza si el tenant tiene al menos 1 producto activo con stock.

**Diseño Liquid Glass mobile-first:**
- Header con título "Tienda" y línea acento
- Grid 2 columnas en móvil / 3-4 en desktop
- Cards con `backdrop-blur`, borde sutil, imagen cuadrada arriba, nombre, precio, badge de stock bajo si aplica
- Tap en card → `ProductDetailDialog` (bottom sheet en móvil, dialog en desktop) con imagen grande, descripción, precio, selector de cantidad y dos botones:
  - **"Añadir al carrito"** (estado local del carrito de tienda)
  - **"Comprar ahora"** → abre formulario de checkout simple (nombre/teléfono o usuario logueado) y crea `product_order` con `pickup_type=pickup`

**Carrito flotante** estilo iOS (botón sticky abajo derecha con badge cantidad) cuando hay items.

## 4. Integración en el flujo de reserva

En `BookingFlow.tsx` / `TenantBookingFlow.tsx`, **paso intermedio antes de confirmar (paso 4)**:

Nuevo bloque opcional **"¿Quieres añadir algún producto a tu cita?"**
- Carrusel horizontal de productos destacados con stock
- Tap → añade al pedido asociado a la reserva
- Resumen muestra: servicios + productos + total combinado
- Al confirmar booking → se crea también `product_order` con `booking_id` y `pickup_type=with_appointment`

Si el cliente ya tenía items en el carrito de tienda al iniciar la reserva, se preservan y se ofrecen para añadir.

## 5. Panel admin: Pedidos en tiempo real

Nueva sub-tab **"Tienda"** dentro de `CatalogSection` (o nueva sección si prefieres) con:
- **Lista de pedidos** ordenada por `created_at desc`
- Filtros por estado (Pendiente / Listo / Entregado)
- Cada pedido muestra: cliente, items, total, si tiene cita asociada (link), botones de cambio de estado
- **Suscripción Realtime** a `product_orders` filtrado por `tenant_id` → toast + sonido + badge en sidebar al llegar uno nuevo
- Notificación push al admin reusando `send-push-notification`

## 6. Notificaciones

- Al crear pedido → notificar al admin (push + in-app)
- Al cambiar estado a `ready` → notificar al cliente (push si tiene cuenta)
- Reusar la infraestructura existente (`notifications` table + `send-push-notification` edge function)

## Archivos a crear/editar

**Migración SQL:**
- Nueva migración: campos en `products`, tabla `product_orders` + RLS + trigger stock + bucket storage + realtime

**Nuevos:**
- `src/components/tenant/TenantShopSection.tsx`
- `src/components/tenant/ProductDetailDialog.tsx`
- `src/components/tenant/ShopCart.tsx` (carrito flotante)
- `src/components/booking/BookingProductsAddon.tsx`
- `src/components/admin/ProductOrdersManager.tsx`
- `src/contexts/ShopCartContext.tsx` (estado carrito)

**Editar:**
- `src/components/admin/ProductsManager.tsx` (subida imagen + featured)
- `src/pages/TenantLanding.tsx` (renderizar shop section)
- `src/components/booking/BookingFlow.tsx` y `TenantBookingFlow.tsx` (addon productos)
- `src/components/booking/BookingConfirmation.tsx` (incluir productos en resumen y crear orden)
- `src/components/admin/sections/CatalogSection.tsx` (añadir tab "Pedidos")

## Notas técnicas
- Stock se valida server-side en el trigger para evitar race conditions
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE product_orders`
- Imágenes optimizadas con `loading="lazy"` y aspect-ratio fijo
- Soporta usuarios invitados (sin login) para compra rápida — `user_id` nullable
