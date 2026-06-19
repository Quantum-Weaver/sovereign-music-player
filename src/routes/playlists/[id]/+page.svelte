<script lang="ts">
  import { playlistStore } from '$lib/stores/playlist.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { page } from '$app/state';

  const playlistId = page.params.id || '';
  const colors = $derived(getThemeColors(themeStore.config));

  const playlist = $derived(playlistStore.getPlaylist(playlistId));
  const tracks = $derived(
    (playlist?.trackIds || [])
      .map(id => libraryStore.getTrackById(id))
      .filter(t => t !== undefined)
  );

  function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function playAll() {
    if (tracks.length > 0) {
      playerStore.loadQueue(tracks);
      window.location.href = '/nowplaying';
    }
  }

  function playTrack(index: number) {
    playerStore.loadQueue(tracks, index);
    window.location.href = '/nowplaying';
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="playlist-detail" style="background-color: {colors.background}; color: {colors.text};">
  {#if !playlist}
    <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>← Playlists</button>
    <div class="empty-state">
      <p style="color: {colors.textSecondary};">Playlist not found</p>
    </div>
  {:else}
    <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>← Playlists</button>

    <div class="hero">
      <h1>{playlist.name}</h1>
      <p style="color: {colors.textSecondary};">
        {tracks.length} track{tracks.length !== 1 ? 's' : ''}
      </p>
      {#if tracks.length > 0}
        <button class="play-btn" style="background-color: {colors.accent};" onclick={playAll}>
          ▶ Play All
        </button>
      {/if}
    </div>

    {#if tracks.length === 0}
      <div class="empty-state">
        <span style="font-size: 2rem;">🎵</span>
        <p style="color: {colors.textSecondary};">No tracks in this playlist</p>
      </div>
    {:else}
      <div class="track-list">
        {#each tracks as track, i (track.id)}
          <div class="track-item" style="border-bottom-color: {colors.border};">
            <button class="track-click" onclick={() => playTrack(i)}>
              <span class="track-num" style="color: {colors.textMuted};">{i + 1}</span>
              <div class="track-info">
                <span class="track-title" style="color: {colors.text};">{track.title}</span>
                <span class="track-artist" style="color: {colors.textSecondary};">{track.artist}</span>
              </div>
              <span class="track-dur" style="color: {colors.textMuted};">
                {formatDuration(track.duration)}
              </span>
            </button>
            <button
              class="remove-btn"
              onclick={() => playlistStore.removeTrack(playlistId, track.id)}
            >
              ✕
            </button>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
</div>

<style>
  .playlist-detail {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  .back-btn {
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    margin-bottom: 1.5rem;
    align-self: flex-start;
  }
  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    margin-bottom: 2rem;
  }
  h1 {
    font-size: 1.5rem;
    font-weight: 700;
  }
  .play-btn {
    color: white;
    border: none;
    padding: 0.5rem 2rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
    transition: filter 0.15s;
  }
  .play-btn:hover {
    filter: brightness(1.1);
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
    border-bottom: 1px solid;
  }
  .track-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    padding: 0.7rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
  }
  .track-click:hover {
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
  .track-dur {
    font-size: 0.85rem;
  }
  .remove-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
  }
</style>