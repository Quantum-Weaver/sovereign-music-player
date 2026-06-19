import type { Track, Album, Artist } from '$lib/types/types';

let tracks = $state<Track[]>([]);
let albums = $state<Album[]>([]);
let artists = $state<Artist[]>([]);
let isScanning = $state(false);
let scanProgress = $state(0);
let lastScanned = $state<number | null>(null);

export const libraryStore = {
  get tracks() { return tracks; },
  get albums() { return albums; },
  get artists() { return artists; },
  get isScanning() { return isScanning; },
  get scanProgress() { return scanProgress; },
  get lastScanned() { return lastScanned; },

  setTracks(newTracks: Track[]) {
    tracks = newTracks;
    
    // Build albums from tracks
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

    // Link albums to artists
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