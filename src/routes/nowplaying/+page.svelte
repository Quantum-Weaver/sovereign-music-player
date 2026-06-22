<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';

  const colors = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const isPlaying = $derived(playerStore.isPlaying);
  const position = $derived(playerStore.position);
  const duration = $derived(playerStore.duration);
  const shuffle = $derived(playerStore.shuffle);
  const repeat = $derived(playerStore.repeat);

  const progress = $derived(duration > 0 ? position / duration : 0);
  const repeatIcon = $derived(repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '➡️');

  function formatTime(secs: number): string {
    if (!secs || secs <= 0) return '0:00';
    const s = Math.floor(secs);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
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
      <button class="queue-link" onclick={() => window.location.href = '/queue'}>Queue</button>
    </div>

    <div class="art-container">
      <div class="album-art">
        <span>💿</span>
      </div>
    </div>

    <div class="track-info">
      <h2>{currentTrack.title}</h2>
      <p class="artist">{currentTrack.artist}</p>
      <p class="album">{currentTrack.album}</p>
    </div>

    <div class="progress-container">
      <span class="time">{formatTime(position)}</span>
      <div class="progress-bar">
        <div class="progress-fill" style="width: {progress * 100}%;"></div>
      </div>
      <span class="time">{formatTime(duration)}</span>
    </div>

    <div class="controls">
      <button
        class="ctrl-btn"
        class:active={shuffle}
        onclick={playerStore.toggleShuffle}
      >🔀</button>
      <button class="ctrl-btn" onclick={playerStore.previous}>⏮</button>
      <button class="play-pause" onclick={playerStore.togglePlay}>
        <span>{isPlaying ? '⏸' : '▶️'}</span>
      </button>
      <button class="ctrl-btn" onclick={playerStore.next}>⏭</button>
      <button
        class="ctrl-btn"
        class:active={repeat !== 'off'}
        onclick={playerStore.toggleRepeat}
      >{repeatIcon}</button>
    </div>
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
    box-shadow: 0 0 60px color-mix(in srgb, var(--accent) 20%, transparent);
  }

  .track-info {
    text-align: center;
    margin-bottom: 1.5rem;
  }

  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
    color: var(--text);
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

  .progress-container {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin-bottom: 2rem;
  }

  .time {
    font-size: 0.75rem;
    width: 2.5rem;
    text-align: center;
    color: var(--text-muted);
  }

  .progress-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
    background-color: var(--bg-surface-light);
  }

  .progress-fill {
    height: 100%;
    border-radius: 2px;
    background-color: var(--accent);
    transition: width 0.3s ease;
  }

  .controls {
    display: flex;
    justify-content: center;
    align-items: center;
    gap: 1.25rem;
  }

  .ctrl-btn {
    background: none;
    border: none;
    font-size: 1.6rem;
    cursor: pointer;
    padding: 0.25rem;
    color: var(--text-secondary);
    transition: transform 0.15s;
  }

  .ctrl-btn:hover {
    transform: scale(1.1);
  }

  .ctrl-btn.active {
    color: var(--accent);
  }

  .play-pause {
    width: 64px;
    height: 64px;
    border-radius: 50%;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 1.8rem;
    color: white;
    background-color: var(--accent);
    transition: transform 0.15s;
  }

  .play-pause:hover {
    transform: scale(1.05);
  }
</style>