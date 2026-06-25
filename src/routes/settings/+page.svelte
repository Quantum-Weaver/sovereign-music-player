<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { getThemeColors, PRESET_THEMES } from '$lib/theme/theme';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';

  // ── Theme ────────────────────────────────────────────────────────────────
  const colors = $derived(getThemeColors(themeStore.config));
  const config = $derived(themeStore.config);

  const accentColors   = ['#6C5CE7','#FDCB6E','#0984E3','#00B894','#E17055','#FFD700','#00CEC9','#E84393'];
  const fontSizeOpts   = ['small','medium','large'] as const;
  const shapeOpts      = ['square','rounded','circular'] as const;
  const modeOpts       = ['dark','light','amoled'] as const;
  const presetEmojis: Record<string, string> = {
    dark:'🌙', warm:'🔥', ocean:'🌊', forest:'🌿', sunset:'🌅', amoled:'🖤',
  };

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

  // ── Equalizer ────────────────────────────────────────────────────────────
  interface EqStateResponse { enabled: boolean; bands: number[]; preamp: number; labels: string[]; }
  const EQ_PRESETS = ['flat','rock','jazz','classical','vocal','bass_boost'] as const;
  type Preset = typeof EQ_PRESETS[number];
  const PRESET_LABELS: Record<Preset, string> = {
    flat:'Flat', rock:'Rock', jazz:'Jazz', classical:'Classical', vocal:'Vocal', bass_boost:'Bass Boost',
  };

  let eqOpen      = $state(false);
  let eqEnabled   = $state(false);
  let eqBands     = $state<number[]>(new Array(10).fill(0));
  let eqPreamp    = $state(0);
  let eqLabels    = $state<string[]>(['32','64','125','250','500','1k','2k','4k','8k','16k']);
  let eqLoading   = $state(true);
  let activePreset = $state<Preset | null>(null);

  async function loadEq() {
    try {
      const s: EqStateResponse = await invoke('get_eq_state');
      eqEnabled = s.enabled;
      eqBands   = [...s.bands];
      eqPreamp  = s.preamp;
      eqLabels  = [...s.labels];
    } catch { /* not in Tauri */ }
    finally { eqLoading = false; }
  }

  async function setEqBand(i: number, v: number) {
    eqBands[i] = v;
    eqBands = [...eqBands];
    activePreset = null;
    try { await invoke('set_eq_band', { band: i, gainDb: v }); } catch {}
  }

  async function setEqPreamp(v: number) {
    eqPreamp = v;
    try { await invoke('set_eq_preamp', { gainDb: v }); } catch {}
  }

  async function toggleEq(val: boolean) {
    eqEnabled = val;
    try { await invoke('toggle_eq', { enabled: val }); } catch {}
  }

  async function applyPreset(preset: Preset) {
    activePreset = preset;
    try {
      await invoke('set_eq_preset', { preset });
      const s: EqStateResponse = await invoke('get_eq_state');
      eqBands = [...s.bands];
      eqEnabled = s.enabled;
    } catch {}
  }

  function dbLabel(db: number): string {
    return db === 0 ? '0' : (db > 0 ? '+' : '') + db.toFixed(1);
  }

  onMount(loadEq);
</script>

