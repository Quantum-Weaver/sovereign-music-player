// 10-band graphic equalizer using biquad peaking filters.
// Coefficients derived from the Audio EQ Cookbook by Robert Bristow-Johnson.
// EQ state is shared via Arc<Mutex> between Tauri commands and the EqFilter
// source wrapper. The filter checks for changes every UPDATE_INTERVAL samples
// using try_lock() to never block the audio callback thread.

use std::sync::{Arc, Mutex};
use std::time::Duration;
use rodio::Source;
use serde::{Deserialize, Serialize};

pub const EQ_FREQS: [f32; 10] = [32.0, 64.0, 125.0, 250.0, 500.0, 1000.0, 2000.0, 4000.0, 8000.0, 16000.0];
pub const EQ_BAND_LABELS: [&str; 10] = ["32", "64", "125", "250", "500", "1k", "2k", "4k", "8k", "16k"];
const EQ_Q: f32 = 1.4;
const UPDATE_INTERVAL: usize = 256;

// ---------------------------------------------------------------------------
// Shared state (updated by Tauri commands, read by EqFilter)
// ---------------------------------------------------------------------------

#[derive(Clone, Serialize, Deserialize)]
pub struct EqState {
    pub enabled: bool,
    pub bands: [f32; 10],
    pub preamp: f32,
}

impl Default for EqState {
    fn default() -> Self {
        Self { enabled: false, bands: [0.0; 10], preamp: 0.0 }
    }
}

// ---------------------------------------------------------------------------
// Biquad peaking EQ coefficient set (normalised — a0 divided out)
// ---------------------------------------------------------------------------

#[derive(Clone)]
struct BiquadCoeffs {
    b0: f32, b1: f32, b2: f32,
    a1: f32, a2: f32,
}

impl BiquadCoeffs {
    fn peaking(freq: f32, q: f32, gain_db: f32, sample_rate: f32) -> Self {
        use std::f32::consts::PI;
        let w0    = 2.0 * PI * freq / sample_rate;
        let cos_w = w0.cos();
        let sin_w = w0.sin();
        let a     = 10_f32.powf(gain_db / 40.0); // sqrt(10^(gain_db/20))
        let alpha = sin_w / (2.0 * q);

        let b0 = 1.0 + alpha * a;
        let b1 = -2.0 * cos_w;
        let b2 = 1.0 - alpha * a;
        let a0 = 1.0 + alpha / a;
        let a1 = -2.0 * cos_w;
        let a2 = 1.0 - alpha / a;

        Self { b0: b0/a0, b1: b1/a0, b2: b2/a0, a1: a1/a0, a2: a2/a0 }
    }
}

// ---------------------------------------------------------------------------
// Per-channel biquad delay line + coefficient set
// ---------------------------------------------------------------------------

#[derive(Clone)]
struct BiquadFilter {
    coeffs: BiquadCoeffs,
    x1: f32, x2: f32, y1: f32, y2: f32,
}

impl BiquadFilter {
    fn new(coeffs: BiquadCoeffs) -> Self {
        Self { coeffs, x1: 0.0, x2: 0.0, y1: 0.0, y2: 0.0 }
    }

    #[inline(always)]
    fn process(&mut self, x: f32) -> f32 {
        let y = self.coeffs.b0 * x
              + self.coeffs.b1 * self.x1
              + self.coeffs.b2 * self.x2
              - self.coeffs.a1 * self.y1
              - self.coeffs.a2 * self.y2;
        self.x2 = self.x1; self.x1 = x;
        self.y2 = self.y1; self.y1 = y;
        y
    }

    fn update_coeffs(&mut self, new: BiquadCoeffs) {
        // Preserve delay-line state to avoid clicks on coefficient updates
        self.coeffs = new;
    }
}

// ---------------------------------------------------------------------------
// EqFilter: Source wrapper that applies 10-band EQ to an f32 stream
// ---------------------------------------------------------------------------

pub struct EqFilter<S> {
    inner:       S,
    eq_arc:      Arc<Mutex<EqState>>,
    // filters[band][channel]
    filters:     Vec<Vec<BiquadFilter>>,
    preamp_gain: f32,
    enabled:     bool,
    channels:    u16,
    sample_rate: u32,
    ch_pos:      u16,
    tick:        usize,
    // Shadow of last-applied state (to detect changes)
    last_bands:  [f32; 10],
    last_preamp: f32,
}

