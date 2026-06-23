import Database from '@tauri-apps/plugin-sql';
import type { Track, Album, Artist } from '$lib/types/types';

let tracks = $state<Track[]>([]);
let albums = $state<Album[]>([]);
let artists = $state<Artist[]>([]);
let isScanning = $state(false);
let scanProgress = $state(0);
let lastScanned = $state<number | null>(null);
let db = $state<Database | null>(null);
let favoriteTrackIds = $state<Set<string>>(new Set());

// SQLite bound-parameter limits: 999 max. 13 cols × 50 rows = 650 params per batch.
const INSERT_BATCH = 50;
// For IN-clause batches: 1 timestamp param + up to 900 URIs = 901 params per batch.
const URI_BATCH = 900;

// Build one INSERT statement for a single batch (max INSERT_BATCH rows).
function buildInsertBatch(vals: unknown[][]): [string, unknown[]] {
    let p = 1;
    const rows = vals.map(row => `(${row.map(() => '$' + p++).join(',')})`);
    return [
        `INSERT INTO songs (id,uri,filename,title,artist,album,genre,year,track_number,duration,cover_art,date_added,last_scanned) VALUES ${rows.join(',')}`,
        vals.flat(),
    ];
}

export const libraryStore = {
  get tracks() { return tracks; },
  get albums() { return albums; },
  get artists() { return artists; },
  get isScanning() { return isScanning; },
  get scanProgress() { return scanProgress; },
  get lastScanned() { return lastScanned; },

  get favoriteTrackIds() { return favoriteTrackIds; },

  isFavorite(trackId: string): boolean {
    return favoriteTrackIds.has(trackId);
  },

  async loadFavorites() {
    if (!db) return;
    const rows = await db.select('SELECT track_id FROM favorites');
    favoriteTrackIds = new Set((rows as any[]).map((r: any) => r.track_id));
    // Sync DB favorites to the localStorage-backed favorites playlist
    const { playlistStore } = await import('$lib/stores/playlist.svelte');
    const favPlaylist = playlistStore.getPlaylist('favorites');
    if (favPlaylist) {
      const dbIds = new Set(favoriteTrackIds);
      const plIds = new Set(favPlaylist.trackIds);
      for (const id of dbIds) { if (!plIds.has(id)) playlistStore.addTrack('favorites', id); }
      for (const id of plIds) { if (!dbIds.has(id)) playlistStore.removeTrack('favorites', id); }
    }
  },

  async toggleFavorite(trackId: string) {
    if (!db) return;
    const { moodStore } = await import('$lib/stores/mood.svelte');
    const { playlistStore } = await import('$lib/stores/playlist.svelte');
    if (favoriteTrackIds.has(trackId)) {
      await db.execute('DELETE FROM favorites WHERE track_id = $1', [trackId]);
      const next = new Set(favoriteTrackIds);
      next.delete(trackId);
      favoriteTrackIds = next;
      playlistStore.removeTrack('favorites', trackId);
    } else {
      const ts = Math.floor(Date.now() / 1000);
      await db.execute('INSERT OR REPLACE INTO favorites (track_id, timestamp) VALUES ($1, $2)', [trackId, ts]);
      const next = new Set(favoriteTrackIds);
      next.add(trackId);
      favoriteTrackIds = next;
      await moodStore.addMoodEvent(trackId, '❤️', 5, undefined, 'favorite');
      playlistStore.addTrack('favorites', trackId);
    }
  },

  // Initialize database and load saved library
  async initDatabase() {
    db = await Database.load('sqlite:songs.db');
    const rows = await db.select('SELECT * FROM songs ORDER BY artist, title');
    const savedTracks: Track[] = (rows as any[]).map((row: any) => ({
      id: row.id,
      uri: row.uri,
      filename: row.filename,
      title: row.title,
      artist: row.artist,
      album: row.album,
      genre: row.genre || undefined,
      year: row.year || undefined,
      trackNumber: row.track_number || undefined,
      duration: row.duration || 0,
      coverArt: row.cover_art || undefined,
      dateAdded: row.date_added || 0,
    }));
    // DIAGNOSTIC: log cover art presence in DB
    const artDiag = await db.select('SELECT filename, LENGTH(cover_art) AS art_size FROM songs LIMIT 10') as any[];
    console.log('[COVER-ART] DB art_size diagnostic:', artDiag);
    if (savedTracks.length > 0) {
      const sample = savedTracks[0];
      console.log(`[COVER-ART] initDatabase first track "${sample.filename}": coverArt=${sample.coverArt ? sample.coverArt.substring(0, 100) : 'NONE/NULL'}`);
    }
    if (savedTracks.length > 0) {
      this.setTracks(savedTracks);
    }
    await this.loadFavorites();
  },

  // Save scanned tracks to database with incremental logic
  async saveScannedTracks(scannedTracks: Track[]) {
    if (!db) return;

    const existingRows = await db.select('SELECT uri FROM songs');
    const existingUris = new Set((existingRows as any[]).map((r: any) => r.uri));
    const scannedUris = new Set(scannedTracks.map(t => t.uri));

    const newTracks = scannedTracks.filter(t => !existingUris.has(t.uri));
    const deletedUris = [...existingUris].filter(uri => !scannedUris.has(uri as string));
    const keptUris = [...scannedUris].filter(uri => existingUris.has(uri));
    const now = Math.floor(Date.now() / 1000);

    // All mutations run inside a single transaction so a mid-scan failure
    // never leaves the database in a partial state.
    await db.execute('BEGIN');
    try {
      // 1. Remove tracks no longer present on disk.
      for (const uri of deletedUris) {
        await db.execute('DELETE FROM songs WHERE uri = $1', [uri as string]);
      }

      // 2. Insert new tracks in batches of INSERT_BATCH rows.
      if (newTracks.length > 0) {
        const vals = newTracks.map(t => [
          t.id, t.uri, t.filename, t.title, t.artist, t.album,
          t.genre ?? null, t.year ?? null, t.trackNumber ?? null,
          t.duration, t.coverArt ?? null, t.dateAdded || now, now,
        ]);
        for (let i = 0; i < vals.length; i += INSERT_BATCH) {
          const [stmt, params] = buildInsertBatch(vals.slice(i, i + INSERT_BATCH));
          await db.execute(stmt, params);
        }
      }

      // 3. Stamp last_scanned on tracks that were already in the DB,
      //    batching the IN clause to stay under the 999-param limit.
      for (let i = 0; i < keptUris.length; i += URI_BATCH) {
        const batch = keptUris.slice(i, i + URI_BATCH);
        let p = 2;
        const placeholders = batch.map(() => '$' + p++).join(',');
        await db.execute(
          `UPDATE songs SET last_scanned = $1 WHERE uri IN (${placeholders})`,
          [now, ...batch],
        );
      }

      await db.execute('COMMIT');
    } catch (err) {
      try { await db.execute('ROLLBACK'); } catch { /* ignore rollback error */ }
      throw err;
    }
  },

  setTracks(newTracks: Track[]) {
    tracks = newTracks;

    const albumMap = new Map<string, Album>();
    const artistMap = new Map<string, Artist>();

    for (const track of newTracks) {
      const artistName = track.artist.trim();
      const albumName = track.album.trim();
      const artistKey = artistName.toLowerCase();
      const albumKey = `${albumName.toLowerCase()}|||${artistKey}`;
      const album = albumMap.get(albumKey) || { coverArt: track.coverArt };

      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          id: `${albumName}|||${artistName}`,
          name: albumName,
          artist: artistName,
          tracks: [],
          coverArt: album.coverArt || track.coverArt,
          year: track.year,
          genre: track.genre,
        });
      }
      albumMap.get(albumKey)!.tracks.push(track);

      if (!artistMap.has(artistKey)) {
        artistMap.set(artistKey, {
          id: artistName,
          name: artistName,
          albums: [],
          trackCount: 0,
        });
      }
      artistMap.get(artistKey)!.trackCount++;
    }

    for (const album of albumMap.values()) {
      const artist = artistMap.get(album.artist.toLowerCase());
      if (artist) artist.albums.push(album);
    }

    albums = Array.from(albumMap.values());
    artists = Array.from(artistMap.values());
    lastScanned = Date.now();
  },

  async clearLibrary() {
    if (!db) return;
    await db.execute('DELETE FROM songs');
    tracks = [];
    albums = [];
    artists = [];
    lastScanned = null;
  },

  async startScan() {
    const { open } = await import('@tauri-apps/plugin-dialog');
    const { invoke } = await import('@tauri-apps/api/core');
    const { listen } = await import('@tauri-apps/api/event');

    const selected = await open({ directory: true, multiple: false, title: 'Select your music folder' });
    if (!selected) return;

    isScanning = true;
    scanProgress = 0;

    const unlisten = await listen<{ current: number; total: number }>('scan-progress', (event) => {
      const { current, total } = event.payload;
      if (total > 0) scanProgress = current / total;
    });

    try {
      const result = await invoke<unknown[]>('scan_directory', { dirPath: selected as string });
      const scannedTracks = result as Track[];
      // DIAGNOSTIC: log what came back from Rust
      console.log(`[COVER-ART] scan_directory returned ${scannedTracks.length} tracks`);
      if (scannedTracks.length > 0) {
        const sample = scannedTracks[0];
        console.log(`[COVER-ART] startScan first track "${sample.filename}": coverArt=${sample.coverArt ? sample.coverArt.substring(0, 100) : 'NONE/NULL'}`);
        const withArt = scannedTracks.filter(t => t.coverArt).length;
        console.log(`[COVER-ART] tracks with art: ${withArt}/${scannedTracks.length}`);
      }
      await this.saveScannedTracks(scannedTracks);
      this.setTracks(scannedTracks);
    } catch (err) {
      console.error('Scan failed:', err);
    } finally {
      unlisten();
      isScanning = false;
      scanProgress = 0;
    }
  },

  setScanning(scanning: boolean) { isScanning = scanning; },
  setScanProgress(progress: number) { scanProgress = progress; },

  getTrackById(id: string): Track | undefined {
    return tracks.find((t) => t.id === id);
  },

  getTracksByAlbum(albumId: string): Track[] {
    const album = albums.find((a) => a.id === albumId);
    return album ? [...album.tracks].sort((a, b) => (a.trackNumber || 0) - (b.trackNumber || 0)) : [];
  },

  getTracksByArtist(artistId: string): Track[] {
    return tracks.filter((t) => t.artist === artistId);
  },

  getAlbumsByArtist(artistId: string): Album[] {
    const artist = artists.find((a) => a.id === artistId);
    return artist ? artist.albums : [];
  },

  search(query: string): { tracks: Track[]; albums: Album[]; artists: Artist[] } {
    const q = query.toLowerCase();
    return {
      tracks: tracks.filter(
        (t) => t.title.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q) || t.album.toLowerCase().includes(q)
      ),
      albums: albums.filter(
        (a) => a.name.toLowerCase().includes(q) || a.artist.toLowerCase().includes(q)
      ),
      artists: artists.filter((a) => a.name.toLowerCase().includes(q)),
    };
  },
};