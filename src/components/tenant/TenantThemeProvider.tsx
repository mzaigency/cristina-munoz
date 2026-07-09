import { useEffect, useRef } from "react";

interface TenantThemeProviderProps {
  primaryColor: string;
  secondaryColor: string;
  fontHeading?: string | null;
  fontBody?: string | null;
  headingSize?: string | null;
  buttonStyle?: string | null;
  children: React.ReactNode;
}

// Firma tipográfica Glowapp para la web pública: Playfair editorial en
// titulares, Plus Jakarta Sans en UI. El salón puede cambiarlas en su panel.
const DEFAULT_HEADING = "Playfair Display";
const DEFAULT_BODY = "Plus Jakarta Sans";

// Convert hex to HSL values for CSS variables
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function adjustLightness(h: number, s: number, l: number, amount: number): string {
  const newL = Math.max(0, Math.min(100, l + amount));
  return `${h} ${s}% ${newL}%`;
}

// Load Google Fonts dynamically.
// Playfair necesita itálica (la palabra en gradiente de los titulares); css2
// devuelve solo 400 si se pide un eje que la familia no tiene, así que el
// heading lleva su spec con ital y el resto usa la genérica de pesos.
const FONT_AXES: Record<string, string> = {
  "Playfair Display": "ital,wght@0,400..800;1,400..700",
};

function loadGoogleFont(fontFamily: string) {
  const formattedFont = fontFamily.replace(/ /g, '+');
  const linkId = `font-${formattedFont}`;

  if (document.getElementById(linkId)) return;

  const axes = FONT_AXES[fontFamily] || "ital,wght@0,400;0,500;0,600;0,700;1,400;1,600";
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:${axes}&display=swap`;
  document.head.appendChild(link);
}

export const TenantThemeProvider = ({
  primaryColor,
  secondaryColor,
  fontHeading,
  fontBody,
  headingSize,
  buttonStyle = "rounded",
  children
}: TenantThemeProviderProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  // Inter era el body por defecto antiguo guardado en tenants viejos; se trata
  // como "sin elección" para que la firma Glowapp (Jakarta) actúe.
  const effHeading = fontHeading || DEFAULT_HEADING;
  const effBody = !fontBody || fontBody === "Inter" ? DEFAULT_BODY : fontBody;
  
  useEffect(() => {
    const root = document.documentElement;
    
    const primary = hexToHsl(primaryColor);
    const secondary = hexToHsl(secondaryColor);
    
    // Set primary color variants (colors can be global as they're brand-specific per tenant)
    root.style.setProperty('--primary', `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty('--primary-foreground', primary.l > 50 ? '0 0% 0%' : '0 0% 100%');
    
    // Set accent/secondary color
    root.style.setProperty('--accent', `${secondary.h} ${secondary.s}% ${secondary.l}%`);
    root.style.setProperty('--accent-foreground', secondary.l > 50 ? '0 0% 0%' : '0 0% 100%');
    
    // Set ring color to match primary
    root.style.setProperty('--ring', `${primary.h} ${primary.s}% ${primary.l}%`);
    
    // Create salon-specific variants
    root.style.setProperty('--salon-pink', `${primary.h} ${primary.s}% ${primary.l}%`);
    root.style.setProperty('--salon-pink-light', adjustLightness(primary.h, primary.s, primary.l, 35));
    root.style.setProperty('--salon-pink-dark', adjustLightness(primary.h, primary.s, primary.l, -15));
    
    // Load fonts (they need to be available globally for the container to use them)
    loadGoogleFont(effHeading);
    loadGoogleFont(effBody);
    
    // Cleanup function - restore original colors
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--salon-pink');
      root.style.removeProperty('--salon-pink-light');
      root.style.removeProperty('--salon-pink-dark');
    };
  }, [primaryColor, secondaryColor, effHeading, effBody]);

  // Calculate styles for the container
  // NOTE: We intentionally do NOT globally scale heading sizes here.
  // Tailwind classes in each section/component should control sizing.
  const buttonRadius = {
    rounded: '0.5rem',
    pill: '9999px',
    square: '0.25rem',
    sharp: '0'
  };

  const radius = buttonRadius[buttonStyle as keyof typeof buttonRadius] || '0.5rem';

  return (
    <div
      ref={containerRef}
      className="tenant-theme-container"
      style={{
        '--tenant-font-heading': `"${effHeading}", serif`,
        '--tenant-font-body': `"${effBody}", sans-serif`,
        '--tenant-button-radius': radius,
      } as React.CSSProperties}
    >
      <style>{`
        .tenant-theme-container {
          font-family: var(--tenant-font-body);
        }
        .tenant-theme-container h1,
        .tenant-theme-container h2,
        .tenant-theme-container h3,
        .tenant-theme-container h4,
        .tenant-theme-container h5,
        .tenant-theme-container h6 {
          font-family: var(--tenant-font-heading);
        }
        /* Editorial italic words inside headings → gradient using salon colors */
        .tenant-theme-container .font-editorial-italic {
          background-image: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent)) 100%);
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
}
        .tenant-theme-container button:not([data-fixed-radius]),
        .tenant-theme-container [role="button"]:not([data-fixed-radius]) {
          border-radius: var(--tenant-button-radius);
        }
      `}</style>
      {children}
    </div>
  );
};

export default TenantThemeProvider;
