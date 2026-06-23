// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
mod audio;
mod equalizer;
mod visualizer;
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::tag::Accessor;
use lofty::tag::ItemKey;
use base64::prelude::*;
use tauri::Emitter;
use tauri_plugin_sql::{Migration, MigrationKind};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrackInfo {
    pub id: String,
    pub uri: String,
    pub filename: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub genre: Option<String>,
    pub year: Option<u32>,
    #[serde(rename = "trackNumber")]
    pub track_number: Option<u32>,
    pub duration: f64,
    #[serde(rename = "coverArt")]
    pub cover_art: Option<String>,
    #[serde(rename = "dateAdded")]
    pub date_added: u64,
}

fn parse_duration(path: &Path) -> f64 {
    if let Ok(tagged_file) = lofty::read_from_path(path) {
        return tagged_file.properties().duration().as_secs_f64();
    }
    0.0
}

fn parse_metadata(path: &Path) -> TrackInfo {
    let filename = path
        .file_name()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();

    let uri = path.to_string_lossy().to_string();
    let id = uri.clone();

    let mut title = path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("Unknown")
        .to_string();
        
    let mut artist = String::from("Unknown Artist");
    let mut album = String::from("Unknown Album");
    let mut genre: Option<String> = None;
    let mut year: Option<u32> = None;
    let mut track_number: Option<u32> = None;
    let mut cover_art: Option<String> = None;

    if let Ok(tagged_file) = lofty::read_from_path(path) {
        if let Some(tag) = tagged_file.primary_tag() {
            if let Some(t) = tag.title() {
                title = t.to_string();
            }
            if let Some(a) = tag.artist() {
                artist = a.to_string();
            }
            if let Some(a) = tag.album() {
                album = a.to_string();
            }
            genre = tag.genre().map(|g| g.to_string());

            year = tag.get_string(&ItemKey::RecordingDate)
                .and_then(|s| s.parse::<u32>().ok());
            track_number = tag.get_string(&ItemKey::TrackNumber)
                .and_then(|s| s.parse::<u32>().ok());

            if let Some(pic) = tag.pictures().first() {
                let mime = match pic.mime_type() {
                    Some(lofty::picture::MimeType::Jpeg) => "image/jpeg",
                    Some(lofty::picture::MimeType::Png) => "image/png",
                    Some(lofty::picture::MimeType::Gif) => "image/gif",
                    Some(lofty::picture::MimeType::Tiff) => "image/tiff",
                    Some(lofty::picture::MimeType::Bmp) => "image/bmp",
                    _ => "image/jpeg",
                };
                cover_art = Some(format!("data:{};base64,{}", mime, BASE64_STANDARD.encode(pic.data())));
            }
        }
    }

    // Fallback: parse "Artist - Title" from filename if no metadata
    if artist == "Unknown Artist" && title.contains(" - ") {
        let parts: Vec<&str> = title.splitn(2, " - ").collect();
        if parts.len() == 2 {
            artist = parts[0].trim().to_string();
            title = parts[1].trim().to_string();
        }
    }

    let duration = parse_duration(path);
    
    // Get date_added from file modification time
    let date_added = std::fs::metadata(path)
        .and_then(|m| m.modified())
        .map(|t| t.duration_since(std::time::UNIX_EPOCH).unwrap_or_default().as_secs())
        .unwrap_or(0);

    TrackInfo {
        id,
        uri,
        filename,
        title,
        artist,
        album,
        genre,
        year,
        track_number,
        duration,
        cover_art,
        date_added,
    }
}

#[derive(Serialize, Clone)]
struct ScanProgress {
    current: usize,
    total: usize,
}

#[tauri::command]
fn scan_directory(app_handle: tauri::AppHandle, dir_path: String) -> Result<Vec<TrackInfo>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Directory not found: {}", dir_path));
    }

    let extensions = ["mp3", "flac", "wav", "aac", "ogg", "m4a"];

    // First pass: collect all audio paths so we know the total before emitting.
    fn collect_paths(dir: &Path, paths: &mut Vec<std::path::PathBuf>, extensions: &[&str]) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let p = entry.path();
                if p.is_dir() {
                    collect_paths(&p, paths, extensions);
                } else if let Some(ext) = p.extension() {
                    if extensions.contains(&ext.to_string_lossy().to_lowercase().as_str()) {
                        paths.push(p);
                    }
                }
            }
        }
    }

    let mut paths: Vec<std::path::PathBuf> = Vec::new();
    collect_paths(path, &mut paths, &extensions);
    let total = paths.len();

    // Second pass: parse metadata and emit progress after each file.
    let mut tracks = Vec::with_capacity(total);
    for (i, file_path) in paths.iter().enumerate() {
        tracks.push(parse_metadata(file_path));
        let _ = app_handle.emit("scan-progress", ScanProgress { current: i + 1, total });
    }

    Ok(tracks)
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let songs_migrations = vec![
        Migration {
            version: 1,
            description: "create_songs_table",
            sql: "CREATE TABLE IF NOT EXISTS songs (
                id TEXT PRIMARY KEY,
                uri TEXT NOT NULL UNIQUE,
                filename TEXT NOT NULL,
                title TEXT NOT NULL,
                artist TEXT NOT NULL,
                album TEXT NOT NULL,
                genre TEXT,
                year INTEGER,
                track_number INTEGER,
                duration REAL NOT NULL DEFAULT 0,
                cover_art TEXT,
                date_added INTEGER NOT NULL DEFAULT 0,
                last_scanned INTEGER NOT NULL DEFAULT 0
            );",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "create_mood_events_table",
            sql: "CREATE TABLE IF NOT EXISTS mood_events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                track_id TEXT NOT NULL,
                emoji TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                intensity INTEGER DEFAULT 3,
                comment TEXT,
                context TEXT DEFAULT 'manual'
            );
            CREATE INDEX IF NOT EXISTS idx_mood_track ON mood_events(track_id);
            CREATE INDEX IF NOT EXISTS idx_mood_time ON mood_events(timestamp);",
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "create_favorites_table",
            sql: "CREATE TABLE IF NOT EXISTS favorites (
                track_id TEXT NOT NULL,
                timestamp INTEGER NOT NULL,
                PRIMARY KEY (track_id)
            );",
            kind: MigrationKind::Up,
        },
    ];

    let (vis_tx, vis_rx) = visualizer::make_channel();
    let audio_state = audio::init(vis_tx);

    tauri::Builder::default()
        .manage(audio_state)
        .setup(|app| {
            visualizer::start(app.handle().clone(), vis_rx);
            Ok(())
        })
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:songs.db", songs_migrations)
                .build()
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            scan_directory,
            audio::play_track,
            audio::pause,
            audio::resume,
            audio::seek,
            audio::set_volume,
            audio::stop,
            audio::get_eq_state,
            audio::set_eq_band,
            audio::set_eq_preamp,
            audio::toggle_eq,
            audio::set_eq_preset,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}