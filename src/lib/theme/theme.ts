import type { ThemeConfig } from '$lib/types/types';

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  dark: {
    mode: 'dark',
    accentColor: '#9b59b6',
    presetName: 'Dark',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  warm: {
    mode: 'dark',
    accentColor: '#e67e22',
    presetName: 'Warm',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  ocean: {
    mode: 'dark',
    accentColor: '#3498db',
    presetName: 'Ocean',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  forest: {
    mode: 'dark',
    accentColor: '#2ecc71',
    presetName: 'Forest',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  sunset: {
    mode: 'dark',
    accentColor: '#e74c3c',
    presetName: 'Sunset',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
  amoled: {
    mode: 'amoled',
    accentColor: '#9b59b6',
    presetName: 'AMOLED Black',
    fontSize: 'medium',
    albumArtShape: 'rounded',
  },
};

export const getThemeColors = (config: ThemeConfig) => {
  const isDark = config.mode !== 'light';
  
  return {
    background: config.mode === 'amoled' ? '#000000' : isDark ? '#121212' : '#f5f5f5',
    surface: config.mode === 'amoled' ? '#0a0a0a' : isDark ? '#1e1e1e' : '#ffffff',
    surfaceLight: config.mode === 'amoled' ? '#111111' : isDark ? '#2a2a2a' : '#f0f0f0',
    accent: config.accentColor,
    accentPulse: config.accentColor + 'CC',
    text: isDark ? '#e0e0e0' : '#212121',
    textSecondary: isDark ? '#999999' : '#666666',
    textMuted: isDark ? '#666666' : '#999999',
    border: isDark ? '#333333' : '#e0e0e0',
    heart: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
  };
};