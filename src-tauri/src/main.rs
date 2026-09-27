#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cpal::traits::{DeviceTrait, HostTrait, StreamTrait};
use rustfft::{num_complex::Complex, FftPlanner};
use std::sync::{Arc, Mutex};
use tokio::sync::broadcast;
use futures_util::SinkExt;

const FFT_SIZE: usize = 2048;

fn main() {
    let (tx, _rx) = broadcast::channel::<Vec<u8>>(16);
    let tx_clone = tx.clone();
    let tx_ws = tx.clone();

    // Spawn a dedicated thread for tokio runtime
    std::thread::spawn(move || {
        let rt = tokio::runtime::Builder::new_multi_thread()
            .enable_all()
            .build()
            .unwrap();
            
        rt.block_on(async move {
            let listener = tokio::net::TcpListener::bind("127.0.0.1:3030").await.unwrap();
            println!("WebSocket server listening on ws://127.0.0.1:3030");

            while let Ok((stream, _)) = listener.accept().await {
                let mut rx = tx_ws.subscribe();
                tokio::spawn(async move {
                    if let Ok(mut ws_stream) = tokio_tungstenite::accept_async(stream).await {
                        while let Ok(frame) = rx.recv().await {
                            if ws_stream
                                .send(tokio_tungstenite::tungstenite::Message::Binary(frame))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                    }
                });
            }
        });
    });

    // Spawn audio capture thread
    std::thread::spawn(move || {
        let host = cpal::default_host();
        let device = host
            .default_output_device()
            .expect("No default output device available");

        let config = device
            .default_output_config()
            .expect("Failed to get default output config");

        let channels = config.channels() as usize;
        let err_fn = |err| eprintln!("an error occurred on stream: {}", err);

        let mut planner = FftPlanner::new();
        let fft = planner.plan_fft_forward(FFT_SIZE);

        let mut sample_buffer: Vec<f32> = Vec::with_capacity(FFT_SIZE);
        let mut complex_buffer: Vec<Complex<f32>> = vec![Complex { re: 0.0, im: 0.0 }; FFT_SIZE];
        let mut scratch: Vec<Complex<f32>> =
            vec![Complex { re: 0.0, im: 0.0 }; fft.get_inplace_scratch_len()];

        let stream_config: cpal::StreamConfig = config.clone().into();
        let stream = match config.sample_format() {
            cpal::SampleFormat::F32 => device.build_input_stream(
                &stream_config,
                move |data: &[f32], _: &_| {
                    // Downmix to mono and collect
                    for frame in data.chunks(channels) {
                        let mut sum = 0.0;
                        for &sample in frame {
                            sum += sample;
                        }
                        sample_buffer.push(sum / channels as f32);

                        if sample_buffer.len() >= FFT_SIZE {
                            // Perform FFT
                            for (i, &sample) in sample_buffer.iter().enumerate() {
                                // Apply Hann window
                                let multiplier = 0.5
                                    * (1.0
                                        - (2.0 * std::f32::consts::PI * i as f32
                                            / (FFT_SIZE as f32 - 1.0))
                                            .cos());
                                complex_buffer[i] = Complex {
                                    re: sample * multiplier,
                                    im: 0.0,
                                };
                            }
                            fft.process_with_scratch(&mut complex_buffer, &mut scratch);

                            // Calculate magnitudes and send as bytes (u8 array)
                            let mut byte_data = Vec::with_capacity(FFT_SIZE / 2 + FFT_SIZE);
                            for c in complex_buffer.iter().take(FFT_SIZE / 2) {
                                // Scale by 2.0 / FFT_SIZE like Web Audio API does
                                let mag = (c.norm() * (2.0 / FFT_SIZE as f32)).max(1e-10);
                                // Convert to decibels similar to AnalyserNode
                                let db = 20.0 * mag.log10();
                                // AnalyserNode maps minDecibels (-90) to 0, maxDecibels (-10) to 255
                                let min_db = -90.0;
                                let max_db = -10.0;
                                let scaled = 255.0 * (db - min_db) / (max_db - min_db);
                                let clamped = scaled.clamp(0.0, 255.0);
                                byte_data.push(clamped as u8);
                            }

                            // Append time domain data for oscilloscope
                            for &sample in sample_buffer.iter() {
                                let scaled = (sample + 1.0) * 127.5;
                                let clamped = scaled.clamp(0.0, 255.0);
                                byte_data.push(clamped as u8);
                            }

                            // Send frame to websocket clients
                            let _ = tx_clone.send(byte_data);
                            sample_buffer.clear();
                        }
                    }
                },
                err_fn,
                None,
            ),
            _ => panic!("Unsupported sample format - WASAPI loopback requires F32"),
        }
        .unwrap();

        stream.play().unwrap();

        // Keep thread alive
        loop {
            std::thread::sleep(std::time::Duration::from_secs(1));
        }
    });

    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
