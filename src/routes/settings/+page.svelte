<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { getThemeColors, PRESET_THEMES } from '$lib/theme/theme';
  import { goto } from '$app/navigation';

  async function clearLibrary() {
    if (confirm('Delete all tracks from your library? Rescan your folders to rebuild it.')) {
      await libraryStore.clearLibrary();
    }
  }

  async function fullRescan() {
    if (confirm('Clear your library and immediately rescan a folder? A folder picker will open.')) {
      await libraryStore.clearLibrary();
      await libraryStore.startScan();
    }
  }

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

<div
  class="settings-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface: {colors.surface};
    --border-color: {colors.border};
  "
>
  <h2>Settings</h2>

  <div class="content">
    <!-- Theme Presets -->
    <h3>THEME PRESETS</h3>
    <div class="preset-grid">
      {#each Object.entries(PRESET_THEMES) as [key, theme]}
        <button
          class="preset-circle"
          class:selected={config.presetName === key || (!config.presetName && key === 'dark')}
          style="background-color: {theme.accentColor};"
          onclick={() => themeStore.setPreset(key)}
          aria-label="Theme: {key}"
        >
          <span>{presetEmojis[key] || '🎨'}</span>
        </button>
      {/each}
    </div>

    <!-- Accent Color -->
    <h3>ACCENT COLOR</h3>
    <div class="color-row">
      {#each accentColors as color}
        <button
          class="color-dot"
          class:selected={config.accentColor === color}
          style="background-color: {color};"
          onclick={() => themeStore.setAccentColor(color)}
          aria-label="Accent color: {color}"
        ></button>
      {/each}
    </div>

    <!-- Display Mode -->
    <h3>DISPLAY MODE</h3>
    <div class="option-row">
      {#each modeOptions as mode}
        <button
          class="option-btn"
          class:active={config.mode === mode}
          onclick={() => themeStore.setMode(mode)}
        >
          {mode === 'dark' ? '🌙 Dark' : mode === 'light' ? '☀️ Light' : '🖤 AMOLED'}
        </button>
      {/each}
    </div>

    <!-- Font Size -->
    <h3>FONT SIZE</h3>
    <div class="option-row">
      {#each fontSizeOptions as size}
        <button
          class="option-btn"
          class:active={config.fontSize === size}
          onclick={() => themeStore.setFontSize(size)}
        >
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Album Art Shape -->
    <h3>ALBUM ART SHAPE</h3>
    <div class="option-row">
      {#each shapeOptions as shape}
        <button
          class="option-btn"
          class:active={config.albumArtShape === shape}
          onclick={() => themeStore.setAlbumArtShape(shape)}
        >
          {shape.charAt(0).toUpperCase() + shape.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Audio -->
    <h3>AUDIO</h3>
    <button class="nav-btn" onclick={() => goto('/equalizer')}>🎛️ Equalizer →</button>

    <!-- Library Data -->
    <h3>LIBRARY DATA</h3>
    <div class="action-row">
      <button class="danger-btn" onclick={clearLibrary}>Clear Library</button>
      <button class="danger-btn" onclick={fullRescan}>Full Rescan (Clear &amp; Rescan)</button>
    </div>
    <p class="danger-desc">Clear Library removes all tracks. Full Rescan clears first, then opens a folder picker to rebuild.</p>

    <!-- App Info -->
    <p class="app-info">
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
    background-color: var(--bg);
    color: var(--text);
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 1.5rem;
    color: var(--text);
  }

  h3 {
    font-size: 0.75rem;
    font-weight: 700;
    letter-spacing: 1px;
    margin-top: 1.5rem;
    margin-bottom: 0.6rem;
    color: var(--text-secondary);
  }

  .content {
    max-width: 500px;
  }

  /* Presets */
  .preset-grid {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .preset-circle {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: transform 0.15s, border-color 0.15s;
  }

  .preset-circle:hover {
    transform: scale(1.1);
  }

  .preset-circle.selected {
    border-color: var(--text);
  }

  /* Color Dots */
  .color-row {
    display: flex;
    gap: 0.6rem;
    flex-wrap: wrap;
  }

  .color-dot {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 3px solid transparent;
    cursor: pointer;
    transition: transform 0.15s, border-color 0.15s;
  }

  .color-dot:hover {
    transform: scale(1.15);
  }

  .color-dot.selected {
    border-color: var(--text);
  }

  /* Option Buttons */
  .option-row {
    display: flex;
    gap: 0.5rem;
  }

  .option-btn {
    padding: 0.5rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--bg-surface);
    color: var(--text);
    transition: background-color 0.15s, color 0.15s;
  }

  .option-btn:hover {
    background-color: rgba(108, 92, 231, 0.15);
  }

  .option-btn.active {
    background-color: var(--accent);
    color: #fff;
    border-color: var(--accent);
  }

  .nav-btn {
    padding: 0.6rem 1.25rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s;
    text-align: left;
  }

  .nav-btn:hover { border-color: var(--accent); color: var(--accent); }

  .action-row {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }

  .danger-btn {
    padding: 0.5rem 1.25rem;
    border-radius: 8px;
    border: 1px solid #e17055;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    background-color: transparent;
    color: #e17055;
    transition: background-color 0.15s;
  }

  .danger-btn:hover {
    background-color: rgba(225, 112, 85, 0.12);
  }

  .danger-desc {
    margin-top: 0.4rem;
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  /* App Info */
  .app-info {
    margin-top: 2rem;
    font-size: 0.8rem;
    text-align: center;
    line-height: 1.5;
    color: var(--text-muted);
  }
</style>