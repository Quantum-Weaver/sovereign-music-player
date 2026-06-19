<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const PRESETS = [15, 30, 45, 60, 90, 120];
  const colors = $derived(getThemeColors(themeStore.config));

  let duration = $state(0);
  let remaining = $state(0);
  let isRunning = $state(false);
  let fadeOut = $state(false);
  let interval = $state<ReturnType<typeof setInterval> | null>(null);

  function startTimer(mins: number) {
    duration = mins;
    remaining = mins;
    isRunning = true;
    interval = setInterval(() => {
      remaining -= 1;
      if (remaining <= 0) {
        isRunning = false;
        if (interval) clearInterval(interval);
        interval = null;
        duration = 0;
        // Will trigger audio fadeout in Phase 6
      }
    }, 60000);
  }

  function cancelTimer() {
    isRunning = false;
    duration = 0;
    remaining = 0;
    if (interval) clearInterval(interval);
    interval = null;
  }

  function formatTime(mins: number): string {
    if (mins >= 60) {
      const h = Math.floor(mins / 60);
      const m = mins % 60;
      return `${h}h ${m}m`;
    }
    return `${mins} min`;
  }
</script>

<div class="timer-page" style="background-color: {colors.background}; color: {colors.text};">
  <h2>Sleep Timer</h2>

  {#if isRunning}
    <div class="active-timer">
      <p style="color: {colors.textSecondary};">Music will stop in</p>
      <span class="timer-value" style="color: {colors.accent};">{formatTime(remaining)}</span>
      <div class="progress-bar" style="background-color: {colors.surfaceLight};">
        <div
          class="progress-fill"
          style="background-color: {colors.accent}; width: {((duration - remaining) / duration) * 100}%;"
        ></div>
      </div>
      <button class="cancel-btn" style="background-color: {colors.warning};" onclick={cancelTimer}>
        Cancel Timer
      </button>
    </div>
  {:else}
    <p class="label" style="color: {colors.textSecondary};">Select duration</p>
    <div class="presets">
      {#each PRESETS as mins}
        <button
          class="preset-btn"
          style="background-color: {colors.surface}; border-color: {colors.border}; color: {colors.text};"
          onclick={() => startTimer(mins)}
        >
          {formatTime(mins)}
        </button>
      {/each}
    </div>

    <div class="fade-row" style="border-top-color: {colors.border};">
      <span>Fade out at end</span>
      <button
        class="toggle"
        style="background-color: {fadeOut ? colors.accent : colors.surfaceLight};"
        onclick={() => fadeOut = !fadeOut}
      >
        <span class="dot" class:active={fadeOut}></span>
      </button>
    </div>
  {/if}
</div>

<style>
  .timer-page {
    padding: 2rem;
    height: 100%;
  }
  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    margin-bottom: 2rem;
  }
  .active-timer {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding-top: 3rem;
    gap: 1rem;
  }
  .timer-value {
    font-size: 3rem;
    font-weight: 700;
  }
  .progress-bar {
    width: 100%;
    height: 4px;
    border-radius: 2px;
    margin: 1rem 0;
  }
  .progress-fill {
    height: 100%;
    border-radius: 2px;
    transition: width 60s linear;
  }
  .cancel-btn {
    color: white;
    border: none;
    padding: 0.5rem 2rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
  }
  .label {
    margin-bottom: 0.75rem;
  }
  .presets {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .preset-btn {
    width: calc(33% - 0.35rem);
    padding: 1.2rem 0;
    border-radius: 12px;
    border: 1px solid;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    transition: background-color 0.15s;
  }
  .preset-btn:hover {
    background-color: rgba(108, 92, 231, 0.15);
  }
  .fade-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-top: 1.5rem;
    margin-top: 2rem;
    border-top: 1px solid;
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
    transition: background-color 0.2s;
  }
  .dot {
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: white;
    transition: transform 0.2s;
  }
  .dot.active {
    transform: translateX(20px);
  }
</style>