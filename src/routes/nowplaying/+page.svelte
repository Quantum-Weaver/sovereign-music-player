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
  const volume = $derived(playerStore.volume);

  const progress = $derived(duration > 0 ? position / duration : 0);
  const repeatIcon = $derived(repeat === 'one' ? '🔂' : repeat === 'all' ? '🔁' : '➡️');

  function formatTime(ms: number): string {
    if (!ms || ms <= 0) return '0:00';
    const totalSec = Math.floor(ms / 1000);
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function goBack() {
    window.history.back();
  }
</script>

<div class="nowplaying-page" style="background-color: {colors.background};">
  {#if !currentTrack}
    <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>← Library</button>
    <div class="empty-state">
      <span style="font-size: 4rem;">🎵</span>
      <p style="color: {colors.textSecondary};">Select a track to play</p>
    </div>
  {:else}
    <div class="header">
      <button class="back-btn" style="color: {colors.accent};" onclick={goBack}>← Library</button>
      <button class="queue-link" style="color: {colors.accent};" onclick={() => window.location.href = '/queue'}>Queue</button>
    </div>

    <div class="art-container">
      <div class="album-art" style="background-color: {colors.accent}; box-shadow: 0 0 60px {colors.accent}30;">
        <span>💿</span>
      </div>
    </div>

    <div class="track-info">
      <h2 style="color: {colors.text};">{currentTrack.title}</h2>
      <p style="color: {colors.textSecondary};">{currentTrack.artist}</p>
      <p style="color: {colors.textMuted}; font-size: 0.85rem;">{currentTrack.album}</p>
    </div>

    <div class="progress-container">
      <span class="time" style="color: {colors.textMuted};">{formatTime(position)}</span>
      <div class="progress-bar" style="background-color: {colors.surfaceLight};">
        <div class="progress-fill" style="background-color: {colors.accent}; width: {progress * 100}%;"></div>
      </div>
      <span class="time" style="color: {colors.textMuted};">{formatTime(duration)}</span>
    </div>

    <div class="controls">
      <button class="ctrl-btn" style="color: {shuffle ? colors.accent : colors.textSecondary};" onclick={playerStore.toggleShuffle}>🔀</button>
      <button class="ctrl-btn" style="color: {colors.text};" onclick={playerStore.previous}>⏮</button>
      <button class="play-pause" style="background-color: {colors.accent};" onclick={playerStore.togglePlay}>
        <span>{isPlaying ? '⏸' : '▶️'}</span>
      </button>
      <button class="ctrl-btn" style="color: {colors.text};" onclick={playerStore.next}>⏭</button>
      <button class="ctrl-btn" style="color: {repeat !== 'off' ? colors.accent : colors.textSecondary};" onclick={playerStore.toggleRepeat}>{repeatIcon}</button>
    </div>
  {/if}
</div>

<style>
  .nowplaying-page {
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
  .back-btn, .queue-link {
    background: none;
    border: none;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    padding: 0;
  }
  .empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 1rem;
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
  }
  .track-info {
    text-align: center;
    margin-bottom: 1.5rem;
  }
  h2 {
    font-size: 1.35rem;
    font-weight: 700;
    margin-bottom: 0.25rem;
  }
  p {
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
  }
  .progress-bar {
    flex: 1;
    height: 4px;
    border-radius: 2px;
    cursor: pointer;
  }
  .progress-fill {
    height: 100%;
    border-radius: 2px;
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
    transition: transform 0.15s;
  }
  .ctrl-btn:hover {
    transform: scale(1.1);
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
    transition: transform 0.15s;
  }
  .play-pause:hover {
    transform: scale(1.05);
  }
</style>