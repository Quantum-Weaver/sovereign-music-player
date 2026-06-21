<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
  const queue = $derived(playerStore.queue);
  const currentTrack = $derived(playerStore.currentTrack);

  function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="queue-page" style="--accent: {colors.accent};">
  <div class="header">
    <button class="back-btn" onclick={goBack}>← Now Playing</button>
    {#if queue.length > 0}
      <button class="clear-btn" onclick={playerStore.clearQueue}>Clear All</button>
    {/if}
  </div>

  <h2>Up Next · {queue.length} track{queue.length !== 1 ? 's' : ''}</h2>

  {#if queue.length === 0}
    <div class="empty-state">
      <span class="text-5xl drop-shadow-[0_0_8px_var(--accent)]">📋</span>
      <p class="text-secondary">Queue is empty</p>
      <p class="text-muted text-sm">Right-click a track in your library to add it</p>
    </div>
  {:else}
    <div class="track-list">
      {#each queue as track, i (track.id + '_' + i)}
        <div class="track-item">
          <button class="track-click" onclick={() => playerStore.loadTrack(track)}>
            <span class="track-num" class:active={currentTrack?.id === track.id}>
              {currentTrack?.id === track.id ? '▶' : i + 1}
            </span>
            <div class="track-info">
              <span class="track-title" class:active={currentTrack?.id === track.id}>
                {track.title}
              </span>
              <span class="track-artist">{track.artist}</span>
            </div>
            <span class="track-dur">{formatDuration(track.duration)}</span>
          </button>
          <button class="remove-btn" onclick={() => playerStore.removeFromQueue(i)}>✕</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .queue-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg);
    color: var(--text);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
  }

  .back-btn, .clear-btn {
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    color: var(--accent);
  }

  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--text);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .text-secondary { color: var(--text-secondary); }
  .text-muted { color: var(--text-muted); }

  .track-list { flex: 1; overflow-y: auto; }

  .track-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    transition: background-color 0.15s;
  }

  .track-item:hover { background-color: rgba(108, 92, 231, 0.08); }

  .track-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0.7rem 0.5rem;
    color: inherit;
    font: inherit;
  }

  .track-num {
    width: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
    color: var(--text-muted);
  }

  .track-num.active { color: var(--accent); }

  .track-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
    overflow: hidden;
  }

  .track-title {
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--text);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-title.active { color: var(--accent); }

  .track-artist {
    font-size: 0.8rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .track-dur {
    font-size: 0.85rem;
    color: var(--text-muted);
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--error);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
  }
</style>