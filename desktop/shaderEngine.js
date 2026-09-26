/**
 * High-Performance WebGL2 Two-Pass Code Art Shader Engine for TouchArt Studio
 * Pass 1: Scene GLSL → Framebuffer Texture
 * Pass 2: Post-FX (Bloom, Chromatic Aberration, Vignette, Film Grain) → Screen
 */

class TouchArtShaderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false });
    
    if (!this.gl) {
      alert('WebGL2 not supported on this system!');
      return;
    }

    this.sceneProgram = null;
    this.postFxProgram = null;
    this.positionBuffer = null;
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.currentFps = 60;
    this.compileError = null;

    // Framebuffer for two-pass rendering
    this.fbo = null;
    this.fboTexture = null;
    this.fboWidth = 0;
    this.fboHeight = 0;

    // Default parameters (u_param1 .. u_param10)
    this.params = {
      param1: 0.5,
      param2: 0.5,
      param3: 0.5,
      param4: 0.5,
      param5: 0.5,
      param6: 0.5,
      param7: 0.5,
      param8: 0.5,
      param9: 0.5,
      param10: 0.5
    };

    // Post-FX parameters
    this.postFx = {
      bloom: 0.0,
      chromatic: 0.0,
      vignette: 0.0,
      filmgrain: 0.0
    };

    // Default audio uniforms
    this.audio = {
      subBass: 0.0,
      bass: 0.0,
      mid: 0.0,
      treble: 0.0,
      rms: 0.0,
      peak: 0.0,
      beat: 0.0,
      rhythm: 0.0
    };

    this.initBuffers();
    this.initPostFxShader();
    this.resizeCanvas();
  }

  initBuffers() {
    const gl = this.gl;
    // Fullscreen Quad Triangle Strip
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
       1,  1,
    ]);

    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  }

  /**
   * Create/resize the offscreen framebuffer for two-pass rendering
   */
  ensureFramebuffer(width, height) {
    const gl = this.gl;
    if (this.fboWidth === width && this.fboHeight === height && this.fbo) return;

    // Cleanup old
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    if (this.fboTexture) gl.deleteTexture(this.fboTexture);

    this.fboTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    this.fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTexture, 0);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.fboWidth = width;
    this.fboHeight = height;
  }

  /**
   * Compile the built-in Post-FX shader (Bloom + Chromatic Aberration + Vignette + Film Grain)
   */
  initPostFxShader() {
    const gl = this.gl;

    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_uv;
      void main() {
        v_uv = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_uv;
      out vec4 fragColor;

      uniform sampler2D u_sceneTexture;
      uniform vec2 u_resolution;
      uniform float u_time;
      uniform float u_bloom;
      uniform float u_chromatic;
      uniform float u_vignette;
      uniform float u_filmgrain;
      uniform float u_audio_bass;
      uniform float u_audio_peak;

      // Fast pseudo-random for film grain
      float rand(vec2 co) {
        return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
      }

      void main() {
        vec2 uv = v_uv;
        vec3 col = vec3(0.0);

        // === Chromatic Aberration ===
        float caStrength = u_chromatic * 0.012 * (1.0 + u_audio_bass * 0.5);
        vec2 caDir = (uv - 0.5) * caStrength;
        col.r = texture(u_sceneTexture, uv + caDir).r;
        col.g = texture(u_sceneTexture, uv).g;
        col.b = texture(u_sceneTexture, uv - caDir).b;

        // === Bloom (Screen-Space Multi-Sample Glow) ===
        if (u_bloom > 0.01) {
          vec3 bloomAccum = vec3(0.0);
          float bloomRadius = u_bloom * 8.0 * (1.0 + u_audio_bass * 0.4);
          float totalWeight = 0.0;
          
          for (float x = -3.0; x <= 3.0; x += 1.0) {
            for (float y = -3.0; y <= 3.0; y += 1.0) {
              vec2 offset = vec2(x, y) * bloomRadius / u_resolution;
              float weight = 1.0 / (1.0 + length(vec2(x, y)));
              bloomAccum += texture(u_sceneTexture, uv + offset).rgb * weight;
              totalWeight += weight;
            }
          }
          bloomAccum /= totalWeight;
          
          // Additive bloom with threshold
          vec3 brightPass = max(bloomAccum - 0.3, 0.0) * 2.0;
          col += brightPass * u_bloom * 1.5;
        }

        // === Vignette ===
        if (u_vignette > 0.01) {
          float dist = length(uv - 0.5) * 1.414;
          float vig = 1.0 - smoothstep(0.4, 1.2, dist * (0.8 + u_vignette * 1.2));
          col *= mix(1.0, vig, u_vignette);
        }

        // === Film Grain ===
        if (u_filmgrain > 0.01) {
          float grain = rand(uv * u_resolution + u_time * 100.0) * 2.0 - 1.0;
          col += grain * u_filmgrain * 0.15;
        }

        // Tone mapping - prevent clipping
        col = col / (col + 1.0);
        col = pow(col, vec3(1.0 / 2.2)); // Gamma correction

        fragColor = vec4(col, 1.0);
      }
    `;

    const vs = this.createShader(gl, gl.VERTEX_SHADER, vsSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) {
      console.error('[Shader Engine] Failed to compile Post-FX shader');
      return;
    }

    this.postFxProgram = gl.createProgram();
    gl.attachShader(this.postFxProgram, vs);
    gl.attachShader(this.postFxProgram, fs);
    gl.linkProgram(this.postFxProgram);

    if (!gl.getProgramParameter(this.postFxProgram, gl.LINK_STATUS)) {
      console.error('[Shader Engine] Post-FX Link Error:', gl.getProgramInfoLog(this.postFxProgram));
      this.postFxProgram = null;
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth * dpr;
    const height = this.canvas.clientHeight * dpr;

    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      this.gl.viewport(0, 0, width, height);
    }
  }

  compileShader(fragmentShaderSource) {
    const gl = this.gl;

    const vertexShaderSource = `#version 300 es
      in vec2 a_position;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    // Wrap GLSL fragment code into WebGL2 header if missing #version 300 es
    let fsSource = fragmentShaderSource.trim();
    if (!fsSource.startsWith('#version')) {
      fsSource = `#version 300 es
        precision highp float;
        out vec4 fragColor;
        #define gl_FragColor fragColor
        ${fsSource}
      `;
    }

    const vs = this.createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fs = this.createShader(gl, gl.FRAGMENT_SHADER, fsSource);

    if (!vs || !fs) return false;

    const newProgram = gl.createProgram();
    gl.attachShader(newProgram, vs);
    gl.attachShader(newProgram, fs);
    gl.linkProgram(newProgram);

    if (!gl.getProgramParameter(newProgram, gl.LINK_STATUS)) {
      this.compileError = gl.getProgramInfoLog(newProgram);
      console.error('[Shader Engine] Link Error:', this.compileError);
      return false;
    }

    if (this.sceneProgram) {
      gl.deleteProgram(this.sceneProgram);
    }

    this.sceneProgram = newProgram;
    this.compileError = null;
    return true;
  }

  createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      this.compileError = gl.getShaderInfoLog(shader);
      console.error('[Shader Engine] Compile Error:', this.compileError);
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  /**
   * Check if any Post-FX is active (optimization: skip two-pass when all zero)
   */
  isPostFxActive() {
    return this.postFx.bloom > 0.01 || this.postFx.chromatic > 0.01 ||
           this.postFx.vignette > 0.01 || this.postFx.filmgrain > 0.01;
  }

  render() {
    if (!this.sceneProgram) return;

    this.resizeCanvas();
    const gl = this.gl;
    const usePostFx = this.isPostFxActive() && this.postFxProgram;

    // ============ PASS 1: Render Scene to FBO (or directly to screen) ============
    if (usePostFx) {
      this.ensureFramebuffer(this.canvas.width, this.canvas.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    gl.useProgram(this.sceneProgram);

    // Bind Quad Position Attribute
    const positionLoc = gl.getAttribLocation(this.sceneProgram, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Bind Uniforms
    const elapsedTime = (Date.now() - this.startTime) / 1000.0;
    this.setUniform1f(this.sceneProgram, 'u_time', elapsedTime);
    this.setUniform2f(this.sceneProgram, 'u_resolution', this.canvas.width, this.canvas.height);

    // Bind Audio Uniforms
    this.setUniform1f(this.sceneProgram, 'u_audio_subBass', this.audio.subBass);
    this.setUniform1f(this.sceneProgram, 'u_audio_bass', this.audio.bass);
    this.setUniform1f(this.sceneProgram, 'u_audio_mid', this.audio.mid);
    this.setUniform1f(this.sceneProgram, 'u_audio_treble', this.audio.treble);
    this.setUniform1f(this.sceneProgram, 'u_audio_rms', this.audio.rms);
    this.setUniform1f(this.sceneProgram, 'u_audio_peak', this.audio.peak);
    this.setUniform1f(this.sceneProgram, 'u_audio_beat', this.audio.beat);
    this.setUniform1f(this.sceneProgram, 'u_audio_rhythm', this.audio.rhythm);

    // Bind All 10 Parameter Sliders
    for (let i = 1; i <= 10; i++) {
      this.setUniform1f(this.sceneProgram, `u_param${i}`, this.params[`param${i}`]);
    }

    // Draw Scene
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // ============ PASS 2: Post-FX to Screen ============
    if (usePostFx) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);

      gl.useProgram(this.postFxProgram);

      const pfxPosLoc = gl.getAttribLocation(this.postFxProgram, 'a_position');
      gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
      gl.enableVertexAttribArray(pfxPosLoc);
      gl.vertexAttribPointer(pfxPosLoc, 2, gl.FLOAT, false, 0, 0);

      // Bind scene texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.fboTexture);
      const texLoc = gl.getUniformLocation(this.postFxProgram, 'u_sceneTexture');
      if (texLoc !== null) gl.uniform1i(texLoc, 0);

      this.setUniform2f(this.postFxProgram, 'u_resolution', this.canvas.width, this.canvas.height);
      this.setUniform1f(this.postFxProgram, 'u_time', elapsedTime);
      this.setUniform1f(this.postFxProgram, 'u_bloom', this.postFx.bloom);
      this.setUniform1f(this.postFxProgram, 'u_chromatic', this.postFx.chromatic);
      this.setUniform1f(this.postFxProgram, 'u_vignette', this.postFx.vignette);
      this.setUniform1f(this.postFxProgram, 'u_filmgrain', this.postFx.filmgrain);
      this.setUniform1f(this.postFxProgram, 'u_audio_bass', this.audio.bass);
      this.setUniform1f(this.postFxProgram, 'u_audio_peak', this.audio.peak);
      this.setUniform1f(this.postFxProgram, 'u_audio_beat', this.audio.beat);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    // FPS Meter Logic
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  setUniform1f(program, name, value) {
    const loc = this.gl.getUniformLocation(program, name);
    if (loc !== null) this.gl.uniform1f(loc, value);
  }

  setUniform2f(program, name, x, y) {
    const loc = this.gl.getUniformLocation(program, name);
    if (loc !== null) this.gl.uniform2f(loc, x, y);
  }
}

if (typeof module !== 'undefined') {
  module.exports = TouchArtShaderEngine;
}
