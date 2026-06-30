// Basko Design System — Refreshed Palette
// Richer gradients, warmer accent colors, premium feel

export const Colors = {
  // Primary — Deep Indigo (replaces flat Royal Blue)
  primary: '#6366f1',
  primaryDark: '#4f46e5',
  primaryLight: '#a5b4fc',
  primaryGhost: '#eef2ff',
  
  // Warm Accent — Amber/Tangerine  
  accent: '#f59e0b',
  accentDark: '#d97706',
  accentLight: '#fef3c7',
  
  // Success — Emerald
  success: '#10b981',
  successDark: '#059669',
  successLight: '#d1fae5',
  
  // Danger — Rose
  danger: '#f43f5e',
  dangerDark: '#e11d48',
  dangerLight: '#ffe4e6',
  
  // Warning — Amber
  warning: '#f59e0b',
  warningDark: '#b45309',
  warningLight: '#fef3c7',
  
  // Neutrals — Slate
  bg: '#f8fafc',
  surface: '#ffffff',
  surfaceAlt: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',
  
  // Text
  textPrimary: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',
  textOnPrimary: '#ffffff',
  textOnAccent: '#78350f',
  
  // Gradients (use with LinearGradient)
  gradientPrimary: ['#6366f1', '#8b5cf6'],
  gradientWarm: ['#f59e0b', '#ef4444'],
  gradientSuccess: ['#10b981', '#06b6d4'],
  gradientDark: ['#1e293b', '#0f172a'],
  gradientSunrise: ['#f97316', '#f59e0b', '#eab308'],
};

// Spacing scale
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};

// Border radius
export const Radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

// Shadow presets
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};
