<script lang="ts">
  import { playerStore } from '$lib/stores/player.svelte';
  import { libraryStore } from '$lib/stores/library.svelte';
  import { moodStore } from '$lib/stores/mood.svelte';
  import { themeStore } from '$lib/stores/theme.svelte';
  import { getThemeColors } from '$lib/theme/theme';
  import { EMOJI_DEFS } from '$lib/data/emojis';
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { slide } from 'svelte/transition';

  const colors       = $derived(getThemeColors(themeStore.config));
  const currentTrack = $derived(playerStore.currentTrack);
  const isPlaying    = $derived(playerStore.isPlaying);
  const position     = $derived(playerStore.position);
  const duration     = $derived(playerStore.duration);
  const volume       = $derived(playerStore.volume);
  const repeat       = $derived(playerStore.repeat);
  const shuffle      = $derived(playerStore.shuffle);
  const isFav        = $derived(currentTrack ? libraryStore.isFavorite(currentTrack.id) : false);

  let expanded         = $state(false);
  let moodPopupOpen    = $state(false);
  let heartAnimating   = $state(false);
  let confirmedMoodEmoji = $state<string | null>(null);
  let dragging = false;

  // Auto-close on every navigation (fixes backdrop-blocking-sidebar bug)
  $effect(() => {
    const _ = page.url.pathname;
    expanded = false;
    moodPopupOpen = false;
  });

  const quickEmojis = EMOJI_DEFS.slice(0, 8);

  function fmt(secs: number): string {
    if (!secs || secs <= 0) return '0:00';
    const s = Math.floor(secs);
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

  function toggleFav() {
    if (!currentTrack) return;
    heartAnimating = true;
    setTimeout(() => { heartAnimating = false; }, 400);
    libraryStore.toggleFavorite(currentTrack.id);
  }

  function handleMood(emoji: string) {
    if (!currentTrack) return;
    moodStore.addMoodEvent(currentTrack.id, emoji);
    confirmedMoodEmoji = emoji;
    moodPopupOpen = false;
    setTimeout(() => { confirmedMoodEmoji = null; }, 1400);
  }

  function navTo(path: string) {
    expanded = false;
    moodPopupOpen = false;
    goto(path);
  }

  // Seek drag for expanded progress bar
  function seekAt(e: PointerEvent) {
    if (!currentTrack || duration <= 0) return;
    const bar  = e.currentTarget as HTMLElement;
    const rect = bar.getBoundingClientRect();
    playerStore.seek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration);
  }
  function onPD(e: PointerEvent) {
    if (!currentTrack) return;
    dragging = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    seekAt(e);
  }
  function onPM(e: PointerEvent) { if (dragging) seekAt(e); }
  function onPU() { dragging = false; }
</script>

<div
  class="mini-player"
  style="
    --mp-accent:      {colors.accent};
    --mp-surface:     {colors.surface};
    --mp-surf-light:  {colors.surfaceLight};
    --mp-text:        {colors.text};
    --mp-text-sec:    {colors.textSecondary};
    --mp-text-muted:  {colors.textMuted};
    --mp-border:      {colors.border};
  "
