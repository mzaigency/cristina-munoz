// Types for the Story Editor with Fabric.js

export type ElementType = 'text' | 'image' | 'shape' | 'sticker' | 'widget' | 'drawing';
export type ToolType = 'select' | 'text' | 'shapes' | 'stickers' | 'draw' | 'filters' | 'media' | 'widgets';
export type PanelType = 'none' | 'properties' | 'layers' | 'text' | 'shapes' | 'filters' | 'stickers' | 'widgets';
export type ShapeType = 'rect' | 'circle' | 'triangle' | 'line';
export type WidgetType = 'poll' | 'question' | 'countdown' | 'emoji-slider';

export interface ElementProperties {
  // Text properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  fontStyle?: 'normal' | 'italic';
  textAlign?: 'left' | 'center' | 'right';
  lineHeight?: number;
  letterSpacing?: number;
  fill?: string;
  backgroundColor?: 'none' | 'solid' | 'translucent';
  textShadow?: {
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
  };
  stroke?: string;
  strokeWidth?: number;

  // Shape properties
  shapeType?: ShapeType;
  fillColor?: string;
  strokeColor?: string;
  borderRadius?: number;

  // Image properties
  src?: string;
  filters?: ImageFilters;

  // Sticker/emoji
  emoji?: string;

  // Widget properties
  widgetType?: WidgetType;
  widgetConfig?: Record<string, any>;

  // Drawing properties
  brushColor?: string;
  brushWidth?: number;
  brushType?: 'pen' | 'neon' | 'eraser';
  paths?: string;
}

export interface ImageFilters {
  brightness: number; // -1 to 1
  contrast: number; // -1 to 1
  saturation: number; // -1 to 1
  hue: number; // -180 to 180
  blur: number; // 0 to 1
  noise: number; // 0 to 1000
  pixelate: number; // 1 to 20
  grayscale: number; // 0 to 1
  sepia: number; // 0 to 1
  invert: boolean;
}

export interface EditorElement {
  id: string;
  fabricId: string;
  type: ElementType;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  scaleX: number;
  scaleY: number;
  zIndex: number;
  locked: boolean;
  visible: boolean;
  properties: ElementProperties;
  createdAt: number;
  updatedAt: number;
}

export interface EditorBackground {
  type: 'color' | 'image' | 'video';
  value: string;
}

export interface HistoryState {
  elements: EditorElement[];
  background: EditorBackground;
}

export interface EditorState {
  // Canvas dimensions
  canvasWidth: number;
  canvasHeight: number;
  
  // Canvas state
  elements: EditorElement[];
  selectedElementId: string | null;
  background: EditorBackground;
  zoom: number;
  
  // History (50 steps)
  history: HistoryState[];
  historyIndex: number;
  maxHistory: number;
  
  // UI state
  activeTool: ToolType;
  activePanel: PanelType;
  showGrid: boolean;
  showSafeZones: boolean;
  
  // Clipboard
  clipboard: EditorElement | null;
  
  // Actions
  addElement: (element: Omit<EditorElement, 'id' | 'zIndex' | 'fabricId' | 'createdAt' | 'updatedAt'>) => string;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  reorderElement: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  duplicateElement: (id: string) => string | null;
  toggleElementVisibility: (id: string) => void;
  toggleElementLock: (id: string) => void;
  renameElement: (id: string, name: string) => void;
  
  // History
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  
  // Canvas
  setZoom: (zoom: number) => void;
  setBackground: (bg: EditorBackground) => void;
  setActiveTool: (tool: ToolType) => void;
  setActivePanel: (panel: PanelType) => void;
  toggleGrid: () => void;
  toggleSafeZones: () => void;
  
  // Clipboard
  copyElement: (id: string) => void;
  pasteElement: () => string | null;
  
  // Get selected element
  getSelectedElement: () => EditorElement | null;
  
  // Reset
  reset: () => void;
  initWithBackground: (imageData: string) => void;
}

// Default filters
export const defaultFilters: ImageFilters = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  hue: 0,
  blur: 0,
  noise: 0,
  pixelate: 1,
  grayscale: 0,
  sepia: 0,
  invert: false,
};
