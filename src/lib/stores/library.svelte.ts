import Database from '@tauri-apps/plugin-sql';
import type { Track, Album, Artist } from '$lib/types/types';

let tracks = $state<Track[]>([]);
let albums = $state<Album[]>([]);
let artists = $state<Artist[]>([]);
let isScanning = $state(false);
let scanProgress = $state(0);
let lastScanned = $state<number | null>(null);
let db = $state<Database | null>(null);

// Helper: Bulk insert for performance
function bulkInsert(table: string, cols: string[], vals: unknown[][]): [string, unknown[]] {
    const values = vals.flat();
    const def: string[] = [];
    let x = 1;
    for (let i = 0; i < vals.length; i++) {
        const f: string[] = [];
        for (let j = 0; j < cols.length; j++) {
            f[j] = "$" + x;
            x++;
        }
        def[i] = "(" + f.join(",") + ")";
    }
    return [`INSERT INTO ${table} (${cols.join(",")}) VALUES ${def.join(",")}`, values];
}

export const libraryStore = {
  get tracks() { return tracks; },
  get albums() { return albums; },
  get artists() { return artists; },
  get isScanning() { return isScanning; },
  get scanProgress() { return scanProgress; },
  get lastScanned() { return lastScanned; },

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
    if (savedTracks.length > 0) {
      this.setTracks(savedTracks);
    }
  },

  // Save scanned tracks to database with incremental logic
  async saveScannedTracks(scannedTracks: Track[]) {
    if (!db) return;
    
    const existingRows = await db.select('SELECT uri FROM songs');
    const existingUris = new Set((existingRows as any[]).map((r: any) => r.uri));
    const scannedUris = new Set(scannedTracks.map(t => t.uri));
    
    const newTracks = scannedTracks.filter(t => !existingUris.has(t.uri));
    const deletedUris = [...existingUris].filter(uri => !scannedUris.has(uri));
    
    for (const uri of deletedUris) {
      await db.execute('DELETE FROM songs WHERE uri = $1', [uri as string]);
    }
    
    // Insert new tracks in bulk
    if (newTracks.length > 0) {
      const cols = ['id', 'uri', 'filename', 'title', 'artist', 'album', 'genre', 'year', 'track_number', 'duration', 'cover_art', 'date_added', 'last_scanned'];
      const now = Math.floor(Date.now() / 1000);
      const vals = newTracks.map(t => [
        t.id, t.uri, t.filename, t.title, t.artist, t.album,
        t.genre || null, t.year || null, t.trackNumber || null,
        t.duration, t.coverArt || null, t.dateAdded || now, now
      ]);
      const [statement, values] = bulkInsert('songs', cols, vals);
      await db.execute(statement, values);
    }
    
    // Update last_scanned for existing tracks that are still present
    const now = Math.floor(Date.now() / 1000);
    for (const uri of scannedUris) {
      if (existingUris.has(uri)) {
        await db.execute('UPDATE songs SET last_scanned = $1 WHERE uri = $2', [now, uri]);
      }
    }
  },

  setTracks(newTracks: Track[]) {
    tracks = newTracks;
    
    const albumMap = new Map<string, Album>();
    const artistMap = new Map<string, Artist>();

    for (const track of newTracks) {
      const albumKey = `${track.album}|||${track.artist}`;
      if (!albumMap.has(albumKey)) {
        albumMap.set(albumKey, {
          id: albumKey,
          name: track.album,
          artist: track.artist,
          tracks: [],
          coverArt: track.coverArt,
          year: track.year,
          genre: track.genre,
        });
      }
      albumMap.get(albumKey)!.tracks.push(track);

      if (!artistMap.has(track.artist)) {
        artistMap.set(track.artist, {
          id: track.artist,
          name: track.artist,
          albums: [],
          trackCount: 0,
        });
      }
      artistMap.get(track.artist)!.trackCount++;
    }

    for (const album of albumMap.values()) {
      const artist = artistMap.get(album.artist);
      if (artist) artist.albums.push(album);
    }

    albums = Array.from(albumMap.values());
    artists = Array.from(artistMap.values());
    lastScanned = Date.now();
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