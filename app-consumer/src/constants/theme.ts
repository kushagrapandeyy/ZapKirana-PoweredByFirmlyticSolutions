// ZapKirana Design System — Premium Grocery OS
// Warm off-white, Deep Green, Muted Gold

export const Colors = {
  // Primary — Deep Grocery Green
  primary: '#064e3b',
  primaryDark: '#022c22',
  primaryLight: '#34d399',
  primaryGhost: '#ecfdf5',
  
  // Warm Accent — Muted Gold / Champagne
  accent: '#d4af37',
  accentDark: '#b8860b',
  accentLight: '#fef3c7',
  
  // Success — Emerald
  success: '#10b981',
  successDark: '#059669',
  successLight: '#d1fae5',
  
  // Danger — Rose
  danger: '#e11d48',
  dangerDark: '#be123c',
  dangerLight: '#ffe4e6',
  
  // Warning — Amber
  warning: '#f59e0b',
  warningDark: '#b45309',
  warningLight: '#fef3c7',
  
  // Neutrals — Warm Ivory/Off-White base
  bg: '#fdfbf7', // Warm ivory
  surface: '#ffffff',
  surfaceAlt: '#f3f4f6',
  border: '#e5e7eb',
  borderLight: '#f9fafb',
  
  // Text
  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff',
  textOnAccent: '#451a03',
  
  // Gradients (use with LinearGradient)
  gradientPrimary: ['#064e3b', '#047857'],
  gradientWarm: ['#d4af37', '#f59e0b'],
  gradientSuccess: ['#10b981', '#34d399'],
  gradientDark: ['#111827', '#1f2937'],
  gradientSunrise: ['#f59e0b', '#d4af37', '#fbbf24'],
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

// Shadow presets - Smooth diffuse glassmorphism shadows
export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.08,
    shadowRadius: 32,
    elevation: 12,
  },
  glow: {
    shadowColor: '#064e3b',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
};
