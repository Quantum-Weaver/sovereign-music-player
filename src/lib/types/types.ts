// Track metadata
export interface Track {
  id: string;
  uri: string;
  filename: string;
  title: string;
  artist: string;
  album: string;
  genre?: string;
  year?: number;
  trackNumber?: number;
  duration: number;
  coverArt?: string;
  dateAdded: number;
}

// Album grouping
export interface Album {
  id: string;
  name: string;
  artist: string;
  tracks: Track[];
  coverArt?: string;
  year?: number;
  genre?: string;
}

// Artist grouping
export interface Artist {
  id: string;
  name: string;
  albums: Album[];
  trackCount: number;
}

// Playlist
export interface Playlist {
  id: string;
  name: string;
  trackIds: string[];
  createdAt: number;
  updatedAt: number;
}

// Mood event (skip/replay)
// Mood event (emoji tagging, skip prompts, manual)
export interface MoodEvent {
  id: number;
  trackId: string;
  emoji: string;
  timestamp: number;
  intensity: number;
  comment?: string;
  context: 'manual' | 'skip_prompt' | 'track_end';
}

// Emoji definition (folksonomy)
export interface EmojiDefinition {
  emoji: string;
  definition: string;
  isDefault: boolean;
  isHidden: boolean;
  sortOrder: number;
}

// Theme customization
export interface ThemeConfig {
  mode: 'dark' | 'light' | 'amoled';
  accentColor: string;
  presetName?: string;
  fontSize: 'small' | 'medium' | 'large';
  albumArtShape: 'square' | 'rounded' | 'circular';
}

// Playback state
export interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: 'off' | 'one' | 'all';
  volume: number;
}