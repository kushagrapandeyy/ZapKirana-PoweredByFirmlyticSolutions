// ZapKirana Design System — Scanner Dark Utility Mode
// True black, high contrast, neon green accents

import { Platform } from 'react-native';

export const Colors = {
  // Pure Dark Mode Base
  bg: '#000000',
  surface: '#111827',
  surfaceAlt: '#1f2937',
  border: '#374151',
  
  // Neon Accents for scanning feedback
  primary: '#10b981', // Neon Green
  primaryDark: '#059669',
  primaryGhost: 'rgba(16, 185, 129, 0.15)',
  
  accent: '#3b82f6', // Bright Blue
  
  // States
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  
  // Text
  textPrimary: '#ffffff',
  textSecondary: '#9ca3af',
  textMuted: '#6b7280',
  
  // Gradients for overlays
  gradientDark: ['transparent', '#000000'],
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'sans-serif',
    mono: 'monospace',
  },
});

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
