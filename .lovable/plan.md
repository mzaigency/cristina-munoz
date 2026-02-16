

# Nuevas Politicas de Privacidad y Terminos de Uso

## Resumen
Reescribir completamente las paginas de Politica de Privacidad y Terminos y Condiciones para que reflejen con precision todo lo que GlowApp recopila, almacena y utiliza, incluyendo permisos del dispositivo como camara, geolocalizacion, notificaciones push, haptics, etc. Ademas, corregir los enlaces rotos en el footer de la landing de negocios.

## Que cambia para el usuario
- Las paginas de Privacidad y Terminos tendran contenido profesional y completo, acorde a lo que realmente hace la app
- Los enlaces del footer de la pagina "Para Negocios" funcionaran correctamente

## Datos que la app recopila y debe reflejar en la politica

**Datos personales directos:**
- Nombre completo, email, telefono, foto de perfil (avatar)
- Ubicacion (pais, provincia, ciudad)
- Nombre de usuario (username)

**Datos de reservas:**
- Fecha, hora, servicios seleccionados, estilista, notas
- Nombre del cliente y telefono (encriptados en base de datos)

**Datos de actividad social:**
- Resenas y valoraciones, comentarios en publicaciones
- Likes, follows a salones, favoritos
- Mensajes directos con salones
- Respuestas a widgets interactivos de stories

**Datos de negocio (para profesionales):**
- Transacciones y caja registradora (con datos encriptados)
- Horarios de negocio, servicios, promociones
- Integraciones externas, generaciones de IA

**Permisos del dispositivo:**
- Camara: para subir fotos de perfil, imagenes de galeria, stories
- Geolocalizacion: para mostrar salones cercanos y calcular distancias
- Notificaciones push: recordatorios de citas, mensajes, actualizaciones
- Haptics: vibracion tactil para feedback de interacciones

**Terceros y procesamiento:**
- Stripe para pagos de suscripciones de negocios
- Servicios de IA (Google Gemini, OpenAI) para generacion de contenido
- Almacenamiento en la nube para imagenes y archivos

## Cambios tecnicos

### 1. `src/pages/PrivacyPolicy.tsx`
Reescribir con 14 secciones completas:
1. Responsable del tratamiento (GlowApp, contacto@glowapp.app)
2. Datos que recopilamos (desglose completo por categoria)
3. Permisos del dispositivo (camara, ubicacion, push, haptics)
4. Finalidad del tratamiento
5. Base legal (RGPD: consentimiento, ejecucion contractual, interes legitimo)
6. Comparticion con terceros (salones, Stripe, proveedores cloud, IA)
7. Transferencias internacionales
8. Encriptacion y seguridad (mencion a datos encriptados en BD)
9. Conservacion de datos
10. Derechos del usuario (RGPD completo: acceso, rectificacion, supresion, portabilidad, oposicion, limitacion)
11. Eliminacion de cuenta (mencion a la funcionalidad existente de delete-account)
12. Cookies y almacenamiento local
13. Menores de edad
14. Contacto y modificaciones

### 2. `src/pages/TermsOfUse.tsx`
Reescribir con 16 secciones completas:
1. Aceptacion de los terminos
2. Descripcion del servicio (dos perfiles: cliente y profesional)
3. Registro y tipos de cuenta
4. Uso de la plataforma como cliente
5. Uso como profesional (planes de suscripcion, funcionalidades)
6. Reservas y cancelaciones (politica detallada)
7. Sistema de resenas y valoraciones
8. Contenido generado por el usuario (stories, posts, fotos)
9. Mensajeria directa
10. Notificaciones y comunicaciones
11. Pagos y suscripciones (Stripe, facturacion)
12. Propiedad intelectual
13. Conducta prohibida
14. Limitacion de responsabilidad
15. Terminacion de cuenta
16. Ley aplicable, jurisdiccion y contacto

### 3. `src/components/business-landing/Footer.tsx`
Corregir enlaces rotos:
- `/privacy` a `/privacidad`
- `/terms` a `/terminos`
