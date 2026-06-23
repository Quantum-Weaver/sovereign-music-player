<script lang="ts">
  let { emojis, onSelect, selectedEmoji = null }: {
    emojis: Array<{ emoji: string; label: string; color: string }>;
    onSelect: (emoji: string) => void;
    selectedEmoji?: string | null;
  } = $props();
</script>

<div class="emoji-grid">
  {#each emojis as item}
    <button
      class="grid-btn"
      class:selected={selectedEmoji === item.emoji}
      style="--eg-color: {item.color};"
      onclick={() => onSelect(item.emoji)}
      title={item.label}
      aria-label="Tag {item.label}"
      aria-pressed={selectedEmoji === item.emoji}
    >
      <span class="grid-emoji">{item.emoji}</span>
    </button>
  {/each}
</div>

<style>
  .emoji-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
  }

  .grid-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 2px solid rgba(255, 255, 255, 0.1);
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
    transition: all 0.18s ease;
    padding: 0;
    line-height: 1;
  }

  .grid-btn:hover {
    border-color: var(--eg-color);
    background-color: color-mix(in srgb, var(--eg-color) 20%, transparent);
    transform: scale(1.12);
  }

  .grid-btn.selected {
    border-color: var(--eg-color);
    background-color: color-mix(in srgb, var(--eg-color) 30%, transparent);
    transform: scale(1.12);
    box-shadow: 0 0 14px color-mix(in srgb, var(--eg-color) 45%, transparent);
  }

  .grid-emoji { line-height: 1; }
</style>