<div
  class="settings-page"
  style="
    --accent:       {colors.accent};
    --text:         {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted:   {colors.textMuted};
    --bg-surface:   {colors.surface};
    --bg-surf-light:{colors.surfaceLight};
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
        ><span>{presetEmojis[key] ?? '🎨'}</span></button>
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
          aria-label="Accent: {color}"
        ></button>
      {/each}
    </div>

    <!-- Display Mode -->
    <h3>DISPLAY MODE</h3>
    <div class="option-row">
      {#each modeOpts as mode}
        <button class="option-btn" class:active={config.mode === mode} onclick={() => themeStore.setMode(mode)}>
          {mode === 'dark' ? '🌙 Dark' : mode === 'light' ? '☀️ Light' : '🖤 AMOLED'}
        </button>
      {/each}
    </div>

    <!-- Font Size -->
    <h3>FONT SIZE</h3>
    <div class="option-row">
      {#each fontSizeOpts as size}
        <button class="option-btn" class:active={config.fontSize === size} onclick={() => themeStore.setFontSize(size)}>
          {size.charAt(0).toUpperCase() + size.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Album Art Shape -->
    <h3>ALBUM ART SHAPE</h3>
    <div class="option-row">
      {#each shapeOpts as shape}
        <button class="option-btn" class:active={config.albumArtShape === shape} onclick={() => themeStore.setAlbumArtShape(shape)}>
          {shape.charAt(0).toUpperCase() + shape.slice(1)}
        </button>
      {/each}
    </div>

    <!-- Equalizer Section -->
    <button class="section-toggle" onclick={() => eqOpen = !eqOpen} aria-expanded={eqOpen}>
      <span>🎛️ EQUALIZER</span>
      <span class="toggle-arrow">{eqOpen ? '▲' : '▼'}</span>
    </button>

    {#if eqOpen}
      <div class="eq-section">
        <div class="eq-header">
          <label class="toggle-wrap" aria-label="Enable equalizer">
            <input
              type="checkbox"
              class="sr-only"
              checked={eqEnabled}
              onchange={(e) => toggleEq((e.target as HTMLInputElement).checked)}
            />
            <span class="toggle-track" class:on={eqEnabled}><span class="toggle-thumb"></span></span>
            <span class="toggle-label">{eqEnabled ? 'On' : 'Off'}</span>
          </label>
        </div>

        <div class="presets-row">
          {#each EQ_PRESETS as preset}
            <button
              class="preset-btn"
              class:active={activePreset === preset}
              onclick={() => applyPreset(preset)}
            >{PRESET_LABELS[preset]}</button>
          {/each}
        </div>

        {#if eqLoading}
          <p class="loading-hint">Loading EQ state…</p>
        {:else}
          <div class="sliders-wrap">
            <!-- Preamp -->
            <div class="slider-col preamp-col">
              <span class="band-db">{dbLabel(eqPreamp)}</span>
              <div class="slider-track-wrap">
                <input type="range" class="vslider" min="-12" max="12" step="0.5"
                  value={eqPreamp}
                  oninput={(e) => setEqPreamp(parseFloat((e.target as HTMLInputElement).value))}
                  aria-label="Preamp gain" disabled={!eqEnabled}
                />
                <div class="center-line"></div>
              </div>
              <span class="band-label">Pre</span>
            </div>

            <div class="divider"></div>

            {#each eqBands as band, i}
              <div class="slider-col">
                <span class="band-db">{dbLabel(band)}</span>
                <div class="slider-track-wrap">
                  <input type="range" class="vslider" min="-12" max="12" step="0.5"
                    value={band}
                    oninput={(e) => setEqBand(i, parseFloat((e.target as HTMLInputElement).value))}
                    aria-label="{eqLabels[i]} Hz" disabled={!eqEnabled}
                  />
                  <div class="center-line"></div>
                </div>
                <span class="band-label">{eqLabels[i]}</span>
              </div>
            {/each}
          </div>
        {/if}
      </div>
    {/if}

    <!-- Library Data -->
    <h3>LIBRARY DATA</h3>
    <div class="action-row">
      <button class="danger-btn" onclick={clearLibrary}>Clear Library</button>
      <button class="danger-btn" onclick={fullRescan}>Full Rescan</button>
    </div>
    <p class="danger-desc">Clear Library removes all tracks. Full Rescan clears first, then opens a folder picker.</p>

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

  h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 1.5rem; color: var(--text); }

  h3 {
    font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;
    margin-top: 1.5rem; margin-bottom: 0.6rem;
    color: var(--text-secondary);
  }

  .content { max-width: 520px; }

  /* Presets */
  .preset-grid { display: flex; gap: 0.75rem; flex-wrap: wrap; }
  .preset-circle {
    width: 48px; height: 48px; border-radius: 50%;
    border: 3px solid transparent; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.2rem; transition: transform 0.15s, border-color 0.15s;
  }
  .preset-circle:hover { transform: scale(1.1); }
  .preset-circle.selected { border-color: var(--text); }

  /* Color dots */
  .color-row { display: flex; gap: 0.6rem; flex-wrap: wrap; }
  .color-dot {
    width: 32px; height: 32px; border-radius: 50%;
    border: 3px solid transparent; cursor: pointer;
    transition: transform 0.15s, border-color 0.15s;
  }
  .color-dot:hover { transform: scale(1.15); }
  .color-dot.selected { border-color: var(--text); }

  /* Option buttons */
  .option-row { display: flex; gap: 0.5rem; }
  .option-btn {
    padding: 0.5rem 1rem; border-radius: 8px;
    border: 1px solid var(--border-color);
    font-size: 0.85rem; font-weight: 600; cursor: pointer;
    background-color: var(--bg-surface); color: var(--text);
    transition: background-color 0.15s;
  }
  .option-btn:hover { background-color: rgba(108,92,231,0.15); }
  .option-btn.active { background-color: var(--accent); color: #fff; border-color: var(--accent); }

  /* Section toggle (EQ header) */
  .section-toggle {
    display: flex; justify-content: space-between; align-items: center;
    width: 100%; padding: 0.65rem 0.85rem;
    margin-top: 1.5rem;
    background: var(--bg-surface); border: 1px solid var(--border-color);
    border-radius: 8px; cursor: pointer; color: var(--text);
    font-size: 0.75rem; font-weight: 700; letter-spacing: 1px;
    transition: border-color 0.15s;
  }
  .section-toggle:hover { border-color: var(--accent); }
  .toggle-arrow { font-size: 0.65rem; color: var(--text-muted); }

  /* EQ section */
  .eq-section {
    border: 1px solid var(--border-color);
    border-top: none;
    border-radius: 0 0 8px 8px;
    padding: 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.85rem;
  }

  .eq-header { display: flex; align-items: center; gap: 1rem; }

  /* Toggle switch */
  .toggle-wrap { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; user-select: none; }
  .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
  .toggle-track {
    width: 40px; height: 22px; border-radius: 11px;
    background: rgba(255,255,255,0.15); border: 1px solid var(--border-color);
    position: relative; transition: background 0.2s, border-color 0.2s; display: block;
  }
  .toggle-track.on { background: var(--accent); border-color: var(--accent); }
  .toggle-thumb {
    position: absolute; top: 2px; left: 2px;
    width: 16px; height: 16px; border-radius: 50%;
    background: #fff; transition: transform 0.2s; display: block;
  }
  .toggle-track.on .toggle-thumb { transform: translateX(18px); }
  .toggle-label { font-size: 0.85rem; font-weight: 600; color: var(--text-secondary); min-width: 2rem; }

  /* EQ presets */
  .presets-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
  .preset-btn {
    padding: 0.35rem 0.8rem; border-radius: 20px;
    border: 1px solid var(--border-color);
    background: var(--bg-surface); color: var(--text-secondary);
    font-size: 0.8rem; font-weight: 600; cursor: pointer;
    transition: all 0.15s;
  }
  .preset-btn:hover { border-color: var(--accent); color: var(--accent); }
  .preset-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* Sliders */
  .sliders-wrap {
    display: flex; align-items: flex-end;
    gap: 0.4rem; padding: 0.25rem 0;
    overflow-x: auto; min-height: 190px;
  }
  .slider-col {
    display: flex; flex-direction: column; align-items: center;
    gap: 0.3rem; flex-shrink: 0; width: 34px;
  }
  .preamp-col { width: 42px; }
  .band-db {
    font-size: 0.65rem; font-weight: 600; color: var(--accent);
    min-height: 1rem; text-align: center;
  }
  .slider-track-wrap {
    position: relative; height: 140px;
    display: flex; align-items: center; justify-content: center;
  }
  .vslider {
    -webkit-appearance: none; appearance: none;
    writing-mode: vertical-lr; direction: rtl;
    width: 26px; height: 140px;
    background: transparent; cursor: pointer;
    outline: none; padding: 0; margin: 0;
  }
  .vslider:disabled { opacity: 0.35; cursor: default; }
  .vslider::-webkit-slider-runnable-track { width: 4px; background: var(--border-color); border-radius: 2px; }
  .vslider::-webkit-slider-thumb {
    -webkit-appearance: none; appearance: none;
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--accent); margin-left: -6px;
    box-shadow: 0 0 6px rgba(108,92,231,0.45);
    transition: box-shadow 0.15s;
  }
  .vslider:hover::-webkit-slider-thumb { box-shadow: 0 0 14px rgba(108,92,231,0.75); }
  .vslider::-moz-range-track { width: 4px; background: var(--border-color); border-radius: 2px; }
  .vslider::-moz-range-thumb {
    width: 16px; height: 16px; border-radius: 50%;
    background: var(--accent); border: none;
    box-shadow: 0 0 6px rgba(108,92,231,0.45);
  }
  .center-line {
    position: absolute; left: 50%; top: 50%;
    transform: translate(-50%,-50%);
    width: 18px; height: 1px;
    background: rgba(255,255,255,0.15); pointer-events: none;
  }
  .band-label { font-size: 0.68rem; color: var(--text-muted); text-align: center; }
  .divider { width: 1px; height: 140px; background: var(--border-color); flex-shrink: 0; align-self: center; }

  .loading-hint { color: var(--text-muted); font-size: 0.88rem; }

  /* Library */
  .action-row { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  .danger-btn {
    padding: 0.5rem 1.25rem; border-radius: 8px;
    border: 1px solid #e17055; font-size: 0.85rem; font-weight: 600;
    cursor: pointer; background: transparent; color: #e17055;
    transition: background-color 0.15s;
  }
  .danger-btn:hover { background-color: rgba(225,112,85,0.12); }
  .danger-desc { margin-top: 0.4rem; font-size: 0.8rem; color: var(--text-muted); }

  .app-info {
    margin-top: 2rem; font-size: 0.8rem; text-align: center;
    line-height: 1.5; color: var(--text-muted);
  }
</style>
