<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const isPlaying = $derived(playerStore.isPlaying);
</script>

{#if currentTrack}
  <div class="mini-player" style="background-color: {colors.surface}; border-top-color: {colors.border};">
    <button class="mini-click" onclick={() => window.location.href = '/nowplaying'}>
      <div class="artwork" style="background-color: {colors.accent};">
        <span>💿</span>
      </div>
      <div class="info">
        <span class="title" style="color: {colors.text};">{currentTrack.title}</span>
        <span class="artist" style="color: {colors.textSecondary};">{currentTrack.artist}</span>
      </div>
    </button>
    <button class="ctrl-btn" style="color: {colors.text};" onclick={(e) => { e.stopPropagation(); playerStore.togglePlay(); }}>
      <span>{isPlaying ? '⏸' : '▶️'}</span>
    </button>
    <button class="ctrl-btn" style="color: {colors.text};" onclick={(e) => { e.stopPropagation(); playerStore.next(); }}>
      <span>⏭</span>
    </button>
  </div>
{/if}

<style>
  .mini-player {
    display: flex;
    align-items: center;
    padding: 0.5rem 0.75rem;
    border-top: 1px solid;
    height: 60px;
    gap: 0.5rem;
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
    overflow: hidden;
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
  }
  .info {
    flex: 1;
    overflow: hidden;
  }
  .title {
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .artist {
    font-size: 0.75rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }
  .ctrl-btn {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.3rem;
    padding: 0.25rem 0.5rem;
    transition: transform 0.1s;
  }
  .ctrl-btn:hover {
    transform: scale(1.15);
  }
</style>