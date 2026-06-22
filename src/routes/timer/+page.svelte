<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { playerStore } from '$lib/stores/player.svelte';

  const PRESETS = [15, 30, 45, 60, 90, 120];
  const colors = $derived(getThemeColors(themeStore.config));

  let totalSecs = $state(0);
  let remainingSecs = $state(0);
  let isRunning = $state(false);
  let fadeOut = $state(false);
  let interval = $state<ReturnType<typeof setInterval> | null>(null);
  let fadeInterval = $state<ReturnType<typeof setInterval> | null>(null);
  let preTimerVolume = 0;

  function startFade() {
    preTimerVolume = playerStore.volume;
    const FADE_STEPS = 30;
    let step = 0;
    fadeInterval = setInterval(() => {
      step++;
      playerStore.setVolume(Math.max(0, preTimerVolume * (1 - step / FADE_STEPS)));
      if (step >= FADE_STEPS) {
        if (fadeInterval) clearInterval(fadeInterval);
        fadeInterval = null;
      }
    }, 2000);
  }

  function stopFade(restore: boolean) {
    if (fadeInterval) {
      clearInterval(fadeInterval);
      fadeInterval = null;
    }
    if (restore && preTimerVolume > 0) {
      playerStore.setVolume(preTimerVolume);
      preTimerVolume = 0;
    }
  }

  function startTimer(mins: number) {
    totalSecs = mins * 60;
    remainingSecs = mins * 60;
    isRunning = true;
    interval = setInterval(() => {
      remainingSecs -= 1;
      if (fadeOut && remainingSecs === 60 && totalSecs > 60 && !fadeInterval) {
        startFade();
      }
      if (remainingSecs <= 0) {
        isRunning = false;
        if (interval) clearInterval(interval);
        interval = null;
        stopFade(true);
        playerStore.pause();
        totalSecs = 0;
      }
    }, 1000);
  }

  function cancelTimer() {
    isRunning = false;
    totalSecs = 0;
    remainingSecs = 0;
    if (interval) clearInterval(interval);
    interval = null;
    stopFade(true);
  }

  function formatTime(mins: number): string {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins} min`;
  }

  function formatCountdown(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
</script>

<div
  class="timer-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --bg-surface: {colors.surface};
    --bg-surface-light: {colors.surfaceLight};
    --border-color: {colors.border};
    --warning: {colors.warning};
  "
>
  <h2>Sleep Timer</h2>

  {#if isRunning}
    <div class="active-timer">
      <p class="timer-label">Music will stop in</p>
      <span class="timer-value">{formatCountdown(remainingSecs)}</span>
      <div class="progress-bar">
        <div
          class="progress-fill"
          style="width: {totalSecs > 0 ? ((totalSecs - remainingSecs) / totalSecs) * 100 : 0}%;"
        ></div>
      </div>
      <button class="cancel-btn" onclick={cancelTimer}>Cancel Timer</button>
    </div>
  {:else}
    <p class="label">Select duration</p>
    <div class="presets">
      {#each PRESETS as mins}
        <button class="preset-btn" onclick={() => startTimer(mins)}>
          {formatTime(mins)}
        </button>
      {/each}
    </div>

    <div class="fade-row">
      <span>Fade out at end</span>
      <button
        class="toggle {fadeOut ? 'active' : ''}"
        onclick={() => fadeOut = !fadeOut}
        aria-label="Enable fade out"
        aria-pressed={fadeOut}
      >
        <span class="dot"></span>
      </button>
    </div>
  {/if}
</div>

<style>
  .timer-page {
    padding: 2rem;
    height: 100%;
    background-color: var(--bg);
    color: var(--text);
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 2rem;
    color: var(--text);
  }

  .label {
    margin-bottom: 0.75rem;
    color: var(--text-secondary);
  }

  /* Active Timer */
  .active-timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 3rem;
    gap: 1rem;
  }

  .timer-label {
    color: var(--text-secondary);
  }

  .timer-value {
    font-size: 3rem;
    font-weight: 700;
    color: var(--accent);
  }

  .progress-bar {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    margin: 1rem 0;
    background-color: var(--bg-surface-light);
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    background-color: var(--accent);
    transition: width 1s linear;
  }

  .cancel-btn {
    color: white;
    border: none;
    padding: 0.5rem 2rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--warning);
  }

  /* Presets */
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .preset-btn {
    width: calc(33% - 0.35rem);
    padding: 1.2rem 0;
    border-radius: 12px;
    border: 1px solid var(--border-color);
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--bg-surface);
    color: var(--text);
    transition: background-color 0.15s;
  }

  .preset-btn:hover {
    background-color: rgba(108, 92, 231, 0.15);
  }

  /* Fade Toggle */
  .fade-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    margin-top: 2rem;
    border-top: 1px solid var(--border-color);
    color: var(--text);
  }

  .toggle {
    width: 48px;
    height: 28px;
    border-radius: 14px;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    padding: 3px;
    background-color: var(--bg-surface-light);
    transition: background-color 0.2s;
  }

  .toggle.active {
    background-color: var(--accent);
  }

  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: white;
    transition: transform 0.2s;
  }

  .toggle.active .dot {
    transform: translateX(20px);
  }
</style>