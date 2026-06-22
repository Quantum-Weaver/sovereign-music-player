<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { goto } from '$app/navigation';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const isPlaying = $derived(playerStore.isPlaying);
</script>

{#if currentTrack}
  <div
    class="mini-player"
    style="
      --mini-accent: {colors.accent};
      --mini-surface: {colors.surface};
      --mini-text: {colors.text};
      --mini-text-secondary: {colors.textSecondary};
      --mini-border: {colors.border};
    "
  >
    <button class="mini-click" onclick={() => goto('/nowplaying')}>
      <div class="artwork">
        <span>💿</span>
      </div>
      <div class="info">
        <span class="title">{currentTrack.title}</span>
        <span class="artist">{currentTrack.artist}</span>
      </div>
    </button>
    <button class="ctrl-btn" onclick={(e) => { e.stopPropagation(); playerStore.togglePlay(); }}>
      <span>{isPlaying ? '⏸' : '▶️'}</span>
    </button>
    <button class="ctrl-btn" onclick={(e) => { e.stopPropagation(); playerStore.next(); }}>
      <span>⏭</span>
    </button>
  </div>
{/if}

<style>
  .mini-player {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid var(--mini-border);
    height: 60px;
    gap: 0.5rem;
    background-color: var(--mini-surface);
  }

  .mini-click {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex: 1;
    background: transparent;
    border: none;
    cursor: pointer;
    text-align: left;
    color: inherit;
    font: inherit;
    padding: 0;
    overflow: auto;
  }

  .artwork {
    width: 40px;
    height: 40px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    flex-shrink: 0;
    background-color: var(--mini-accent);
  }

  .info {
    flex: 1;
    overflow: auto;
  }

  .title {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: auto;
    text-overflow: ellipsis;
    display: block;
    color: var(--mini-text);
  }

  .artist {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: auto;
    text-overflow: ellipsis;
    display: block;
    color: var(--mini-text-secondary);
  }

  .ctrl-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.3rem;
    padding: 0.25rem 0.5rem;
    transition: transform 0.1s;
    color: var(--mini-text);
  }

  .ctrl-btn:hover {
    transform: scale(1.15);
  }
</style>