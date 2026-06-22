<script lang="ts">
  import { moodStore } from '$lib/stores/mood.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { MOOD_COLORS } from '$lib/cosmic';

  let expanded = $state(false);
  let confirmedEmoji = $state<string | null>(null);

  const emojis = [
    { emoji: '😌', label: 'Calm', color: MOOD_COLORS.calm },
    { emoji: '🔥', label: 'Energy', color: MOOD_COLORS.energized },
    { emoji: '😢', label: 'Sad', color: MOOD_COLORS.peaceful },
    { emoji: '😊', label: 'Happy', color: MOOD_COLORS.creative },
    { emoji: '🌀', label: 'Overstimulated', color: MOOD_COLORS.intense },
    { emoji: '🌙', label: 'Melancholy', color: MOOD_COLORS.mystical },
    { emoji: '✨', label: 'Transcendent', color: '#FFD700' },
    { emoji: '🎯', label: 'Focused', color: MOOD_COLORS.focused },
    { emoji: '💙', label: 'Connected', color: '#0984E3' },
    { emoji: '😮‍💨', label: 'Relief', color: MOOD_COLORS.calm },
    { emoji: '💤', label: 'Tired', color: '#636E72' },
    { emoji: '🎉', label: 'Celebratory', color: MOOD_COLORS.energized },
  ];

  function handleTap(item: typeof emojis[0]) {
    if (!playerStore.currentTrack) return;
    moodStore.addMoodEvent(playerStore.currentTrack.id, item.emoji);
    confirmedEmoji = item.emoji;
    setTimeout(() => { confirmedEmoji = null; }, 800);
  }
</script>

<div class="palette-wrapper">
  <button
    class="toggle-btn"
    onclick={() => expanded = !expanded}
    aria-label={expanded ? 'Hide mood palette' : 'Show mood palette'}
  >
    <span class="toggle-icon">{expanded ? '▼' : '🏷️'}</span>
    <span class="toggle-label">{expanded ? 'Hide' : 'Mood'}</span>
  </button>

  {#if expanded}
    <div class="emoji-strip">
      {#each emojis as item}
        <button
          class="emoji-btn"
          class:confirmed={confirmedEmoji === item.emoji}
          style="--emoji-color: {item.color};"
          onclick={() => handleTap(item)}
          title={item.label}
        >
          <span class="emoji-char">{item.emoji}</span>
        </button>
      {/each}
    </div>
  {/if}
</div>

<style>
  .palette-wrapper {
    margin-top: 1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }

  .toggle-btn {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    background: none;
    border: 1px solid var(--border-color, rgba(99, 110, 114, 0.3));
    border-radius: 16px;
    padding: 0.3rem 0.85rem;
    cursor: pointer;
    color: var(--text-secondary);
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .toggle-btn:hover {
    border-color: var(--accent);
    color: var(--accent);
  }

  .toggle-icon {
    font-size: 0.85rem;
  }

  .emoji-strip {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 0.35rem;
    padding: 0.5rem;
    border-radius: 12px;
    background-color: var(--bg-surface, rgba(26, 31, 53, 0.5));
    border: 1px solid var(--border-color, rgba(99, 110, 114, 0.15));
  }

  .emoji-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid transparent;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.2s ease;
    padding: 0;
  }

  .emoji-btn:hover {
    background-color: color-mix(in srgb, var(--emoji-color) 20%, transparent);
    border-color: var(--emoji-color);
    transform: scale(1.1);
  }

  .emoji-btn.confirmed {
    animation: confirmPop 0.5s ease-out;
    background-color: color-mix(in srgb, var(--emoji-color) 30%, transparent);
    border-color: var(--emoji-color);
    box-shadow: 0 0 16px color-mix(in srgb, var(--emoji-color) 50%, transparent);
  }

  @keyframes confirmPop {
    0% { transform: scale(1); }
    30% { transform: scale(1.35); }
    60% { transform: scale(0.95); }
    100% { transform: scale(1); }
  }
</style>