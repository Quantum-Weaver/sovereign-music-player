use std::fs::File;
use std::io::BufReader;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use rodio::{Decoder, OutputStreamHandle, Sink, Source};
use tauri::{AppHandle, Emitter};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct CurrentPlayback {
    sink: Option<Arc<Sink>>,
    /// Set to true to signal the position thread of the *previous* track to exit.
    stop_flag: Option<Arc<AtomicBool>>,
}

pub struct AudioState {
    current: Mutex<CurrentPlayback>,
    stream_handle: OutputStreamHandle,
}

impl AudioState {
    pub fn new(stream_handle: OutputStreamHandle) -> Self {
        Self {
            current: Mutex::new(CurrentPlayback {
                sink: None,
                stop_flag: None,
            }),
            stream_handle,
        }
    }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/// Initialise the audio output on a dedicated thread so that `OutputStream`
/// (which is `!Send` due to CPAL/WASAPI handles) never needs to cross threads.
/// The thread is parked forever to keep the stream alive.
pub fn init() -> AudioState {
    let (tx, rx) = std::sync::mpsc::channel::<OutputStreamHandle>();
    std::thread::spawn(move || {
        let (_stream, handle) =
            rodio::OutputStream::try_default().expect("Failed to open audio output device");
        tx.send(handle).expect("Failed to send OutputStreamHandle");
        // Park indefinitely — _stream must not be dropped.
        loop {
            std::thread::sleep(Duration::from_secs(3600));
        }
    });
    let stream_handle = rx.recv().expect("Audio initialisation timed out");
    AudioState::new(stream_handle)
}

/// Emits `audio://position` every 500 ms until the stop flag is set or the
/// sink drains naturally (which also fires `audio://track-end`).
fn start_position_thread(app_handle: AppHandle, sink: Arc<Sink>, stop_flag: Arc<AtomicBool>) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(500));

        // Check stop flag *before* inspecting the sink so that an explicit
        // stop never races into emitting a spurious track-end.
        if stop_flag.load(Ordering::Relaxed) {
            break;
        }

        if sink.empty() {
            // Double-check: a stop() call racing with the empty() check should
            // not produce a track-end event.
            if !stop_flag.load(Ordering::Relaxed) {
                let _ = app_handle.emit("audio://track-end", ());
            }
            break;
        }

        let _ = app_handle.emit("audio://position", sink.get_pos().as_secs_f64());
    });
}

// ---------------------------------------------------------------------------
// Tauri commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn play_track(
    app_handle: AppHandle,
    state: tauri::State<'_, AudioState>,
    path: String,
) -> Result<(), String> {
    // Decode the file *before* taking the mutex so I/O never holds the lock.
    let file = File::open(&path).map_err(|e| format!("Cannot open '{}': {e}", path))?;
    let source =
        Decoder::new(BufReader::new(file)).map_err(|e| format!("Cannot decode '{}': {e}", path))?;

    // rodio reports duration for formats with headers (FLAC, WAV, OGG, CBR MP3).
    // VBR MP3 without Xing frame → 0.0; the frontend falls back to lofty metadata.
    let duration_secs = source.total_duration().map(|d| d.as_secs_f64()).unwrap_or(0.0);

    // Create the new sink in a paused state so we can swap it in atomically.
    let new_sink = Arc::new(
        Sink::try_new(&state.stream_handle).map_err(|e| format!("Cannot create sink: {e}"))?,
    );
    new_sink.pause();
    new_sink.append(source);

    let new_flag = Arc::new(AtomicBool::new(false));

    {
        let mut current = state.current.lock().unwrap();
        // Signal the old position thread to exit without emitting track-end.
        if let Some(flag) = &current.stop_flag {
            flag.store(true, Ordering::Relaxed);
        }
        // Discard the old sink (stops audio immediately).
        if let Some(sink) = &current.sink {
            sink.stop();
        }
        current.sink = Some(Arc::clone(&new_sink));
        current.stop_flag = Some(Arc::clone(&new_flag));
    } // lock released

    // Start the new track and the position-reporting thread.
    new_sink.play();
    let _ = app_handle.emit("audio://duration", duration_secs);
    start_position_thread(app_handle, new_sink, new_flag);

    Ok(())
}

#[tauri::command]
pub fn pause(state: tauri::State<'_, AudioState>) {
    let current = state.current.lock().unwrap();
    if let Some(sink) = &current.sink {
        sink.pause();
    }
}

#[tauri::command]
pub fn resume(state: tauri::State<'_, AudioState>) {
    let current = state.current.lock().unwrap();
    if let Some(sink) = &current.sink {
        sink.play();
    }
}

#[tauri::command]
pub fn seek(state: tauri::State<'_, AudioState>, position_secs: f64) -> Result<(), String> {
    if !position_secs.is_finite() || position_secs < 0.0 {
        return Err("Invalid seek position".into());
    }
    let current = state.current.lock().unwrap();
    if let Some(sink) = &current.sink {
        sink.try_seek(Duration::from_secs_f64(position_secs))
            .map_err(|e| format!("Seek failed: {e}"))?;
    }
    Ok(())
}

#[tauri::command]
pub fn set_volume(state: tauri::State<'_, AudioState>, vol: f64) {
    let current = state.current.lock().unwrap();
    if let Some(sink) = &current.sink {
        sink.set_volume(vol as f32);
    }
}

#[tauri::command]
pub fn stop(state: tauri::State<'_, AudioState>) {
    let mut current = state.current.lock().unwrap();
    if let Some(flag) = &current.stop_flag {
        flag.store(true, Ordering::Relaxed);
    }
    if let Some(sink) = &current.sink {
        sink.stop();
    }
    current.sink = None;
    current.stop_flag = None;
}
