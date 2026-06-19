<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

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

  function scanLibrary() {
    // Will wire to Rust backend in Phase 6
    console.log('Scan requested');
  }

  function navigate(path: string) {
    window.location.href = path;
  }
</script>

<div class="library-page">
  <div class="header">
    <h1 style="color: var(--text);">Library</h1>
    <button class="scan-btn" style="background-color: var(--accent);">
      Scan Library
    </button>
  </div>
  <div class="placeholder" style="color: var(--text-secondary);">
    <span style="font-size: 4rem;">🎵</span>
    <p>Your music library will appear here</p>
  </div>
</div>

<style>
  .library-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
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
  }
  .scan-btn {
    color: white;
    border: none;
    padding: 0.5rem 1.5rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 0 20px rgba(108, 92, 231, 0.2);
  }
  .scan-btn:hover {
    box-shadow: 0 0 30px rgba(108, 92, 231, 0.4);
    transform: translateY(-1px);
  }
  .placeholder {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    font-size: 1.1rem;
  }
</style>