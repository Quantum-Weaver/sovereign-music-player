<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import TrackItem from '$lib/components/TrackItem.svelte';

  const colors = $derived(getThemeColors(themeStore.config));
  const queue = $derived(playerStore.queue);
  const currentTrack = $derived(playerStore.currentTrack);

  function goBack() {
    window.history.back();
  }
</script>

<div
  class="queue-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --border-color: {colors.border};
    --bg-surface: {colors.surface};
  "
>
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
        <TrackItem
          {track}
          index={i + 1}
          showHeart={true}
          isCurrentTrack={currentTrack?.id === track.id}
          onPlay={() => playerStore.loadTrack(track)}
          onRemove={() => playerStore.removeFromQueue(i)}
        />
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
  .text-muted     { color: var(--text-muted); }

  .track-list { flex: 1; overflow-y: auto; }
</style>
