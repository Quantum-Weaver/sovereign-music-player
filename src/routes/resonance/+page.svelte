<script lang="ts">
  import { moodStore } from '$lib/stores/mood.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { playerStore } from '$lib/stores/player.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import TrackItem from '$lib/components/TrackItem.svelte';
  import EmojiGrid from '$lib/components/EmojiGrid.svelte';
  import { EMOJI_DEFS } from '$lib/data/emojis';
  import { onMount } from 'svelte';

  type Tab = 'map' | 'emojis' | 'pending' | 'tag' | 'dict';
  let activeTab = $state<Tab>('map');
  let searchQuery = $state('');
  let tagMenuTrackId = $state<string | null>(null);
  let loading = $state(true);
  let localMoods = $state<any[]>([]);

  // Emoji dictionary tab state
  let selectedEmojiForDict = $state<string | null>(null);
  let personalDefs = $state<Record<string, string>>({});
  let editingDef = $state('');

  const colors = $derived(getThemeColors(themeStore.config));
  const topEmojis = $derived(moodStore.topEmojis);
  const totalEvents = $derived(moodStore.totalEvents);
  const tracks = $derived(libraryStore.tracks);
  const favIds = $derived(libraryStore.favoriteTrackIds);

  const pendingMoods = $derived(
    localMoods.filter((m: any) => m.context === 'skip_prompt')
  );

  const filteredTracks = $derived(
    searchQuery
      ? tracks.filter(t =>
          t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.artist.toLowerCase().includes(searchQuery.toLowerCase())
        )
      : tracks
  );

  const topEmojiTotal = $derived(
    topEmojis.reduce((sum: number, e: any) => sum + e.count, 0) || 1
  );

  // Favorites stats
  const favCount = $derived(favIds.size);
  const favTopArtist = $derived((() => {
    if (favIds.size === 0) return null;
    const artistCounts = new Map<string, number>();
    for (const id of favIds) {
      const t = libraryStore.getTrackById(id);
      if (t) artistCounts.set(t.artist, (artistCounts.get(t.artist) || 0) + 1);
    }
    let top = ''; let topCount = 0;
    for (const [artist, count] of artistCounts) {
      if (count > topCount) { top = artist; topCount = count; }
    }
    return top || null;
  })());

  const EMOJI_ITEMS = [
    { emoji: '😌', label: 'Calm',         color: '#6C5CE7' },
    { emoji: '🔥', label: 'Energy',       color: '#E17055' },
    { emoji: '💙', label: 'Connected',    color: '#0984E3' },
    { emoji: '🎸', label: 'Rock',         color: '#FDCB6E' },
    { emoji: '🌊', label: 'Flow',         color: '#0984E3' },
    { emoji: '⚡', label: 'Electric',     color: '#FDCB6E' },
    { emoji: '🌿', label: 'Peaceful',     color: '#00B894' },
    { emoji: '💜', label: 'Deep',         color: '#A29BFE' },
    { emoji: '😤', label: 'Intense',      color: '#E17055' },
    { emoji: '✨', label: 'Transcendent', color: '#FFD700' },
    { emoji: '🧘', label: 'Meditative',   color: '#00CEC9' },
    { emoji: '🌙', label: 'Melancholy',   color: '#636E72' },
    { emoji: '🎶', label: 'Musical',      color: '#6C5CE7' },
    { emoji: '💫', label: 'Drifting',     color: '#A29BFE' },
    { emoji: '🤤', label: 'Obsessed',     color: '#FDCB6E' },
  ];

  function relativeTime(ts: number): string {
    const diff = Date.now() - ts;
    if (diff < 60_000)     return 'just now';
    if (diff < 3_600_000)  return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  }

  function intensityDots(intensity: number = 3): string {
    return '●'.repeat(Math.min(5, Math.max(1, intensity))) + '○'.repeat(5 - Math.min(5, Math.max(1, intensity)));
  }

  async function tagTrack(trackId: string, emoji: string) {
    await moodStore.addMoodEvent(trackId, emoji, 3, undefined, 'manual');
    localMoods = await moodStore.getRecentMoods(50) as any[];
    tagMenuTrackId = null;
  }

  async function tagPending(mood: any, emoji: string) {
    await moodStore.addMoodEvent(mood.trackId, emoji, 3, undefined, 'manual');
    localMoods = await moodStore.getRecentMoods(50) as any[];
  }

  function trackForId(id: string) {
    return libraryStore.getTrackById(id);
  }

  function topInsight(): string {
    if (topEmojis.length === 0) return 'No mood data yet. Start tagging your music!';
    const top = topEmojis[0] as any;
    const pct = Math.round((top.count / topEmojiTotal) * 100);
    return `Your most common vibe is ${top.emoji} (${pct}% of tags). You've logged ${totalEvents} mood event${totalEvents === 1 ? '' : 's'} total.`;
  }

  function selectEmojiForDict(emoji: string) {
    if (selectedEmojiForDict === emoji) {
      selectedEmojiForDict = null;
      return;
    }
    selectedEmojiForDict = emoji;
    editingDef = personalDefs[emoji] ?? '';
  }

  function savePersonalDef(emoji: string) {
    try {
      localStorage.setItem(`emoji_def_${emoji}`, editingDef);
      personalDefs = { ...personalDefs, [emoji]: editingDef };
    } catch {}
  }

  onMount(async () => {
    try {
      localMoods = await moodStore.getRecentMoods(50) as any[];
    } catch {
      localMoods = [];
    } finally {
      loading = false;
    }
    // Load personal definitions for the emoji dictionary
    const loaded: Record<string, string> = {};
    for (const { emoji } of EMOJI_DEFS) {
      try {
        const v = localStorage.getItem(`emoji_def_${emoji}`);
        if (v) loaded[emoji] = v;
      } catch {}
    }
    personalDefs = loaded;
  });
