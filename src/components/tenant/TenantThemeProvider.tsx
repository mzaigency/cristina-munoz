import { useEffect, useRef } from "react";
import {
  GOOGLE_FONT_SPECS,
  DEFAULT_HEADING_FONT,
  DEFAULT_BODY_FONT,
} from "@/constants/tenantFonts";

interface TenantThemeProviderProps {
  primaryColor: string;
  secondaryColor: string;
  fontHeading?: string | null;
  fontBody?: string | null;
  headingSize?: string | null;
  buttonStyle?: string | null;
  children: React.ReactNode;
}

const DEFAULT_HEADING = DEFAULT_HEADING_FONT;
const DEFAULT_BODY = DEFAULT_BODY_FONT;

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
function loadGoogleFont(fontFamily: string) {
  const formattedFont = fontFamily.replace(/ /g, '+');
  const linkId = `font-${formattedFont}`;

  if (document.getElementById(linkId)) return;

  const axes = GOOGLE_FONT_SPECS[fontFamily] || "ital,wght@0,400;0,500;0,600;0,700;1,400;1,600";
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:${axes}&display=swap`;
  document.head.appendChild(link);
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  hex = hex.replace(/^#/, '');
  if (hex.length === 3) {
    hex = hex.split('').map(c => c + c).join('');
  }
  if (hex.length !== 6) return null;
  const num = parseInt(hex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
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

  const pRgb = hexToRgb(primaryColor);
  const sRgb = hexToRgb(secondaryColor || primaryColor);
  const brandGrad = `linear-gradient(135deg, ${primaryColor}, ${secondaryColor || primaryColor})`;
  
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

    // Dynamic brand gradient & kicker colors for tenant landing
    root.style.setProperty('--tv-brand-grad', brandGrad);
    root.style.setProperty('--tv-kicker-color', primaryColor);
    if (pRgb) root.style.setProperty('--tv-primary-rgb', `${pRgb.r}, ${pRgb.g}, ${pRgb.b}`);
    if (sRgb) root.style.setProperty('--tv-secondary-rgb', `${sRgb.r}, ${sRgb.g}, ${sRgb.b}`);
    
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
      root.style.removeProperty('--tv-brand-grad');
      root.style.removeProperty('--tv-kicker-color');
      root.style.removeProperty('--tv-primary-rgb');
      root.style.removeProperty('--tv-secondary-rgb');
    };
  }, [primaryColor, secondaryColor, effHeading, effBody, brandGrad, pRgb, sRgb]);

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
        '--tv-brand-grad': brandGrad,
        '--tv-kicker-color': primaryColor,
        '--tv-primary-rgb': pRgb ? `${pRgb.r}, ${pRgb.g}, ${pRgb.b}` : '34, 64, 140',
        '--tv-secondary-rgb': sRgb ? `${sRgb.r}, ${sRgb.g}, ${sRgb.b}` : '152, 50, 154',
      } as React.CSSProperties}
    >
      <style>{`
        .tenant-theme-container {
          font-family: var(--tenant-font-body);
        }
        /* Una sola tipografía en las secciones: los títulos usan la del cuerpo.
           El hero conserva su fuente porque marca .font-heading explícitamente
           (mayor especificidad) y no se ve afectado. */
        .tenant-theme-container h1,
        .tenant-theme-container h2,
        .tenant-theme-container h3,
        .tenant-theme-container h4,
        .tenant-theme-container h5,
        .tenant-theme-container h6 {
          font-family: var(--tenant-font-body);
        }
        .tenant-theme-container .font-heading {
          font-family: var(--tenant-font-heading);
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
