#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rustfft::{num_complex::Complex, FftPlanner};
use std::sync::mpsc;
use tauri::State;
use tokio::sync::broadcast;
use futures_util::SinkExt;

const FFT_SIZE: usize = 2048;

struct AppState {
    cmd_tx: std::sync::Mutex<mpsc::Sender<String>>,
}

#[tauri::command]
fn get_audio_devices() -> Vec<String> {
    let host = cpal::default_host();
    let mut devices = Vec::new();
    if let Ok(output_devices) = host.output_devices() {
        for device in output_devices {
            devices.push(device.to_string());
        }
    }
    devices
}

#[tauri::command]
fn set_audio_device(name: String, state: State<'_, AppState>) {
    let tx = state.cmd_tx.lock().unwrap();
    let _ = tx.send(name);
}

fn start_stream(device: cpal::Device, tx_clone: broadcast::Sender<Vec<u8>>) -> Option<cpal::Stream> {
    let config = match device.default_output_config() {
        Ok(c) => c,
        Err(e) => {
            eprintln!("Failed to get default output config: {}", e);
            return None;
        }
    };

    let channels = config.channels() as usize;
    let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

    let mut planner = FftPlanner::new();
    let fft = planner.plan_fft_forward(FFT_SIZE);

    let mut sample_buffer: Vec<f32> = Vec::with_capacity(FFT_SIZE);
    let mut complex_buffer: Vec<Complex<f32>> = vec![Complex { re: 0.0, im: 0.0 }; FFT_SIZE];
    let mut scratch: Vec<Complex<f32>> = vec![Complex { re: 0.0, im: 0.0 }; fft.get_inplace_scratch_len()];

    let stream_config: cpal::StreamConfig = config.clone().into();
    
    // We must handle different sample formats correctly
    let stream = match config.sample_format() {
        cpal::SampleFormat::F32 => device.build_input_stream(
            stream_config.clone(),
            move |data: &[f32], _: &_| process_audio(data, channels, &mut sample_buffer, &mut complex_buffer, &mut scratch, &fft, &tx_clone),
            err_fn,
            None,
        ),
        cpal::SampleFormat::I16 => device.build_input_stream(
            stream_config.clone(),
            move |data: &[i16], _: &_| {
                let f32_data: Vec<f32> = data.iter().map(|&s| s as f32 / i16::MAX as f32).collect();
                process_audio(&f32_data, channels, &mut sample_buffer, &mut complex_buffer, &mut scratch, &fft, &tx_clone)
            },
            err_fn,
            None,
        ),
        cpal::SampleFormat::U16 => device.build_input_stream(
            stream_config.clone(),
            move |data: &[u16], _: &_| {
                let f32_data: Vec<f32> = data.iter().map(|&s| (s as f32 - u16::MAX as f32 / 2.0) / (u16::MAX as f32 / 2.0)).collect();
                process_audio(&f32_data, channels, &mut sample_buffer, &mut complex_buffer, &mut scratch, &fft, &tx_clone)
            },
            err_fn,
            None,
        ),
        _ => {
            eprintln!("Unsupported sample format");
            return None;
        }
    };

    match stream {
        Ok(s) => {
            if let Err(e) = s.play() {
                eprintln!("Failed to play stream: {}", e);
                return None;
            }
            Some(s)
        }
        Err(e) => {
            eprintln!("Failed to build input stream: {}", e);
            None
        }
    }
}

fn process_audio(
    data: &[f32], 
    channels: usize, 
    sample_buffer: &mut Vec<f32>, 
    complex_buffer: &mut [Complex<f32>], 
    scratch: &mut [Complex<f32>], 
    fft: &std::sync::Arc<dyn rustfft::Fft<f32>>,
    tx_clone: &broadcast::Sender<Vec<u8>>
) {
    for frame in data.chunks(channels) {
        let mut sum = 0.0;
        for &sample in frame {
            sum += sample;
        }
        sample_buffer.push(sum / channels as f32);

        if sample_buffer.len() >= FFT_SIZE {
            for (i, &sample) in sample_buffer.iter().enumerate() {
                let multiplier = 0.5 * (1.0 - (2.0 * std::f32::consts::PI * i as f32 / (FFT_SIZE as f32 - 1.0)).cos());
                complex_buffer[i] = Complex { re: sample * multiplier, im: 0.0 };
            }
            fft.process_with_scratch(complex_buffer, scratch);

            let mut byte_data = Vec::with_capacity(FFT_SIZE / 2 + FFT_SIZE);
            for c in complex_buffer.iter().take(FFT_SIZE / 2) {
                let mag = (c.norm() * (2.0 / FFT_SIZE as f32)).max(1e-10);
                let db = 20.0 * mag.log10();
                let min_db = -90.0;
                let max_db = -10.0;
                let scaled = 255.0 * (db - min_db) / (max_db - min_db);
                let clamped = scaled.clamp(0.0, 255.0);
                byte_data.push(clamped as u8);
            }

            for &sample in sample_buffer.iter() {
                let scaled = (sample + 1.0) * 127.5;
                let clamped = scaled.clamp(0.0, 255.0);
                byte_data.push(clamped as u8);
            }

            let _ = tx_clone.send(byte_data);
            sample_buffer.clear();
        }
    }
}

fn main() {
    let (tx, _rx) = broadcast::channel::<Vec<u8>>(16);
    let tx_ws = tx.clone();
    let tx_audio = tx.clone();

    // Spawn a dedicated thread for tokio runtime
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
            println!("WebSocket server listening on ws://127.0.0.1:3030");

            while let Ok((stream, _)) = listener.accept().await {
                let mut rx = tx_ws.subscribe();
                tokio::spawn(async move {
                    if let Ok(mut ws_stream) = tokio_tungstenite::accept_async(stream).await {
                        while let Ok(frame) = rx.recv().await {
                            if ws_stream.send(tokio_tungstenite::tungstenite::Message::Binary(frame.into())).await.is_err() {
                                break;
                            }
                        }
                    }
                });
            }
        });
    });

    let (cmd_tx, cmd_rx) = mpsc::channel::<String>();

    // Spawn audio capture thread
    std::thread::spawn(move || {
        let host = cpal::default_host();
        let mut current_stream: Option<cpal::Stream> = None;

        if let Some(device) = host.default_output_device() {
            current_stream = start_stream(device, tx_audio.clone());
        }

        // Listen for commands
        while let Ok(device_name) = cmd_rx.recv() {
            if let Ok(output_devices) = host.output_devices() {
                if let Some(d) = output_devices.into_iter().find(|d| d.to_string() == device_name) {
                    println!("Switching to audio device: {}", device_name);
                    current_stream = None; // Drop the old stream (stops it)
                    current_stream = start_stream(d, tx_audio.clone());
                }
            }
        }
    });

    tauri::Builder::default()
        .manage(AppState { cmd_tx: std::sync::Mutex::new(cmd_tx) })
        .invoke_handler(tauri::generate_handler![get_audio_devices, set_audio_device])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
