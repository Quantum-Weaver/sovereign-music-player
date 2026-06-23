<script lang="ts">
  import { moodStore } from '$lib/stores/mood.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { EMOJI_DEFS } from '$lib/data/emojis';
  import EmojiGrid from '$lib/components/EmojiGrid.svelte';

  let expanded = $state(false);
  let confirmedEmoji = $state<string | null>(null);

  const emojis = EMOJI_DEFS.map(({ emoji, label, color }) => ({ emoji, label, color }));

  function handleSelect(emoji: string) {
    if (!playerStore.currentTrack) return;
    moodStore.addMoodEvent(playerStore.currentTrack.id, emoji);
    confirmedEmoji = emoji;
    setTimeout(() => { confirmedEmoji = null; }, 800);
  }
</script>

<div class="palette-wrapper">
  {#if expanded}
    <div class="emoji-strip">
      <EmojiGrid {emojis} onSelect={handleSelect} selectedEmoji={confirmedEmoji} />
    </div>
  {/if}

  <button
    class="toggle-btn"
    onclick={() => expanded = !expanded}
    aria-label={expanded ? 'Hide mood palette' : 'Show mood palette'}
  >
    <span class="toggle-icon">{expanded ? '▲' : '🏷️'}</span>
    <span class="toggle-label">{expanded ? 'Hide' : 'Mood'}</span>
  </button>
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

  .toggle-icon { font-size: 0.85rem; }

  .emoji-strip {
    padding: 0.5rem;
    border-radius: 12px;
    background-color: var(--bg-surface, rgba(26, 31, 53, 0.5));
    border: 1px solid var(--border-color, rgba(99, 110, 114, 0.15));
    display: flex;
    justify-content: center;
  }
</style>
