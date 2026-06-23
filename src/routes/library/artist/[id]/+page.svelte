<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import AlbumCard from '$lib/components/AlbumCard.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  const artistName = decodeURIComponent(page.params.id || 'undefined');
  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);

  const artistTracks = $derived(tracks.filter(t => t.artist.trim().toLowerCase() === artistName.toLowerCase()));

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
      goto('/nowplaying');
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
    --bg-surface: {colors.surface};
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

  <div class="album-grid">
    {#each albums as album (album.id)}
      <AlbumCard
        {album}
        size="small"
        onClick={() => goto(`/library/album/${encodeURIComponent(album.name)}?artist=${encodeURIComponent(artistName)}`)}
      />
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
    overflow-y: auto;
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

  h1 { font-size: 1.5rem; font-weight: 700; color: var(--text); }
  .artist-stats { color: var(--text-secondary); }

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

  .play-btn:hover { filter: brightness(1.1); }

  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.85rem;
  }
</style>
