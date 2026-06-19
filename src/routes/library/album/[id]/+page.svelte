<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { page } from '$app/state';

  const albumName = decodeURIComponent(page.params.id || '');
  const artistName = decodeURIComponent(page.url.searchParams.get('artist') || '');

  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);

  const albumTracks = $derived(
    tracks
      .filter(t => t.album === albumName && t.artist === artistName)
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
  );

  const album = $derived(albumTracks[0]);
  const totalMins = $derived(Math.floor(albumTracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60));
  const currentTrack = $derived(playerStore.currentTrack);

  function formatDuration(seconds: number): string {
    if (!seconds || seconds <= 0) return '--:--';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function playTrack(index: number) {
    playerStore.loadQueue(albumTracks, index);
    window.location.href = '/nowplaying';
  }

  function playAll() {
    if (albumTracks.length > 0) {
      playerStore.loadQueue(albumTracks);
      window.location.href = '/nowplaying';
    }
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="album-page" style="background-color: {colors.background}; color: {colors.text};">
  <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>
    ← Artist
  </button>

  <div class="hero">
    <div class="album-art" style="background-color: {colors.accent};">
      <span>💿</span>
    </div>
    <h1>{albumName}</h1>
    <p style="color: {colors.textSecondary};">{artistName}</p>
    <p style="color: {colors.textMuted}; font-size: 0.85rem;">
      {albumTracks.length} tracks · {totalMins} min
      {album?.year ? ` · ${album.year}` : ''}
      {album?.genre ? ` · ${album.genre}` : ''}
    </p>
    <button class="play-btn" style="background-color: {colors.accent};" onclick={playAll}>
      ▶ Play Album
    </button>
  </div>

  <div class="track-list">
    {#each albumTracks as track, i (track.id)}
      <button
        class="track-item"
        style="border-bottom-color: {colors.border};"
        onclick={() => playTrack(i)}
        oncontextmenu={(e) => { e.preventDefault(); playerStore.addToQueue(track); }}
      >
        <span class="track-num" style="color: {currentTrack?.id === track.id ? colors.accent : colors.textMuted};">
          {currentTrack?.id === track.id ? '▶' : (track.trackNumber || i + 1)}
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
    {/each}
  </div>
</div>

<style>
  .album-page {
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
  .album-art {
    width: 160px;
    height: 160px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 3rem;
    color: white;
    margin-bottom: 1rem;
  }
  h1 {
    font-size: 1.35rem;
    font-weight: 700;
    text-align: center;
    padding: 0 1rem;
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
    width: 2rem;
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
</style>