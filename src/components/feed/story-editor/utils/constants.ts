// Constants for the Story Editor

// Canvas dimensions (Instagram Stories)
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1920;
export const CANVAS_ASPECT_RATIO = 9 / 16;

// Safe zones for content (considering notches, buttons, etc.)
export const SAFE_ZONE = {
  top: 120, // For status bar, close button
  bottom: 180, // For navigation, publish bar
  left: 32,
  right: 32,
};

// Google Fonts - Popular choices
export const FONTS = [
  { name: 'Inter', category: 'sans-serif' },
  { name: 'Roboto', category: 'sans-serif' },
  { name: 'Poppins', category: 'sans-serif' },
  { name: 'Montserrat', category: 'sans-serif' },
  { name: 'Open Sans', category: 'sans-serif' },
  { name: 'Lato', category: 'sans-serif' },
  { name: 'Nunito', category: 'sans-serif' },
  { name: 'Raleway', category: 'sans-serif' },
  { name: 'Oswald', category: 'sans-serif' },
  { name: 'Playfair Display', category: 'serif' },
  { name: 'Merriweather', category: 'serif' },
  { name: 'PT Serif', category: 'serif' },
  { name: 'Bebas Neue', category: 'display' },
  { name: 'Righteous', category: 'display' },
  { name: 'Pacifico', category: 'handwriting' },
  { name: 'Dancing Script', category: 'handwriting' },
  { name: 'Lobster', category: 'handwriting' },
  { name: 'Caveat', category: 'handwriting' },
  { name: 'Source Code Pro', category: 'monospace' },
  { name: 'Roboto Mono', category: 'monospace' },
];

// Font weights
export const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 200, label: 'Extra Light' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semi Bold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'Extra Bold' },
  { value: 900, label: 'Black' },
];

// Text colors with name
export const TEXT_COLORS = [
  { value: '#FFFFFF', name: 'White' },
  { value: '#000000', name: 'Black' },
  { value: '#FF3B30', name: 'Red' },
  { value: '#FF9500', name: 'Orange' },
  { value: '#FFCC00', name: 'Yellow' },
  { value: '#34C759', name: 'Green' },
  { value: '#007AFF', name: 'Blue' },
  { value: '#5856D6', name: 'Purple' },
  { value: '#FF2D55', name: 'Pink' },
  { value: '#AF52DE', name: 'Magenta' },
  { value: '#00C7BE', name: 'Teal' },
  { value: '#8E8E93', name: 'Gray' },
];

// Shape colors
export const SHAPE_COLORS = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#007AFF', '#5856D6', '#FF2D55', '#AF52DE',
  '#00C7BE', '#8E8E93', '#636366', '#48484A', '#3A3A3C',
];

// Brush colors for drawing
export const BRUSH_COLORS = [
  '#FFFFFF', '#000000', '#FF3B30', '#FF9500', '#FFCC00',
  '#34C759', '#007AFF', '#5856D6', '#FF2D55', '#AF52DE',
];

// Brush widths
export const BRUSH_WIDTHS = [2, 4, 8, 12, 20, 30];

// Popular emojis/stickers
export const POPULAR_EMOJIS = [
  '😀', '😍', '🥰', '😂', '🤣', '😊', '🥳', '🤩',
  '😎', '🔥', '💯', '❤️', '💕', '💖', '✨', '⭐',
  '🎉', '🎊', '🎁', '🎈', '👏', '🙌', '💪', '👍',
  '✌️', '🤞', '👋', '🙏', '💋', '🌟', '🌈', '☀️',
  '🌙', '⚡', '💥', '🎵', '🎶', '💃', '🕺', '🏆',
];

// Filter presets
export const FILTER_PRESETS = [
  {
    id: 'normal',
    name: 'Normal',
    filters: { brightness: 0, contrast: 0, saturation: 0, hue: 0, blur: 0, grayscale: 0, sepia: 0 },
  },
  {
    id: 'vibrant',
    name: 'Vibrant',
    filters: { brightness: 0.1, contrast: 0.1, saturation: 0.3, hue: 0, blur: 0, grayscale: 0, sepia: 0 },
  },
  {
    id: 'warm',
    name: 'Warm',
    filters: { brightness: 0.05, contrast: 0.05, saturation: 0.1, hue: 15, blur: 0, grayscale: 0, sepia: 0.2 },
  },
  {
    id: 'cool',
    name: 'Cool',
    filters: { brightness: 0, contrast: 0.1, saturation: -0.1, hue: -15, blur: 0, grayscale: 0, sepia: 0 },
  },
  {
    id: 'bw',
    name: 'B&W',
    filters: { brightness: 0.1, contrast: 0.2, saturation: 0, hue: 0, blur: 0, grayscale: 1, sepia: 0 },
  },
  {
    id: 'vintage',
    name: 'Vintage',
    filters: { brightness: 0.05, contrast: -0.1, saturation: -0.2, hue: 0, blur: 0, grayscale: 0, sepia: 0.4 },
  },
  {
    id: 'dramatic',
    name: 'Dramatic',
    filters: { brightness: -0.1, contrast: 0.3, saturation: 0.1, hue: 0, blur: 0, grayscale: 0, sepia: 0 },
  },
  {
    id: 'fade',
    name: 'Fade',
    filters: { brightness: 0.15, contrast: -0.1, saturation: -0.2, hue: 0, blur: 0, grayscale: 0, sepia: 0 },
  },
];

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS = {
  undo: ['ctrl+z', 'cmd+z'],
  redo: ['ctrl+shift+z', 'cmd+shift+z', 'ctrl+y'],
  copy: ['ctrl+c', 'cmd+c'],
  paste: ['ctrl+v', 'cmd+v'],
  duplicate: ['ctrl+d', 'cmd+d'],
  delete: ['delete', 'backspace'],
  selectAll: ['ctrl+a', 'cmd+a'],
  deselect: ['escape'],
  moveUp: ['arrowup'],
  moveDown: ['arrowdown'],
  moveLeft: ['arrowleft'],
  moveRight: ['arrowright'],
  moveUpFast: ['shift+arrowup'],
  moveDownFast: ['shift+arrowdown'],
  moveLeftFast: ['shift+arrowleft'],
  moveRightFast: ['shift+arrowright'],
};

// Default element names by type
export const DEFAULT_ELEMENT_NAMES = {
  text: 'Texto',
  image: 'Imagen',
  shape: 'Forma',
  sticker: 'Sticker',
  widget: 'Widget',
  drawing: 'Dibujo',
};

// Animation easing options
export const EASING_OPTIONS = [
  { value: 'linear', label: 'Linear' },
  { value: 'ease', label: 'Ease' },
  { value: 'ease-in', label: 'Ease In' },
  { value: 'ease-out', label: 'Ease Out' },
  { value: 'ease-in-out', label: 'Ease In Out' },
];

// Export quality settings
export const EXPORT_SETTINGS = {
  jpgQuality: 0.92,
  pngQuality: 1,
  maxFileSizeMB: 2,
};
