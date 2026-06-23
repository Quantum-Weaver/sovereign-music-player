<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';

  let { mini = false }: { mini?: boolean } = $props();

  const isPlaying = $derived(playerStore.isPlaying);
  const position = $derived(playerStore.position);
  const duration = $derived(playerStore.duration);
  const volume = $derived(playerStore.volume);

  let dragging = false;

  function formatTime(secs: number): string {
    if (!secs || secs <= 0) return '0:00';
    const s = Math.floor(secs);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function formatRemaining(pos: number, dur: number): string {
    if (!dur || dur <= 0) return '0:00';
    const rem = Math.max(0, dur - pos);
    const s = Math.floor(rem);
    return `-${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function seekAt(e: PointerEvent) {
    if (duration <= 0) return;
    const bar = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    playerStore.seek(ratio * duration);
  }

  function onPointerDown(e: PointerEvent) {
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekAt(e);
  }

  function onPointerMove(e: PointerEvent) {
    if (dragging) seekAt(e);
  }

  function onPointerUp() {
    dragging = false;
  }
</script>

{#if !mini}
  <div class="progress-row">
    <span class="time">{formatTime(position)}</span>
    <div
      class="progress-bar"
      role="slider"
      aria-label="Playback position"
      aria-valuenow={Math.round(position)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      tabindex="0"
      onpointerdown={onPointerDown}
      onpointermove={onPointerMove}
      onpointerup={onPointerUp}
      onpointercancel={onPointerUp}
    >
      <div
        class="progress-fill"
        style="width: {duration > 0 ? (position / duration) * 100 : 0}%;"
      ></div>
    </div>
    <span class="time">{formatRemaining(position, duration)}</span>
  </div>
{/if}

<div class="controls-row" class:mini>
  <button class="ctrl-btn" onclick={() => playerStore.previous()} aria-label="Previous">⏮</button>
  <button
    class="play-btn"
    onclick={() => playerStore.togglePlay()}
    aria-label={isPlaying ? 'Pause' : 'Play'}
  >{isPlaying ? '⏸' : '▶'}</button>
  <button class="ctrl-btn" onclick={() => playerStore.next(true)} aria-label="Next">⏭</button>
  {#if !mini}
    <div class="volume-group">
      <span class="volume-icon" aria-hidden="true">🔊</span>
      <input
        type="range"
        class="volume-slider"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        oninput={(e) => playerStore.setVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
        aria-label="Volume"
      />
    </div>
  {/if}
</div>

<style>
  .progress-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 1.5rem;
  }

  .time {
    font-size: 0.75rem;
    width: 3rem;
    text-align: center;
    color: var(--text-muted, #666);
    flex-shrink: 0;
    font-variant-numeric: tabular-nums;
  }

  .progress-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
    background-color: var(--bg-surface-light, rgba(255, 255, 255, 0.15));
    position: relative;
    transition: height 0.1s;
    touch-action: none;
    user-select: none;
  }

  .progress-bar:hover {
    height: 6px;
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    background-color: var(--accent, #6C5CE7);
    pointer-events: none;
    transition: width 0.4s linear;
  }

  .controls-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.25rem;
  }

  .controls-row.mini {
    gap: 0.25rem;
    justify-content: flex-end;
  }

  .ctrl-btn {
    background: none;
    border: none;
    font-size: 1.6rem;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--text-secondary, #999);
    transition: transform 0.15s, color 0.15s;
    line-height: 1;
  }

  .mini .ctrl-btn {
    font-size: 1.2rem;
    padding: 0.2rem 0.4rem;
  }

  .ctrl-btn:hover {
    transform: scale(1.1);
    color: var(--text, #e0e0e0);
  }

  .play-btn {
    width: 56px;
    height: 56px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.5rem;
    color: white;
    background-color: var(--accent, #6C5CE7);
    transition: transform 0.15s;
    flex-shrink: 0;
    line-height: 1;
  }

  .mini .play-btn {
    width: 34px;
    height: 34px;
    font-size: 1rem;
  }

  .play-btn:hover {
    transform: scale(1.05);
  }

  .volume-group {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    margin-left: 0.75rem;
  }

  .volume-icon {
    font-size: 0.9rem;
    line-height: 1;
  }

  .volume-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 80px;
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    background: var(--bg-surface-light, rgba(255, 255, 255, 0.15));
    accent-color: var(--accent, #6C5CE7);
  }

  .volume-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 14px;
    height: 14px;
    border-radius: 50%;
    background-color: var(--accent, #6C5CE7);
    cursor: pointer;
  }
</style>
