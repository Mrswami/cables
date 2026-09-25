/**
 * High-Performance WebGL2 Code Art Shader Engine for TouchArt Studio
 */

class TouchArtShaderEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl2', { antialias: true, alpha: false, preserveDrawingBuffer: false });
    
    if (!this.gl) {
      alert('WebGL2 not supported on this system!');
      return;
    }

    this.program = null;
    this.positionBuffer = null;
    this.startTime = Date.now();
    this.frameCount = 0;
    this.lastFpsUpdate = Date.now();
    this.currentFps = 60;
    this.compileError = null;

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

    // Default audio uniforms
    this.audio = {
      bass: 0.0,
      mid: 0.0,
      treble: 0.0,
      rms: 0.0,
      peak: 0.0
    };

    this.initBuffers();
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

    if (this.program) {
      gl.deleteProgram(this.program);
    }

    this.program = newProgram;
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

  render() {
    if (!this.program) return;

    this.resizeCanvas();
    const gl = this.gl;
    gl.useProgram(this.program);

    // Bind Quad Position Attribute
    const positionLoc = gl.getAttribLocation(this.program, 'a_position');
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // Bind Uniforms
    const elapsedTime = (Date.now() - this.startTime) / 1000.0;
    this.setUniform1f('u_time', elapsedTime);
    this.setUniform2f('u_resolution', this.canvas.width, this.canvas.height);

    // Bind Audio Uniforms
    this.setUniform1f('u_audio_bass', this.audio.bass);
    this.setUniform1f('u_audio_mid', this.audio.mid);
    this.setUniform1f('u_audio_treble', this.audio.treble);
    this.setUniform1f('u_audio_rms', this.audio.rms);
    this.setUniform1f('u_audio_peak', this.audio.peak);

    // Bind Math Parameter Sliders
    for (let i = 1; i <= 10; i++) {
      this.setUniform1f(`u_param${i}`, this.params[`param${i}`]);
    }

    // Draw Call
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

    // FPS Meter Logic
    this.frameCount++;
    const now = Date.now();
    if (now - this.lastFpsUpdate >= 500) {
      this.currentFps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
  }

  setUniform1f(name, value) {
    const loc = this.gl.getUniformLocation(this.program, name);
    if (loc !== null) this.gl.uniform1f(loc, value);
  }

  setUniform2f(name, x, y) {
    const loc = this.gl.getUniformLocation(this.program, name);
    if (loc !== null) this.gl.uniform2f(loc, x, y);
  }
}

if (typeof module !== 'undefined') {
  module.exports = TouchArtShaderEngine;
}
