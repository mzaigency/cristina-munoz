

## Plan: Mejora UX/UI del Onboarding Setup

### Problemas actuales detectados
- 13 pasos es abrumador — el usuario siente que nunca acaba
- No hay indicación de qué pasos son opcionales vs obligatorios
- Los pasos de ubicación, contacto, redes sociales y tipografía se sienten como fricción innecesaria al inicio
- No hay "skip" visible — el usuario no sabe que puede avanzar sin rellenar
- El header con pills ocupa mucho espacio vertical en mobile
- Los botones "Atrás/Continuar" no dan feedback de progreso motivacional

### Mejoras propuestas

#### 1. Reducir pasos percibidos: agrupar en 6 pantallas
Consolidar los 13 pasos en 6 pantallas reales para reducir la sensación de longitud:

| Pantalla | Contenido actual | Cambio |
|----------|-----------------|--------|
| 1. Tu negocio | BusinessType | Se mantiene |
| 2. Datos de contacto | Ubicación + Contacto + Redes | Fusionar en un solo paso con secciones colapsables |
| 3. Tu contenido | Imágenes + Equipo | Fusionar, con badges "opcional" |
| 4. Servicios y horarios | Servicios + Horarios | Fusionar en tabs |
| 5. Diseño | Tema + Colores + Tipografía | Fusionar en un solo paso con tabs o secciones |
| 6. Generar con IA | AIGeneration → Success | Se mantiene |

#### 2. UX: botón "Saltar" y motivación
- Añadir botón "Saltar paso" discreto en pasos opcionales (datos contacto, redes, imágenes)
- Cambiar el texto del botón principal según el paso: "Siguiente" → último paso: "Crear mi página"
- Añadir microcopy motivacional bajo la barra de progreso: "Ya casi, solo queda el diseño"

#### 3. UI: header más compacto y limpio
- Simplificar el header: quitar las category pills (ocupan demasiado espacio mobile)
- Dejar solo: flecha atrás + título del paso + "Paso 2 de 6" + barra de progreso
- La barra de progreso más gruesa (h-1.5) con gradiente sutil para sentir el avance

#### 4. UI: transiciones más fluidas
- Cambiar la animación de slide vertical a slide horizontal (como pasar páginas) para dar sensación de avance lateral
- Añadir haptic feedback en mobile al cambiar de paso

### Archivos a modificar
| Archivo | Cambio |
|---------|--------|
| `OnboardingSetup.tsx` | Reestructurar steps de 13→6, nuevo header compacto, animación horizontal, microcopy motivacional |
| `ContactStep.tsx` | Fusionar con LocationStep y SocialStep en un nuevo `BusinessInfoStep.tsx` |
| `ServicesStep` (inline) | Añadir tabs con HoursStep |
| `ColorsStep` (inline) | Fusionar con ThemeStep y TypographyStep en un `DesignStep.tsx` |
| Nuevo: `BusinessInfoStep.tsx` | Paso unificado con acordeones para ubicación, contacto y redes |
| Nuevo: `DesignStep.tsx` | Paso unificado con tabs para tema, colores y tipografía |

### Resultado esperado
- De 13 pasos a 6: menos abandono
- Skip visible en opcionales: menos frustración
- Header compacto: más espacio para contenido en mobile
- Microcopy motivacional: el usuario siente progreso real

