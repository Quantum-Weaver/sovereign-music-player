import { PRESET_THEMES } from '$lib/theme/theme';
import type { ThemeConfig } from '$lib/types/types';
import { browser } from '$app/environment';

let config = $state<ThemeConfig>(PRESET_THEMES.dark);

export const themeStore = {
  get config() {
    return config;
  },
  
  setPreset(presetName: string) {
    const preset = PRESET_THEMES[presetName];
    if (preset) {
      config = { ...preset };
      if (browser) localStorage.setItem('themeConfig', JSON.stringify(preset));
    }
  },

  setAccentColor(color: string) {
    config = { ...config, accentColor: color, presetName: undefined };
    if (browser) localStorage.setItem('themeConfig', JSON.stringify(config));
  },

  setMode(mode: 'dark' | 'light' | 'amoled') {
    config = { ...config, mode };
    if (browser) localStorage.setItem('themeConfig', JSON.stringify(config));
  },

  setFontSize(fontSize: 'small' | 'medium' | 'large') {
    config = { ...config, fontSize };
    if (browser) localStorage.setItem('themeConfig', JSON.stringify(config));
  },

  setAlbumArtShape(albumArtShape: 'square' | 'rounded' | 'circular') {
    config = { ...config, albumArtShape };
    if (browser) localStorage.setItem('themeConfig', JSON.stringify(config));
  },

  loadTheme() {
    if (browser) {
      try {
        const stored = localStorage.getItem('themeConfig');
        if (stored) config = JSON.parse(stored);
      } catch {}
    }
  }
};