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

<div class="queue-page" style="background-color: {colors.background}; color: {colors.text};">
  <div class="header">
    <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>← Now Playing</button>
    {#if queue.length > 0}
      <button class="clear-btn" style="color: {colors.accent};" onclick={playerStore.clearQueue}>Clear All</button>
    {/if}
  </div>

  <h2>Up Next · {queue.length} track{queue.length !== 1 ? 's' : ''}</h2>

  {#if queue.length === 0}
    <div class="empty-state">
      <span style="font-size: 3rem;">📋</span>
      <p style="color: {colors.textSecondary};">Queue is empty</p>
      <p style="color: {colors.textMuted}; font-size: 0.85rem;">Right-click a track in your library to add it</p>
    </div>
  {:else}
    <div class="track-list">
      {#each queue as track, i (track.id + '_' + i)}
        <div
          class="track-item"
          style="border-bottom-color: {colors.border};"
        >
          <button class="track-click" onclick={() => playerStore.loadTrack(track)}>
            <span class="track-num" style="color: {currentTrack?.id === track.id ? colors.accent : colors.textMuted};">
              {currentTrack?.id === track.id ? '▶' : i + 1}
            </span>
            <div class="track-info">
              <span class="track-title" style="color: {currentTrack?.id === track.id ? colors.accent : colors.text};">
                {track.title}
              </span>
              <span class="track-artist" style="color: {colors.textSecondary};">
                {track.artist}
              </span>
            </div>
            <span class="track-dur" style="color: {colors.textMuted};">
              {formatDuration(track.duration)}
            </span>
          </button>
          <button
            class="remove-btn"
            onclick={() => playerStore.removeFromQueue(i)}
          >
            ✕
          </button>
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
  }
  h2 {
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 1rem;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .track-list {
    flex: 1;
    overflow-y: auto;
  }
  .track-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.5rem;
    border-bottom: 1px solid;
    background: transparent;
    border-left: none;
    border-right: none;
    border-top: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background-color 0.15s;
  }
  .track-item:hover {
    background-color: rgba(108, 92, 231, 0.08);
  }
  .track-num {
    width: 1.5rem;
    text-align: center;
    font-size: 0.9rem;
  }
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
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track-artist {
    font-size: 0.8rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .track-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    padding: 0;
    color: inherit;
    font: inherit;
  }  
  .track-dur {
    font-size: 0.85rem;
  }
  .remove-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.25rem;
  }
</style>