>

  <!-- ── EXPANDED PANEL ─────────────────────────────────────────────────── -->
  {#if expanded}
    <div class="expanded-panel" transition:slide={{ duration: 240 }}>

      <button class="close-btn" onclick={() => expanded = false} aria-label="Collapse player">⌄</button>

      <!-- Hero: art + meta -->
      <div class="exp-hero">
        <div class="exp-art" class:empty={!currentTrack?.coverArt}>
          {#if currentTrack?.coverArt}
            <img src={currentTrack.coverArt} alt="" />
          {:else}
            <span>💿</span>
          {/if}
        </div>
        <div class="exp-meta">
          <span class="exp-title">{currentTrack?.title ?? 'No music playing'}</span>
          <span class="exp-artist">{currentTrack?.artist ?? ''}</span>
          {#if currentTrack?.album}
            <span class="exp-album">{currentTrack.album}{currentTrack.year ? ` · ${currentTrack.year}` : ''}</span>
          {/if}
          <div class="exp-actions">
            <button
              class="exp-act-btn"
              class:fav={isFav} class:pop={heartAnimating}
              onclick={toggleFav} disabled={!currentTrack}
              aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
            >{isFav ? '❤️' : '🤍'}</button>
            <button
              class="exp-act-btn"
              onclick={() => navTo('/settings')}
              aria-label="Equalizer"
              title="Open Equalizer in Settings"
            >🎛️</button>
            <button
              class="exp-act-btn"
              onclick={() => navTo('/nowplaying')}
              aria-label="Full Now Playing"
            >↗</button>
          </div>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="exp-prog-row">
        <span class="exp-time">{fmt(position)}</span>
        <div
          class="exp-prog-bar"
          class:no-track={!currentTrack}
          role="slider"
          aria-label="Playback position"
          aria-valuenow={Math.round(position)}
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          tabindex={currentTrack ? 0 : -1}
          onpointerdown={onPD}
          onpointermove={onPM}
          onpointerup={onPU}
          onpointercancel={onPU}
        >
          <div class="exp-prog-fill" style="width: {duration > 0 ? (position / duration) * 100 : 0}%"></div>
        </div>
        <span class="exp-time">{fmt(duration)}</span>
      </div>

      <!-- Playback controls + shuffle/repeat -->
      <div class="exp-ctrl-row">
        <button
          class="exp-ctrl shuffle" class:active={shuffle}
          onclick={() => playerStore.toggleShuffle()}
          disabled={!currentTrack} aria-label="Shuffle"
        >🔀</button>
        <button class="exp-ctrl skip" onclick={() => playerStore.previous()} disabled={!currentTrack} aria-label="Previous">⏮</button>
        <button class="exp-play" onclick={() => playerStore.togglePlay()} disabled={!currentTrack} aria-label={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? '⏸' : '▶'}
        </button>
        <button class="exp-ctrl skip" onclick={() => playerStore.next(true)} disabled={!currentTrack} aria-label="Next">⏭</button>
        <button
          class="exp-ctrl rep" class:active={repeat !== 'off'}
          onclick={() => playerStore.toggleRepeat()}
          disabled={!currentTrack}
          title={repeat === 'all' ? 'Repeat all' : repeat === 'one' ? 'Repeat one' : 'Repeat off'}
          aria-label="Repeat"
        >{repeat === 'one' ? '🔂' : '🔁'}</button>
      </div>

      <!-- Volume -->
      <div class="exp-vol-row">
        <span>🔊</span>
        <input type="range" class="exp-vol" min="0" max="1" step="0.01" value={volume}
          oninput={(e) => playerStore.setVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
          aria-label="Volume"
        />
      </div>

      <!-- Resonance quick-tag -->
      <div class="mood-strip">
        <p class="mood-strip-label">How does this track feel?</p>
        <div class="mood-strip-row">
          {#each quickEmojis as item}
            <button
              class="qm-btn"
              style="--qm-color: {item.color}"
              class:sel={confirmedMoodEmoji === item.emoji}
              onclick={() => handleMood(item.emoji)}
              disabled={!currentTrack}
              title={item.label}
              aria-label={item.label}
            >{item.emoji}</button>
          {/each}
        </div>
      </div>

      <!-- Nav row -->
      <div class="exp-nav-row">
        <button class="exp-nav-btn" onclick={() => navTo('/resonance')}>📊 Resonance</button>
        <button class="exp-nav-btn" onclick={() => navTo('/visualizer')}>🌊 Visualizer</button>
        <button class="exp-nav-btn" onclick={() => navTo('/timer')}>⏰ Timer</button>
      </div>

    </div>
  {/if}

  <!-- ── COMPACT BAR ─────────────────────────────────────────────────────── -->
  <div class="compact-bar">

    <!-- Left: art + title/artist + time -->
    <div class="bar-left">
      <div class="bar-art">
        {#if currentTrack?.coverArt}
          <img src={currentTrack.coverArt} alt="" />
        {:else}
          <span>💿</span>
        {/if}
      </div>
      <div class="bar-info">
        <span class="bar-title">{currentTrack?.title ?? 'No music playing'}</span>
        <span class="bar-artist">{currentTrack?.artist ?? ''}</span>
      </div>
      <span class="bar-time" class:dim={!currentTrack}>{fmt(position)}&thinsp;/&thinsp;{fmt(duration)}</span>
    </div>

    <!-- Center: ⏮ ▶ ⏭ -->
    <div class="bar-center">
      <button class="bar-ctrl" onclick={() => playerStore.previous()} disabled={!currentTrack} aria-label="Previous">⏮</button>
      <button class="bar-play" onclick={() => playerStore.togglePlay()} disabled={!currentTrack} aria-label={isPlaying ? 'Pause' : 'Play'}>
        {isPlaying ? '⏸' : '▶'}
      </button>
      <button class="bar-ctrl" onclick={() => playerStore.next(true)} disabled={!currentTrack} aria-label="Next">⏭</button>
    </div>

    <!-- Right: vol | eq | mood | heart | repeat | expand -->
    <div class="bar-right">
      <div class="vol-wrap">
        <span class="vol-icon">🔊</span>
        <input type="range" class="vol-slider" min="0" max="1" step="0.01" value={volume}
          oninput={(e) => playerStore.setVolume(parseFloat((e.currentTarget as HTMLInputElement).value))}
          aria-label="Volume"
        />
      </div>

      <button class="icon-btn" onclick={() => navTo('/settings')} aria-label="Equalizer" title="Equalizer">🎛️</button>

      <div class="mood-wrap-rel">
        <button
          class="icon-btn" class:active={moodPopupOpen}
          onclick={() => { if (currentTrack) moodPopupOpen = !moodPopupOpen; }}
          disabled={!currentTrack}
          aria-label="Tag mood" title="Tag mood"
        >{confirmedMoodEmoji ?? '🏷️'}</button>
        {#if moodPopupOpen}
          <div class="mood-popup">
            <div class="emoji-row">
              {#each EMOJI_DEFS as item}
                <button
                  class="emj-btn"
                  style="--ec: {item.color}"
                  onclick={() => handleMood(item.emoji)}
                  title={item.label}
                  aria-label={item.label}
                >{item.emoji}</button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      {#if currentTrack}
        <button
          class="icon-btn heart" class:fav={isFav} class:pop={heartAnimating}
          onclick={toggleFav}
          aria-label={isFav ? 'Remove favorite' : 'Add favorite'}
        >{isFav ? '❤️' : '🤍'}</button>
      {/if}

      <button
        class="icon-btn" class:active={repeat !== 'off'}
        onclick={() => playerStore.toggleRepeat()}
        disabled={!currentTrack}
        title={repeat === 'all' ? 'Repeat all' : repeat === 'one' ? 'Repeat one' : 'Repeat off'}
        aria-label="Repeat"
      >{repeat === 'one' ? '🔂' : '🔁'}</button>

      <button
        class="expand-btn"
        onclick={() => expanded = !expanded}
        aria-label={expanded ? 'Collapse player' : 'Expand player'}
        aria-expanded={expanded}
      >{expanded ? '⌄' : '⌃'}</button>
    </div>
  </div>
</div>

<style>
  /* ── Shell ── */
  .mini-player {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 110;
    display: flex;
    flex-direction: column;
    background-color: var(--mp-surface);
    border-top: 1px solid var(--mp-border);
    box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.35);
  }

  /* ── Expanded panel ── */
  .expanded-panel {
    max-height: 44vh;
    overflow-y: auto;
    overflow-x: hidden;
    padding: 0.5rem 1rem 0.6rem;
    border-bottom: 1px solid var(--mp-border);
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
  }

  .close-btn {
    align-self: center;
    background: none;
    border: none;
    font-size: 1.2rem;
    cursor: pointer;
    color: var(--mp-text-muted);
    padding: 0 0.75rem;
    line-height: 1;
    transition: color 0.15s;
    margin-bottom: -0.15rem;
  }
  .close-btn:hover { color: var(--mp-text); }

  /* Hero */
  .exp-hero { display: flex; gap: 0.8rem; align-items: flex-start; }

  .exp-art {
    width: 76px;
    height: 76px;
    border-radius: 8px;
    background: rgba(108,92,231,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
  }
  .exp-art.empty { opacity: 0.45; }
  .exp-art img { width: 100%; height: 100%; object-fit: cover; }
  .exp-art span { font-size: 2rem; }

  .exp-meta { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.12rem; }
  .exp-title  { font-size: 0.92rem; font-weight: 700; color: var(--mp-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .exp-artist { font-size: 0.78rem; color: var(--mp-text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .exp-album  { font-size: 0.72rem; color: var(--mp-text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .exp-actions { display: flex; gap: 0.3rem; margin-top: 0.35rem; align-items: center; }

  .exp-act-btn {
    background: none;
    border: 1px solid var(--mp-border);
    border-radius: 6px;
    padding: 0.22rem 0.45rem;
    font-size: 0.95rem;
    cursor: pointer;
    color: var(--mp-text-sec);
    transition: color 0.15s, border-color 0.15s;
    line-height: 1;
  }
  .exp-act-btn:hover:not(:disabled) { color: var(--mp-accent); border-color: var(--mp-accent); }
  .exp-act-btn:disabled { opacity: 0.35; cursor: default; }
  .exp-act-btn.fav { color: #E17055; border-color: #E17055; }
  .exp-act-btn.pop { animation: hpop 0.35s ease-out; }

  /* Progress */
  .exp-prog-row { display: flex; align-items: center; gap: 0.45rem; }
  .exp-time { font-size: 0.7rem; color: var(--mp-text-muted); font-variant-numeric: tabular-nums; width: 2.8rem; text-align: center; flex-shrink: 0; }
  .exp-prog-bar {
    flex: 1;
    height: 4px;
    background: var(--mp-surf-light);
    border-radius: 2px;
    cursor: pointer;
    position: relative;
    touch-action: none;
    user-select: none;
    transition: height 0.1s;
  }
  .exp-prog-bar:not(.no-track):hover { height: 6px; }
  .exp-prog-bar.no-track { cursor: default; }
  .exp-prog-fill { height: 100%; border-radius: 2px; background: var(--mp-accent); pointer-events: none; transition: width 0.4s linear; }

  /* Controls */
  .exp-ctrl-row { display: flex; align-items: center; justify-content: center; gap: 0.6rem; }
  .exp-ctrl {
    background: none; border: none; cursor: pointer;
    color: var(--mp-text-sec); padding: 0.2rem;
    transition: transform 0.15s, color 0.15s; line-height: 1;
  }
  .exp-ctrl:hover:not(:disabled) { transform: scale(1.1); color: var(--mp-text); }
  .exp-ctrl:disabled { opacity: 0.35; cursor: default; }
  .exp-ctrl.skip  { font-size: 1.5rem; }
  .exp-ctrl.shuffle, .exp-ctrl.rep { font-size: 1.05rem; }
  .exp-ctrl.active { color: var(--mp-accent); }

  .exp-play {
    width: 50px; height: 50px;
    border-radius: 50%; border: none;
    background: var(--mp-accent); color: #fff;
    font-size: 1.35rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s; line-height: 1; flex-shrink: 0;
  }
  .exp-play:hover:not(:disabled) { transform: scale(1.06); }
  .exp-play:disabled { opacity: 0.35; cursor: default; }

  /* Volume */
  .exp-vol-row { display: flex; align-items: center; gap: 0.45rem; padding: 0 0.1rem; }
  .exp-vol-row span { font-size: 0.85rem; }
  .exp-vol {
    flex: 1; -webkit-appearance: none; appearance: none;
    height: 4px; border-radius: 2px;
    background: var(--mp-surf-light);
    accent-color: var(--mp-accent); cursor: pointer; outline: none;
  }
  .exp-vol::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%; background: var(--mp-accent); cursor: pointer; }

  /* Mood strip */
  .mood-strip { display: flex; flex-direction: column; gap: 0.3rem; }
  .mood-strip-label { font-size: 0.68rem; color: var(--mp-text-muted); font-weight: 600; letter-spacing: 0.4px; margin: 0; }
  .mood-strip-row { display: flex; gap: 0.25rem; }
  .qm-btn {
    flex: 1; aspect-ratio: 1; border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.1);
    background: transparent; font-size: 1rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.14s; padding: 0; line-height: 1;
  }
  .qm-btn:hover:not(:disabled) { border-color: var(--qm-color); background: color-mix(in srgb, var(--qm-color) 20%, transparent); transform: scale(1.08); }
  .qm-btn.sel { border-color: var(--qm-color); background: color-mix(in srgb, var(--qm-color) 28%, transparent); box-shadow: 0 0 8px color-mix(in srgb, var(--qm-color) 35%, transparent); }
  .qm-btn:disabled { opacity: 0.35; cursor: default; }

  /* Nav row */
  .exp-nav-row { display: flex; gap: 0.4rem; }
  .exp-nav-btn {
    flex: 1; padding: 0.42rem 0.4rem;
    border-radius: 8px; border: 1px solid var(--mp-border);
    background: var(--mp-surf-light); color: var(--mp-text-sec);
    font-size: 0.76rem; font-weight: 600; cursor: pointer;
    transition: color 0.15s, border-color 0.15s; white-space: nowrap;
  }
  .exp-nav-btn:hover { color: var(--mp-accent); border-color: var(--mp-accent); }

  /* ── Compact bar ── */
  .compact-bar {
    display: flex;
    align-items: center;
    height: 60px;
    padding: 0 0.75rem;
    gap: 0.5rem;
    flex-shrink: 0;
  }

  .bar-left {
    display: flex; align-items: center;
    gap: 0.45rem; flex: 1; min-width: 0;
  }

  .bar-art {
    width: 40px; height: 40px; border-radius: 4px;
    background: rgba(108,92,231,0.3);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; overflow: hidden;
  }
  .bar-art img { width: 100%; height: 100%; object-fit: cover; }
  .bar-art span { font-size: 1rem; opacity: 0.7; }

  .bar-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
  .bar-title  { font-size: 0.81rem; font-weight: 600; color: var(--mp-text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .bar-artist { font-size: 0.71rem; color: var(--mp-text-sec); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  .bar-time { font-size: 0.69rem; color: var(--mp-text-muted); font-variant-numeric: tabular-nums; white-space: nowrap; flex-shrink: 0; }
  .bar-time.dim { opacity: 0.4; }

  .bar-center { display: flex; align-items: center; gap: 0.1rem; flex-shrink: 0; }
  .bar-ctrl {
    background: none; border: none; font-size: 1.2rem; cursor: pointer;
    color: var(--mp-text-sec); padding: 0.2rem 0.3rem;
    transition: transform 0.15s, color 0.15s; line-height: 1;
  }
  .bar-ctrl:hover:not(:disabled) { transform: scale(1.1); color: var(--mp-text); }
  .bar-ctrl:disabled { opacity: 0.35; cursor: default; }

  .bar-play {
    width: 36px; height: 36px; border-radius: 50%; border: none;
    background: var(--mp-accent); color: #fff;
    font-size: 1rem; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    transition: transform 0.15s; line-height: 1; flex-shrink: 0;
  }
  .bar-play:hover:not(:disabled) { transform: scale(1.06); }
  .bar-play:disabled { opacity: 0.35; cursor: default; }

  .bar-right { display: flex; align-items: center; gap: 0.12rem; flex-shrink: 0; }

  .vol-wrap { display: flex; align-items: center; gap: 0.12rem; }
  .vol-icon  { font-size: 0.8rem; line-height: 1; }
  .vol-slider {
    -webkit-appearance: none; appearance: none;
    width: 54px; height: 4px; border-radius: 2px;
    background: rgba(255,255,255,0.15);
    accent-color: var(--mp-accent); cursor: pointer; outline: none;
  }
  .vol-slider::-webkit-slider-thumb { -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%; background: var(--mp-accent); cursor: pointer; }
  .vol-slider::-moz-range-thumb   { width: 12px; height: 12px; border-radius: 50%; background: var(--mp-accent); border: none; }

  .icon-btn {
    background: none; border: none; font-size: 1rem; cursor: pointer;
    padding: 0.22rem 0.28rem; color: var(--mp-text-sec); line-height: 1;
    transition: color 0.15s; flex-shrink: 0;
  }
  .icon-btn:hover:not(:disabled) { color: var(--mp-accent); }
  .icon-btn:disabled { opacity: 0.35; cursor: default; }
  .icon-btn.active { color: var(--mp-accent); }
  .icon-btn.heart.fav { color: #E17055; }
  .icon-btn.heart.pop { animation: hpop 0.35s ease-out; }

  /* Mood popup */
  .mood-wrap-rel { position: relative; }
  .mood-popup {
    position: absolute;
    bottom: calc(100% + 8px);
    right: 0;
    z-index: 120;
    background: var(--mp-surface);
    border: 1px solid var(--mp-border);
    border-radius: 12px;
    padding: 0.5rem;
    box-shadow: 0 -4px 28px rgba(0,0,0,0.5);
    width: max-content;
    max-width: min(300px, calc(100vw - 2rem));
  }
  .emoji-row { display: flex; flex-wrap: wrap; gap: 0.28rem; }
  .emj-btn {
    width: 36px; height: 36px; border-radius: 50%;
    border: 2px solid rgba(255,255,255,0.1);
    background: transparent; font-size: 1.05rem;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.14s; padding: 0;
  }
  .emj-btn:hover { border-color: var(--ec); background: color-mix(in srgb, var(--ec) 20%, transparent); transform: scale(1.1); }

  .expand-btn {
    background: none; border: 1px solid var(--mp-border);
    border-radius: 4px; font-size: 0.82rem; cursor: pointer;
    padding: 0.18rem 0.38rem; color: var(--mp-text-muted);
    line-height: 1; transition: color 0.15s, border-color 0.15s;
    flex-shrink: 0;
  }
  .expand-btn:hover { color: var(--mp-accent); border-color: var(--mp-accent); }

  @keyframes hpop {
    0%   { transform: scale(1); }
    40%  { transform: scale(1.55); }
    70%  { transform: scale(0.9); }
    100% { transform: scale(1); }
  }
</style>
