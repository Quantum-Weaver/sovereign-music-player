<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors, PRESET_THEMES } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
  const config = $derived(themeStore.config);

  const accentColors = ['#6C5CE7', '#FDCB6E', '#0984E3', '#00B894', '#E17055', '#FFD700', '#00CEC9', '#E84393'];
  const fontSizeOptions = ['small', 'medium', 'large'] as const;
  const shapeOptions = ['square', 'rounded', 'circular'] as const;
  const modeOptions = ['dark', 'light', 'amoled'] as const;

  const presetEmojis: Record<string, string> = {
    dark: '🌙', warm: '🔥', ocean: '🌊', forest: '🌿', sunset: '🌅', amoled: '🖤'
  };
</script>

<div class="settings-page" style="background-color: {colors.background}; color: {colors.text};">
  <h2>Settings</h2>

  <div class="content">
    <!-- Theme Presets -->
    <h3 style="color: {colors.textSecondary};">THEME PRESETS</h3>
    <div class="preset-grid">
      {#each Object.entries(PRESET_THEMES) as [key, theme]}
        <button
          class="preset-circle"
          style="background-color: {theme.accentColor}; border: {config.presetName === key || (!config.presetName && key === 'dark') ? '3px solid ' + colors.text : 'none'};"
          onclick={() => themeStore.setPreset(key)}
          aria-label="Accent color: {colors}"
        >
          <span>{presetEmojis[key] || '🎨'}</span>
        </button>
      {/each}
    </div>

    <!-- Accent Color -->
    <h3 style="color: {colors.textSecondary};">ACCENT COLOR</h3>
    <div class="color-row">
      {#each accentColors as color}
        <button
          class="color-dot"
          style="background-color: {color}; border: {config.accentColor === color ? '3px solid ' + colors.text : 'none'};"
          onclick={() => themeStore.setAccentColor(color)}
          aria-label="Accent color: {color}"
        ></button>
      {/each}
    </div>

    <!-- Display Mode -->
    <h3 style="color: {colors.textSecondary};">DISPLAY MODE</h3>
    <div class="option-row">
      {#each modeOptions as mode}
        <button
          class="option-btn"
          class:active={config.mode === mode}
          style="background-color: {config.mode === mode ? colors.accent : colors.surface}; border-color: {colors.border}; color: {config.mode === mode ? '#fff' : colors.text};"
          onclick={() => themeStore.setMode(mode)}
        >
          {mode === 'dark' ? '🌙 Dark' : mode === 'light' ? '☀️ Light' : '🖤 AMOLED'}
        </button>
      {/each}
    </div>

    <!-- Font Size -->
    <h3 style="color: {colors.textSecondary};">FONT SIZE</h3>
    <div class="option-row">
      {#each fontSizeOptions as size}
        <button
          class="option-btn"
          class:active={config.fontSize === size}
          style="background-color: {config.fontSize === size ? colors.accent : colors.surface}; border-color: {colors.border}; color: {config.fontSize === size ? '#fff' : colors.text};"
          onclick={() => themeStore.setFontSize(size)}
        >
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Album Art Shape -->
    <h3 style="color: {colors.textSecondary};">ALBUM ART SHAPE</h3>
    <div class="option-row">
      {#each shapeOptions as shape}
        <button
          class="option-btn"
          class:active={config.albumArtShape === shape}
          style="background-color: {config.albumArtShape === shape ? colors.accent : colors.surface}; border-color: {colors.border}; color: {config.albumArtShape === shape ? '#fff' : colors.text};"
          onclick={() => themeStore.setAlbumArtShape(shape)}
        >
          {shape.charAt(0).toUpperCase() + shape.slice(1)}
        </button>
      {/each}
    </div>

    <!-- App Info -->
    <p class="app-info" style="color: {colors.textMuted};">
      Sovereign Music Player v1.0<br/>
      Built with Aethelred · No ads · No subscriptions · Your music, your device
    </p>
  </div>
</div>

<style>
  .settings-page {
    padding: 2rem;
    height: 100%;
    overflow-y: auto;
  }
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
  }
  h3 {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 1.5rem;
    margin-bottom: 0.6rem;
  }
  .content {
    max-width: 500px;
  }
  .preset-grid {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }
  .preset-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: transform 0.15s;
  }
  .preset-circle:hover {
    transform: scale(1.1);
  }
  .color-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  .color-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    transition: transform 0.15s;
  }
  .color-dot:hover {
    transform: scale(1.15);
  }
  .option-row {
    display: flex;
    gap: 0.5rem;
  }
  .option-btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .app-info {
    margin-top: 2rem;
    font-size: 0.8rem;
    text-align: center;
    line-height: 1.5;
  }
</style>