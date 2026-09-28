#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use rustfft::{num_complex::Complex, FftPlanner};
use std::sync::mpsc;
use tauri::State;
use tokio::sync::broadcast;
use futures_util::SinkExt;
use wasapi::*;

const FFT_SIZE: usize = 2048;

struct AppState {
    cmd_tx: std::sync::Mutex<mpsc::Sender<String>>,
}

#[tauri::command]
fn get_audio_devices() -> Vec<String> {
    let _ = initialize_mta();
    let mut names = Vec::new();
    if let Ok(enumerator) = DeviceEnumerator::new() {
        if let Ok(collection) = enumerator.get_device_collection(&Direction::Render) {
            if let Ok(count) = collection.get_nbr_devices() {
                for i in 0..count {
                    if let Ok(device) = collection.get_device_at_index(i) {
                        if let Ok(name) = device.get_friendlyname() {
                            names.push(name);
                        }
                    }
                }
            }
        }
    }
    names
}

#[tauri::command]
fn set_audio_device(name: String, state: State<'_, AppState>) {
    let tx = state.cmd_tx.lock().unwrap();
    let _ = tx.send(name);
}

fn process_audio(
    data: &[f32],
    sample_buffer: &mut Vec<f32>,
    complex_buffer: &mut [Complex<f32>],
    scratch: &mut [Complex<f32>],
    fft: &std::sync::Arc<dyn rustfft::Fft<f32>>,
    tx_clone: &broadcast::Sender<Vec<u8>>,
) {
    for &sample in data {
        sample_buffer.push(sample);

        if sample_buffer.len() >= FFT_SIZE {
            for (i, &s) in sample_buffer.iter().enumerate() {
                let multiplier = 0.5
                    * (1.0
                        - (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE as f32 - 1.0))
                            .cos());
                complex_buffer[i] = Complex { re: s * multiplier, im: 0.0 };
            }
            fft.process_with_scratch(complex_buffer, scratch);

            let mut byte_data = Vec::with_capacity(FFT_SIZE / 2 + FFT_SIZE);
            // FFT magnitude bins (1024 bytes)
            for c in complex_buffer.iter().take(FFT_SIZE / 2) {
                let mag = (c.norm() * (2.0 / FFT_SIZE as f32)).max(1e-10);
                let db = 20.0 * mag.log10();
                let min_db = -90.0_f32;
                let max_db = -10.0_f32;
                let scaled = 255.0 * (db - min_db) / (max_db - min_db);
                byte_data.push(scaled.clamp(0.0, 255.0) as u8);
            }
            // Raw waveform samples (2048 bytes)
            for &s in sample_buffer.iter() {
                let scaled = (s + 1.0) * 127.5;
                byte_data.push(scaled.clamp(0.0, 255.0) as u8);
            }

            let _ = tx_clone.send(byte_data);
            sample_buffer.clear();
        }
    }
}

