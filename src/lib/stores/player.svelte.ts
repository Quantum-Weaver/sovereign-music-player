import type { Track } from '$lib/types/types';
import { browser } from '$app/environment';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

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
    duration = track.duration;
    isPlaying = true;
    invoke('play_track', { path: track.uri }).catch(console.error);
  },

  loadQueue(tracks: Track[], startIndex = 0) {
    queue = tracks;
    currentTrack = tracks[startIndex];
    position = 0;
    duration = tracks[startIndex].duration;
    isPlaying = true;
    invoke('play_track', { path: tracks[startIndex].uri }).catch(console.error);
  },

  play() {
    if (!currentTrack) return;
    isPlaying = true;
    invoke('resume').catch(console.error);
  },

  pause() {
    isPlaying = false;
    invoke('pause').catch(console.error);
  },

  togglePlay() {
    if (isPlaying) {
      playerStore.pause();
    } else {
      playerStore.play();
    }
  },

  next(isSkip = false) {
    if (!currentTrack || queue.length === 0) return;
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);

    if (repeat === 'one') {
      position = 0;
      invoke('play_track', { path: currentTrack.uri }).catch(console.error);
      return;
    }

    // Log skip event when user manually advances mid-track
    if (isSkip && position > 0) {
      const skippedId = currentTrack.id;
      import('$lib/stores/mood.svelte').then(({ moodStore }) => {
        moodStore.addMoodEvent(skippedId, '⏭️', 3, undefined, 'skip_prompt').catch(() => {});
      });
    }

    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeat === 'all') {
          nextIndex = 0;
        } else {
          isPlaying = false;
          invoke('stop').catch(console.error);
          return;
        }
      }
    }

    currentTrack = queue[nextIndex];
    position = 0;
    duration = queue[nextIndex].duration;
    invoke('play_track', { path: queue[nextIndex].uri }).catch(console.error);
  },

  previous() {
    if (!currentTrack || queue.length === 0) return;
    // Log skip event when user goes back mid-track
    if (position > 0) {
      const skippedId = currentTrack.id;
      import('$lib/stores/mood.svelte').then(({ moodStore }) => {
        moodStore.addMoodEvent(skippedId, '⏭️', 3, undefined, 'skip_prompt').catch(() => {});
      });
    }
    const currentIndex = queue.findIndex((t) => t.id === currentTrack?.id);
    const prevIndex = currentIndex - 1 < 0 ? queue.length - 1 : currentIndex - 1;
    currentTrack = queue[prevIndex];
    position = 0;
    duration = queue[prevIndex].duration;
    invoke('play_track', { path: queue[prevIndex].uri }).catch(console.error);
  },

  seek(newPosition: number) {
    position = newPosition;
    invoke('seek', { positionSecs: newPosition }).catch(console.error);
  },

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
      duration = nextTrack?.duration ?? 0;
      isPlaying = !!nextTrack;
      if (nextTrack) {
        invoke('play_track', { path: nextTrack.uri }).catch(console.error);
      } else {
        invoke('stop').catch(console.error);
      }
    } else {
      queue = newQueue;
    }
  },

  clearQueue() {
    queue = [];
    currentTrack = null;
    isPlaying = false;
    position = 0;
    duration = 0;
    invoke('stop').catch(console.error);
  },

  setVolume(newVolume: number) {
    volume = Math.max(0, Math.min(1, newVolume));
    invoke('set_volume', { vol: volume }).catch(console.error);
  },
};

// ---------------------------------------------------------------------------
// Tauri audio event listeners (wired once for the lifetime of the app)
// ---------------------------------------------------------------------------
if (browser) {
  listen<number>('audio://position', (event) => {
    position = event.payload;
  });

  listen<number>('audio://duration', (event) => {
    // Only overwrite the lofty-sourced duration if rodio reports a positive value.
    // VBR MP3s without Xing headers report 0.0 — don't clobber the correct value.
    if (event.payload > 0) duration = event.payload;
  });

  listen('audio://track-end', () => {
    playerStore.next();
  });
}