</script>

<div
  class="resonance-page"
  style="
    --accent: {colors.accent};
    --text: {colors.text};
    --text-secondary: {colors.textSecondary};
    --text-muted: {colors.textMuted};
    --bg-surface: {colors.surface};
    --border-color: {colors.border};
  "
>
  <h2>Resonance</h2>
  <p class="subtitle">Your music, your moods.</p>

  <div class="tabs">
    {#each (['map', 'emojis', 'pending', 'tag', 'dict'] as Tab[]) as tab}
      <button
        class="tab"
        class:active={activeTab === tab}
        onclick={() => activeTab = tab}
      >
        {tab === 'map' ? '🗺 Mood Map' : tab === 'emojis' ? '🏆 Top Emojis' : tab === 'pending' ? '⏳ Pending' : tab === 'tag' ? '✏️ Tag Music' : '📖 Emojis'}
      </button>
    {/each}
  </div>

  <!-- ── MOOD MAP ── -->
  {#if activeTab === 'map'}
    <div class="tab-content">
      {#if loading}
        <p class="empty">Loading...</p>
      {:else if localMoods.length === 0}
        <div class="empty-state">
          <span class="empty-icon">💭</span>
          <p>No mood events yet.</p>
          <p class="empty-sub">Head to "Tag Music" to start tagging tracks with emojis.</p>
        </div>
      {:else}
        <div class="mood-list">
          {#each localMoods as mood (mood.id)}
            {@const track = trackForId(mood.trackId)}
            <div class="mood-row">
              <div class="mood-art">
                {#if track?.coverArt}
                  <img src={track.coverArt} alt="" class="mood-art-img" />
                {:else}
                  <span>💿</span>
                {/if}
              </div>
              <div class="mood-info">
                <span class="mood-title">{track?.title ?? mood.trackId}</span>
                <span class="mood-artist">{track?.artist ?? '—'}</span>
                <span class="mood-dots">{intensityDots(mood.intensity)}</span>
              </div>
              <div class="mood-right">
                <span class="mood-emoji">{mood.emoji}</span>
                <span class="mood-time">{relativeTime(mood.timestamp)}</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── TOP EMOJIS ── -->
  {#if activeTab === 'emojis'}
    <div class="tab-content">
      <!-- Favorites card -->
      <div class="fav-card">
        <span class="fav-icon">❤️</span>
        <div class="fav-info">
          <span class="fav-count">{favCount} track{favCount !== 1 ? 's' : ''} favorited</span>
          {#if favTopArtist}
            <span class="fav-artist">Most loved: {favTopArtist}</span>
          {/if}
        </div>
      </div>

      <p class="insight">{topInsight()}</p>
      {#if topEmojis.length === 0}
        <div class="empty-state">
          <span class="empty-icon">📊</span>
          <p>No emoji data yet.</p>
        </div>
      {:else}
        <div class="emoji-list">
          {#each topEmojis as entry (entry.emoji)}
            {@const pct = Math.round(((entry as any).count / topEmojiTotal) * 100)}
            <div class="emoji-row">
              <span class="emoji-big">{entry.emoji}</span>
              <div class="emoji-bar-wrap">
                <div class="emoji-bar-track">
                  <div class="emoji-bar-fill" style="width: {pct}%;"></div>
                </div>
                <span class="emoji-count">{(entry as any).count} × {pct}%</span>
              </div>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── PENDING ── -->
  {#if activeTab === 'pending'}
    <div class="tab-content">
      {#if pendingMoods.length === 0}
        <div class="empty-state">
          <span class="empty-icon">✅</span>
          <p>Nothing pending.</p>
          <p class="empty-sub">Skip prompts will appear here for you to tag later.</p>
        </div>
      {:else}
        <div class="mood-list">
          {#each pendingMoods as mood (mood.id)}
            {@const track = trackForId(mood.trackId)}
            <div class="mood-row">
              <div class="mood-art">
                {#if track?.coverArt}
                  <img src={track.coverArt} alt="" class="mood-art-img" />
                {:else}
                  <span>💿</span>
                {/if}
              </div>
              <div class="mood-info">
                <span class="mood-title">{track?.title ?? 'Unknown'}</span>
                <span class="mood-artist">{track?.artist ?? '—'}</span>
                <div class="palette-row">
                  <EmojiGrid
                    emojis={EMOJI_ITEMS}
                    onSelect={(emoji) => tagPending(mood, emoji)}
                    selectedEmoji={null}
                  />
                </div>
              </div>
              <span class="mood-time">{relativeTime(mood.timestamp)}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── MANUAL TAGGING ── -->
  {#if activeTab === 'tag'}
    <div class="tab-content">
      <input
        class="search-input"
        type="text"
        placeholder="Search tracks..."
        bind:value={searchQuery}
        aria-label="Search tracks"
      />

      {#if filteredTracks.length === 0}
        <div class="empty-state">
          <span class="empty-icon">🔍</span>
          <p>{searchQuery ? 'No tracks match your search.' : 'Your library is empty. Scan some music first!'}</p>
        </div>
      {:else}
        <div class="tag-list">
          {#each filteredTracks as track (track.id)}
            <TrackItem
              {track}
              index={0}
              showHeart={true}
              isCurrentTrack={playerStore.currentTrack?.id === track.id}
              onPlay={() => playerStore.loadTrack(track)}
              onTag={() => { tagMenuTrackId = tagMenuTrackId === track.id ? null : track.id; }}
            />
            {#if tagMenuTrackId === track.id}
              <div class="palette-popup">
                <EmojiGrid
                  emojis={EMOJI_ITEMS}
                  onSelect={(emoji) => tagTrack(track.id, emoji)}
                  selectedEmoji={null}
                />
              </div>
            {/if}
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- ── EMOJI DICTIONARY ── -->
  {#if activeTab === 'dict'}
    <div class="tab-content dict-tab">
      <EmojiGrid
        emojis={EMOJI_DEFS.map(d => ({ emoji: d.emoji, label: d.label, color: d.color }))}
        onSelect={selectEmojiForDict}
        selectedEmoji={selectedEmojiForDict}
      />
      {#if selectedEmojiForDict}
        {@const def = EMOJI_DEFS.find(d => d.emoji === selectedEmojiForDict)}
        {#if def}
          <div class="dict-expansion" style="--dict-color: {def.color}">
            <div class="dict-header">
              <span class="dict-emoji">{def.emoji}</span>
              <span class="dict-label">{def.label}</span>
            </div>
            <div class="dict-columns">
              <div class="dict-col">
                <h4 class="dict-col-title">Sanctuary</h4>
                <p class="dict-definition">{def.definition}</p>
                <div class="sensory-grid">
                  <span class="sensory-item">🎨 {def.sensory.color}</span>
                  <span class="sensory-item">🔊 {def.sensory.sound}</span>
                  <span class="sensory-item">✋ {def.sensory.texture}</span>
                  <span class="sensory-item">🌡️ {def.sensory.temperature}</span>
                </div>
              </div>
              <div class="dict-col">
                <h4 class="dict-col-title">Yours</h4>
                <textarea
                  class="personal-textarea"
                  placeholder="What does this feel like to you?"
                  bind:value={editingDef}
                  rows={5}
                ></textarea>
                <button
                  class="save-btn"
                  onclick={() => savePersonalDef(selectedEmojiForDict!)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style>
  .resonance-page {
    padding: 2rem;
    height: 100%;
    overflow-y: auto;
    background-color: var(--bg);
    color: var(--text);
  }

  h2 { font-size: 1.75rem; font-weight: 700; margin-bottom: 0.25rem; color: var(--text); }

  .subtitle {
    font-size: 0.85rem;
    color: var(--text-muted);
    margin-bottom: 1.25rem;
  }

  .tabs {
    display: flex;
    gap: 0.25rem;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 1.25rem;
    overflow-x: auto;
  }

  .tab {
    padding: 0.55rem 1rem;
    border: none;
    border-bottom: 2px solid transparent;
    background: transparent;
    color: var(--text-secondary);
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
    white-space: nowrap;
    transition: color 0.15s, border-color 0.15s;
  }

  .tab:hover { color: var(--accent); }
  .tab.active { color: var(--accent); border-bottom-color: var(--accent); }

  .tab-content { max-width: 640px; }

  /* Favorites card */
  .fav-card {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    border-radius: 10px;
    background: color-mix(in srgb, #E17055 12%, transparent);
    border: 1px solid color-mix(in srgb, #E17055 30%, transparent);
    margin-bottom: 1rem;
  }

  .fav-icon { font-size: 1.6rem; flex-shrink: 0; }

  .fav-info { display: flex; flex-direction: column; gap: 0.1rem; }

  .fav-count {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--text);
  }

  .fav-artist {
    font-size: 0.8rem;
    color: var(--text-secondary);
  }

  /* Empty state */
  .empty-state {
    text-align: center;
    padding: 3rem 1rem;
    color: var(--text-muted);
  }

  .empty-icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
  .empty-sub  { font-size: 0.82rem; margin-top: 0.4rem; }
  .empty      { color: var(--text-muted); }

  /* Mood rows */
  .mood-list { display: flex; flex-direction: column; gap: 0.5rem; }

  .mood-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem;
    border-radius: 10px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
  }

  .mood-art {
    width: 42px;
    height: 42px;
    border-radius: 6px;
    background-color: rgba(108, 92, 231, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.1rem;
    flex-shrink: 0;
    overflow: hidden;
  }

  .mood-art-img { width: 100%; height: 100%; object-fit: cover; }

  .mood-info {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .mood-title {
    font-size: 0.88rem;
    font-weight: 600;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: var(--text);
  }

  .mood-artist {
    font-size: 0.77rem;
    color: var(--text-secondary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mood-dots {
    font-size: 0.65rem;
    letter-spacing: 1px;
    color: var(--accent);
    margin-top: 0.1rem;
  }

  .mood-right {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.2rem;
    flex-shrink: 0;
  }

  .mood-emoji { font-size: 1.3rem; line-height: 1; }
  .mood-time  { font-size: 0.72rem; color: var(--text-muted); }

  /* Insight */
  .insight {
    font-size: 0.88rem;
    color: var(--text-secondary);
    margin-bottom: 1.25rem;
    line-height: 1.5;
  }

  /* Emoji bars */
  .emoji-list { display: flex; flex-direction: column; gap: 0.75rem; }

  .emoji-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .emoji-big { font-size: 1.6rem; width: 2rem; text-align: center; flex-shrink: 0; }
  .emoji-bar-wrap { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }

  .emoji-bar-track {
    height: 8px;
    border-radius: 4px;
    background-color: var(--bg-surface);
    border: 1px solid var(--border-color);
    overflow: hidden;
  }

  .emoji-bar-fill {
    height: 100%;
    border-radius: 4px;
    background: linear-gradient(90deg, #6C5CE7, #0984E3);
    transition: width 0.4s ease;
  }

  .emoji-count { font-size: 0.75rem; color: var(--text-muted); }

  /* Palette in pending tab */
  .palette-row { margin-top: 0.4rem; }

  /* Search */
  .search-input {
    width: 100%;
    padding: 0.65rem 1rem;
    border-radius: 8px;
    border: 1px solid var(--border-color);
    background-color: var(--bg-surface);
    color: var(--text);
    font-size: 0.92rem;
    outline: none;
    margin-bottom: 1rem;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .search-input:focus { border-color: var(--accent); }

  .tag-list { display: flex; flex-direction: column; }

  /* Emoji popup below TrackItem */
  .palette-popup {
    padding: 0.6rem 0.5rem 0.75rem 3.5rem;
    border-bottom: 1px solid var(--border-color);
    background-color: var(--bg-surface);
  }

  /* Emoji dictionary tab */
  .dict-tab { display: flex; flex-direction: column; gap: 1rem; }

  .dict-expansion {
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--dict-color) 35%, transparent);
    background: color-mix(in srgb, var(--dict-color) 8%, transparent);
    padding: 1rem;
    animation: dict-in 0.15s ease;
  }

  @keyframes dict-in {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .dict-header {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    margin-bottom: 1rem;
  }

  .dict-emoji { font-size: 1.8rem; line-height: 1; }

  .dict-label {
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text);
  }

  .dict-columns {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
  }

  .dict-col { display: flex; flex-direction: column; gap: 0.5rem; }

  .dict-col-title {
    font-size: 0.72rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-muted);
    margin: 0;
  }

  .dict-definition {
    font-size: 0.85rem;
    color: var(--text-secondary);
    line-height: 1.55;
    margin: 0;
  }

  .sensory-grid {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
    margin-top: 0.25rem;
  }

  .sensory-item {
    font-size: 0.76rem;
    color: var(--text-muted);
    line-height: 1.4;
  }

  .personal-textarea {
    width: 100%;
    padding: 0.5rem 0.65rem;
    border-radius: 6px;
    border: 1px solid var(--border-color);
    background: var(--bg-surface);
    color: var(--text);
    font: inherit;
    font-size: 0.85rem;
    resize: vertical;
    outline: none;
    box-sizing: border-box;
    transition: border-color 0.15s;
  }

  .personal-textarea:focus { border-color: var(--accent); }

  .save-btn {
    align-self: flex-start;
    padding: 0.4rem 1rem;
    border-radius: 6px;
    border: none;
    background: var(--accent);
    color: white;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    transition: filter 0.15s;
  }

  .save-btn:hover { filter: brightness(1.1); }
</style>
