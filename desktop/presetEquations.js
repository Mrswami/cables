/**
 * High-Impact Preset Code Art Equations (GLSL Fragment Shaders) for TouchArt Studio
 * All 5 sliders (u_param1 .. u_param5) have DRAMATIC visual impact across all presets.
 */

const PRESET_EQUATIONS = {
  cyber_core: {
    name: "1. Cyber Core Raymarcher (3D Shape Morph & Tiling)",
    author: "Mrswami",
    description: "Audio-reactive 3D Raymarched geometry with dramatic shape morphing, spike density, and grid duplication.",
    code: `// Cyber Core Raymarcher
// u_param1: Radical Shape Morph (Sphere -> Box -> Octahedron -> Spikes)
// u_param2: Spike Density & Surface Noise (1x to 40x)
// u_param3: Neon Glow Intensity & Chromatic Shift
// u_param4: Orbital Spin & Camera Speed
// u_param5: Modular Repetitiveness & Matrix Tiling Grid (1x1 to 8x8)

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
uniform float u_param5;

mat2 rotate2D(float angle) {
    float s = sin(angle), c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float map(vec3 p) {
    vec3 q = p;

    // u_param5: Massive Grid Duplication
    if (u_param5 > 0.02) {
        float gridSpacing = 4.0 - u_param5 * 2.8;
        q.xy = mod(q.xy + gridSpacing * 0.5, gridSpacing) - gridSpacing * 0.5;
    }

    q.xz *= rotate2D(u_time * (0.2 + u_param4 * 3.0));
    q.xy *= rotate2D(u_time * (0.1 + u_param4 * 2.0));
    
    // u_param2: Dynamic Surface Spikes & Multi-Frequency Noise
    float spikeFreq = 2.0 + u_param2 * 30.0;
    float spikes = sin(q.x * spikeFreq) * sin(q.y * spikeFreq) * sin(q.z * spikeFreq) * (0.05 + u_param2 * 0.4);

    // Audio Reactive Pulsing
    float baseSize = 0.8 + u_audio_bass * 1.5;
    
    float sphere = length(q) - (baseSize + spikes);
    
    vec3 b = abs(q) - vec3(baseSize * 0.7 + u_audio_mid * 0.8);
    float box = length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) + spikes;
    
    float oct = sdOctahedron(q, baseSize * 1.2) + spikes;
    
    // u_param1: Smooth Morph between Sphere, Box, and Octahedron
    float shapeMorph = u_param1 * 2.0;
    if (shapeMorph < 1.0) {
        return mix(sphere, box, shapeMorph);
    } else {
        return mix(box, oct, shapeMorph - 1.0);
    }
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 ro = vec3(0.0, 0.0, -4.0);
    vec3 rd = normalize(vec3(uv, 1.2));
    
    float t = 0.0;
    float glow = 0.0;
    int maxSteps = 90;
    
    for (int i = 0; i < 90; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        
        // u_param3: Glow Intensity
        glow += (0.01 + u_param3 * 0.04) / (abs(d) + 0.015);
        
        if (d < 0.001 || t > 12.0) break;
        t += d * 0.5;
    }
    
    vec3 col = vec3(0.0);
    if (t < 12.0) {
        vec3 p = ro + rd * t;
        vec3 n = normalize(vec3(
            map(p + vec3(0.001, 0.0, 0.0)) - map(p - vec3(0.001, 0.0, 0.0)),
            map(p + vec3(0.0, 0.001, 0.0)) - map(p - vec3(0.0, 0.001, 0.0)),
            map(p + vec3(0.0, 0.0, 0.001)) - map(p - vec3(0.0, 0.0, 0.001))
        ));
        
        float diff = max(dot(n, normalize(vec3(1.0, 2.0, -3.0))), 0.15);
        
        // u_param3: Color Spectrum Shift
        vec3 baseColor = 0.5 + 0.5 * cos(u_time + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
        col = baseColor * diff;
    }
    
    vec3 glowColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.6), sin(u_time * 2.0 + u_param3 * 5.0) * 0.5 + 0.5);
    col += glowColor * glow * (0.1 + u_param3 * 0.4) * (1.0 + u_audio_bass * 3.0);
    
    gl_FragColor = vec4(col, 1.0);
}`
  },

  mandala_harmonics: {
    name: "2. Mandala Harmonic Wave Field (Polar Fold & Matrix)",
    author: "Mrswami",
    description: "Symmetric polar wave equation reacting vividly to bass, mid, and treble frequencies with dramatic grid duplications.",
    code: `// Mandala Harmonic Wave Field
// u_param1: Symmetry Fold Petal Count (3 to 32 Fold)
// u_param2: Ripple Line Density (5x to 80x)
// u_param3: Color Palette Shift Velocity
// u_param4: Zoom & Spiral Vortex Twist
// u_param5: Repetitiveness & Matrix Tiling Duplicates (1x1 to 10x10)

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
uniform float u_param5;

#define PI 3.14159265359

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    // u_param4: Zoom & Distortion
    st *= (0.8 + u_param4 * 5.0);

    // u_param5: Matrix Grid Duplication
    if (u_param5 > 0.02) {
        float repCount = 1.0 + floor(u_param5 * 9.0);
        st = fract(st * repCount * 0.5) - 0.5;
    }
    
    float r = length(st);
    float a = atan(st.y, st.x);
    
    // u_param4: Spiral Vortex Twist
    a += r * u_param4 * 4.0;

    // u_param1: Polar Symmetry Folding (3 to 32 petals)
    float N = 3.0 + floor(u_param1 * 29.0);
    a = mod(a, 2.0 * PI / N) - PI / N;
    
    vec2 p = vec2(cos(a), sin(a)) * r;
    
    // u_param2: Ripple Frequency Lines (5x to 80x)
    float density = 5.0 + u_param2 * 75.0;
    float wave = sin(p.x * density + u_time * 3.0 + u_audio_bass * 10.0);
    wave += cos(p.y * density - u_time * 2.0 + u_audio_treble * 12.0);
    
    float c = smoothstep(0.0, 0.12, abs(wave) - (0.05 + u_audio_mid * 0.9));
    
    // u_param3: Color Spectrum
    vec3 color = 0.5 + 0.5 * cos(u_time * (1.0 + u_param3 * 4.0) + r * (3.0 + u_param3 * 8.0) + vec3(0.0, 2.0, 4.0));
    color *= (1.0 - c) * (1.2 + u_audio_bass * 3.0);
    
    gl_FragColor = vec4(color, 1.0);
}`
  },

  quantum_plasma: {
    name: "3. Quantum Fluid Plasma (Hydrodynamic Domain Warp)",
    author: "Mrswami",
    description: "Continuous domain warping fluid with intense audio turbulence and matrix cell tiling.",
    code: `// Quantum Fluid Plasma
// u_param1: Turbulence Scaling (1x to 20x)
// u_param2: Warp Iterations & Complexity (1 to 10 Octaves)
// u_param3: Color Saturation & Glow Brightness
// u_param4: Flow Velocity (0.1 to 5.0)
// u_param5: Repetitiveness & Cell Grid Duplication

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
uniform float u_param5;

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // u_param5: Matrix Duplication
    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 8.0);
        p = mod(p * grid, 1.0) - 0.5;
    }
    
    // u_param1 & u_param4: Turbulence & Speed
    p *= (1.0 + u_param1 * 4.0);
    float speed = u_time * (0.2 + u_param4 * 3.0);
    
    // u_param2: Octave Iterations (1 to 8)
    float maxOctaves = 1.0 + floor(u_param2 * 7.0);
    for(float i = 1.0; i < 9.0; i++){
        if (i > maxOctaves) break;
        p.x += 0.3 / i * sin(i * 3.0 * p.y + speed + u_audio_bass * 5.0);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + speed + u_audio_treble * 5.0);
    }
    
    float col = sin(p.x * 2.0 + p.y * 2.0 + u_audio_mid * 6.0);
    
    // u_param3: Color Shift & Glow
    vec3 rgb = vec3(
        sin(col * 3.0 + u_time * 2.0 + u_param3 * 6.28),
        sin(col * 3.0 + u_time * 2.0 + u_param3 * 6.28 + 2.0),
        sin(col * 3.0 + u_time * 2.0 + u_param3 * 6.28 + 4.0)
    ) * 0.5 + 0.5;
    
    rgb = mix(vec3(col), rgb, 0.4 + u_param3 * 0.6);
    gl_FragColor = vec4(rgb * (0.8 + u_audio_bass * 1.8), 1.0);
}`
  },

  synthwave_horizon: {
    name: "4. Neon Synthwave Sun & Grid Horizon",
    author: "Mrswami",
    description: "Retro 80s Cyberpunk grid terrain with audio-reactive synthwave sun and perspective flight.",
    code: `// Neon Synthwave Sun & Grid Horizon
// u_param1: Sun Size & Ring Displace
// u_param2: Grid Line Frequency (10x to 60x)
// u_param3: Horizon Fog & Color Palette
// u_param4: Forward Flight Velocity
// u_param5: Mirrored Dual Skies & Tiling

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
uniform float u_param5;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        uv.x = mod(uv.x + u_param5, u_param5 * 0.8) - u_param5 * 0.4;
    }
    
    vec3 col = vec3(0.02, 0.0, 0.08);

    // Synthwave Sun
    vec2 sunPos = vec2(0.0, 0.15);
    float sunRadius = 0.25 + u_param1 * 0.3 + u_audio_bass * 0.2;
    float distToSun = length(uv - sunPos);
    
    if (distToSun < sunRadius) {
        // Sun Horizontal Cutouts
        float cut = sin((uv.y - sunPos.y) * 40.0 + u_time * 2.0);
        if (uv.y < sunPos.y && cut > 0.3) {
            // Cutout bar
        } else {
            float t = (uv.y - (sunPos.y - sunRadius)) / (sunRadius * 2.0);
            col = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.0, 0.5), t);
        }
    }

    // Grid Floor Perspective
    if (uv.y < 0.0) {
        float pZ = 0.8 / abs(uv.y);
        float pX = uv.x * pZ;
        
        float flightSpeed = u_time * (1.0 + u_param4 * 6.0);
        
        float gridLineWidth = 0.04;
        float gridFreq = 5.0 + u_param2 * 45.0;
        
        float gridX = abs(fract(pX * (gridFreq * 0.1) + 0.5) - 0.5);
        float gridZ = abs(fract((pZ + flightSpeed) * 0.5 + 0.5) - 0.5);
        
        float line = min(gridX, gridZ);
        if (line < gridLineWidth) {
            vec3 gridColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.8), u_param3);
            col += gridColor * (1.0 - line / gridLineWidth) * (1.0 / (pZ * 0.3)) * (1.0 + u_audio_bass * 2.0);
        }
    }

    gl_FragColor = vec4(col, 1.0);
}`
  },

  cosmic_wormhole: {
    name: "5. Hyperdimensional Cosmic Wormhole",
    author: "Mrswami",
    description: "High-speed space-time tunnel with laser ring frequency and twisting warp geometry.",
    code: `// Hyperdimensional Cosmic Wormhole
// u_param1: Tunnel Twist & Vortex Angle
// u_param2: Laser Ring Frequency (5x to 50x)
// u_param3: Hyperspace Flight Speed
// u_param4: Tunnel Radius & Camera Wobble
// u_param5: Multi-Tunnel Parallel Array

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
uniform float u_param5;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        uv = mod(uv + 0.5, 1.0 - u_param5 * 0.6) - 0.5;
    }
    
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param1: Twist Spiral
    a += u_param1 * 10.0 / (r + 0.1);

    // Tunnel Perspective Depth
    float z = (0.5 + u_param4 * 1.5) / (r + 0.001);
    float speed = u_time * (1.0 + u_param3 * 8.0);
    
    // u_param2: Laser Rings
    float ringFreq = 4.0 + u_param2 * 46.0;
    float rings = sin(z * ringFreq - speed + u_audio_bass * 6.0);
    float spirals = sin(a * 12.0 + z * 2.0 + u_audio_treble * 8.0);
    
    float pattern = smoothstep(0.1, 0.9, rings * spirals);

    vec3 col = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.0, 0.6), sin(z * 0.5 + u_time) * 0.5 + 0.5);
    col *= pattern * (1.0 / (r * 2.0)) * (1.0 + u_audio_bass * 2.5);

    gl_FragColor = vec4(col, 1.0);
}`
  },

  audio_matrix_cubes: {
    name: "6. 3D Audio Matrix Cube Grid",
    author: "Mrswami",
    description: "Isometric 3D cube matrix rising and falling in sync with audio frequency bands.",
    code: `// 3D Audio Matrix Cube Grid
// u_param1: Cube Height & Bevel Scale
// u_param2: Matrix Grid Density (2x2 to 20x20)
// u_param3: Top Surface Glow Brightness
// u_param4: Isometric Angle & Camera Tilt
// u_param5: Matrix Array Tiling Duplicates

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
uniform float u_param5;

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        st = mod(st + 0.5, 1.2 - u_param5 * 0.8) - 0.5;
    }
    
    // u_param2: Grid Density
    float grid = 4.0 + floor(u_param2 * 20.0);
    vec2 id = floor(st * grid);
    vec2 f = fract(st * grid) - 0.5;

    // Audio Height for Cell
    float d = length(id);
    float h = sin(d * 0.5 - u_time * 3.0) * 0.5 + 0.5;
    h += u_audio_bass * (0.8 + u_param1 * 2.0);

    float box = max(abs(f.x), abs(f.y)) - (0.35 + h * 0.1);
    float edge = smoothstep(0.05, 0.0, abs(box));

    vec3 col = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 0.0, 0.5), sin(id.x * 0.3 + id.y * 0.3 + u_time) * 0.5 + 0.5);
    col *= edge * (0.5 + u_param3 * 2.0) * (1.0 + u_audio_bass * 2.0);

    gl_FragColor = vec4(col, 1.0);
}`
  },

  volumetric_nebula: {
    name: "7. Volumetric Cosmic Nebula Cloud",
    author: "Mrswami",
    description: "Deep space glowing nebula clouds with audio-reactive cosmic starfields.",
    code: `// Volumetric Cosmic Nebula Cloud
// u_param1: Cloud Noise Density
// u_param2: Starfield Particle Density
// u_param3: Color Nebula Palette Shift
// u_param4: Cosmic Expansion Speed
// u_param5: Parallel Universe Tiling

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
uniform float u_param5;

float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
               mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        uv = mod(uv + 0.5, 1.0 - u_param5 * 0.6) - 0.5;
    }

    vec2 p = uv * (1.5 + u_param1 * 4.0);
    float speed = u_time * (0.1 + u_param4 * 1.5);
    
    float n = noise(p + speed);
    n += 0.5 * noise(p * 2.0 - speed * 0.8 + u_audio_bass);
    n += 0.25 * noise(p * 4.0 + speed * 1.2 + u_audio_treble);

    // Stars
    float starDensity = 20.0 + u_param2 * 100.0;
    vec2 starId = floor(uv * starDensity);
    float starVal = hash(starId);
    float star = step(0.96, starVal) * (sin(u_time * 5.0 + starVal * 10.0) * 0.5 + 0.5);

    vec3 nebColor = 0.5 + 0.5 * cos(n * 4.0 + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
    vec3 col = nebColor * n * (1.0 + u_audio_bass * 1.8) + vec3(star) * (1.0 + u_audio_treble * 2.0);

    gl_FragColor = vec4(col, 1.0);
}`
  },

  kaleido_lattice: {
    name: "8. Kaleidoscopic Crystal Lattice",
    author: "Mrswami",
    description: "Multifaceted prismatic crystal lattice with rotating kaleidoscope mirrors.",
    code: `// Kaleidoscopic Crystal Lattice
// u_param1: Mirror Symmetry Facet Count (4 to 32 Facets)
// u_param2: Crystal Edge Subdivision Frequency
// u_param3: Prism Spectrum Dispersion
// u_param4: Rotation Velocity
// u_param5: Crystal Matrix Duplication

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
uniform float u_param5;

#define PI 3.14159265359

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 7.0);
        uv = fract(uv * grid * 0.5) - 0.5;
    }

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param1: Facet Count
    float facets = 4.0 + floor(u_param1 * 28.0);
    a = abs(mod(a + u_time * u_param4 * 2.0, 2.0 * PI / facets) - PI / facets);

    vec2 p = vec2(cos(a), sin(a)) * r;

    // u_param2: Subdivision
    float freq = 4.0 + u_param2 * 46.0;
    float crystal = sin(p.x * freq + u_audio_bass * 8.0) * cos(p.y * freq + u_audio_treble * 8.0);

    vec3 col = 0.5 + 0.5 * cos(crystal * 5.0 + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
    col *= (0.8 + u_audio_bass * 2.0);

    gl_FragColor = vec4(col, 1.0);
}`
  },

  spectral_wave_grid: {
    name: "9. 3D Audio Frequency Terrain Mesh",
    author: "Mrswami",
    description: "3D wireframe terrain mountain landscape moving to live audio frequencies.",
    code: `// 3D Audio Frequency Terrain Mesh
// u_param1: Peak Mountain Height
// u_param2: Wireframe Grid Density (10x to 80x)
// u_param3: Laser Wireframe Color Shift
// u_param4: Terrain Flight Speed
// u_param5: Multi-Landscape Tiling Matrix

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
uniform float u_param5;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        uv.x = mod(uv.x + 0.5, 1.0 - u_param5 * 0.5) - 0.5;
    }

    vec3 col = vec3(0.0);

    if (uv.y < 0.1) {
        float depth = 0.8 / abs(uv.y - 0.1);
        vec2 p = vec2(uv.x * depth, depth + u_time * (1.0 + u_param4 * 5.0));

        // u_param1: Height
        float height = sin(p.x * 0.5) * cos(p.y * 0.5) * (0.5 + u_param1 * 2.5) * (1.0 + u_audio_bass * 2.0);
        
        float gridRes = 5.0 + u_param2 * 55.0;
        vec2 grid = abs(fract(p * (gridRes * 0.1) + height * 0.2) - 0.5);
        float line = min(grid.x, grid.y);

        if (line < 0.05) {
            vec3 lineColor = mix(vec3(0.0, 1.0, 0.5), vec3(1.0, 0.0, 0.5), u_param3);
            col = lineColor * (1.0 - line / 0.05) * (1.0 / (depth * 0.2));
        }
    }

    gl_FragColor = vec4(col, 1.0);
}`
  },

  torus_knot_fractal: {
    name: "10. Raymarched Torus Knot Fractal",
    author: "Mrswami",
    description: "Complex 3D braided torus knot with metallic shader reflections and audio pulse rings.",
    code: `// Raymarched Torus Knot Fractal
// u_param1: Knot Winding Ratio & Braids
// u_param2: Tube Thickness & Surface Ring Ripples
// u_param3: Metallic Specular Brightness
// u_param4: Torsional Spin Velocity
// u_param5: Multi-Knot Lattice Matrix

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
uniform float u_param5;

mat2 rotate2D(float angle) {
    float s = sin(angle), c = cos(angle);
    return mat2(c, -s, s, c);
}

float map(vec3 p) {
    vec3 q = p;

    if (u_param5 > 0.02) {
        float grid = 3.5 - u_param5 * 2.0;
        q.xy = mod(q.xy + grid * 0.5, grid) - grid * 0.5;
    }

    q.xz *= rotate2D(u_time * (0.2 + u_param4 * 3.0));
    q.xy *= rotate2D(u_time * (0.1 + u_param4 * 2.0));

    // Torus Knot Distance Equation
    float r1 = 1.0 + u_audio_bass * 0.8;
    float r2 = 0.3 + u_param2 * 0.4;
    vec2 t = vec2(length(q.xz) - r1, q.y);
    
    // u_param1: Winding Ratio
    float winding = 2.0 + floor(u_param1 * 6.0);
    float a = atan(q.z, q.x);
    t *= rotate2D(a * winding * 0.5);

    return length(t) - r2;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    vec3 ro = vec3(0.0, 0.0, -3.5);
    vec3 rd = normalize(vec3(uv, 1.2));

    float t = 0.0;
    float glow = 0.0;

    for (int i = 0; i < 80; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        glow += 0.01 / (abs(d) + 0.015);
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

        float spec = Math.pow(max(dot(reflect(rd, n), normalize(vec3(1.0, 2.0, -3.0))), 0.0), 16.0);
        col = vec3(0.1, 0.6, 1.0) * spec * (1.0 + u_param3 * 4.0);
    }

    col += vec3(0.0, 0.8, 1.0) * glow * (0.1 + u_param3 * 0.4) * (1.0 + u_audio_bass * 2.5);
    gl_FragColor = vec4(col, 1.0);
}`
  },

  particle_vortex: {
    name: "11. Cybernetic Particle Vortex Engine",
    author: "Mrswami",
    description: "Swirling particle stream driven by audio frequencies with vortex speed & density.",
    code: `// Cybernetic Particle Vortex Engine
// u_param1: Vortex Swarm Radius & Spiral Arms
// u_param2: Particle Size & Density Count
// u_param3: Ignition Glow & Spectrum Shift
// u_param4: Gravitational Vortex Velocity
// u_param5: Multi-Vortex Grid Array

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
uniform float u_param5;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 6.0);
        uv = fract(uv * grid) - 0.5;
    }

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param4: Vortex Speed
    a += u_time * (1.0 + u_param4 * 5.0) + (0.5 / (r + 0.1));

    // u_param1 & u_param2: Spiral Arms & Density
    float arms = 2.0 + floor(u_param1 * 8.0);
    float spiral = sin(a * arms + r * (10.0 + u_param2 * 40.0) + u_audio_bass * 6.0);

    float particle = smoothstep(0.7, 1.0, spiral);

    vec3 col = 0.5 + 0.5 * cos(a + u_time + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
    col *= particle * (1.0 / (r * 1.5)) * (1.0 + u_audio_bass * 2.5);

    gl_FragColor = vec4(col, 1.0);
}`
  }
};

if (typeof module !== 'undefined') {
  module.exports = PRESET_EQUATIONS;
}