fn db_to_linear(db: f32) -> f32 {
    10_f32.powf(db / 20.0)
}

impl<S: Source<Item = f32>> EqFilter<S> {
    pub fn new(inner: S, eq_arc: Arc<Mutex<EqState>>) -> Self {
        let channels    = inner.channels().max(1);
        let sample_rate = inner.sample_rate();

        let (enabled, bands, preamp) = {
            let s = eq_arc.lock().unwrap();
            (s.enabled, s.bands, s.preamp)
        };

        // Initialise all filters with current gain values
        let filters: Vec<Vec<BiquadFilter>> = EQ_FREQS.iter()
            .enumerate()
            .map(|(band_i, &freq)| {
                (0..channels as usize)
                    .map(|_| BiquadFilter::new(
                        BiquadCoeffs::peaking(freq, EQ_Q, bands[band_i], sample_rate as f32)
                    ))
                    .collect()
            })
            .collect();

        Self {
            inner,
            eq_arc,
            filters,
            preamp_gain: db_to_linear(preamp),
            enabled,
            channels,
            sample_rate,
            ch_pos:      0,
            tick:        0,
            last_bands:  bands,
            last_preamp: preamp,
        }
    }

    fn apply_state_update(&mut self, s: &EqState) {
        self.enabled     = s.enabled;
        self.preamp_gain = db_to_linear(s.preamp);
        self.last_preamp = s.preamp;
        self.last_bands  = s.bands;

        if !s.enabled { return; }

        for (band_i, &freq) in EQ_FREQS.iter().enumerate() {
            let new_coeffs = BiquadCoeffs::peaking(freq, EQ_Q, s.bands[band_i], self.sample_rate as f32);
            for ch in 0..self.channels as usize {
                self.filters[band_i][ch].update_coeffs(new_coeffs.clone());
            }
        }
    }
}

impl<S: Source<Item = f32>> Iterator for EqFilter<S> {
    type Item = f32;

    fn next(&mut self) -> Option<f32> {
        // Periodically check for EQ state changes without blocking.
        // Clone before any &mut self call so the MutexGuard is fully dropped.
        self.tick += 1;
        if self.tick >= UPDATE_INTERVAL {
            self.tick = 0;
            let maybe_snap: Option<EqState> = {
                if let Ok(state) = self.eq_arc.try_lock() {
                    let changed = state.enabled  != self.enabled
                        || state.bands   != self.last_bands
                        || (state.preamp - self.last_preamp).abs() > 0.001;
                    if changed { Some(state.clone()) } else { None }
                } else {
                    None
                }
            };
            if let Some(snap) = maybe_snap {
                self.apply_state_update(&snap);
            }
        }

        let sample = self.inner.next()?;

        if !self.enabled {
            self.ch_pos = (self.ch_pos + 1) % self.channels;
            return Some(sample);
        }

        let ch  = self.ch_pos as usize;
        self.ch_pos = (self.ch_pos + 1) % self.channels;

        let mut s = sample * self.preamp_gain;
        for band in 0..10 {
            s = self.filters[band][ch].process(s);
        }

        Some(s.clamp(-1.0, 1.0))
    }
}

impl<S: Source<Item = f32>> Source for EqFilter<S> {
    fn current_frame_len(&self) -> Option<usize> { self.inner.current_frame_len() }
    fn channels(&self)        -> u16              { self.channels }
    fn sample_rate(&self)     -> u32              { self.sample_rate }
    fn total_duration(&self)  -> Option<Duration> { self.inner.total_duration() }
}

// ---------------------------------------------------------------------------
// Preset band tables
// ---------------------------------------------------------------------------

pub fn preset_bands(preset: &str) -> [f32; 10] {
    match preset {
        "flat"       => [0.0; 10],
        "rock"       => [ 4.0,  3.0,  1.0, -1.0, -2.0, -1.0,  0.0,  2.0,  3.5,  4.0],
        "jazz"       => [ 3.0,  2.0,  1.5,  2.0, -1.0, -1.0,  0.0,  1.0,  2.0,  2.5],
        "classical"  => [ 0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  1.5,  2.0],
        "vocal"      => [-2.0, -2.0,  0.0,  2.0,  4.0,  4.5,  3.0,  1.0, -1.0, -2.0],
        "bass_boost" => [ 6.0,  5.5,  4.0,  2.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
        _            => [0.0; 10],
    }
}
