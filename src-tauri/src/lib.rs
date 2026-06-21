// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use lofty::file::AudioFile;
use lofty::file::TaggedFileExt;
use lofty::tag::Accessor;
use lofty::tag::ItemKey;
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
    pub cover_art: Option<String>,
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
        cover_art: None,
        date_added,
    }
}

#[tauri::command]
fn scan_directory(dir_path: String) -> Result<Vec<TrackInfo>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err(format!("Directory not found: {}", dir_path));
    }

    let mut tracks = Vec::new();
    let extensions = ["mp3", "flac", "wav", "aac", "ogg", "m4a"];

    fn walk_dir(dir: &Path, tracks: &mut Vec<TrackInfo>, extensions: &[&str]) {
        if let Ok(entries) = fs::read_dir(dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.is_dir() {
                    walk_dir(&path, tracks, extensions);
                } else if let Some(ext) = path.extension() {
                    let ext_lower = ext.to_string_lossy().to_lowercase();
                    if extensions.contains(&ext_lower.as_str()) {
                        tracks.push(parse_metadata(&path));
                    }
                }
            }
        }
    }

    walk_dir(path, &mut tracks, &extensions);
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
        }
    ];

    tauri::Builder::default()
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:songs.db", songs_migrations)
                .build()
        )
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![greet, scan_directory])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}