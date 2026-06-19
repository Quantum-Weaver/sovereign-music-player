<script lang="ts">
  import { playlistStore } from '$lib/stores/playlist.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
  const playlists = $derived(playlistStore.playlists);

  let showCreate = $state(false);
  let newName = $state('');

  function handleCreate() {
    if (newName.trim()) {
      const id = playlistStore.createPlaylist(newName.trim());
      newName = '';
      showCreate = false;
      window.location.href = `/playlists/${id}`;
    }
  }

  function handleDelete(id: string, name: string) {
    if (confirm(`Delete "${name}"?`)) {
      playlistStore.deletePlaylist(id);
    }
  }
</script>

<div class="playlists-page" style="background-color: {colors.background}; color: {colors.text};">
  <div class="header">
    <h2>Playlists</h2>
    <button class="add-btn" style="background-color: {colors.accent};" onclick={() => showCreate = !showCreate}>
      + New
    </button>
  </div>

  {#if showCreate}
    <div class="create-row" style="background-color: {colors.surface};">
      <input
        type="text"
        class="create-input"
        style="background-color: {colors.surfaceLight}; color: {colors.text};"
        placeholder="Playlist name..."
        bind:value={newName}
        onkeydown={(e) => e.key === 'Enter' && handleCreate()}
      />
      <button class="create-btn" style="background-color: {colors.success};" onclick={handleCreate}>
        Create
      </button>
    </div>
  {/if}

  {#if playlists.length === 0 && !showCreate}
    <div class="empty-state">
      <span style="font-size: 3rem;">📋</span>
      <p style="color: {colors.textSecondary};">No playlists yet</p>
    </div>
  {:else}
    <div class="playlist-list">
      {#each playlists as playlist (playlist.id)}
        <div class="playlist-item" style="border-bottom-color: {colors.border};">
          <button class="playlist-click" onclick={() => window.location.href = `/playlists/${playlist.id}`}>
            <div class="playlist-icon" style="background-color: {colors.accent};">
              <span>🎵</span>
            </div>
            <div class="playlist-info">
              <span class="playlist-name" style="color: {colors.text};">{playlist.name}</span>
              <span class="playlist-meta" style="color: {colors.textSecondary};">
                {playlist.trackIds.length} track{playlist.trackIds.length !== 1 ? 's' : ''}
              </span>
            </div>
            <span class="chevron" style="color: {colors.textMuted};">›</span>
          </button>
          <button
            class="delete-btn"
            onclick={() => handleDelete(playlist.id, playlist.name)}
          >
            ✕
          </button>
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
  }
  .add-btn {
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  .create-row {
    display: flex;
    gap: 0.5rem;
    padding: 0.75rem;
    border-radius: 8px;
    margin-bottom: 1rem;
  }
  .create-input {
    flex: 1;
    padding: 0.5rem 0.75rem;
    border-radius: 6px;
    border: none;
    font-size: 0.95rem;
    outline: none;
  }
  .create-btn {
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-weight: 600;
    cursor: pointer;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
  }
  .playlist-list {
    flex: 1;
    overflow-y: auto;
  }
  .playlist-item {
    display: flex;
    align-items: center;
    border-bottom: 1px solid;
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
  .playlist-click:hover {
    background-color: rgba(108, 92, 231, 0.08);
  }
  .playlist-icon {
    width: 44px;
    height: 44px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    flex-shrink: 0;
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
  }
  .playlist-meta {
    font-size: 0.8rem;
  }
  .chevron {
    font-size: 1.5rem;
    padding-right: 0.5rem;
  }
  .delete-btn {
    background: none;
    border: none;
    color: #e74c3c;
    cursor: pointer;
    font-size: 1rem;
    padding: 0.5rem;
  }
</style>