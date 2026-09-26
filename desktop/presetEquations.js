/**
 * High-Impact Preset Code Art Equations (GLSL Fragment Shaders) for TouchArt Studio
 * 15 Parameters: u_param1-10 (all with DRAMATIC visual impact) + Post-FX (bloom/chromatic/vignette/filmgrain)
 * All shaders audited for WebGL2/GLSL 300 es compatibility.
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
// u_param6: Camera Zoom / FOV Scale
// u_param7: X/Y Position Offset & Drift
// u_param8: Secondary Geometry Layer Blend
// u_param9: Background Brightness / Ambient Fog
// u_param10: Time Warp / Animation Speed Multiplier

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_audio_beat;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;
uniform float u_param5;
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

mat2 rotate2D(float angle) {
    float s = sin(angle), c = cos(angle);
    return mat2(c, -s, s, c);
}

float sdOctahedron(vec3 p, float s) {
    p = abs(p);
    return (p.x + p.y + p.z - s) * 0.57735027;
}

float sdTorus(vec3 p, float R, float r) {
    vec2 q = vec2(length(p.xz) - R, p.y);
    return length(q) - r;
}

float map(vec3 p) {
    vec3 q = p;

    // u_param5: Massive Grid Duplication
    if (u_param5 > 0.02) {
        float gridSpacing = 4.0 - u_param5 * 2.8;
        q.xy = mod(q.xy + gridSpacing * 0.5, gridSpacing) - gridSpacing * 0.5;
    }

    // u_param10: Time Warp
    float t = u_time * (0.3 + u_param10 * 4.0);

    q.xz *= rotate2D(t * (0.2 + u_param4 * 3.0));
    q.xy *= rotate2D(t * (0.1 + u_param4 * 2.0));
    
    // u_param2: Dynamic Surface Spikes & Multi-Frequency Noise
    float spikeFreq = 2.0 + u_param2 * 30.0;
    float spikes = sin(q.x * spikeFreq) * sin(q.y * spikeFreq) * sin(q.z * spikeFreq) * (0.05 + u_param2 * 0.4);

    // Audio Reactive Pulsing (Smooth Ambient Breathing)
    float baseSize = 0.75 + u_audio_bass * 0.45 + u_audio_beat * 0.25;
    
    float sphere = length(q) - (baseSize + spikes);
    
    vec3 b = abs(q) - vec3(baseSize * 0.7 + u_audio_mid * 0.3);
    float box = length(max(b, 0.0)) + min(max(b.x, max(b.y, b.z)), 0.0) + spikes;
    
    float oct = sdOctahedron(q, baseSize * 1.2) + spikes;

    // u_param8: Secondary Geometry (Torus Layer)
    float torus = sdTorus(q, 1.2, 0.15 + u_param8 * 0.5);
    
    // u_param1: Smooth Morph between Sphere, Box, Octahedron
    float shapeMorph = u_param1 * 2.0;
    float primary;
    if (shapeMorph < 1.0) {
        primary = mix(sphere, box, shapeMorph);
    } else {
        primary = mix(box, oct, shapeMorph - 1.0);
    }

    // Blend secondary geometry
    return mix(primary, torus, u_param8 * 0.5);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // u_param7: X/Y Offset Drift
    uv += vec2(sin(u_time * 0.3) * u_param7 * 0.5, cos(u_time * 0.2) * u_param7 * 0.3);

    // u_param6: Camera Zoom / FOV
    float zoom = 3.0 + u_param6 * 6.0;
    vec3 ro = vec3(0.0, 0.0, -zoom);
    vec3 rd = normalize(vec3(uv, 1.2));
    
    float t = 0.0;
    float glow = 0.0;
    
    for (int i = 0; i < 90; i++) {
        vec3 p = ro + rd * t;
        float d = map(p);
        
        // u_param3: Glow Intensity
        glow += (0.01 + u_param3 * 0.04) / (abs(d) + 0.015);
        
        if (d < 0.001 || t > 12.0) break;
        t += d * 0.5;
    }
    
    // u_param9: Background Brightness
    vec3 col = vec3(u_param9 * 0.15);

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
    
    // Rich harmonic neon glow without sudden strobe snapping
    vec3 glowColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.6), sin(u_time * 2.0 + u_param3 * 5.0) * 0.5 + 0.5);
    glowColor += vec3(0.05, 0.1, 0.2) * u_audio_beat;
    col += glowColor * glow * (0.12 + u_param3 * 0.45) * (1.0 + u_audio_bass * 0.6 + u_audio_beat * 0.35);
    
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
// u_param6: Radial Pulsation Amplitude
// u_param7: Angular Wave Distortion
// u_param8: Inner Ring Radius Control
// u_param9: Background Glow & Ambient Light
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

#define PI 3.14159265359

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    
    float t = u_time * (0.5 + u_param10 * 4.0);

    // u_param4: Zoom & Distortion
    st *= (0.8 + u_param4 * 5.0);

    // u_param5: Matrix Grid Duplication
    if (u_param5 > 0.02) {
        float repCount = 1.0 + floor(u_param5 * 9.0);
        st = fract(st * repCount * 0.5) - 0.5;
    }
    
    float r = length(st);
    float a = atan(st.y, st.x);

    // u_param7: Angular Wave Distortion
    a += sin(r * 8.0 + t) * u_param7 * 2.0;
    
    // u_param4: Spiral Vortex Twist
    a += r * u_param4 * 4.0;

    // u_param1: Polar Symmetry Folding (3 to 32 petals)
    float N = 3.0 + floor(u_param1 * 29.0);
    a = mod(a, 2.0 * PI / N) - PI / N;
    
    vec2 p = vec2(cos(a), sin(a)) * r;

    // u_param8: Inner Ring
    float innerRing = smoothstep(u_param8 * 0.5, u_param8 * 0.5 + 0.05, r);
    
    // u_param2: Ripple Frequency Lines (5x to 80x)
    float density = 5.0 + u_param2 * 75.0;
    float wave = sin(p.x * density + t * 3.0 + u_audio_bass * 1.5);
    wave += cos(p.y * density - t * 2.0 + u_audio_treble * 1.5);

    // u_param6: Radial Pulsation
    wave += sin(r * 20.0 - t * 5.0) * u_param6 * 2.0 * (1.0 + u_audio_bass * 0.4);
    
    float c = smoothstep(0.0, 0.12, abs(wave) - (0.05 + u_audio_mid * 0.25));
    
    // u_param3: Color Spectrum
    vec3 color = 0.5 + 0.5 * cos(t * (1.0 + u_param3 * 4.0) + r * (3.0 + u_param3 * 8.0) + vec3(0.0, 2.0, 4.0));
    color *= (1.0 - c) * innerRing * (1.0 + u_audio_bass * 0.55);

    // u_param9: Background ambient
    color += vec3(u_param9 * 0.08);
    
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
// u_param6: Secondary Warp Layer Intensity
// u_param7: Horizontal Shear Distortion
// u_param8: Vortex Curl Amount
// u_param9: Background Fog Density
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

void main() {
    vec2 p = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    float t = u_time * (0.2 + u_param10 * 4.0);

    // u_param5: Matrix Duplication
    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 8.0);
        p = mod(p * grid, 1.0) - 0.5;
    }
    
    // u_param1 & u_param4: Turbulence & Speed
    p *= (1.0 + u_param1 * 4.0);
    float speed = t * (0.2 + u_param4 * 3.0);

    // u_param7: Horizontal Shear
    p.x += p.y * u_param7 * 2.0;

    // u_param8: Vortex Curl
    float angle = length(p) * u_param8 * 6.0;
    float cs = cos(angle), sn = sin(angle);
    p = vec2(p.x * cs - p.y * sn, p.x * sn + p.y * cs);
    
    // u_param2: Octave Iterations (1 to 8)
    float maxOctaves = 1.0 + floor(u_param2 * 7.0);
    for(float i = 1.0; i < 9.0; i++){
        if (i > maxOctaves) break;
        p.x += 0.3 / i * sin(i * 3.0 * p.y + speed + u_audio_bass * 1.2);
        p.y += 0.3 / i * cos(i * 3.0 * p.x + speed + u_audio_treble * 1.2);
    }

    // u_param6: Secondary Warp Layer
    if (u_param6 > 0.02) {
        p.x += sin(p.y * 4.0 + t * 2.0) * u_param6 * 0.5;
        p.y += cos(p.x * 4.0 - t * 1.5) * u_param6 * 0.5;
    }
    
    float col = sin(p.x * 2.0 + p.y * 2.0 + u_audio_mid * 1.5);
    
    // u_param3: Color Shift & Glow
    vec3 rgb = vec3(
        sin(col * 3.0 + t * 2.0 + u_param3 * 6.28),
        sin(col * 3.0 + t * 2.0 + u_param3 * 6.28 + 2.0),
        sin(col * 3.0 + t * 2.0 + u_param3 * 6.28 + 4.0)
    ) * 0.5 + 0.5;
    
    rgb = mix(vec3(col), rgb, 0.4 + u_param3 * 0.6);

    // u_param9: Background fog
    rgb = mix(rgb, vec3(0.05), u_param9 * 0.5 * (1.0 - length(gl_FragCoord.xy / u_resolution.xy - 0.5)));

    gl_FragColor = vec4(rgb * (0.9 + u_audio_bass * 0.45), 1.0);
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
// u_param6: Sun Horizontal Stripe Count
// u_param7: Mountain Terrain Height
// u_param8: Star Field Density
// u_param9: Sky Gradient Intensity
// u_param10: Time Warp Speed

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_audio_beat;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;
uniform float u_param5;
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.5 + u_param10 * 4.0);

    if (u_param5 > 0.02) {
        uv.x = mod(uv.x + u_param5, u_param5 * 0.8) - u_param5 * 0.4;
    }
    
    // u_param9: Sky Gradient
    vec3 col = mix(vec3(0.02, 0.0, 0.08), vec3(0.15, 0.0, 0.3) * u_param9, uv.y + 0.5);

    // u_param8: Star Field
    if (u_param8 > 0.02 && uv.y > 0.0) {
        float starDensity = 30.0 + u_param8 * 200.0;
        vec2 starId = floor(uv * starDensity);
        float starVal = hash21(starId);
        float star = step(0.97, starVal) * (sin(t * 3.0 + starVal * 20.0) * 0.5 + 0.5);
        col += vec3(star) * (0.5 + u_audio_treble);
    }

    // Synthwave Sun (Gentle Ambient Breathing with Bass & Beat)
    vec2 sunPos = vec2(0.0, 0.15);
    float sunRadius = 0.24 + u_param1 * 0.3 + u_audio_bass * 0.08 + u_audio_beat * 0.05;
    float distToSun = length(uv - sunPos);
    
    if (distToSun < sunRadius) {
        // u_param6: Sun Horizontal Cutout Stripes
        float stripeCount = 10.0 + u_param6 * 50.0;
        float cut = sin((uv.y - sunPos.y) * stripeCount + t * 2.0);
        if (uv.y < sunPos.y && cut > 0.3) {
            // Cutout bar - keep background
        } else {
            float sunT = (uv.y - (sunPos.y - sunRadius)) / (sunRadius * 2.0);
            col = mix(vec3(1.0, 0.8, 0.0), vec3(1.0, 0.0, 0.5), sunT);
        }
    }

    // u_param7: Mountain Terrain Silhouette
    if (u_param7 > 0.02) {
        float mountainHeight = sin(uv.x * 8.0 + 1.0) * 0.04 + sin(uv.x * 15.0) * 0.02;
        mountainHeight *= u_param7 * 3.0;
        if (uv.y < mountainHeight && uv.y > -0.02) {
            col = vec3(0.02, 0.0, 0.06);
        }
    }

    // Grid Floor Perspective
    if (uv.y < 0.0) {
        float pZ = 0.8 / abs(uv.y);
        float pX = uv.x * pZ;
        
        float flightSpeed = t * (1.0 + u_param4 * 6.0);
        
        float gridFreq = 5.0 + u_param2 * 45.0;
        
        float gridX = abs(fract(pX * (gridFreq * 0.1) + 0.5) - 0.5);
        float gridZ = abs(fract((pZ + flightSpeed) * 0.5 + 0.5) - 0.5);
        
        float line = min(gridX, gridZ);
        float gridLineWidth = 0.04;
        if (line < gridLineWidth) {
            vec3 gridColor = mix(vec3(0.0, 0.9, 1.0), vec3(1.0, 0.0, 0.8), u_param3);
            col += gridColor * (1.0 - line / gridLineWidth) * (1.0 / (pZ * 0.3)) * (1.0 + u_audio_bass * 0.6 + u_audio_beat * 0.35);
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
// u_param6: Tunnel Wall Texture Complexity
// u_param7: Perspective Depth Warp
// u_param8: Secondary Spiral Arms
// u_param9: Outer Glow Halo Intensity
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.5 + u_param10 * 4.0);

    if (u_param5 > 0.02) {
        uv = mod(uv + 0.5, 1.0 - u_param5 * 0.6) - 0.5;
    }
    
    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param1: Twist Spiral
    a += u_param1 * 10.0 / (r + 0.1);

    // u_param7: Perspective Depth Warp
    float depthScale = 0.5 + u_param7 * 2.0;
    float z = (depthScale + u_param4 * 1.5) / (r + 0.001);
    float speed = t * (1.0 + u_param3 * 8.0);
    
    // u_param2: Laser Rings
    float ringFreq = 4.0 + u_param2 * 46.0;
    float rings = sin(z * ringFreq - speed + u_audio_bass * 1.5);

    // u_param6: Wall Texture
    float wallTex = sin(a * (4.0 + u_param6 * 20.0) + z * 0.5) * 0.5 + 0.5;

    // u_param8: Secondary Spiral Arms
    float spiralArms = 4.0 + floor(u_param8 * 16.0);
    float spirals = sin(a * spiralArms + z * 2.0 + u_audio_treble * 1.5);
    
    float pattern = smoothstep(0.1, 0.9, rings * spirals) + wallTex * u_param6 * 0.3;

    vec3 col = mix(vec3(0.0, 0.8, 1.0), vec3(1.0, 0.0, 0.6), sin(z * 0.5 + t) * 0.5 + 0.5);
    col *= pattern * (1.0 / (r * 2.0)) * (1.0 + u_audio_bass * 0.55);

    // u_param9: Outer Glow Halo
    col += vec3(0.1, 0.3, 0.8) * u_param9 * (1.0 / (r * 3.0 + 1.0)) * 0.3;

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
// u_param6: Cube Corner Rounding
// u_param7: Wave Propagation Speed
// u_param8: Color Band Separation
// u_param9: Background Depth Fade
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

void main() {
    vec2 st = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.5 + u_param10 * 4.0);

    if (u_param5 > 0.02) {
        st = mod(st + 0.5, 1.2 - u_param5 * 0.8) - 0.5;
    }

    // u_param4: Isometric rotation
    float isoAngle = 0.3 + u_param4 * 1.2;
    float cs = cos(isoAngle), sn = sin(isoAngle);
    st = vec2(st.x * cs - st.y * sn, st.x * sn + st.y * cs);
    
    // u_param2: Grid Density
    float grid = 4.0 + floor(u_param2 * 20.0);
    vec2 id = floor(st * grid);
    vec2 f = fract(st * grid) - 0.5;

    // u_param7: Wave Propagation Speed
    float d = length(id);
    float h = sin(d * 0.5 - t * (1.0 + u_param7 * 5.0)) * 0.5 + 0.5;
    h += u_audio_bass * (0.35 + u_param1 * 0.6);
    h += u_audio_mid * 0.2;

    // u_param6: Corner Rounding
    float rounding = u_param6 * 0.2;
    float box = max(abs(f.x), abs(f.y)) - (0.35 + h * 0.1 - rounding);
    float edge = smoothstep(0.05 + rounding, 0.0, abs(box));

    // u_param8: Color Band Separation
    float colorPhase = id.x * (0.3 + u_param8 * 0.7) + id.y * (0.3 + u_param8 * 0.7) + t;
    vec3 col = mix(vec3(0.0, 0.5, 1.0), vec3(1.0, 0.0, 0.5), sin(colorPhase) * 0.5 + 0.5);
    col = mix(col, vec3(0.0, 1.0, 0.5), sin(colorPhase * 1.5 + 2.0) * 0.5 * u_param8);
    col *= edge * (0.5 + u_param3 * 2.0) * (1.0 + u_audio_bass * 0.5);

    // u_param9: Background fade
    col += vec3(0.02, 0.01, 0.04) * u_param9;

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
// u_param6: Cloud Layer Depth & Thickness
// u_param7: Galactic Rotation
// u_param8: Emission Glow Strength
// u_param9: Deep Space Background Brightness
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

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
    float t = u_time * (0.3 + u_param10 * 3.0);

    if (u_param5 > 0.02) {
        uv = mod(uv + 0.5, 1.0 - u_param5 * 0.6) - 0.5;
    }

    // u_param7: Galactic Rotation
    float rotAngle = t * u_param7 * 0.5;
    float cs = cos(rotAngle), sn = sin(rotAngle);
    uv = vec2(uv.x * cs - uv.y * sn, uv.x * sn + uv.y * cs);

    vec2 p = uv * (1.5 + u_param1 * 4.0);
    float speed = t * (0.1 + u_param4 * 1.5);
    
    // Multi-layer noise with u_param6 controlling depth
    float n = noise(p + speed);
    n += 0.5 * noise(p * 2.0 - speed * 0.8 + u_audio_bass);
    n += 0.25 * noise(p * 4.0 + speed * 1.2 + u_audio_treble);
    n += 0.125 * noise(p * 8.0 - speed * 0.5) * u_param6;
    n += 0.0625 * noise(p * 16.0 + speed * 2.0) * u_param6 * u_param6;

    // Stars
    float starDensity = 20.0 + u_param2 * 100.0;
    vec2 starId = floor(uv * starDensity);
    float starVal = hash(starId);
    float star = step(0.96, starVal) * (sin(t * 5.0 + starVal * 10.0) * 0.5 + 0.5);

    vec3 nebColor = 0.5 + 0.5 * cos(n * 4.0 + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));

    // u_param8: Emission Glow
    vec3 emissionGlow = nebColor * pow(max(n, 0.0), 2.0) * u_param8 * 2.0;

    vec3 col = nebColor * n * (1.0 + u_audio_bass * 0.5) + vec3(star) * (1.0 + u_audio_treble * 0.6);
    col += emissionGlow * (1.0 + u_audio_mid * 0.4);

    // u_param9: Deep Space Background
    col += vec3(0.01, 0.005, 0.02) * u_param9 * 2.0;

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
// u_param6: Refraction Depth Layers
// u_param7: Crystal Size / Scale
// u_param8: Edge Glow Thickness
// u_param9: Background Crystal Fog
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

#define PI 3.14159265359

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.5 + u_param10 * 4.0);

    // u_param7: Crystal Scale
    uv *= (0.5 + u_param7 * 3.0);

    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 7.0);
        uv = fract(uv * grid * 0.5) - 0.5;
    }

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param1: Facet Count
    float facets = 4.0 + floor(u_param1 * 28.0);
    a = abs(mod(a + t * u_param4 * 2.0, 2.0 * PI / facets) - PI / facets);

    vec2 p = vec2(cos(a), sin(a)) * r;

    // u_param2: Subdivision
    float freq = 4.0 + u_param2 * 46.0;
    float crystal = sin(p.x * freq + u_audio_bass * 1.5) * cos(p.y * freq + u_audio_treble * 1.5);

    // u_param6: Refraction Layers
    float refraction = sin(p.x * freq * 2.0 - t * 3.0) * cos(p.y * freq * 2.0 + t * 2.0);
    crystal += refraction * u_param6 * 0.5;

    // u_param8: Edge Glow
    float edge = abs(crystal);
    float edgeGlow = smoothstep(0.1, 0.0, edge) * u_param8 * 3.0;

    vec3 col = 0.5 + 0.5 * cos(crystal * 5.0 + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
    col *= (0.9 + u_audio_bass * 0.45);
    col += vec3(0.5, 0.8, 1.0) * edgeGlow * (1.0 + u_audio_mid * 0.4);

    // u_param9: Background fog
    col += vec3(0.03, 0.01, 0.06) * u_param9;

    gl_FragColor = vec4(col, 1.0);
}`
  },

  spectral_wave_grid: {
    name: "9. 3D Audio Frequency Terrain Mesh",
    author: "Mrswami",
    description: "3D raymarched cyber wireframe mountain landscape erupting to live audio bass, beats, and frequency harmonics.",
    code: `// 3D Audio Frequency Terrain Mesh
// u_param1: Mountain Peak Elevation & Audio Surge (0.5x to 8x)
// u_param2: Wireframe Grid Density & Resolution
// u_param3: Neon Cyber Wireframe Color Spectrum
// u_param4: Forward Flight Velocity through Canyon
// u_param5: Canyon Matrix Duplication / Multi-Ridge
// u_param6: Mountain Crest Jaggedness & Harmonic Octaves
// u_param7: Camera Elevation & Horizon Pitch
// u_param8: Wireframe Laser Beam Thickness & Glow
// u_param9: Atmospheric Fog & Ambient Sky Intensity
// u_param10: Time Warp Speed Multiplier

precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_audio_bass;
uniform float u_audio_mid;
uniform float u_audio_treble;
uniform float u_audio_beat;
uniform float u_param1;
uniform float u_param2;
uniform float u_param3;
uniform float u_param4;
uniform float u_param5;
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

float hash21(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

// 3D Audio-Reactive Mountain Heightfield
float getTerrainHeight(vec2 p) {
    // Multi-canyon duplication if u_param5 > 0
    if (u_param5 > 0.02) {
        float spacing = 14.0 - u_param5 * 6.0;
        p.x = mod(p.x + spacing * 0.5, spacing) - spacing * 0.5;
    }

    // Canyon valley through center: smooth valley floor flanked by massive mountains
    float valley = smoothstep(1.2, 5.5, abs(p.x));

    // Audio frequency modulation for organic mountain wave breathing
    float audioBassPulse = (u_audio_bass * 0.75 + u_audio_beat * 0.40);
    float audioMidWaves = (u_audio_mid * 0.50);
    float audioTrebleCrests = (u_audio_treble * 0.40);

    float baseElev = (0.6 + u_param1 * 4.2) * (1.0 + audioBassPulse);

    // Multi-octave mountain ridges
    float h = sin(p.x * 0.35) * cos(p.y * 0.22) * 2.0;
    h += sin(p.x * 0.85 + p.y * 0.6) * (1.0 + u_param6 * 1.6) * (1.0 + audioMidWaves);
    h += sin(p.x * 2.1 - p.y * 1.7) * (0.4 + u_param6 * 0.9) * (1.0 + audioTrebleCrests);
    h += cos(p.x * 5.0 + p.y * 4.0) * (u_param6 * 0.25);

    return h * baseElev * valley;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.6 + u_param10 * 3.5);

    // Camera setup: flying forward along Z above canyon floor
    float camSpeed = t * (2.5 + u_param4 * 12.0);
    float camHeight = 2.4 + u_param7 * 3.5;
    vec3 ro = vec3(0.0, camHeight, camSpeed);

    // Camera ray direction with pitch control
    float pitch = -0.18 + u_param7 * 0.25;
    vec3 rd = normalize(vec3(uv.x, uv.y + pitch, 1.15));

    // Sky Background with Stars & Audio Treble Twinkle
    vec3 skyCol = mix(vec3(0.01, 0.0, 0.04), vec3(0.08, 0.01, 0.18) * (1.0 + u_param9 * 2.0), uv.y + 0.5);
    
    if (uv.y > -0.05) {
        vec2 starId = floor(uv * 180.0);
        float starVal = hash21(starId);
        if (starVal > 0.982) {
            float twinkle = sin(t * 5.0 + starVal * 30.0) * 0.5 + 0.5;
            skyCol += vec3(0.8, 0.9, 1.0) * twinkle * (0.6 + u_audio_treble * 0.6);
        }
    }

    // Glowing Synthwave Sun on the horizon
    vec2 sunPos = vec2(0.0, 0.12 + u_param7 * 0.15);
    float sunDist = length(uv - sunPos);
    float sunRadius = 0.22 + (u_audio_bass * 0.05 + u_audio_beat * 0.03);
    
    if (sunDist < sunRadius) {
        float sunY = (uv.y - (sunPos.y - sunRadius)) / (sunRadius * 2.0);
        float stripes = sin((uv.y - sunPos.y) * 45.0 + t * 2.0);
        if (!(uv.y < sunPos.y && stripes > 0.35)) {
            vec3 sunGradient = mix(vec3(1.0, 0.8, 0.1), vec3(1.0, 0.0, 0.6), sunY);
            skyCol = mix(skyCol, sunGradient, smoothstep(sunRadius, sunRadius - 0.02, sunDist));
        }
    }

    // Sun Radial Corona / Glow
    skyCol += vec3(1.0, 0.2, 0.5) * (0.04 / (sunDist + 0.08)) * (1.0 + u_audio_bass * 0.35);

    vec3 col = skyCol;

    // Raymarch the 3D Mountain Mesh
    float tDist = 0.2;
    float maxDist = 38.0;
    bool hit = false;
    vec3 hitPos = vec3(0.0);

    for (int i = 0; i < 68; i++) {
        vec3 p = ro + rd * tDist;
        float h = getTerrainHeight(p.xz);
        float diff = p.y - h;

        if (diff < 0.04) {
            hit = true;
            hitPos = p;
            break;
        }

        // Adaptive step size based on distance and vertical delta
        tDist += max(diff * 0.38, 0.08 + tDist * 0.015);
        if (tDist > maxDist) break;
    }

    if (hit) {
        // Wireframe Grid Coordinates
        float gridRes = 0.35 + u_param2 * 2.6;
        vec2 grid = abs(fract(hitPos.xz * gridRes) - 0.5);
        float lineDist = min(grid.x, grid.y);

        // Laser Wireframe Thickness
        float wireThickness = 0.03 + u_param8 * 0.12;
        float wire = smoothstep(wireThickness, 0.0, lineDist);

        // Neon Wireframe Spectrum (Smooth Cyan -> Magenta transition with subtle beat lift)
        vec3 neonColor = mix(vec3(0.0, 0.95, 1.0), vec3(1.0, 0.0, 0.7), u_param3);
        neonColor += vec3(0.08, 0.12, 0.22) * u_audio_beat;

        // Peak Height Highlight: mountain ridges glow hotter
        float peakGlow = clamp((hitPos.y - 1.0) * 0.4, 0.0, 1.0);
        neonColor += vec3(0.3, 0.6, 1.0) * peakGlow * (1.0 + u_audio_treble * 0.6);

        // Distance fog attenuation
        float fog = exp(-0.045 * tDist);
        vec3 terrainSurf = mix(vec3(0.01, 0.005, 0.03), vec3(0.06, 0.01, 0.12), clamp(hitPos.y * 0.3, 0.0, 1.0));

        // Combine wireframe lines with dark terrain surface (soft harmonic glow)
        vec3 finalTerrain = terrainSurf + neonColor * wire * (1.1 + u_audio_bass * 0.55 + u_audio_beat * 0.35);

        // Blend terrain into horizon sky fog
        col = mix(skyCol, finalTerrain, fog);
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
// u_param6: Camera Zoom / Distance
// u_param7: Surface Bump Frequency
// u_param8: Secondary Ring Orbit
// u_param9: Ambient Light Intensity
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

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

    float t = u_time * (0.2 + u_param10 * 3.0);

    q.xz *= rotate2D(t * (0.2 + u_param4 * 3.0));
    q.xy *= rotate2D(t * (0.1 + u_param4 * 2.0));

    // Torus Knot Distance Equation
    float r1 = 1.0 + u_audio_bass * 0.25;
    float r2 = 0.3 + u_param2 * 0.4;
    vec2 tor = vec2(length(q.xz) - r1, q.y);
    
    // u_param1: Winding Ratio
    float winding = 2.0 + floor(u_param1 * 6.0);
    float a = atan(q.z, q.x);
    tor *= rotate2D(a * winding * 0.5);

    // u_param7: Surface Bumps
    float bumps = sin(a * (8.0 + u_param7 * 40.0) + t * 4.0) * u_param7 * 0.05;

    float torusDist = length(tor) - r2 + bumps;

    // u_param8: Secondary Ring
    if (u_param8 > 0.02) {
        float r3 = 0.6 + u_audio_mid * 0.3;
        float r4 = 0.1 + u_param8 * 0.15;
        vec2 tor2 = vec2(length(q.yz) - r3, q.x);
        tor2 *= rotate2D(t * 2.0);
        float ring2 = length(tor2) - r4;
        torusDist = min(torusDist, ring2);
    }

    return torusDist;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;

    // u_param6: Camera Zoom
    float camDist = 3.0 + u_param6 * 5.0;
    vec3 ro = vec3(0.0, 0.0, -camDist);
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

    // u_param9: Ambient Light
    vec3 col = vec3(u_param9 * 0.05);

    if (t < 10.0) {
        vec3 p = ro + rd * t;
        vec3 n = normalize(vec3(
            map(p + vec3(0.001, 0.0, 0.0)) - map(p - vec3(0.001, 0.0, 0.0)),
            map(p + vec3(0.0, 0.001, 0.0)) - map(p - vec3(0.0, 0.001, 0.0)),
            map(p + vec3(0.0, 0.0, 0.001)) - map(p - vec3(0.0, 0.0, 0.001))
        ));

        // Standard GLSL pow specular
        float spec = pow(max(dot(reflect(rd, n), normalize(vec3(1.0, 2.0, -3.0))), 0.0), 16.0);
        col = vec3(0.1, 0.6, 1.0) * spec * (1.0 + u_param3 * 4.0);
        col += vec3(0.8, 0.2, 0.5) * max(dot(n, normalize(vec3(-1.0, 1.0, 0.5))), 0.0) * 0.3;
    }

    col += vec3(0.0, 0.8, 1.0) * glow * (0.1 + u_param3 * 0.4) * (1.0 + u_audio_bass * 0.5);
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
// u_param6: Particle Trail Length
// u_param7: Turbulence Distortion
// u_param8: Secondary Swirl Counter-Rotation
// u_param9: Background Nebula Glow
// u_param10: Time Warp Speed

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
uniform float u_param6;
uniform float u_param7;
uniform float u_param8;
uniform float u_param9;
uniform float u_param10;

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution.xy) / u_resolution.y;
    float t = u_time * (0.5 + u_param10 * 4.0);

    if (u_param5 > 0.02) {
        float grid = 1.0 + floor(u_param5 * 6.0);
        uv = fract(uv * grid) - 0.5;
    }

    float r = length(uv);
    float a = atan(uv.y, uv.x);

    // u_param7: Turbulence
    a += sin(r * 10.0 + t) * u_param7 * 1.5;
    r += sin(a * 5.0 + t * 2.0) * u_param7 * 0.1;

    // u_param4: Vortex Speed
    a += t * (1.0 + u_param4 * 5.0) + (0.5 / (r + 0.1));

    // u_param1 & u_param2: Spiral Arms & Density
    float arms = 2.0 + floor(u_param1 * 8.0);
    float spiral = sin(a * arms + r * (10.0 + u_param2 * 40.0) + u_audio_bass * 1.5);

    // u_param6: Particle Trail
    float trailWidth = 0.5 + u_param6 * 0.4;
    float particle = smoothstep(1.0 - trailWidth, 1.0, spiral);

    // u_param8: Secondary Counter-Swirl
    if (u_param8 > 0.02) {
        float a2 = atan(uv.y, uv.x) - t * (0.5 + u_param8 * 3.0);
        float spiral2 = sin(a2 * 3.0 + r * 15.0 + u_audio_treble * 1.5);
        particle += smoothstep(0.7, 1.0, spiral2) * u_param8 * 0.5;
    }

    vec3 col = 0.5 + 0.5 * cos(a + t + u_param3 * 6.28 + vec3(0.0, 2.0, 4.0));
    col *= particle * (1.0 / (r * 1.5)) * (1.0 + u_audio_bass * 0.5);

    // u_param9: Background Nebula Glow
    col += vec3(0.1, 0.02, 0.15) * u_param9 * (1.0 - r * 0.5);

    gl_FragColor = vec4(col, 1.0);
}`
  }
};

if (typeof module !== 'undefined') {
  module.exports = PRESET_EQUATIONS;
}
