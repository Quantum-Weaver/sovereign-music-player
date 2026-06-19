import type { Track } from '$lib/types/types';

let currentTrack = $state<Track | null>(null);
let queue = $state<Track[]>([]);
let isPlaying = $state(false);
let position = $state(0);
let duration = $state(0);
let shuffle = $state(false);
let repeat = $state<'off' | 'one' | 'all'>('off');
let volume = $state(1);

export const playerStore = {
  get currentTrack() { return currentTrack; },
  get queue() { return queue; },
  get isPlaying() { return isPlaying; },
  get position() { return position; },
  get duration() { return duration; },
  get shuffle() { return shuffle; },
  get repeat() { return repeat; },
  get volume() { return volume; },

  loadTrack(track: Track) {
    currentTrack = track;
    queue = [track];
    position = 0;
    isPlaying = true;
  },

  loadQueue(tracks: Track[], startIndex = 0) {
    queue = tracks;
    currentTrack = tracks[startIndex];
    position = 0;
    isPlaying = true;
  },

  play() { isPlaying = true; },
  pause() { isPlaying = false; },
  togglePlay() { isPlaying = !isPlaying; },

  next() {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
    if (repeat === 'one') {
      position = 0;
      return;
    }
    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') nextIndex = 0;
        else { isPlaying = false; return; }
      }
    }
    currentTrack = queue[nextIndex];
    position = 0;
  },

  previous() {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    currentTrack = queue[prevIndex];
    position = 0;
  },

  seek(newPosition: number) { position = newPosition; },
  setDuration(newDuration: number) { duration = newDuration; },

  toggleShuffle() { shuffle = !shuffle; },
  toggleRepeat() {
    const modes: ('off' | 'one' | 'all')[] = ['off', 'one', 'all'];
    const current = modes.indexOf(repeat);
    repeat = modes[(current + 1) % 3];
  },

  addToQueue(track: Track) { queue = [...queue, track]; },
  removeFromQueue(index: number) {
    const newQueue = queue.filter((_, i) => i !== index);
    if (queue[index]?.id === currentTrack?.id) {
      const nextTrack = newQueue[index] || newQueue[0] || null;
      queue = newQueue;
      currentTrack = nextTrack;
      position = 0;
      isPlaying = !!nextTrack;
    } else {
      queue = newQueue;
    }
  },

  clearQueue() {
    queue = [];
    currentTrack = null;
    isPlaying = false;
    position = 0;
  },

  setVolume(newVolume: number) {
    volume = Math.max(0, Math.min(1, newVolume));
  },
};