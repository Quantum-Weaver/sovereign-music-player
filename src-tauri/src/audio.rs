use std::fs::File;
use std::io::BufReader;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use rodio::{Decoder, OutputStreamHandle, Sink, Source};
use tauri::{AppHandle, Emitter};
use serde::Serialize;

use crate::equalizer::{EqFilter, EqState, preset_bands};
use crate::visualizer::{SampleTap, VisSample};

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

struct CurrentPlayback {
    sink:      Option<Arc<Sink>>,
    stop_flag: Option<Arc<AtomicBool>>,
}

pub struct AudioState {
    current:       Mutex<CurrentPlayback>,
    stream_handle: OutputStreamHandle,
    pub eq:        Arc<Mutex<EqState>>,
    pub vis_tx:    crossbeam_channel::Sender<VisSample>,
}

impl AudioState {
    fn new(
        stream_handle: OutputStreamHandle,
        vis_tx: crossbeam_channel::Sender<VisSample>,
    ) -> Self {
        Self {
            current: Mutex::new(CurrentPlayback { sink: None, stop_flag: None }),
            stream_handle,
            eq: Arc::new(Mutex::new(EqState::default())),
            vis_tx,
        }
    }
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

/// Initialise audio on a dedicated thread so `OutputStream` (WASAPI !Send)
/// never crosses threads.  Returns `AudioState` bound to the resulting handle.
pub fn init(vis_tx: crossbeam_channel::Sender<VisSample>) -> AudioState {
    let (tx, rx) = std::sync::mpsc::channel::<OutputStreamHandle>();
    std::thread::Builder::new()
        .name("sovereign-audio-stream".into())
        .spawn(move || {
            let (_stream, handle) =
                rodio::OutputStream::try_default().expect("Failed to open audio output device");
            tx.send(handle).expect("Failed to send OutputStreamHandle");
            loop { std::thread::sleep(Duration::from_secs(3600)); }
        })
        .expect("failed to spawn audio stream thread");

    let stream_handle = rx.recv().expect("Audio initialisation timed out");
    AudioState::new(stream_handle, vis_tx)
}

// ---------------------------------------------------------------------------
// Position reporter
// ---------------------------------------------------------------------------

fn start_position_thread(app_handle: AppHandle, sink: Arc<Sink>, stop_flag: Arc<AtomicBool>) {
    std::thread::spawn(move || loop {
        std::thread::sleep(Duration::from_millis(500));

        if stop_flag.load(Ordering::Relaxed) { break; }

        if sink.empty() {
            if !stop_flag.load(Ordering::Relaxed) {
                let _ = app_handle.emit("audio://track-end", ());
            }
            break;
        }

        let _ = app_handle.emit("audio://position", sink.get_pos().as_secs_f64());
    });
}

// ---------------------------------------------------------------------------
// Tauri commands — playback
// ---------------------------------------------------------------------------

#[tauri::command]
pub fn play_track(
    app_handle: AppHandle,
    state: tauri::State<'_, AudioState>,
    path: String,
) -> Result<(), String> {
    // Decode before taking the mutex so I/O never holds the lock
    let file   = File::open(&path).map_err(|e| format!("Cannot open '{}': {e}", path))?;
    let source = Decoder::new(BufReader::new(file))
        .map_err(|e| format!("Cannot decode '{}': {e}", path))?;

    let duration_secs = source.total_duration().map(|d| d.as_secs_f64()).unwrap_or(0.0);

    // Build the processing chain: Decoder[i16] → f32 → EQ → SampleTap
    let eq_arc  = Arc::clone(&state.eq);
    let vis_tx  = state.vis_tx.clone();
    let source  = source.convert_samples::<f32>();
    let source  = EqFilter::new(source, eq_arc);
    let source  = SampleTap::new(source, vis_tx);

    // Create the new sink in a paused state so the swap is atomic
    let new_sink = Arc::new(
        Sink::try_new(&state.stream_handle)
            .map_err(|e| format!("Cannot create sink: {e}"))?,
    );
    new_sink.pause();
    new_sink.append(source);

    let new_flag = Arc::new(AtomicBool::new(false));

    {
        let mut current = state.current.lock().unwrap();
        if let Some(flag) = &current.stop_flag { flag.store(true, Ordering::Relaxed); }
        if let Some(sink) = &current.sink       { sink.stop(); }
        current.sink      = Some(Arc::clone(&new_sink));
        current.stop_flag = Some(Arc::clone(&new_flag));
    }

    new_sink.play();
    let _ = app_handle.emit("audio://duration", duration_secs);
    start_position_thread(app_handle, new_sink, new_flag);

    Ok(())
}

#[tauri::command]
pub fn pause(state: tauri::State<'_, AudioState>) {
    if let Some(sink) = &state.current.lock().unwrap().sink { sink.pause(); }
}

#[tauri::command]
pub fn resume(state: tauri::State<'_, AudioState>) {
    if let Some(sink) = &state.current.lock().unwrap().sink { sink.play(); }
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
    if let Some(sink) = &state.current.lock().unwrap().sink {
        sink.set_volume(vol as f32);
    }
}

#[tauri::command]
pub fn stop(state: tauri::State<'_, AudioState>) {
    let mut current = state.current.lock().unwrap();
    if let Some(flag) = &current.stop_flag { flag.store(true, Ordering::Relaxed); }
    if let Some(sink) = &current.sink       { sink.stop(); }
    current.sink      = None;
    current.stop_flag = None;
}

// ---------------------------------------------------------------------------
// Tauri commands — equalizer
// ---------------------------------------------------------------------------

#[derive(Serialize, Clone)]
pub struct EqStateResponse {
    pub enabled: bool,
    pub bands:   [f32; 10],
    pub preamp:  f32,
    pub labels:  [&'static str; 10],
}

#[tauri::command]
pub fn get_eq_state(state: tauri::State<'_, AudioState>) -> EqStateResponse {
    let eq = state.eq.lock().unwrap();
    EqStateResponse {
        enabled: eq.enabled,
        bands:   eq.bands,
        preamp:  eq.preamp,
        labels:  crate::equalizer::EQ_BAND_LABELS,
    }
}

#[tauri::command]
pub fn set_eq_band(state: tauri::State<'_, AudioState>, band: usize, gain_db: f32) {
    if band >= 10 { return; }
    state.eq.lock().unwrap().bands[band] = gain_db.clamp(-12.0, 12.0);
}

#[tauri::command]
pub fn set_eq_preamp(state: tauri::State<'_, AudioState>, gain_db: f32) {
    state.eq.lock().unwrap().preamp = gain_db.clamp(-12.0, 12.0);
}

#[tauri::command]
pub fn toggle_eq(state: tauri::State<'_, AudioState>, enabled: bool) {
    state.eq.lock().unwrap().enabled = enabled;
}

#[tauri::command]
pub fn set_eq_preset(state: tauri::State<'_, AudioState>, preset: String) {
    let bands = preset_bands(&preset);
    let mut eq = state.eq.lock().unwrap();
    eq.bands   = bands;
    eq.enabled = true;
}
