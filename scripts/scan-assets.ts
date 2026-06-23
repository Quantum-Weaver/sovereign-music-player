import { readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

const MEDIA_EXTENSIONS = [
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.icns',
  '.webp', '.bmp', '.mp3', '.wav', '.flac', '.ogg', '.m4a',
  '.aac', '.ttf', '.woff', '.woff2', '.eot'
];

const SKIP_DIRS = ['node_modules', 'src-tauri/icons', 'build', '.svelte-kit', '.git'];

function scan(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    try {
      if (statSync(full).isDirectory()) {
        if (!entry.startsWith('.') && !SKIP_DIRS.includes(entry)) {
          results.push(...scan(full));
        }
      } else if (MEDIA_EXTENSIONS.includes(extname(entry).toLowerCase())) {
        results.push(full);
      }
    } catch {}
  }
  return results;
}

console.log(scan('.').join('\n'));