import { useEffect } from "react";

interface TenantThemeProviderProps {
  primaryColor: string;
  secondaryColor: string;
  fontHeading?: string | null;
  fontBody?: string | null;
  headingSize?: string | null;
  buttonStyle?: string | null;
  children: React.ReactNode;
}

// Convert hex to HSL values for CSS variables
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  hex = hex.replace(/^#/, '');
  
  let r = parseInt(hex.substring(0, 2), 16) / 255;
  let g = parseInt(hex.substring(2, 4), 16) / 255;
  let b = parseInt(hex.substring(4, 6), 16) / 255;

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

// Load Google Fonts dynamically
function loadGoogleFont(fontFamily: string) {
  const formattedFont = fontFamily.replace(/ /g, '+');
  const linkId = `font-${formattedFont}`;
  
  if (document.getElementById(linkId)) return;
  
  const link = document.createElement('link');
  link.id = linkId;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${formattedFont}:wght@400;500;600;700&display=swap`;
  document.head.appendChild(link);
}

export const TenantThemeProvider = ({ 
  primaryColor, 
  secondaryColor,
  fontHeading = "Playfair Display",
  fontBody = "Inter",
  headingSize = "normal",
  buttonStyle = "rounded",
  children 
}: TenantThemeProviderProps) => {
  
  useEffect(() => {
    const root = document.documentElement;
    
    const primary = hexToHsl(primaryColor);
    const secondary = hexToHsl(secondaryColor);
    
    // Set primary color variants
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
    
    // Load and set fonts
    if (fontHeading) {
      loadGoogleFont(fontHeading);
      root.style.setProperty('--font-heading', `"${fontHeading}", serif`);
    }
    if (fontBody) {
      loadGoogleFont(fontBody);
      root.style.setProperty('--font-body', `"${fontBody}", sans-serif`);
    }
    
    // Set heading size scale
    const sizeScale = {
      small: '0.85',
      normal: '1',
      large: '1.15',
      xlarge: '1.3'
    };
    root.style.setProperty('--heading-scale', sizeScale[headingSize as keyof typeof sizeScale] || '1');
    
    // Set button border radius
    const buttonRadius = {
      rounded: '0.5rem',
      pill: '9999px',
      square: '0.25rem',
      sharp: '0'
    };
    root.style.setProperty('--button-radius', buttonRadius[buttonStyle as keyof typeof buttonRadius] || '0.5rem');
    
    // Cleanup function
    return () => {
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--salon-pink');
      root.style.removeProperty('--salon-pink-light');
      root.style.removeProperty('--salon-pink-dark');
      root.style.removeProperty('--font-heading');
      root.style.removeProperty('--font-body');
      root.style.removeProperty('--heading-scale');
      root.style.removeProperty('--button-radius');
    };
  }, [primaryColor, secondaryColor, fontHeading, fontBody, headingSize, buttonStyle]);

  return <>{children}</>;
};

export default TenantThemeProvider;
