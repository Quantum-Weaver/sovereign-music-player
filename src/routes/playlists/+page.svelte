<script lang="ts">
  import { playlistStore } from '$lib/stores/playlist.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { goto } from '$app/navigation';

  const colors = $derived(getThemeColors(themeStore.config));
  const playlists = $derived(playlistStore.playlists);

  let showCreate = $state(false);
  let newName = $state('');

  function handleCreate() {
    if (newName.trim()) {
      const id = playlistStore.createPlaylist(newName.trim());
      newName = '';
      showCreate = false;
      goto(`/playlists/${id}`);
    }
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete "${name}"?`)) {
      playlistStore.deletePlaylist(id);
    }
  }
</script>

<div class="playlists-page" style="--accent: {colors.accent}; --surface: {colors.surface}; --surface-light: {colors.surfaceLight};">
  <div class="header">
    <h2>Playlists</h2>
    <button class="add-btn" onclick={() => showCreate = !showCreate}>+ New</button>
  </div>

  {#if showCreate}
    <div class="create-row">
      <input
        type="text"
        class="create-input"
        placeholder="Playlist name..."
        bind:value={newName}
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <button class="create-btn" onclick={handleCreate}>Create</button>
    </div>
  {/if}

  {#if playlists.length === 0 && !showCreate}
    <div class="empty-state">
      <span class="text-5xl drop-shadow-[0_0_8px_var(--accent)]">📋</span>
      <p class="text-secondary">No playlists yet</p>
    </div>
  {:else}
    <div class="playlist-list">
      {#each playlists as playlist (playlist.id)}
        <div class="playlist-item">
          <button class="playlist-click" onclick={() => goto(`/playlists/${playlist.id}`)}>
            <div class="playlist-icon">
              <span>🎵</span>
            </div>
            <div class="playlist-info">
              <span class="playlist-name">{playlist.name}</span>
              <span class="playlist-meta">
                {playlist.trackIds.length} track{playlist.trackIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span class="chevron">›</span>
          </button>
          <button class="delete-btn" onclick={() => handleDelete(playlist.id, playlist.name)}>✕</button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .playlists-page {
    padding: 2rem;
    height: 100%;
    display: flex;
    flex-direction: column;
    background-color: var(--bg);
    color: var(--text);
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.75rem;
    font-weight: 700;
    color: var(--text);
  }

  .add-btn {
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--accent);
  }

  .create-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    background-color: var(--surface);
  }

  .create-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: none;
    font-size: 0.95rem;
    outline: none;
    background-color: var(--surface-light);
    color: var(--text);
  }

  .create-btn {
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
    background-color: var(--success);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }

  .text-secondary { color: var(--text-secondary); }

  .playlist-list { flex: 1; overflow-y: auto; }

  .playlist-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
  }

  .playlist-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    padding: 0.75rem 0;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
    transition: background-color 0.15s;
  }

  .playlist-click:hover { background-color: rgba(108, 92, 231, 0.08); }

  .playlist-icon {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
    background-color: var(--accent);
  }

  .playlist-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }

  .playlist-name {
    font-size: 1rem;
    font-weight: 500;
    color: var(--text);
  }

  .playlist-meta {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  .chevron {
    font-size: 1.5rem;
    padding-right: 0.5rem;
    color: var(--text-muted);
  }

  .delete-btn {
    background: none;
    border: none;
    color: var(--error);
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
  }
</style>