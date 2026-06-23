import Database from '@tauri-apps/plugin-sql';
import { browser } from '$app/environment';
import type { MoodEvent } from '$lib/types/types';

// ── Reactive State ──
let recentMoods = $state<MoodEvent[]>([]);
let topEmojis = $state<{ emoji: string; count: number }[]>([]);
let totalEvents = $state(0);
let db = $state<Database | null>(null);

// ── Database Init ──
async function initDB() {
  if (!browser) return;
  db = await Database.load('sqlite:songs.db');
  await db.execute(`
    CREATE TABLE IF NOT EXISTS mood_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      track_id TEXT NOT NULL,
      emoji TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      intensity INTEGER DEFAULT 3,
      comment TEXT,
      context TEXT DEFAULT 'manual'
    )
  `);
  await refreshStats();
}

// ── CRUD ──
async function addMoodEvent(
  trackId: string,
  emoji: string,
  intensity: number = 3,
  comment?: string,
  context: 'manual' | 'skip_prompt' | 'track_end' | 'favorite' = 'manual'
) {
  if (!db) return;
  const timestamp = Date.now();
  await db.execute(
    'INSERT INTO mood_events (track_id, emoji, timestamp, intensity, comment, context) VALUES ($1, $2, $3, $4, $5, $6)',
    [trackId, emoji, timestamp, intensity, comment || null, context]
  );
  await refreshStats();
}

async function getMoodEventsByTrack(trackId: string): Promise<MoodEvent[]> {
  if (!db) return [];
  const rows = await db.select(
    'SELECT * FROM mood_events WHERE track_id = $1 ORDER BY timestamp DESC',
    [trackId]
  );
  return (rows as any[]).map(rowToMoodEvent);
}

async function getRecentMoods(limit: number = 20): Promise<MoodEvent[]> {
  if (!db) return [];
  const rows = await db.select(
    'SELECT * FROM mood_events ORDER BY timestamp DESC LIMIT $1',
    [limit]
  );
  return (rows as any[]).map(rowToMoodEvent);
}

async function getTopEmojis(limit: number = 8): Promise<{ emoji: string; count: number }[]> {
  if (!db) return [];
  const rows = await db.select(
    'SELECT emoji, COUNT(*) as count FROM mood_events GROUP BY emoji ORDER BY count DESC LIMIT $1',
    [limit]
  );
  return rows as { emoji: string; count: number }[];
}

async function getTotalEvents(): Promise<number> {
  if (!db) return 0;
  const rows = await db.select('SELECT COUNT(*) as count FROM mood_events');
  return (rows as any[])[0]?.count || 0;
}

async function refreshStats() {
  recentMoods = await getRecentMoods(20);
  topEmojis = await getTopEmojis(8);
  totalEvents = await getTotalEvents();
}

// ── Helpers ──
function rowToMoodEvent(row: any): MoodEvent {
  return {
    id: row.id,
    trackId: row.track_id,
    emoji: row.emoji,
    timestamp: row.timestamp,
    intensity: row.intensity || 3,
    comment: row.comment || undefined,
    context: row.context || 'manual',
  };
}

// ── Store Export ──
export const moodStore = {
  get recentMoods() { return recentMoods; },
  get topEmojis() { return topEmojis; },
  get totalEvents() { return totalEvents; },

  addMoodEvent,
  getMoodEventsByTrack,
  getRecentMoods,
  getTopEmojis,
  getTotalEvents,
  initDB,
};