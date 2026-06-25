# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Run the full Tauri desktop app (required for audio, file system, SQLite)
npm run tauri dev

# Run the Vite frontend only (no Tauri APIs — for UI-only work)
npm run dev

# Type-check the frontend
npm run check
npm run check:watch

# Build for release
npm run tauri build

# Rust: build/test the backend only
cd src-tauri && cargo build
cd src-tauri && cargo test
```

There are no frontend tests. `npm run check` is the closest equivalent.

## Architecture

**Stack:** Tauri v2 (Rust backend) + SvelteKit (SPA mode) + Tailwind CSS v4 + SQLite

SvelteKit is configured with `adapter-static` and `fallback: "index.html"` — the entire app is a client-side SPA. All Tauri APIs (file dialog, fs, SQL) are only available at runtime inside the desktop shell.

### Frontend structure

- `src/routes/` — SvelteKit file-based routes: `/` (home/recent), `/library`, `/playlists`, `/playlists/[id]`, `/nowplaying`, `/queue`, `/timer`, `/settings`, `/equalizer`, `/visualizer`, `/resonance`, `/search`, `/library/album/[id]`, `/library/artist/[id]`
- `src/lib/stores/` — global reactive state: `player`, `library`, `playlist`, `theme`, `mood`
- `src/lib/types/types.ts` — canonical TypeScript interfaces (`Track`, `Album`, `Artist`, `Playlist`, `MoodEvent`, `ThemeConfig`, `PlayerState`)
- `src/lib/theme/theme.ts` — `PRESET_THEMES` record + `getThemeColors(config)` helper that returns computed hex values
- `src/lib/cosmic/colors.ts` — `QUANTUM_COLORS` single source of truth for all color constants; also exports `MOOD_COLORS`, `ENERGY_COLORS`, etc.
- `src/lib/components/MiniPlayer.svelte` — persistent bottom playback bar, always rendered in `+layout.svelte`

### State management pattern

All stores use **Svelte 5 runes** — module-level `$state` variables exported through a plain object with getters. This is **not** the old `writable()`/`readable()` pattern.

```ts
let tracks = $state<Track[]>([]);

export const libraryStore = {
  get tracks() { return tracks; },
  setTracks(newTracks: Track[]) { tracks = newTracks; },
};
```

In components, use `$derived` to subscribe: `const tracks = $derived(libraryStore.tracks);`

### Navigation

The codebase uses `goto()` from `$app/navigation` for all in-app navigation. One known issue: the visualizer page uses `position: fixed; inset: 0; z-index: 100`, so if `goto()` navigation doesn't fully tear down the component, the overlay remains and blocks all clicks. Keep `onDestroy` cleanup complete on any page using fixed full-screen overlays.

### Theme system

CSS variables (`--accent`, `--text`, `--text-secondary`, `--text-muted`, `--bg-surface`, `--border-color`) are injected as inline styles on the root `.app-shell` div in `+layout.svelte`. Every page/component reads them via `var()`. To get computed values, call `getThemeColors(themeStore.config)` and spread the result into a `style` attribute.

### Data persistence

| Data | Storage |
|------|---------|
| Music library (tracks) | SQLite `songs.db` via `tauri-plugin-sql` |
| Mood events | SQLite `songs.db` (`mood_events` table) |
| Favorites | SQLite `songs.db` (`favorites` table) + mirrored to `localStorage` playlist |
| Playlists | `localStorage` |
| Theme config | `localStorage` |

`libraryStore.initDatabase()` is called on mount in `+layout.svelte`. It opens the DB (auto-applying migrations), loads saved tracks, and syncs favorites. `moodStore.initDB()` is also called from layout — it opens the same `songs.db` but creates `mood_events` in JS rather than relying solely on the Rust migration.

**SQLite batch limits:** The plugin caps bound parameters at 999. The library store enforces `INSERT_BATCH = 50` rows (13 columns × 50 = 650 params) for inserts, and `URI_BATCH = 900` for `IN`-clause updates.

**Album ID format:** Composite key `"albumName|||artistName"`. Route: `/library/album/[encodedAlbumName]?artist=[encodedArtistName]`.

**Track ID and URI** are both the full filesystem path. Cover art is stored as a `data:image/...;base64,...` string in the `cover_art` column.

**Favorites playlist** is always the first entry in `playlistStore`; `deletePlaylist('favorites')` is a no-op.

---

### Rust backend

The backend is split across four files in `src-tauri/src/`:

| File | Responsibility |
|------|---------------|
| `lib.rs` | App setup, `scan_directory` Tauri command, SQLite migrations, wires modules together |
| `audio.rs` | Playback commands (`play_track`, `pause`, `resume`, `seek`, `set_volume`, `stop`) and EQ commands |
| `equalizer.rs` | `EqFilter` (biquad DSP), `EqState`, presets |
| `visualizer.rs` | `SampleTap` source wrapper + FFT thread emitting `spectrum` events |

**Audio processing chain** (per `play_track`):
```
Decoder[i16] → convert_samples::<f32>() → EqFilter → SampleTap → Sink
```

`OutputStream` / WASAPI is held on a dedicated thread (not `Send`) — `AudioState` wraps the `OutputStreamHandle` and is `Managed` as Tauri state.

**Tauri audio events** emitted to the frontend:
- `audio://position` — current playback position in seconds, ~500ms interval
- `audio://duration` — total duration from rodio (only emitted if > 0, to avoid clobbering lofty's value for VBR MP3s)
- `audio://track-end` — fired when the sink drains; triggers `playerStore.next()`
- `spectrum` — 64 `f32` values (0..1, log-scale) at ~30fps from the FFT thread

**Visualizer FFT:** `FFT_SIZE = 2048`, Hann window, log-scale binning into 64 bars, sqrt-curve normalisation (`powf(0.65)`). `SampleTap` captures only the left channel via `try_send` (non-blocking) so the audio callback never stalls.

**Equalizer:** 10-band parametric biquad, ±12 dB per band plus preamp. Bands: 32, 64, 125, 250, 500, 1k, 2k, 4k, 8k, 16k Hz. State is `Arc<Mutex<EqState>>` shared between the Tauri command handlers and the `EqFilter` source.

**`scan_directory`** does two passes: first collects all audio paths to know the total (for progress), then parses metadata with `lofty` and emits `scan-progress` events. Supports mp3, flac, wav, aac, ogg, m4a. Falls back to `"Artist - Title"` filename parsing when no tags exist.

### SQLite schema (migrations in `lib.rs`)

```sql
-- v1
songs(id TEXT PK, uri TEXT UNIQUE, filename, title, artist, album, genre, year,
      track_number, duration REAL, cover_art TEXT, date_added INT, last_scanned INT)

-- v2
mood_events(id INT PK AUTOINCREMENT, track_id TEXT, emoji TEXT, timestamp INT,
            intensity INT DEFAULT 3, comment TEXT, context TEXT DEFAULT 'manual')
-- indexed on track_id and timestamp

-- v3
favorites(track_id TEXT PK, timestamp INT)
```
