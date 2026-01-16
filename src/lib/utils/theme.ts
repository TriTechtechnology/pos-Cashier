// Simplified theme utilities for better performance
export const getThemeStyles = () => {
  return {
    selectionRing: 'ring-4 ring-primary ring-opacity-70 scale-105 shadow-xl z-50 border-primary',
    selectionOverlay: 'bg-primary/20',
    selectionText: 'bg-primary text-primary-foreground',
    highlightRing: 'ring-2 ring-accent ring-opacity-50 scale-102 border-accent',
    highlightOverlay: 'bg-accent/10',
    highlightText: 'bg-accent text-accent-foreground',
    borderColor: 'border-border',
    focusRing: 'focus:ring-2 focus:ring-primary focus:ring-opacity-50',
    // Inline style helpers
    selectionRingStyle: {},
    selectionOverlayStyle: {},
    selectionTextStyle: {},
    highlightRingStyle: {},
    highlightOverlayStyle: {},
    highlightTextStyle: {},
    borderColorStyle: {},
    focusRingStyle: {},
  };
};

// Predefined restaurant theme presets (simplified)
export const restaurantThemes = {
  golden: {
    name: 'Golden Elegance',
    primaryColor: '#E9E9E9',
    accentColor: '#FFD700',
    textColor: '#000000',
  },
  blue: {
    name: 'Ocean Blue',
    primaryColor: '#E9E9E9',
    accentColor: '#0066CC',
    textColor: '#FFFFFF',
  },
  green: {
    name: 'Forest Green',
    primaryColor: '#E9E9E9',
    accentColor: '#228B22',
    textColor: '#FFFFFF',
  },
  red: {
    name: 'Crimson Red',
    primaryColor: '#E9E9E9',
    accentColor: '#DC143C',
    textColor: '#FFFFFF',
  },
  purple: {
    name: 'Royal Purple',
    primaryColor: '#E9E9E9',
    accentColor: '#8A2BE2',
    textColor: '#FFFFFF',
  },
  orange: {
    name: 'Sunset Orange',
    primaryColor: '#E9E9E9',
    accentColor: '#FF8C00',
    textColor: '#000000',
  },
  custom: {
    name: 'Custom Colors',
    primaryColor: '#E9E9E9',
    accentColor: '#FFD700',
    textColor: '#E9E9E9',
  },
};
