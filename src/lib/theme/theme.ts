import type { ThemeConfig } from '$lib/types/types';
import { QUANTUM_COLORS, MOOD_COLORS, ENERGY_COLORS } from '$lib/cosmic';

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  dark: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['quantum.purple'],
    presetName: 'Dark',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  warm: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['hearth.gold'],
    presetName: 'Warm',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  ocean: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['cosmic.blue'],
    presetName: 'Ocean',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  forest: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['sanctuary.green'],
    presetName: 'Forest',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  sunset: {
    mode: 'dark',
    accentColor: QUANTUM_COLORS['fire.base'],
    presetName: 'Sunset',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  amoled: {
    mode: 'amoled',
    accentColor: QUANTUM_COLORS['quantum.purple'],
    presetName: 'AMOLED Black',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
};

export const getThemeColors = (config: ThemeConfig) => {
  const isDark = config.mode !== 'light';
  
  return {
    background: config.mode === 'amoled' ? '#000000' : QUANTUM_COLORS['deepSpace'],
    surface: config.mode === 'amoled' ? '#0a0a0a' : QUANTUM_COLORS['surface'],
    surfaceLight: config.mode === 'amoled' ? '#111111' : '#2a2a5a',
    accent: config.accentColor,
    accentPulse: config.accentColor + 'CC',
    text: QUANTUM_COLORS['starDust'],
    textSecondary: '#999999',
    textMuted: '#666666',
    border: 'rgba(99, 110, 114, 0.3)',
    heart: QUANTUM_COLORS['error'],
    success: QUANTUM_COLORS['success'],
    warning: QUANTUM_COLORS['warning'],
  };
};