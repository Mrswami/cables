/**
 * Preset Code Art Equations (GLSL Fragment Shaders) for TouchArt Studio
 */

const PRESET_EQUATIONS = {
  cyber_core: {
    name: "Cyber Core Raymarcher",
    author: "Mrswami",
    description: "Audio-reactive 3D Raymarched geometry with pulse morphing and frequency displacement.",
    code: `// Cyber Core Raymarcher
// u_param1: Morph Shape Complexity
// u_param2: Raymarching Iteration Detail
// u_param3: Glow Intensity
// u_param4: Rotation Speed

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;

mat2 rotate2D(float angle) {
    float s = sin(angle), c = cos(angle);
    return mat2(c, -s, s, c);
}

float map(vec3 p) {
    vec3 q = p;
    q.xz *= rotate2D(u_time * (0.2 + u_param4 * 0.8));
    q.xy *= rotate2D(u_time * 0.3);
    
    // Audio Reactive Pulsing Sphere + Box Morph
    float r = 1.0 + u_audio_bass * 0.8 + sin(q.y * (2.0 + u_param1 * 8.0)) * 0.2;
    float sphere = length(q) - r;
    
    vec3 b = abs(q) - vec3(0.8 + u_audio_mid * 0.5);
    float box = length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0);
    
    return mix(sphere, box, 0.5 + 0.5 * sin(u_time + u_audio_treble * 3.0));
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(uv, 1.2));
    
    float t = 0.0;
    float glow = 0.0;
    int maxSteps = int(20.0 + u_param2 * 60.0);
    
    for (int i = 0; i < 80; i++) {
        if (i >= maxSteps) break;
        vec3 p = ro + rd * t;
        float d = map(p);
        
        glow += 0.01 / (abs(d) + 0.02);
        
        if (d < 0.001 || t > 10.0) break;
        t += d * 0.6;
    }
    
    vec3 col = vec3(0.0);
    if (t < 10.0) {
        vec3 p = ro + rd * t;
        vec3 n = normalize(vec3(
            map(p + vec3(0.001, 0.0, 0.0)) - map(p - vec3(0.001, 0.0, 0.0)),
            map(p + vec3(0.0, 0.001, 0.0)) - map(p - vec3(0.0, 0.001, 0.0)),
            map(p + vec3(0.0, 0.0, 0.001)) - map(p - vec3(0.0, 0.0, 0.001))
        ));
        
        float diff = max(dot(n, normalize(vec3(1.0, 2.0, -3.0))), 0.1);
        col = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.5), sin(p.z * 2.0 + u_time) * 0.5 + 0.5) * diff;
    }
    
    col += vec3(0.0, 0.8, 1.0) * glow * (0.05 + u_param3 * 0.15) * (1.0 + u_audio_bass);
    gl_FragColor = vec4(col, 1.0);
}`
  },

  mandala_harmonics: {
    name: "Mandala Harmonic Wave Field",
    author: "Mrswami",
    description: "Symmetric polar wave equation reacting to mid and treble frequencies.",
    code: `// Mandala Harmonic Wave Field
// u_param1: Symmetry Fold Count
// u_param2: Ripple Frequency
// u_param3: Color Shift Speed
// u_param4: Zoom / Distortion

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;

#define PI 3.14159265359

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    st *= 2.0 + u_param4 * 4.0;
    
    float r = length(st);
    float a = atan(st.y, st.x);
    
    // Polar Symmetry Folding
    float N = 3.0 + floor(u_param1 * 9.0);
    a = mod(a, 2.0 * PI / N) - PI / N;
    
    vec2 p = vec2(cos(a), sin(a)) * r;
    
    float wave = sin(p.x * (10.0 + u_param2 * 30.0) + u_time * 2.0 + u_audio_bass * 4.0);
    wave += cos(p.y * (10.0 + u_param2 * 30.0) - u_time * 1.5 + u_audio_treble * 5.0);
    
    float c = smoothstep(0.0, 0.1, abs(wave) - (0.1 + u_audio_mid * 0.4));
    
    vec3 color = 0.5 + 0.5 * cos(u_time * (1.0 + u_param3 * 3.0) + r * 3.0 + vec3(0.0, 2.0, 4.0));
    color *= (1.0 - c) * (1.2 + u_audio_bass);
    
    gl_FragColor = vec4(color, 1.0);
}`
  },

  quantum_plasma: {
    name: "Quantum Fluid Plasma",
    author: "Mrswami",
    description: "Continuous domain warping fluid with audio turbulence.",
    code: `// Quantum Fluid Plasma
// u_param1: Turbulence Scaling
// u_param2: Warp Iterations
// u_param3: Color Saturation
// u_param4: Flow Velocity

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    
    float speed = u_time * (0.2 + u_param4 * 0.8);
    for(float i = 1.0; i < 6.0; i++){
        if (i > 1.0 + u_param2 * 4.0) break;
        p.x += 0.3 / i * sin(i * 3.0 * p.y + speed + u_audio_bass * 2.0);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + speed + u_audio_treble * 2.0);
    }
    
    float col = sin(p.x + p.y + u_audio_mid * 3.0);
    vec3 rgb = vec3(
        sin(col * 3.0 + u_time + 0.0),
        sin(col * 3.0 + u_time + 2.0),
        sin(col * 3.0 + u_time + 4.0)
    ) * 0.5 + 0.5;
    
    rgb = mix(vec3(col), rgb, u_param3);
    gl_FragColor = vec4(rgb * (0.8 + u_audio_bass * 0.5), 1.0);
}`
  }
};

if (typeof module !== 'undefined') {
  module.exports = PRESET_EQUATIONS;
}
