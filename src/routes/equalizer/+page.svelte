<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { invoke } from '@tauri-apps/api/core';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';

  interface EqStateResponse {
    enabled: boolean;
    bands:   number[];
    preamp:  number;
    labels:  string[];
  }

  const PRESETS = ['flat', 'rock', 'jazz', 'classical', 'vocal', 'bass_boost'] as const;
  type Preset = typeof PRESETS[number];

  const PRESET_LABELS: Record<Preset, string> = {
    flat:       'Flat',
    rock:       'Rock',
    jazz:       'Jazz',
    classical:  'Classical',
    vocal:      'Vocal',
    bass_boost: 'Bass Boost',
  };

  const colors = $derived(getThemeColors(themeStore.config));

  let enabled  = $state(false);
  let bands    = $state<number[]>(new Array(10).fill(0));
  let preamp   = $state(0);
  let labels   = $state<string[]>(['32','64','125','250','500','1k','2k','4k','8k','16k']);
  let loading  = $state(true);
  let activePreset = $state<Preset | null>(null);

  async function loadState() {
    try {
      const s: EqStateResponse = await invoke('get_eq_state');
      enabled = s.enabled;
      bands   = [...s.bands];
      preamp  = s.preamp;
      labels  = [...s.labels];
    } catch {
      // Not running inside Tauri (dev preview), keep defaults
    } finally {
      loading = false;
    }
  }

  async function setBand(index: number, value: number) {
    bands[index] = value;
    bands = [...bands]; // trigger reactivity
    activePreset = null;
    try { await invoke('set_eq_band', { band: index, gainDb: value }); } catch {}
  }

  async function setPreamp(value: number) {
    preamp = value;
    try { await invoke('set_eq_preamp', { gainDb: value }); } catch {}
  }

  async function toggleEnabled(val: boolean) {
    enabled = val;
    try { await invoke('toggle_eq', { enabled: val }); } catch {}
  }

  async function applyPreset(preset: Preset) {
    activePreset = preset;
    try {
      await invoke('set_eq_preset', { preset });
      const s: EqStateResponse = await invoke('get_eq_state');
      bands   = [...s.bands];
      enabled = s.enabled;
    } catch {}
  }

  function dbLabel(db: number): string {
    if (db === 0) return '0';
    return (db > 0 ? '+' : '') + db.toFixed(1);
  }

  onMount(loadState);
</script>

<div
  class="eq-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface: {colors.surface};
    --border-color: {colors.border};
  "
