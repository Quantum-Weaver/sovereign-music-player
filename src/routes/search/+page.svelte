<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import AlbumCard from '$lib/components/AlbumCard.svelte';
  import TrackItem from '$lib/components/TrackItem.svelte';
  import { goto } from '$app/navigation';
  import type { Album, Artist } from '$lib/types/types';

  type Category = 'all' | 'artists' | 'albums' | 'tracks';

  let query = $state('');
  let category = $state<Category>('all');

  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);
  const albums = $derived(libraryStore.albums);
  const artists = $derived(libraryStore.artists);

  const q = $derived(query.toLowerCase().trim());

  const matchedTracks = $derived(
    q ? tracks.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.artist.toLowerCase().includes(q) ||
      t.album.toLowerCase().includes(q)
    ) : []
  );

  const matchedAlbums = $derived(
    q ? albums.filter(a =>
      a.name.toLowerCase().includes(q) ||
      a.artist.toLowerCase().includes(q)
    ) : []
  );

  const matchedArtists = $derived(
    q ? artists.filter(a => a.name.toLowerCase().includes(q)) : []
  );

  const hasResults = $derived(
    matchedTracks.length > 0 || matchedAlbums.length > 0 || matchedArtists.length > 0
  );

  const showArtists = $derived(category === 'all' || category === 'artists');
  const showAlbums = $derived(category === 'all' || category === 'albums');
  const showTracks = $derived(category === 'all' || category === 'tracks');

  function navigateAlbum(album: Album) {
    goto(`/library/album/${encodeURIComponent(album.name)}?artist=${encodeURIComponent(album.artist)}`);
  }

  function navigateArtist(artist: Artist) {
    goto(`/library/artist/${encodeURIComponent(artist.name)}`);
  }
</script>

<div
  class="search-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface: {colors.surface};
    --border-color: {colors.border};
  "
>
  <h2>Search</h2>

  <!-- Search input -->
  <!-- svelte-ignore a11y_autofocus -->
  <input
    class="search-input"
    type="search"
    placeholder="Artists, albums, tracks..."
    bind:value={query}
    aria-label="Search library"
    autofocus
  />

  <!-- Category tabs -->
  <div class="tabs">
    {#each (['all', 'artists', 'albums', 'tracks'] as Category[]) as cat}
      <button
        class="tab"
        class:active={category === cat}
        onclick={() => category = cat}
      >
        {cat.charAt(0).toUpperCase() + cat.slice(1)}
      </button>
    {/each}
  </div>

  <!-- Results -->
  {#if !q}
    <div class="empty-state">
      <span class="empty-icon">🔍</span>
      <p>Type to search your library.</p>
    </div>
  {:else if !hasResults}
    <div class="empty-state">
      <span class="empty-icon">😶</span>
      <p>No results for "{query}".</p>
    </div>
  {:else}
    <!-- Artists -->
    {#if showArtists && matchedArtists.length > 0}
      <section class="result-section">
        <h3 class="section-title">Artists</h3>
        <div class="artist-grid">
          {#each matchedArtists as artist (artist.id)}
            <button class="artist-chip" onclick={() => navigateArtist(artist)}>
              <span class="artist-letter">{artist.name.charAt(0).toUpperCase()}</span>
              <div class="artist-info">
                <span class="artist-name">{artist.name}</span>
                <span class="artist-meta">{artist.trackCount} track{artist.trackCount !== 1 ? 's' : ''}</span>
              </div>
            </button>
          {/each}
        </div>
      </section>
    {/if}

    <!-- Albums -->
    {#if showAlbums && matchedAlbums.length > 0}
      <section class="result-section">
        <h3 class="section-title">Albums</h3>
        <div class="album-grid">
          {#each matchedAlbums as album (album.id)}
            <AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
          {/each}
        </div>
      </section>
    {/if}

    <!-- Tracks -->
    {#if showTracks && matchedTracks.length > 0}
      <section class="result-section">
        <h3 class="section-title">Tracks</h3>
        <div class="track-list">
          {#each matchedTracks as track (track.id)}
            <TrackItem
              {track}
              index={0}
              showHeart={true}
              isCurrentTrack={playerStore.currentTrack?.id === track.id}
              onPlay={() => playerStore.loadTrack(track)}
            />
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style>
  .search-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg);
    color: var(--text);
    overflow-y: auto;
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
    margin-bottom: 1rem;
  }

  .search-input {
    width: 100%;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-surface);
    color: var(--text);
    font-size: 1rem;
    outline: none;
    margin-bottom: 1rem;
    transition: border-color 0.2s;
    box-sizing: border-box;
  }

  .search-input:focus { border-color: var(--accent); }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.25rem;
    gap: 0.1rem;
  }

  .tab {
    padding: 0.55rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab:hover { color: var(--accent); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
    color: var(--text-muted);
    text-align: center;
  }

  .empty-icon { font-size: 2.5rem; }

  .result-section {
    margin-bottom: 1.5rem;
  }

  .section-title {
    font-size: 0.8rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin-bottom: 0.75rem;
  }

  /* Artists */
  .artist-grid {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }

  .artist-chip {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.75rem;
    border: none;
    border-radius: 10px;
    background: var(--bg-surface);
    cursor: pointer;
    text-align: left;
    font: inherit;
    color: inherit;
    transition: background-color 0.15s;
  }

  .artist-chip:hover { background-color: color-mix(in srgb, var(--accent) 12%, transparent); }

  .artist-letter {
    width: 38px;
    height: 38px;
    border-radius: 50%;
    background-color: var(--accent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
  }

  .artist-info { display: flex; flex-direction: column; gap: 0.1rem; }
  .artist-name { font-size: 0.95rem; font-weight: 500; color: var(--text); }
  .artist-meta { font-size: 0.78rem; color: var(--text-secondary); }

  /* Albums */
  .album-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
    gap: 0.75rem;
  }

  /* Tracks */
  .track-list { display: flex; flex-direction: column; }
</style>
