<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { playlistStore } from '$lib/stores/playlist.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import TrackItem from '$lib/components/TrackItem.svelte';
  import { page } from '$app/state';
  import { goto } from '$app/navigation';

  const albumName = decodeURIComponent(page.params.id || '');
  const artistName = decodeURIComponent(page.url.searchParams.get('artist') || '');

  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);
  const playlists = $derived(playlistStore.playlists);

  const albumTracks = $derived(
    tracks
      .filter(t =>
        t.album.trim().toLowerCase() === albumName.toLowerCase() &&
        t.artist.trim().toLowerCase() === artistName.toLowerCase()
      )
      .sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0))
  );

  const album = $derived(albumTracks[0]);
  const totalMins = $derived(Math.floor(albumTracks.reduce((sum, t) => sum + (t.duration || 0), 0) / 60));
  const currentTrack = $derived(playerStore.currentTrack);

  let albumMenuOpen = $state(false);

  function playTrack(index: number) {
    playerStore.loadQueue(albumTracks, index);
    goto('/nowplaying');
  }

  function playAll() {
    if (albumTracks.length > 0) {
      playerStore.loadQueue(albumTracks);
      goto('/nowplaying');
    }
  }

  function goBack() {
    window.history.back();
  }

  function addAlbumToPlaylist(playlistId: string) {
    for (const track of albumTracks) {
      playlistStore.addTrack(playlistId, track.id);
    }
    albumMenuOpen = false;
  }
</script>

{#if albumMenuOpen}
  <button class="backdrop" onclick={() => albumMenuOpen = false} aria-label="Close menu"></button>
{/if}

<div
  class="album-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --border-color: {colors.border};
    --bg-surface: {colors.surface};
  "
>
  <button class="back-btn" onclick={goBack}>← Artist</button>

  <div class="hero">
    <div class="album-art">
      {#if album?.coverArt}
        <img src={album.coverArt} alt="Album art" class="art-img" />
      {:else}
        <span>💿</span>
      {/if}
    </div>
    <h1>{albumName}</h1>
    <p class="artist-name">{artistName}</p>
    <p class="album-meta">
      {albumTracks.length} tracks · {totalMins} min
      {album?.year ? ` · ${album.year}` : ''}
      {album?.genre ? ` · ${album.genre}` : ''}
    </p>
    <div class="hero-actions">
      <button class="play-btn" onclick={playAll}>▶ Play Album</button>
      <div class="album-menu-wrap">
        <button class="playlist-btn" onclick={() => albumMenuOpen = !albumMenuOpen}>⊕ Add to Playlist</button>
        {#if albumMenuOpen}
          <div class="playlist-dropdown album-dropdown">
            <p class="dropdown-label">Add all tracks to</p>
            {#if playlists.length === 0}
              <p class="dropdown-empty">No playlists yet</p>
            {:else}
              {#each playlists as pl (pl.id)}
                <button class="dropdown-item" onclick={() => addAlbumToPlaylist(pl.id)}>{pl.name}</button>
              {/each}
            {/if}
          </div>
        {/if}
      </div>
    </div>
  </div>

  <div class="track-list">
    {#each albumTracks as track, i (track.id)}
      <TrackItem
        {track}
        index={track.trackNumber || i + 1}
        showHeart={true}
        showMenu={true}
        isCurrentTrack={currentTrack?.id === track.id}
        onPlay={() => playTrack(i)}
        {playlists}
        onAddToPlaylist={(plId) => playlistStore.addTrack(plId, track.id)}
      />
    {/each}
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    z-index: 9;
    background: transparent;
    border: none;
    cursor: default;
    padding: 0;
  }

  .album-page {
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
    background-color: var(--accent);
    margin-bottom: 1rem;
    overflow: hidden;
  }

  .art-img { width: 100%; height: 100%; object-fit: cover; }

  h1 {
    font-size: 1.35rem;
    font-weight: 700;
    text-align: center;
    padding: 0 1rem;
    color: var(--text);
  }

  .artist-name { color: var(--text-secondary); }
  .album-meta  { color: var(--text-muted); font-size: 0.85rem; }

  .hero-actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.5rem;
  }

  .album-menu-wrap { position: relative; }

  .play-btn {
    color: white;
    border: none;
    padding: 0.5rem 2rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--accent);
    transition: filter 0.15s;
  }

  .play-btn:hover { filter: brightness(1.1); }

  .playlist-btn {
    background: none;
    border: 1px solid var(--accent);
    padding: 0.5rem 1rem;
    border-radius: 20px;
    font-weight: 600;
    cursor: pointer;
    color: var(--accent);
    font-size: 0.9rem;
    transition: background-color 0.15s;
    white-space: nowrap;
  }

  .playlist-btn:hover { background-color: rgba(108, 92, 231, 0.1); }

  .album-dropdown {
    left: 50%;
    right: auto;
    transform: translateX(-50%);
    top: calc(100% + 0.5rem);
  }

  .track-list { flex: 1; overflow-y: auto; }

  /* Shared dropdown */
  .playlist-dropdown {
    position: absolute;
    z-index: 10;
    min-width: 170px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    overflow: hidden;
  }

  .dropdown-label {
    font-size: 0.7rem;
    font-weight: 700;
    letter-spacing: 0.5px;
    color: var(--text-muted);
    padding: 0.5rem 0.75rem 0.25rem;
    text-transform: uppercase;
  }

  .dropdown-empty { font-size: 0.85rem; color: var(--text-muted); padding: 0.5rem 0.75rem 0.75rem; }

  .dropdown-item {
    display: block;
    width: 100%;
    padding: 0.6rem 0.75rem;
    background: none;
    border: none;
    text-align: left;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--text);
    transition: background-color 0.1s;
    font: inherit;
  }

  .dropdown-item:hover { background-color: rgba(108, 92, 231, 0.12); }
</style>
