

## Plan: Mejoras visuales de la página Para Negocios

### 1. Hero mas visual
**HeroSection.tsx**
- Eliminar el logo duplicado (ya esta en el StickyHeader)
- Añadir debajo de los CTAs un mockup del producto: un frame de iPhone con una captura de la app (reutilizando el componente DemoLanding que ya existe) para que el visitante vea inmediatamente qué obtiene
- Ajustar espaciados para que el mockup quepa sin forzar scroll excesivo

### 2. Before/After responsive en mobile
**BeforeAfterSection.tsx**
- En mobile (< sm), cambiar de `grid-cols-2` a layout vertical: cada comparación como una sola tarjeta con "antes" arriba tachado y "después" abajo destacado
- Las cabeceras "Sin GlowApp / Con GlowApp" se ocultan en mobile ya que el formato visual de cada item lo deja claro
- En desktop se mantiene el grid de 2 columnas actual

### 3. Consistencia general
- **HeroSection.tsx**: Cambiar pill "Listo en 5 min" a "Listo en 10 min"
- **FinalCTASection.tsx**: Cambiar "Configura en 15 min" a "Configura en 10 min" (alinear ambas secciones)
- **PainPointsSection.tsx**: Eliminar la flecha animada "GlowApp soluciona todo esto" del final, se siente poco profesional. Dejar un espaciado limpio
- Revisar que los `py-` de secciones sean consistentes

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `HeroSection.tsx` | Quitar logo, añadir mockup iPhone, corregir "5 min" → "10 min" |
| `BeforeAfterSection.tsx` | Layout vertical en mobile |
| `PainPointsSection.tsx` | Eliminar flecha animada inferior |
| `FinalCTASection.tsx` | "15 min" → "10 min" |

