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
      const tracks = await invoke('scan_directory', { dirPath });
      libraryStore.setTracks(tracks as Track[]);
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
    <button class="scan-btn" style="background-color: var(--accent);" onclick={scanLibrary}>
      Scan Library
    </button>
  </div>
  <div class="placeholder" style="color: var(--text-secondary);">
    <span style="font-size: 4rem --accent-glow;">🎵</span>
    <p>Your music library will appear here</p>
  </div>
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
    margin-bottom: 2rem;
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
    box-shadow: var(--accent-glow);
    transition: all 0.2s ease;
  }

  .scan-btn:hover {
    box-shadow: var(--accent-glow-hover);
    transform: translateY(-1px);
  }

  .scan-btn:disabled {
    opacity: 0.7;
    cursor: default;
    transform: none;
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
</style>