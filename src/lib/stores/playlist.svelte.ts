import type { Playlist } from '$lib/types/types';
import { browser } from '$app/environment';

let playlists = $state<Playlist[]>([]);

function save() {
  if (browser) localStorage.setItem('playlists', JSON.stringify(playlists));
}

export const playlistStore = {
  get playlists() { return playlists; },

  createPlaylist(name: string): string {
    const id = `pl_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    playlists = [...playlists, { id, name, trackIds: [], createdAt: Date.now(), updatedAt: Date.now() }];
    save();
    return id;
  },

  deletePlaylist(id: string) {
    if (id === 'favorites') return;
    playlists = playlists.filter((p) => p.id !== id);
    save();
  },

  renamePlaylist(id: string, name: string) {
    if (id === 'favorites') return;
    playlists = playlists.map((p) => p.id === id ? { ...p, name, updatedAt: Date.now() } : p);
    save();
  },

  addTrack(playlistId: string, trackId: string) {
    playlists = playlists.map((p) =>
      p.id === playlistId && !p.trackIds.includes(trackId)
        ? { ...p, trackIds: [...p.trackIds, trackId], updatedAt: Date.now() }
        : p
    );
    save();
  },

  removeTrack(playlistId: string, trackId: string) {
    playlists = playlists.map((p) =>
      p.id === playlistId
        ? { ...p, trackIds: p.trackIds.filter((id) => id !== trackId), updatedAt: Date.now() }
        : p
    );
    save();
  },

  getPlaylist(id: string): Playlist | undefined {
    return playlists.find((p) => p.id === id);
  },

  loadPlaylists() {
    if (browser) {
      try {
        const stored = localStorage.getItem('playlists');
        if (stored) playlists = JSON.parse(stored);
      } catch {}
      if (!playlists.find((p) => p.id === 'favorites')) {
        playlists = [
          { id: 'favorites', name: '❤️ Favorites', trackIds: [], createdAt: Date.now(), updatedAt: Date.now() },
          ...playlists,
        ];
        save();
      }
    }
  },
};
