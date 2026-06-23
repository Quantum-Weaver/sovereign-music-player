<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { goto } from '$app/navigation';
  import { slide } from 'svelte/transition';
  import PlayerControls from '$lib/components/PlayerControls.svelte';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const volume = $derived(playerStore.volume);
  const isFav = $derived(currentTrack ? libraryStore.isFavorite(currentTrack.id) : false);
  let expanded = $state(false);
  let heartAnimating = $state(false);

  function toggleFav() {
    if (!currentTrack) return;
    heartAnimating = true;
    setTimeout(() => { heartAnimating = false; }, 400);
    libraryStore.toggleFavorite(currentTrack.id);
  }
</script>

{#if currentTrack}
  {#if expanded}
    <div
      class="mini-backdrop"
      onclick={() => expanded = false}
      onkeydown={(e) => { if (e.key === 'Escape') expanded = false; }}
      role="button"
      tabindex="0"
      aria-label="Close expanded player"
    ></div>
  {/if}

  <div
    class="mini-player"
    style="
      --mini-accent: {colors.accent};
      --mini-surface: {colors.surface};
      --mini-text: {colors.text};
      --mini-text-secondary: {colors.textSecondary};
      --mini-border: {colors.border};
      --accent: {colors.accent};
      --text: {colors.text};
      --text-secondary: {colors.textSecondary};
      --text-muted: {colors.textMuted};
      --bg-surface-light: {colors.surfaceLight};
    "
  >
    {#if expanded}
      <div class="expanded-panel" transition:slide={{ duration: 220 }}>
        <div class="expanded-header">
          <div class="expanded-meta">
            <span class="exp-title">{currentTrack.title}</span>
            <span class="exp-artist">{currentTrack.artist}</span>
          </div>
          <div class="exp-actions">
            <button
              class="exp-btn heart"
              class:fav={isFav}
              class:pop={heartAnimating}
              onclick={toggleFav}
              aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >{isFav ? '❤️' : '🤍'}</button>
            <button
              class="exp-btn"
              onclick={() => goto('/equalizer')}
              aria-label="Open equalizer"
            >🎛️</button>
            <button
              class="exp-btn"
              onclick={() => { expanded = false; goto('/nowplaying'); }}
              aria-label="Open full view"
            >↗</button>
            <button
              class="exp-btn"
              onclick={() => expanded = false}
              aria-label="Collapse player"
            >⌄</button>
          </div>
        </div>
        <PlayerControls />
      </div>
    {/if}

    <div class="compact-bar">
      <button
        class="mini-click"
        onclick={() => expanded = !expanded}
        aria-label={expanded ? 'Collapse player' : 'Expand player'}
        aria-expanded={expanded}
      >
        <div class="artwork">
          {#if currentTrack?.coverArt}
            <img src={currentTrack.coverArt} alt="" class="art-img" />
          {:else}
            <span>💿</span>
          {/if}
        </div>
        <div class="info">
          <span class="title">{currentTrack.title}</span>
          <span class="artist">{currentTrack.artist}</span>
        </div>
      </button>

      <PlayerControls mini />

      <!-- Volume control in compact bar -->
      <div class="compact-vol">
        <span class="vol-icon" aria-hidden="true">🔊</span>
        <input
          type="range"
          class="vol-slider"
          min="0"
          max="1"
          step="0.01"
          value={volume}
          oninput={(e) => playerStore.setVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
          aria-label="Volume"
        />
      </div>

      <button
        class="compact-eq-btn"
        onclick={() => goto('/equalizer')}
        aria-label="Open equalizer"
        title="Equalizer"
      >🎛️</button>
    </div>
  </div>
{/if}

<style>
  .mini-backdrop {
    position: fixed;
    inset: 0;
    z-index: 49;
    background-color: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    border: none;
    cursor: default;
    padding: 0;
  }

  .mini-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
    display: flex;
    flex-direction: column;
    background-color: var(--mini-surface);
    border-top: 1px solid var(--mini-border);
  }

  .expanded-panel {
    padding: 1rem 1rem 0.5rem;
    border-bottom: 1px solid rgba(255, 255, 255, 0.06);
    overflow: hidden;
  }

  .expanded-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;
  }

  .expanded-meta {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    min-width: 0;
    flex: 1;
    padding-right: 0.75rem;
  }

  .exp-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .exp-artist {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .exp-actions {
    display: flex;
    gap: 0.25rem;
    flex-shrink: 0;
    align-items: center;
  }

  .exp-btn {
    background: none;
    border: 1px solid var(--mini-border);
    border-radius: 6px;
    padding: 0.25rem 0.5rem;
    font-size: 1rem;
    cursor: pointer;
    color: var(--text-secondary);
    transition: color 0.15s, border-color 0.15s;
    line-height: 1;
  }

  .exp-btn:hover { color: var(--accent); border-color: var(--accent); }

  .exp-btn.heart.fav { color: #E17055; border-color: #E17055; }
  .exp-btn.heart.pop { animation: heartPop 0.35s ease-out; }

  /* Compact bar */
  .compact-bar {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    height: 60px;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .mini-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
    padding: 0;
    overflow: hidden;
    min-width: 0;
  }

  .artwork {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    background-color: var(--mini-accent);
    overflow: hidden;
  }

  .art-img { width: 100%; height: 100%; object-fit: cover; }

  .info { flex: 1; overflow: hidden; min-width: 0; }

  .title {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    color: var(--mini-text);
  }

  .artist {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
    color: var(--mini-text-secondary);
  }

  /* Compact volume */
  .compact-vol {
    display: flex;
    align-items: center;
    gap: 0.2rem;
    flex-shrink: 0;
  }

  .vol-icon { font-size: 0.8rem; line-height: 1; }

  .vol-slider {
    -webkit-appearance: none;
    appearance: none;
    width: 60px;
    height: 4px;
    border-radius: 2px;
    outline: none;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.15);
    accent-color: var(--accent, #6C5CE7);
  }

  .vol-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--accent, #6C5CE7);
    cursor: pointer;
  }

  .vol-slider::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background-color: var(--accent, #6C5CE7);
    border: none;
    cursor: pointer;
  }

  /* EQ button in compact bar */
  .compact-eq-btn {
    background: none;
    border: none;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.25rem 0.35rem;
    color: var(--text-secondary);
    line-height: 1;
    transition: color 0.15s;
    flex-shrink: 0;
  }

  .compact-eq-btn:hover { color: var(--accent); }

  @keyframes heartPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.55); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
</style>
