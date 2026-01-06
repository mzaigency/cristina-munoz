// Font loader utility for Google Fonts

import { FONTS } from './constants';

// Track loaded fonts
const loadedFonts = new Set<string>();

// Load a single font
export async function loadFont(fontName: string): Promise<boolean> {
  if (loadedFonts.has(fontName)) {
    return true;
  }

  try {
    // Create link element for Google Fonts
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(/ /g, '+')}:wght@100;200;300;400;500;600;700;800;900&display=swap`;
    
    // Wait for the font to load
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error(`Failed to load font: ${fontName}`));
      document.head.appendChild(link);
    });

    // Mark as loaded
    loadedFonts.add(fontName);
    
    // Use FontFace API to ensure the font is actually ready
    await document.fonts.load(`400 16px "${fontName}"`);
    
    return true;
  } catch (error) {
    console.error(`Error loading font ${fontName}:`, error);
    return false;
  }
}

// Load multiple fonts
export async function loadFonts(fontNames: string[]): Promise<void> {
  await Promise.all(fontNames.map(loadFont));
}

// Preload all available fonts
export async function preloadAllFonts(): Promise<void> {
  const fontNames = FONTS.map(f => f.name);
  
  // Load in batches to avoid overwhelming the browser
  const batchSize = 5;
  for (let i = 0; i < fontNames.length; i += batchSize) {
    const batch = fontNames.slice(i, i + batchSize);
    await loadFonts(batch);
  }
}

// Check if a font is loaded
export function isFontLoaded(fontName: string): boolean {
  return loadedFonts.has(fontName);
}

// Get the list of available fonts
export function getAvailableFonts() {
  return FONTS;
}

// Initialize essential fonts on app load
export async function initializeFonts(): Promise<void> {
  // Load the most common fonts first
  const essentialFonts = ['Inter', 'Poppins', 'Bebas Neue', 'Pacifico', 'Montserrat'];
  await loadFonts(essentialFonts);
}
