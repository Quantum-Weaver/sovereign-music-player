<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { open } from '@tauri-apps/plugin-dialog';
  import { invoke } from '@tauri-apps/api/core';
  import type { Track } from '$lib/types/types';

  let searchQuery = $state('');
  let viewMode = $state<'artists' | 'albums' | 'genres'>('artists');

  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);
  const isScanning = $derived(libraryStore.isScanning);
  const scanProgress = $derived(libraryStore.scanProgress);

  const artists = $derived(libraryStore.artists);
  const albums = $derived(libraryStore.albums);
  const genres = $derived<string[]>([...new Set(tracks.map(t => t.genre).filter((g): g is string => g !== undefined && g !== null))]);

  const filteredArtists = $derived(
    searchQuery
      ? artists.filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
      : artists
  );

  const filteredAlbums = $derived(
    searchQuery
      ? albums.filter(a =>
          a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.artist.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : albums
  );

  const filteredGenres = $derived(
    searchQuery
      ? genres.filter(g => g.toLowerCase().includes(searchQuery.toLowerCase()))
      : genres
  );

  async function scanLibrary() {
    const selected = await open({
      directory: true,
      multiple: false,
      title: 'Select your music folder'
    });

    if (!selected) return;

    libraryStore.setScanning(true);
    libraryStore.setScanProgress(0);
    try {
      const dirPath = selected as string;
      const result = await invoke('scan_directory', { dirPath });
      const scannedTracks = result as Track[];
      await libraryStore.saveScannedTracks(scannedTracks);
      libraryStore.setTracks(scannedTracks);
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      libraryStore.setScanning(false);
      libraryStore.setScanProgress(0);
    }
  }

  function navigate(path: string) {
    window.location.href = path;
  }
</script>

<div class="library-page">
  <div class="header">
    <h1>Library</h1>
    <button
      class="scan-btn"
      onclick={scanLibrary}
      disabled={isScanning}
    >
      {isScanning
        ? `Scanning ${Math.round(scanProgress * 100)}%`
        : tracks.length > 0
          ? 'Rescan'
          : 'Scan Library'}
    </button>
  </div>

  {#if tracks.length === 0 && !isScanning}
    <div class="placeholder">
      <span class="text-6xl drop-shadow-[0_0_12px_var(--accent)]">🎵</span>
      <p>Your music library will appear here</p>
    </div>
  {:else}
    <input
      type="text"
      class="search-input"
      placeholder="Search artists, albums, genres..."
      bind:value={searchQuery}
    />

    <div class="tabs">
      {#each ['artists', 'albums', 'genres'] as mode}
        <button
          class="tab"
          class:active={viewMode === mode}
          onclick={() => viewMode = mode as 'artists' | 'albums' | 'genres'}
        >
          {mode.charAt(0).toUpperCase() + mode.slice(1)}
        </button>
      {/each}
    </div>

    <div class="list">
      {#if viewMode === 'artists'}
        {#each filteredArtists as artist (artist.id)}
          <button
            class="list-item"
            onclick={() => navigate(`/library/artist/${encodeURIComponent(artist.name)}`)}
          >
            <span class="item-text">{artist.name}</span>
            <span class="item-sub">{artist.trackCount} tracks</span>
          </button>
        {/each}
        {#if filteredArtists.length === 0 && searchQuery}
          <p class="empty-search">No artists match your search.</p>
        {/if}
      {:else if viewMode === 'albums'}
        {#each filteredAlbums as album (album.id)}
          <button
            class="list-item"
            onclick={() => navigate(`/library/album/${encodeURIComponent(album.name)}?artist=${encodeURIComponent(album.artist)}`)}
          >
            <span class="item-text">{album.name}</span>
            <span class="item-sub">{album.artist}</span>
          </button>
        {/each}
        {#if filteredAlbums.length === 0 && searchQuery}
          <p class="empty-search">No albums match your search.</p>
        {/if}
      {:else}
        {#each filteredGenres as genre (genre)}
          <button class="list-item">
            <span class="item-text">{genre}</span>
            <span class="item-sub">{tracks.filter(t => t.genre === genre).length} tracks</span>
          </button>
        {/each}
        {#if filteredGenres.length === 0 && searchQuery}
          <p class="empty-search">No genres match your search.</p>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .library-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
  }

  .scan-btn {
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--accent);
    box-shadow: 0 0 20px rgba(108, 92, 231, 0.2);
    transition: all 0.2s ease;
  }

  .scan-btn:hover:not(:disabled) {
    box-shadow: 0 0 30px rgba(108, 92, 231, 0.4);
    transform: translateY(-1px);
  }

  .scan-btn:disabled {
    opacity: 0.7;
    cursor: default;
  }

  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 1.1rem;
    color: var(--text-secondary);
  }

  .search-input {
    padding: 0.75rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color, rgba(99, 110, 114, 0.3));
    background-color: var(--bg-surface);
    color: var(--text);
    font-size: 0.95rem;
    margin-bottom: 1rem;
    outline: none;
    transition: border-color 0.2s;
  }

  .search-input:focus {
    border-color: var(--accent);
  }

  .tabs {
    display: flex;
    border-bottom: 1px solid var(--border-color, rgba(99, 110, 114, 0.3));
    margin-bottom: 0.5rem;
  }

  .tab {
    padding: 0.6rem 1.25rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.9rem;
    font-weight: 600;
    transition: all 0.15s;
  }

  .tab:hover {
    color: var(--accent);
  }

  .tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }

  .list {
    flex: 1;
    overflow-y: auto;
  }

  .list-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.85rem 0.5rem;
    border-bottom: 1px solid var(--border-color, rgba(99, 110, 114, 0.15));
    background: transparent;
    border-left: none;
    border-right: none;
    border-top: none;
    cursor: pointer;
    width: 100%;
    text-align: left;
    color: var(--text);
    transition: background-color 0.15s;
    font-size: inherit;
  }

  .list-item:hover {
    background-color: rgba(108, 92, 231, 0.08);
  }

  .item-text {
    font-size: 1rem;
    font-weight: 500;
  }

  .item-sub {
    font-size: 0.85rem;
    color: var(--text-secondary);
  }

  .empty-search {
    text-align: center;
    padding: 2rem;
    color: var(--text-muted);
  }
</style>