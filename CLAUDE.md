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

SvelteKit is configured with `adapter-static` and `fallback: "index.html"` so the entire app is a client-side SPA — no SSR. All Tauri APIs (file dialog, fs, SQL) are only available at runtime inside the desktop shell.

### Frontend structure

- `src/routes/` — SvelteKit file-based routes: `/` (library), `/playlists`, `/playlists/[id]`, `/nowplaying`, `/queue`, `/timer`, `/settings`, `/library/album/[id]`, `/library/artist/[id]`
- `src/lib/stores/` — global reactive state (library, player, playlists, theme)
- `src/lib/types/types.ts` — canonical TypeScript interfaces (`Track`, `Album`, `Artist`, `Playlist`, `ThemeConfig`, `PlayerState`)
- `src/lib/theme/` — theme presets and `getThemeColors()` helper
- `src/lib/cosmic/` — design system color and effect constants (used as source-of-truth for accent colors)
- `src/lib/components/MiniPlayer.svelte` — persistent bottom playback bar, rendered in `+layout.svelte`

### State management pattern

All stores use **Svelte 5 runes** — module-level `$state` variables wrapped in a plain exported object with getters. This is not the old `writable()`/`readable()` pattern.

```ts
let tracks = $state<Track[]>([]);

export const libraryStore = {
  get tracks() { return tracks; },
  setTracks(newTracks: Track[]) { tracks = newTracks; },
};
```

Use `$derived` in components to subscribe: `const tracks = $derived(libraryStore.tracks);`

### Navigation

Because this is a Tauri SPA, navigation uses `window.location.href = '/path'` rather than SvelteKit's `goto()`. The `page` store from `$app/state` is used for reading the current route.

### Data persistence

| Data | Storage |
|------|---------|
| Music library (tracks) | SQLite `songs.db` via `tauri-plugin-sql` |
| Playlists | `localStorage` |
| Theme config | `localStorage` |

`libraryStore.initDatabase()` is called on mount in `+layout.svelte`. It runs the migration (creates `songs` table) and loads saved tracks. Scanning is incremental: new URIs are inserted, removed URIs are deleted, existing ones get `last_scanned` updated.

### Theme system

Theme CSS variables are injected as inline styles on the root `.app-shell` div in `+layout.svelte`. Every page/component references `--accent`, `--text`, `--text-secondary`, `--text-muted`, `--bg-surface`, `--border-color` etc. via `var()`. Call `getThemeColors(themeStore.config)` to get the computed color values and spread them into a style attribute.

### Rust backend (`src-tauri/src/lib.rs`)

Two Tauri commands are registered:
- `scan_directory(dir_path: String)` — recursively walks a directory, reads audio metadata via `lofty` (mp3, flac, wav, aac, ogg, m4a), returns `Vec<TrackInfo>`. Falls back to parsing `"Artist - Title"` from filename if no embedded tags.
- `greet(name)` — placeholder/test command

The `rodio` crate is a dependency but audio playback is not yet wired to a Tauri command — the frontend `playerStore` manages playback state only (no actual audio engine call yet).

### Album ID format

Album IDs are composite keys: `"albumName|||artistName"`. When navigating to an album detail page, the route is `/library/album/[encodedAlbumName]?artist=[encodedArtistName]`.
