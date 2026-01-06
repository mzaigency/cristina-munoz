import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import type { 
  EditorState, 
  EditorElement, 
  HistoryState, 
  ToolType, 
  PanelType 
} from './types';

// Generate unique ID
const generateId = () => {
  return `el_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

// Initial state
const initialState = {
  canvasWidth: 1080,
  canvasHeight: 1920,
  elements: [] as EditorElement[],
  selectedElementId: null as string | null,
  background: { type: 'color' as const, value: '#000000' },
  zoom: 1,
  history: [] as HistoryState[],
  historyIndex: -1,
  maxHistory: 50,
  activeTool: 'select' as ToolType,
  activePanel: 'none' as PanelType,
  showGrid: false,
  showSafeZones: true,
  clipboard: null as EditorElement | null,
};

export const useEditorStore = create<EditorState>()(
  immer((set, get) => ({
    ...initialState,

    // Add element
    addElement: (element) => {
      const id = generateId();
      const fabricId = `fabric_${id}`;
      const now = Date.now();
      
      let newElement: EditorElement;
      
      set((state) => {
        const maxZIndex = state.elements.length > 0 
          ? Math.max(...state.elements.map(e => e.zIndex)) 
          : 0;
        
        newElement = {
          ...element,
          id,
          fabricId,
          zIndex: maxZIndex + 1,
          createdAt: now,
          updatedAt: now,
        } as EditorElement;
        
        state.elements.push(newElement);
        state.selectedElementId = id;
      });
      
      // Save to history after adding
      get().saveToHistory();
      
      return id;
    },

    // Update element
    updateElement: (id, updates) => {
      set((state) => {
        const element = state.elements.find(e => e.id === id);
        if (element) {
          Object.assign(element, updates, { updatedAt: Date.now() });
        }
      });
    },

    // Delete element
    deleteElement: (id) => {
      set((state) => {
        const index = state.elements.findIndex(e => e.id === id);
        if (index !== -1) {
          state.elements.splice(index, 1);
          if (state.selectedElementId === id) {
            state.selectedElementId = null;
          }
        }
      });
      get().saveToHistory();
    },

    // Select element
    selectElement: (id) => {
      set((state) => {
        state.selectedElementId = id;
        if (id) {
          state.activeTool = 'select';
        }
      });
    },

    // Reorder element
    reorderElement: (id, direction) => {
      set((state) => {
        const element = state.elements.find(e => e.id === id);
        if (!element) return;
        
        const sortedElements = [...state.elements].sort((a, b) => a.zIndex - b.zIndex);
        const currentIndex = sortedElements.findIndex(e => e.id === id);
        
        switch (direction) {
          case 'up':
            if (currentIndex < sortedElements.length - 1) {
              const nextElement = sortedElements[currentIndex + 1];
              const tempZIndex = element.zIndex;
              element.zIndex = nextElement.zIndex;
              const nextEl = state.elements.find(e => e.id === nextElement.id);
              if (nextEl) nextEl.zIndex = tempZIndex;
            }
            break;
          case 'down':
            if (currentIndex > 0) {
              const prevElement = sortedElements[currentIndex - 1];
              const tempZIndex = element.zIndex;
              element.zIndex = prevElement.zIndex;
              const prevEl = state.elements.find(e => e.id === prevElement.id);
              if (prevEl) prevEl.zIndex = tempZIndex;
            }
            break;
          case 'top':
            const maxZIndex = Math.max(...state.elements.map(e => e.zIndex));
            element.zIndex = maxZIndex + 1;
            break;
          case 'bottom':
            const minZIndex = Math.min(...state.elements.map(e => e.zIndex));
            element.zIndex = minZIndex - 1;
            break;
        }
      });
      get().saveToHistory();
    },

    // Duplicate element
    duplicateElement: (id) => {
      const state = get();
      const element = state.elements.find(e => e.id === id);
      if (!element) return null;
      
      const newId = get().addElement({
        ...element,
        name: `${element.name} (copy)`,
        x: element.x + 20,
        y: element.y + 20,
        locked: false,
      });
      
      return newId;
    },

    // Toggle visibility
    toggleElementVisibility: (id) => {
      set((state) => {
        const element = state.elements.find(e => e.id === id);
        if (element) {
          element.visible = !element.visible;
          element.updatedAt = Date.now();
        }
      });
    },

    // Toggle lock
    toggleElementLock: (id) => {
      set((state) => {
        const element = state.elements.find(e => e.id === id);
        if (element) {
          element.locked = !element.locked;
          element.updatedAt = Date.now();
        }
      });
    },

    // Rename element
    renameElement: (id, name) => {
      set((state) => {
        const element = state.elements.find(e => e.id === id);
        if (element) {
          element.name = name;
          element.updatedAt = Date.now();
        }
      });
    },

    // Save to history
    saveToHistory: () => {
      set((state) => {
        const snapshot: HistoryState = {
          elements: JSON.parse(JSON.stringify(state.elements)),
          background: JSON.parse(JSON.stringify(state.background)),
        };
        
        // Remove any future history if we're not at the end
        if (state.historyIndex < state.history.length - 1) {
          state.history = state.history.slice(0, state.historyIndex + 1);
        }
        
        state.history.push(snapshot);
        
        // Limit history size
        if (state.history.length > state.maxHistory) {
          state.history.shift();
        } else {
          state.historyIndex = state.history.length - 1;
        }
      });
    },

    // Undo
    undo: () => {
      set((state) => {
        if (state.historyIndex > 0) {
          state.historyIndex--;
          const snapshot = state.history[state.historyIndex];
          state.elements = JSON.parse(JSON.stringify(snapshot.elements));
          state.background = JSON.parse(JSON.stringify(snapshot.background));
          state.selectedElementId = null;
        }
      });
    },

    // Redo
    redo: () => {
      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          state.historyIndex++;
          const snapshot = state.history[state.historyIndex];
          state.elements = JSON.parse(JSON.stringify(snapshot.elements));
          state.background = JSON.parse(JSON.stringify(snapshot.background));
          state.selectedElementId = null;
        }
      });
    },

    // Can undo
    canUndo: () => {
      return get().historyIndex > 0;
    },

    // Can redo
    canRedo: () => {
      const state = get();
      return state.historyIndex < state.history.length - 1;
    },

    // Set zoom
    setZoom: (zoom) => {
      set((state) => {
        state.zoom = Math.max(0.1, Math.min(3, zoom));
      });
    },

    // Set background
    setBackground: (bg) => {
      set((state) => {
        state.background = bg;
      });
      get().saveToHistory();
    },

    // Set active tool
    setActiveTool: (tool) => {
      set((state) => {
        state.activeTool = tool;
        // Auto-open relevant panel
        switch (tool) {
          case 'text':
            state.activePanel = 'text';
            break;
          case 'shapes':
            state.activePanel = 'shapes';
            break;
          case 'stickers':
            state.activePanel = 'stickers';
            break;
          case 'filters':
            state.activePanel = 'filters';
            break;
          case 'widgets':
            state.activePanel = 'widgets';
            break;
          default:
            state.activePanel = 'none';
        }
      });
    },

    // Set active panel
    setActivePanel: (panel) => {
      set((state) => {
        state.activePanel = panel;
      });
    },

    // Toggle grid
    toggleGrid: () => {
      set((state) => {
        state.showGrid = !state.showGrid;
      });
    },

    // Toggle safe zones
    toggleSafeZones: () => {
      set((state) => {
        state.showSafeZones = !state.showSafeZones;
      });
    },

    // Copy element
    copyElement: (id) => {
      const element = get().elements.find(e => e.id === id);
      if (element) {
        set((state) => {
          state.clipboard = JSON.parse(JSON.stringify(element));
        });
      }
    },

    // Paste element
    pasteElement: () => {
      const clipboard = get().clipboard;
      if (!clipboard) return null;
      
      return get().addElement({
        ...clipboard,
        name: `${clipboard.name} (paste)`,
        x: clipboard.x + 30,
        y: clipboard.y + 30,
        locked: false,
      });
    },

    // Get selected element
    getSelectedElement: () => {
      const state = get();
      if (!state.selectedElementId) return null;
      return state.elements.find(e => e.id === state.selectedElementId) || null;
    },

    // Reset store
    reset: () => {
      set((state) => {
        Object.assign(state, {
          ...initialState,
          history: [],
          historyIndex: -1,
        });
      });
    },

    // Init with background image
    initWithBackground: (imageData) => {
      set((state) => {
        state.elements = [];
        state.selectedElementId = null;
        state.background = { type: 'image', value: imageData };
        state.history = [];
        state.historyIndex = -1;
        state.activeTool = 'select';
        state.activePanel = 'none';
        state.zoom = 1;
      });
      get().saveToHistory();
    },
  }))
);
