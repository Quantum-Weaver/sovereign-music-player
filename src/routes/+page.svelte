<script lang="ts">
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import AlbumCard from '$lib/components/AlbumCard.svelte';
  import GradientPulse from '$lib/components/GradientPulse.svelte';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import type { Album } from '$lib/types/types';

  const colors = $derived(getThemeColors(themeStore.config));
  const tracks = $derived(libraryStore.tracks);

  let recentAlbumIds = $state<string[]>([]);

  onMount(() => {
    try {
      const stored = localStorage.getItem('recent_albums');
      if (stored) recentAlbumIds = JSON.parse(stored);
    } catch {}
  });

  $effect(() => {
    const track = playerStore.currentTrack;
    if (!track) return;
    const albumId = `${track.album.trim()}|||${track.artist.trim()}`;
    const updated = [albumId, ...recentAlbumIds.filter(id => id !== albumId)].slice(0, 20);
    recentAlbumIds = updated;
    try { localStorage.setItem('recent_albums', JSON.stringify(updated)); } catch {}
  });

  const recentAlbums = $derived(
    recentAlbumIds
      .map(id => libraryStore.albums.find(a => a.id === id))
      .filter((a): a is Album => a !== undefined)
      .slice(0, 8)
  );

  const favoriteAlbums = $derived(
    (() => {
      const seen = new Set<string>();
      const result: Album[] = [];
      for (const trackId of libraryStore.favoriteTrackIds) {
        const track = libraryStore.getTrackById(trackId);
        if (!track) continue;
        const albumId = `${track.album.trim()}|||${track.artist.trim()}`;
        if (seen.has(albumId)) continue;
        seen.add(albumId);
        const album = libraryStore.albums.find(a => a.id === albumId);
        if (album) result.push(album);
      }
      return result.slice(0, 8);
    })()
  );

  function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  function getInsight(): string {
    const fav = libraryStore.favoriteTrackIds.size;
    const total = tracks.length;
    if (total === 0) return 'Your sanctuary awaits. Head to Library to scan your music.';
    if (fav > 0) return `${fav} track${fav !== 1 ? 's' : ''} in your favorites. ${total} in your library.`;
    return `${total} track${total !== 1 ? 's' : ''} in your library. Heart the ones that matter.`;
  }

  function navigateAlbum(album: Album) {
    goto(`/library/album/${encodeURIComponent(album.name)}?artist=${encodeURIComponent(album.artist)}`);
  }

  function resume() {
    if (playerStore.currentTrack) {
      playerStore.play();
      goto('/nowplaying');
    }
  }
</script>

<div class="home-page">
  <!-- Greeting with ambient glow -->
  <div class="greeting-wrap">
    <GradientPulse color={colors.accent} pulse={playerStore.isPlaying}>
      <div class="greeting-inner">
        <h1 class="stardust-text">{getGreeting()}</h1>
      </div>
    </GradientPulse>
  </div>

  <!-- Quick Actions -->
  <div class="quick-actions">
    <button
      class="action-btn primary"
      onclick={resume}
      disabled={!playerStore.currentTrack}
    >
      ▶ Resume
    </button>
    <button class="action-btn" onclick={() => goto('/playlists')}>
      🧘 Comfort Zone
    </button>
  </div>

  <!-- Insight line -->
  <p class="insight">{getInsight()}</p>

  <!-- Recently Played -->
  {#if recentAlbums.length > 0}
    <section class="section">
      <h3 class="section-title">Recently Played</h3>
      <div class="h-scroll">
        {#each recentAlbums as album (album.id)}
          <div class="h-card">
            <AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Favorites albums -->
  {#if favoriteAlbums.length > 0}
    <section class="section">
      <h3 class="section-title">Your Favorites</h3>
      <div class="h-scroll">
        {#each favoriteAlbums as album (album.id)}
          <div class="h-card">
            <AlbumCard {album} size="small" onClick={() => navigateAlbum(album)} />
          </div>
        {/each}
      </div>
    </section>
  {/if}

  <!-- Empty state when no library -->
  {#if tracks.length === 0}
    <div class="empty-state">
      <span class="empty-icon">🎵</span>
      <p class="empty-text">No music yet.</p>
      <button class="action-btn" onclick={() => goto('/library')}>Open Library</button>
    </div>
  {/if}
</div>

<style>
  .home-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    overflow-y: auto;
    background-color: var(--bg);
    color: var(--text);
  }

  .greeting-wrap {
    position: relative;
    padding: 1.5rem 0 0.5rem;
  }

  .greeting-inner {
    position: relative;
    z-index: 1;
  }

  h1.stardust-text {
    font-size: 2rem;
    font-weight: 700;
  }

  .quick-actions {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .action-btn {
    padding: 0.6rem 1.4rem;
    border-radius: 22px;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text);
    font-size: 0.9rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .action-btn:hover:not(:disabled) {
    border-color: var(--accent);
    color: var(--accent);
    box-shadow: 0 0 12px color-mix(in srgb, var(--accent) 25%, transparent);
  }

  .action-btn.primary {
    background: var(--accent);
    border-color: var(--accent);
    color: white;
  }

  .action-btn.primary:hover:not(:disabled) {
    filter: brightness(1.1);
    color: white;
    box-shadow: none;
  }

  .action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .insight {
    font-size: 0.85rem;
    color: var(--text-muted);
    line-height: 1.5;
    margin: 0;
  }

  .section {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .section-title {
    font-size: 1rem;
    font-weight: 700;
    color: var(--text);
    letter-spacing: 0.01em;
  }

  .h-scroll {
    display: flex;
    gap: 0.75rem;
    overflow-x: auto;
    padding-bottom: 0.5rem;
    scrollbar-width: thin;
  }

  .h-card {
    flex-shrink: 0;
    width: 140px;
  }

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

  .empty-icon { font-size: 3rem; }
  .empty-text { font-size: 0.9rem; }
</style>
