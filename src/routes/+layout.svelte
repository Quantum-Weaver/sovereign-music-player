<script lang="ts">
  import { themeStore } from '$lib/stores/theme.svelte';
  import { playlistStore } from '$lib/stores/playlist.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import type { Snippet } from 'svelte';
  import MiniPlayer from '$lib/components/MiniPlayer.svelte';
  import '../app.css';

  let { children }: { children: Snippet } = $props();
  let currentRoute = $state('library');

  onMount(() => {
    themeStore.loadTheme();
    playlistStore.loadPlaylists();
  });

  $effect(() => {
    const path = page.url.pathname;
    if (path.includes('playlist')) currentRoute = 'playlists';
    else if (path.includes('timer')) currentRoute = 'timer';
    else if (path.includes('settings')) currentRoute = 'settings';
    else currentRoute = 'library';
  });

  const config = $derived(themeStore.config);
  const colors = $derived(getThemeColors(config));

  const navItems = [
    { id: 'library', label: 'Library', icon: '📚', href: '/' },
    { id: 'playlists', label: 'Playlists', icon: '📋', href: '/playlists' },
    { id: 'timer', label: 'Timer', icon: '⏰', href: '/timer' },
    { id: 'settings', label: 'Settings', icon: '⚙️', href: '/settings' },
  ];

  function handleNav(href: string) {
    window.location.href = href;
  }
</script>

<div
  class="app-shell"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface: {colors.surface};
    --border-color: {colors.border};
    font-size: {config.fontSize === 'small' ? '14px' : config.fontSize === 'large' ? '18px' : '16px'};
  "
>
  <nav class="sidebar">
    <div class="sidebar-header">
      <span class="text-2xl drop-shadow-[0_0_8px_var(--accent)]">🎵</span>
      <span class="font-bold text-[var(--text)]">Sovereign</span>
    </div>
    
    {#each navItems as item}
      <button
        class="nav-item {currentRoute === item.id ? 'active' : ''}"
        style="color: {currentRoute === item.id ? 'var(--accent)' : 'var(--text-secondary)'};"
        onclick={() => handleNav(item.href)}
      >
        <span class="nav-icon drop-shadow-[0_0_6px_var(--accent)]">{item.icon}</span>
        <span>{item.label}</span>
      </button>
    {/each}
  </nav>

  <main class="content">
    {#if children}
      {@render children()}
    {/if}
  </main>

  <MiniPlayer />
</div>

<style>
  .app-shell {
    display: flex;
    height: 100vh;
    overflow: hidden;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background-color: var(--bg);
    color: var(--text);
  }

  .sidebar {
    width: 200px;
    display: flex;
    flex-direction: column;
    padding: 1rem;
    gap: 0.25rem;
    flex-shrink: 0;
    background: linear-gradient(180deg, var(--bg-surface) 0%, rgba(12, 15, 29, 0.95) 100%);
    border-right: 1px solid var(--border-color);
  }

  .sidebar-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    margin-bottom: 1rem;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    background: transparent;
    cursor: pointer;
    font-size: inherit;
    transition: all 0.2s ease;
    width: 100%;
    text-align: left;
  }

  .nav-item:hover {
    background-color: rgba(108, 92, 231, 0.15);
    box-shadow: 0 0 15px rgba(108, 92, 231, 0.1);
  }

  .nav-item.active {
    background-color: rgba(108, 92, 231, 0.2);
    border-left: 3px solid var(--accent);
  }

  .nav-icon {
    font-size: 1.2rem;
    width: 1.5rem;
    text-align: center;
  }

  .content {
    flex: 1;
    overflow-y: auto;
    background-color: var(--bg);
  }
</style>