>
  <!-- Header -->
  <div class="eq-header">
    <button class="back-btn" onclick={() => goto('/settings')} aria-label="Back to settings">← Settings</button>
    <h2>Equalizer</h2>
    <label class="toggle-wrap" aria-label="Enable equalizer">
      <input
        type="checkbox"
        class="sr-only"
        checked={enabled}
        onchange={(e) => toggleEnabled((e.target as HTMLInputElement).checked)}
      />
      <span class="toggle-track" class:on={enabled}>
        <span class="toggle-thumb"></span>
      </span>
      <span class="toggle-label">{enabled ? 'On' : 'Off'}</span>
    </label>
  </div>

  <!-- Presets -->
  <div class="presets-row">
    {#each PRESETS as preset}
      <button
        class="preset-btn"
        class:active={activePreset === preset}
        onclick={() => applyPreset(preset)}
      >
        {PRESET_LABELS[preset]}
      </button>
    {/each}
  </div>

  {#if loading}
    <p class="loading-hint">Loading EQ state…</p>
  {:else}
    <!-- Sliders area -->
    <div class="sliders-wrap">
      <!-- Preamp -->
      <div class="slider-col preamp-col">
        <span class="band-db">{dbLabel(preamp)}</span>
        <div class="slider-track-wrap">
          <input
            type="range"
            class="vslider"
            min="-12" max="12" step="0.5"
            value={preamp}
            oninput={(e) => setPreamp(parseFloat((e.target as HTMLInputElement).value))}
            aria-label="Preamp gain"
            disabled={!enabled}
          />
          <div class="center-line"></div>
        </div>
        <span class="band-label">Pre</span>
      </div>

      <div class="divider"></div>

      <!-- 10 band sliders -->
      {#each bands as band, i}
        <div class="slider-col">
          <span class="band-db">{dbLabel(band)}</span>
          <div class="slider-track-wrap">
            <input
              type="range"
              class="vslider"
              min="-12" max="12" step="0.5"
              value={band}
              oninput={(e) => setBand(i, parseFloat((e.target as HTMLInputElement).value))}
              aria-label="{labels[i]} Hz band"
              disabled={!enabled}
            />
            <div class="center-line"></div>
          </div>
          <span class="band-label">{labels[i]}</span>
        </div>
      {/each}
    </div>

    <!-- dB scale on the side -->
    <div class="db-scale">
      {#each [12, 6, 0, -6, -12] as db}
        <span class="db-tick">{db > 0 ? '+' + db : db}</span>
      {/each}
    </div>
  {/if}

  <p class="hint">Changes apply in real-time to the current track.</p>
</div>

<style>
  .eq-page {
    padding: 1.5rem;
    height: 100%;
    overflow-y: auto;
    background-color: var(--bg);
    color: var(--text);
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  /* Header */
  .eq-header {
    display: flex;
    align-items: center;
    gap: 1rem;
  }

  .back-btn {
    background: none;
    border: 1px solid var(--border-color);
    border-radius: 6px;
    padding: 0.35rem 0.75rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.15s, border-color 0.15s;
    white-space: nowrap;
  }

  .back-btn:hover { color: var(--accent); border-color: var(--accent); }

  h2 {
    font-size: 1.5rem;
    font-weight: 700;
    flex: 1;
    margin: 0;
  }

  /* Toggle */
  .toggle-wrap {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    user-select: none;
  }

  .sr-only {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden; clip: rect(0,0,0,0);
    white-space: nowrap; border: 0;
  }

  .toggle-track {
    width: 40px;
    height: 22px;
    border-radius: 11px;
    background: rgba(255,255,255,0.15);
    border: 1px solid var(--border-color);
    position: relative;
    transition: background 0.2s, border-color 0.2s;
    display: block;
  }

  .toggle-track.on {
    background: var(--accent);
    border-color: var(--accent);
  }

  .toggle-thumb {
    position: absolute;
    top: 2px; left: 2px;
    width: 16px; height: 16px;
    border-radius: 50%;
    background: #fff;
    transition: transform 0.2s;
    display: block;
  }

  .toggle-track.on .toggle-thumb { transform: translateX(18px); }

  .toggle-label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
    min-width: 2rem;
  }

  /* Presets */
  .presets-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-btn {
    padding: 0.4rem 0.9rem;
    border-radius: 20px;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text-secondary);
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
  }

  .preset-btn:hover  { border-color: var(--accent); color: var(--accent); }
  .preset-btn.active { background: var(--accent); border-color: var(--accent); color: #fff; }

  /* Slider grid */
  .sliders-wrap {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
    padding: 0.5rem 0;
    overflow-x: auto;
    min-height: 200px;
  }

  .slider-col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.35rem;
    flex-shrink: 0;
    width: 36px;
  }

  .preamp-col { width: 44px; }

  .band-db {
    font-size: 0.68rem;
    font-weight: 600;
    color: var(--accent);
    min-height: 1rem;
    text-align: center;
  }

  .slider-track-wrap {
    position: relative;
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  /* Vertical range slider via writing-mode */
  .vslider {
    -webkit-appearance: none;
    appearance: none;
    writing-mode: vertical-lr;
    direction: rtl;
    width: 28px;
    height: 140px;
    background: transparent;
    cursor: pointer;
    outline: none;
    padding: 0;
    margin: 0;
  }

  .vslider:disabled { opacity: 0.35; cursor: default; }

  /* Track */
  .vslider::-webkit-slider-runnable-track {
    width: 4px;
    background: var(--border-color);
    border-radius: 2px;
  }

  /* Thumb */
  .vslider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    margin-left: -7px;
    box-shadow: 0 0 8px rgba(108, 92, 231, 0.5);
    transition: box-shadow 0.15s;
  }

  .vslider:hover::-webkit-slider-thumb {
    box-shadow: 0 0 16px rgba(108, 92, 231, 0.8);
  }

  /* Firefox */
  .vslider::-moz-range-track {
    width: 4px;
    background: var(--border-color);
    border-radius: 2px;
  }

  .vslider::-moz-range-thumb {
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--accent);
    border: none;
    box-shadow: 0 0 8px rgba(108, 92, 231, 0.5);
  }

  .center-line {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 1px;
    background: rgba(255,255,255,0.15);
    pointer-events: none;
  }

  .band-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-align: center;
  }

  .divider {
    width: 1px;
    height: 140px;
    background: var(--border-color);
    flex-shrink: 0;
    align-self: center;
    margin: 0 0.15rem;
  }

  /* dB scale */
  .db-scale {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 140px;
    padding-left: 0.5rem;
    position: absolute;
    right: 1rem;
    pointer-events: none;
  }

  .db-tick {
    font-size: 0.65rem;
    color: var(--text-muted);
    line-height: 1;
  }

  .hint {
    font-size: 0.78rem;
    color: var(--text-muted);
    margin-top: auto;
    padding-top: 0.5rem;
  }

  .loading-hint {
    color: var(--text-muted);
    font-size: 0.9rem;
  }
</style>
