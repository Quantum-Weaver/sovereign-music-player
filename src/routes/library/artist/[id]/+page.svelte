<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { page } from '$app/state';

  const artistName = decodeURIComponent(page.params.id || "undefined");
  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);
  
  const artistTracks = $derived(tracks.filter(t => t.artist === artistName));
  
  const albums = $derived(
    (() => {
      const albumMap = new Map<string, typeof libraryStore.albums[0]>();
      for (const track of artistTracks) {
        const key = track.album;
        if (!albumMap.has(key)) {
          albumMap.set(key, {
            id: key,
            name: track.album,
            artist: track.artist,
            tracks: [],
            coverArt: track.coverArt,
            year: track.year,
            genre: track.genre,
          });
        }
        albumMap.get(key)!.tracks.push(track);
      }
      return Array.from(albumMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    })()
  );

  function playAll() {
    if (artistTracks.length > 0) {
      playerStore.loadQueue(artistTracks);
      window.location.href = '/nowplaying';
    }
  }

  function goBack() {
    window.history.back();
  }
</script>

<div
  class="artist-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --border-color: {colors.border};
    --bg-surface-light: {colors.surfaceLight};
  "
>
  <button class="back-btn" onclick={goBack}>← Library</button>

  <div class="hero">
    <div class="avatar">
      <span>{artistName.charAt(0).toUpperCase()}</span>
    </div>
    <h1>{artistName}</h1>
    <p class="artist-stats">
      {albums.length} album{albums.length !== 1 ? 's' : ''} · {artistTracks.length} track{artistTracks.length !== 1 ? 's' : ''}
    </p>
    <button class="play-btn" onclick={playAll}>▶ Play All</button>
  </div>

  <div class="album-list">
    {#each albums as album (album.id)}
      <button
        class="album-item"
        onclick={() => window.location.href = `/library/album/${encodeURIComponent(album.name)}?artist=${encodeURIComponent(artistName)}`}
      >
        <div class="album-art-thumb">
          <span>💿</span>
        </div>
        <div class="album-info">
          <span class="album-name">{album.name}</span>
          <span class="album-meta">
            {album.tracks.length} tracks{album.year ? ` · ${album.year}` : ''}
          </span>
        </div>
        <span class="chevron">›</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .artist-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg);
    color: var(--text);
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
    color: var(--accent);
  }

  .hero {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 2rem;
  }

  .avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.5rem;
    font-weight: 700;
    color: white;
    background-color: var(--accent);
    margin-bottom: 0.5rem;
  }

  h1 {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }

  .artist-stats {
    color: var(--text-secondary);
  }

  .play-btn {
    color: white;
    border: none;
    padding: 0.5rem 2rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    margin-top: 0.5rem;
    background-color: var(--accent);
    transition: filter 0.15s;
  }

  .play-btn:hover {
    filter: brightness(1.1);
  }

  .album-list {
    flex: 1;
    overflow-y: auto;
  }

  .album-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 0.5rem;
    border: none;
    border-bottom: 1px solid var(--border-color);
    background: transparent;
    cursor: pointer;
    width: 100%;
    text-align: left;
    transition: background-color 0.15s;
    color: inherit;
    font: inherit;
  }

  .album-item:hover {
    background-color: rgba(108, 92, 231, 0.08);
  }

  .album-art-thumb {
    width: 48px;
    height: 48px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    background-color: var(--bg-surface-light);
  }

  .album-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .album-name {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text);
  }

  .album-meta {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .chevron {
    font-size: 1.5rem;
    color: var(--text-muted);
  }
</style>