/// Capture loopback from a named render device (or default if name is empty).
/// Returns a JoinHandle so the thread stays alive as long as the handle is alive.
fn start_loopback_thread(
    device_name: String,
    tx: broadcast::Sender<Vec<u8>>,
    stop_rx: mpsc::Receiver<()>,
) -> std::thread::JoinHandle<()> {
    std::thread::spawn(move || {
        let _ = initialize_mta();

        // Find requested render device (or default)
        let device = if device_name.is_empty() {
            DeviceEnumerator::new().and_then(|e| e.get_default_device(&Direction::Render)).ok()
        } else {
            DeviceEnumerator::new()
                .and_then(|e| e.get_device_collection(&Direction::Render))
                .and_then(|c| c.get_device_with_name(&device_name))
                .ok()
        };

        let device = match device {
            Some(d) => d,
            None => {
                eprintln!("Audio device not found: {}", device_name);
                return;
            }
        };

        // Open as loopback capture client
        let mut audio_client = match device.get_iaudioclient() {
            Ok(c) => c,
            Err(e) => { eprintln!("get_iaudioclient failed: {:?}", e); return; }
        };

        let desired_format = WaveFormat::new(32, 32, &SampleType::Float, 48000, 2, None);

        if let Err(e) = audio_client.initialize_client(
            &desired_format,
            &Direction::Capture,
            &StreamMode::PollingShared { autoconvert: true, buffer_duration_hns: 0 },
        ) {
            eprintln!("initialize_client (loopback) failed: {:?}", e);
            return;
        }

        let capture_client = match audio_client.get_audiocaptureclient() {
            Ok(c) => c,
            Err(e) => { eprintln!("get_audiocaptureclient failed: {:?}", e); return; }
        };

        if let Err(e) = audio_client.start_stream() {
            eprintln!("start_stream failed: {:?}", e);
            return;
        }

        eprintln!("Loopback capture started for: {}", if device_name.is_empty() { "default".to_string() } else { device_name.clone() });

        let channels = desired_format.get_nchannels() as usize;
        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(FFT_SIZE);
        let mut sample_buffer: Vec<f32> = Vec::with_capacity(FFT_SIZE);
        let mut complex_buffer: Vec<Complex<f32>> = vec![Complex { re: 0.0, im: 0.0 }; FFT_SIZE];
        let mut scratch: Vec<Complex<f32>> =
            vec![Complex { re: 0.0, im: 0.0 }; fft.get_inplace_scratch_len()];

        let mut raw_buf = vec![0u8; 8192];

        loop {
            // Check for stop signal (non-blocking)
            if stop_rx.try_recv().is_ok() {
                break;
            }

            match capture_client.get_next_packet_size() {
                Ok(Some(0)) | Ok(None) | Err(_) => {
                    std::thread::sleep(std::time::Duration::from_millis(1));
                    continue;
                }
                Ok(Some(_)) => {}
            }

            match capture_client.read_from_device(&mut raw_buf) {
                Ok((bytes_read, _info)) => {
                    if bytes_read > 0 {
                        let floats: Vec<f32> = raw_buf[..bytes_read as usize]
                            .chunks_exact(4)
                            .map(|b| f32::from_le_bytes([b[0], b[1], b[2], b[3]]))
                            .collect();
                        let mono: Vec<f32> = floats
                            .chunks(channels)
                            .map(|frame| frame.iter().sum::<f32>() / channels as f32)
                            .collect();
                        process_audio(&mono, &mut sample_buffer, &mut complex_buffer, &mut scratch, &fft, &tx);
                    }
                }
                Err(e) => {
                    eprintln!("read_from_device error: {:?}", e);
                    std::thread::sleep(std::time::Duration::from_millis(5));
                }
            }
        }

        let _ = audio_client.stop_stream();
        eprintln!("Loopback capture stopped.");
    })
}

fn main() {
    let (tx, _rx) = broadcast::channel::<Vec<u8>>(64);
    let tx_ws = tx.clone();
    let tx_audio = tx.clone();

    // ── WebSocket server thread ──────────────────────────────────────────────
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap();

        rt.block_on(async move {
            let listener = match tokio::net::TcpListener::bind("127.0.0.1:3030").await {
                Ok(l) => l,
                Err(e) => {
                    eprintln!("Failed to bind port 3030: {}", e);
                    return;
                }
            };
            eprintln!("WebSocket server listening on ws://127.0.0.1:3030");

            while let Ok((stream, _)) = listener.accept().await {
                let mut rx = tx_ws.subscribe();
                tokio::spawn(async move {
                    if let Ok(mut ws_stream) = tokio_tungstenite::accept_async(stream).await {
                        eprintln!("WebSocket client connected");
                        while let Ok(frame) = rx.recv().await {
                            if ws_stream
                                .send(tokio_tungstenite::tungstenite::Message::Binary(frame.into()))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        eprintln!("WebSocket client disconnected");
                    }
                });
            }
        });
    });

    // ── Audio loopback thread manager ────────────────────────────────────────
    let (cmd_tx, cmd_rx) = mpsc::channel::<String>();

    std::thread::spawn(move || {
        // Start with default device
        let (stop_tx, stop_rx) = mpsc::channel::<()>();
        let mut _handle = start_loopback_thread(String::new(), tx_audio.clone(), stop_rx);
        let mut current_stop_tx = stop_tx;

        // Listen for device change commands
        while let Ok(device_name) = cmd_rx.recv() {
            eprintln!("Switching audio device to: {}", device_name);
            // Stop old thread
            let _ = current_stop_tx.send(());
            // Start new thread
            let (new_stop_tx, new_stop_rx) = mpsc::channel::<()>();
            _handle = start_loopback_thread(device_name, tx_audio.clone(), new_stop_rx);
            current_stop_tx = new_stop_tx;
        }
    });

    tauri::Builder::default()
        .manage(AppState {
            cmd_tx: std::sync::Mutex::new(cmd_tx),
        })
        .invoke_handler(tauri::generate_handler![get_audio_devices, set_audio_device])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
