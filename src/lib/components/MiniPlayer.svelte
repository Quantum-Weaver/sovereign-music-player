<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { goto } from '$app/navigation';
  import PlayerControls from '$lib/components/PlayerControls.svelte';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
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
      --accent: {colors.accent};
      --text: {colors.text};
      --text-secondary: {colors.textSecondary};
      --text-muted: {colors.textMuted};
      --bg-surface-light: {colors.surfaceLight};
    "
  >
    <button class="mini-click" onclick={() => goto('/nowplaying')}>
      <div class="artwork">
        {#if currentTrack?.coverArt}
          <img src={currentTrack.coverArt} alt="" class="art-img" />
        {:else}
          <span>💿</span>
        {/if}
      </div>
      <div class="info">
        <span class="title">{currentTrack.title}</span>
        <span class="artist">{currentTrack.artist}</span>
      </div>
    </button>
    <PlayerControls mini />
  </div>
{/if}

<style>
  .mini-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 50;
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
    overflow: hidden;
  }

  .art-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
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

</style>