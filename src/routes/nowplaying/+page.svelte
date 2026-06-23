<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import PlayerControls from '$lib/components/PlayerControls.svelte';
  import GradientPulse from '$lib/components/GradientPulse.svelte';
  import { goto } from '$app/navigation';
  import EmojiPalette from '$lib/components/EmojiPalette.svelte';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const isPlaying = $derived(playerStore.isPlaying);
  const shuffle = $derived(playerStore.shuffle);
  const repeat = $derived(playerStore.repeat);
  const repeatIcon = $derived(repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '➡️');
  const isFav = $derived(currentTrack ? libraryStore.isFavorite(currentTrack.id) : false);

  let heartAnimating = $state(false);

  function toggleFav() {
    if (!currentTrack) return;
    heartAnimating = true;
    setTimeout(() => { heartAnimating = false; }, 400);
    libraryStore.toggleFavorite(currentTrack.id);
  }

  function goBack() {
    window.history.back();
  }
</script>

<div
  class="nowplaying-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface-light: {colors.surfaceLight};
  "
>
  {#if !currentTrack}
    <button class="back-btn" onclick={goBack}>← Library</button>
    <div class="empty-state">
      <span class="text-6xl drop-shadow-[0_0_12px_var(--accent)]">🎵</span>
      <p>Select a track to play</p>
    </div>
  {:else}
    <div class="header">
      <button class="back-btn" onclick={goBack}>← Library</button>
      <button class="queue-link" onclick={() => goto('/queue')}>Queue</button>
    </div>

    <div class="art-container">
      <div class="glow-wrap">
        <GradientPulse color={colors.accent} pulse={isPlaying}>
          <div class="album-art">
            {#if currentTrack.coverArt}
              <img src={currentTrack.coverArt} alt="Album art" class="art-img" />
            {:else}
              <span>💿</span>
            {/if}
          </div>
        </GradientPulse>
      </div>
    </div>

    <div class="track-info">
      <div class="title-row">
        <h2>{currentTrack.title}</h2>
        <button
          class="heart-btn"
          class:fav={isFav}
          class:pop={heartAnimating}
          onclick={toggleFav}
          aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFav}
        >{isFav ? '❤️' : '🤍'}</button>
      </div>
      <p class="artist">{currentTrack.artist}</p>
      <p class="album">{currentTrack.album}</p>
    </div>

    <PlayerControls />

    <div class="extra-controls">
      <button
        class="ctrl-btn"
        class:active={shuffle}
        onclick={playerStore.toggleShuffle}
        aria-label="Shuffle"
      >🔀</button>
      <button
        class="ctrl-btn"
        class:active={repeat !== 'off'}
        onclick={playerStore.toggleRepeat}
        aria-label="Repeat"
      >{repeatIcon}</button>
    </div>
    <EmojiPalette />
  {/if}
</div>

<style>
  .nowplaying-page {
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
    margin-bottom: 2rem;
  }

  .back-btn,
  .queue-link {
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
    color: var(--accent);
  }

  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
    color: var(--text-secondary);
  }

  .art-container {
    display: flex;
    justify-content: center;
    margin-bottom: 2rem;
  }

  .glow-wrap {
    position: relative;
    width: 260px;
    height: 260px;
  }

  .album-art {
    width: 260px;
    height: 260px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 4rem;
    color: white;
    background-color: var(--accent);
    overflow: hidden;
    position: relative;
    z-index: 1;
  }

  .art-img { width: 100%; height: 100%; object-fit: cover; }

  .track-info {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  .title-row {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    color: var(--text);
    margin: 0;
  }

  .heart-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.15rem;
    font-size: 1.3rem;
    line-height: 1;
    flex-shrink: 0;
    transition: transform 0.15s;
  }

  .heart-btn:hover { transform: scale(1.25); }
  .heart-btn.pop { animation: heartPop 0.35s ease-out; }

  @keyframes heartPop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.6); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }

  .artist {
    color: var(--text-secondary);
    margin: 0.15rem 0;
  }

  .album {
    color: var(--text-muted);
    font-size: 0.85rem;
    margin: 0.15rem 0;
  }

  .extra-controls {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 0.75rem;
  }

  .ctrl-btn {
    background: none;
    border: none;
    font-size: 1.4rem;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--text-secondary);
    transition: transform 0.15s, color 0.15s;
  }

  .ctrl-btn:hover { transform: scale(1.1); }
  .ctrl-btn.active { color: var(--accent); }
</style>
