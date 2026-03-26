# 3D Library Evaluation: Replacing Three.js

## Current State

| Metric | Value |
|--------|-------|
| `app.js` (minified) | 977 KB |
| `app.js` (gzip) | 265 KB |
| Three.js contribution (min) | ~355 KB (~36% of bundle) |
| Three.js contribution (gzip) | ~84 KB (~32% of bundle) |
| `thumbnails.worker.js` | 607 KB (also bundles Three.js) |
| Three.js version | 0.182.0 |

Three.js is imported via `import * as THREE from 'three'` across 7 renderer files. Tree-shaking has been attempted and does not meaningfully reduce the bundle due to Three.js internal side effects. The library lacks `"sideEffects": false` in its `package.json`.

---

## Three.js Features Actually Used

The codebase uses ~29 Three.js classes, isolated to the rendering subsystem (`src/core/rendering/`):

### Core Rendering
- `WebGLRenderer` (antialiasing, alpha, pixel ratio)
- `Scene`, `PerspectiveCamera`
- `Group`, `Mesh`

### Materials & Textures
- `MeshLambertMaterial` (with textures, solid colors, DoubleSide)
- `CanvasTexture` (dynamic textures from canvas)
- `Color`
- Texture filters: `NearestFilter`, `LinearFilter`
- Texture wrapping: `RepeatWrapping`

### Geometry
- `BufferGeometry` with custom attributes
- `Float32BufferAttribute` (position, normal, uv)
- Index buffers

### Lighting
- `AmbientLight`
- `DirectionalLight`

### Animation
- `AnimationMixer`, `AnimationClip`
- `QuaternionKeyframeTrack`, `VectorKeyframeTrack`, `BooleanKeyframeTrack`
- `Clock`

### Interaction
- `Raycaster` (mouse picking on meshes)
- `OrbitControls` (from addons — rotation, zoom, pan, damping, auto-rotate)

### Math
- `Vector2`, `Vector3`, `Quaternion`, `Matrix4`, `Box3`
- Quaternion SLERP interpolation
- Matrix decomposition

---

## Candidate Libraries

### 1. OGL — Recommended

| Attribute | Details |
|-----------|---------|
| Bundle size | **~29 KB gzip** (8 KB core + 6 KB math + 15 KB extras) |
| Tree-shakeable | Yes (ES6 modules, zero dependencies) |
| GitHub | [oframe/ogl](https://github.com/oframe/ogl) — 4.3k stars |
| Maintained | Yes, active development |
| Savings estimate | **~55 KB gzip** (84 KB Three.js → ~29 KB OGL) |

#### Feature Coverage

| Feature | OGL Support | Notes |
|---------|-------------|-------|
| WebGL Renderer | Yes | `Renderer` class, antialiasing, alpha |
| Scene graph | Yes | `Transform` (≈Group), `Mesh` |
| Camera | Yes | `Camera` with perspective/ortho |
| BufferGeometry | Yes | `Geometry` with custom attributes |
| Orbit controls | Yes | `Orbit` extra — rotation, zoom, pan, damping, auto-rotate |
| Raycasting | Yes | `Raycast` extra — mouse-to-3D, mesh intersection, UV coords |
| Animation | Partial | `Animation` extra — keyframe interpolation with quat slerp and weight blending, but no `AnimationMixer`/`AnimationClip` equivalent |
| Math classes | Yes | `Vec2`, `Vec3`, `Vec4`, `Quat`, `Mat3`, `Mat4`, `Color`, `Euler` |
| Textures | Yes | `Texture` class with filter/wrap modes |
| Lambert material | **No** | Must write custom GLSL shader |
| Lighting system | **No** | Must implement lighting in shaders |
| CanvasTexture | Partial | Can create `Texture` from canvas, but no dedicated `CanvasTexture` class |

#### Migration Gaps & Solutions

**Lambert shading + lighting (MEDIUM effort):** OGL requires writing custom GLSL. A Lambert shader is straightforward (~30 lines of GLSL) and would be shared across all renderers. This is the main migration cost, but also an opportunity — a custom shader will be far smaller than Three.js's entire material system.

```glsl
// Example Lambert vertex/fragment shader for OGL
// Vertex
attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 normalMatrix;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}

// Fragment
precision highp float;
uniform vec3 ambientColor;
uniform vec3 lightDirection;
uniform vec3 lightColor;
uniform sampler2D tMap;
uniform vec3 uColor;
uniform bool useTexture;
varying vec3 vNormal;
varying vec2 vUv;
void main() {
    vec3 baseColor = useTexture ? texture2D(tMap, vUv).rgb : uColor;
    float diff = max(dot(vNormal, normalize(lightDirection)), 0.0);
    vec3 color = baseColor * (ambientColor + lightColor * diff);
    gl_FragColor = vec4(color, 1.0);
}
```

**Animation system (LOW-MEDIUM effort):** The codebase already implements its own keyframe evaluation, interpolation, and matrix composition in `AnimatedRenderer.js`. Three.js's `AnimationMixer` is only used for final playback of pre-built tracks. OGL's `Animation` extra or a lightweight custom solution can replace this. Most of the animation logic (quaternion slerp, keyframe lookup, node chain evaluation) is already custom code that only uses Three.js math types — these map 1:1 to OGL's `Quat`, `Mat4`, `Vec3`.

**CanvasTexture (TRIVIAL):** OGL's `Texture` can accept a canvas element directly via its `image` property.

#### Migration Scope

| Renderer File | Estimated Effort |
|---------------|-----------------|
| `BaseRenderer.js` | Medium — core setup, shader creation, texture/geometry helpers |
| `AnimatedRenderer.js` | Low-Medium — swap math types, adapt animation playback |
| `ActorRenderer.js` | Low — inherits from AnimatedRenderer, mostly data logic |
| `BuildingRenderer.js` | Low — simple model display |
| `PlantRenderer.js` | Low — simple model display with color variants |
| `VehiclePartRenderer.js` | Low — single part display |
| `WdbModelRenderer.js` | Low-Medium — canvas texture painting, raycasting |
| `ScoreCubeRenderer.js` | Low — extends WdbModelRenderer |

Total: **~8 files to modify**, all contained within `src/core/rendering/`.

---

### 2. Four

| Attribute | Details |
|-----------|---------|
| Bundle size | **~10 KB gzip** |
| GitHub | [CodyJasonBennett/four](https://github.com/CodyJasonBennett/four) |
| Savings estimate | ~74 KB gzip |

**Verdict: Not recommended.** Missing raycasting, orbit controls, animation, and lighting. Would require implementing nearly everything from scratch. The additional ~19 KB savings over OGL does not justify the effort. Also has Vite compatibility concerns with WebGPU top-level await.

---

### 3. regl

| Attribute | Details |
|-----------|---------|
| Bundle size | **~30 KB gzip** |
| GitHub | [regl-project/regl](https://github.com/regl-project/regl) |

**Verdict: Not recommended.** Functional/stateless paradigm with no scene graph, no materials, no animation, no raycasting. Would be a complete rewrite with no API similarity. Same bundle size as OGL but far less functionality out of the box.

---

### 4. TWGL.js

| Attribute | Details |
|-----------|---------|
| Bundle size | **Very small** |

**Verdict: Not recommended.** Helper library for raw WebGL verbosity reduction only. No scene graph, no abstractions. Essentially writing raw WebGL with slightly less boilerplate.

---

### 5. Babylon.js

**Verdict: Not recommended.** Larger than Three.js (~1MB+ min). Would make the problem worse.

---

## Other Bundle Optimizations

Beyond library replacement, these non-code-splitting optimizations could further reduce bundle size:

### Compression improvements
- **Brotli pre-compression**: Brotli typically achieves 15-20% smaller output than gzip. If the hosting supports it, pre-compressing assets with `brotli` during build could drop `app.js` from ~265 KB gzip to ~220 KB brotli.

### Dependency audit
- Run `npx vite-bundle-visualizer` or add `rollup-plugin-visualizer` to identify other large dependencies beyond Three.js.
- `@floating-ui/dom` and other UI libraries may have lighter alternatives.

### Terser tuning
- Current config uses 2 passes. Increasing to 3-4 passes with aggressive options (`toplevel: true`, `module: true`) may squeeze out a few more KB.
- Enable `mangle.properties` with a regex for private properties (prefixed `_`) to further reduce output.

### Svelte optimization
- Ensure Svelte compiler is in production mode with `hydratable: false` if SSR isn't used.
- Verify `compilerOptions.css: 'injected'` isn't duplicating CSS in JS.

---

## Recommendation

**Replace Three.js with OGL.** This is the best balance of:

1. **Bundle savings**: ~55 KB gzip reduction (84 KB → 29 KB), bringing `app.js` from ~265 KB to ~210 KB gzip — a **21% total bundle reduction**
2. **API similarity**: OGL's scene graph, math, raycasting, and orbit controls map closely to Three.js equivalents
3. **Contained migration**: All changes are isolated to 8 files in `src/core/rendering/`
4. **Custom shader upside**: Writing a Lambert shader (~30 lines GLSL) replaces Three.js's entire material/lighting system, and gives full control over the rendering pipeline
5. **Existing custom animation**: The codebase already does its own keyframe evaluation — Three.js's animation system is minimally used

The `thumbnails.worker.js` (607 KB) would also benefit from the same migration, as it imports `BuildingRenderer` and `ActorRenderer`.

### Risk Assessment

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Visual differences in Lambert shading | Low | Side-by-side comparison during migration |
| Animation playback regressions | Low | Existing keyframe logic is custom; only mixer hookup changes |
| OGL missing edge-case WebGL features | Low | OGL exposes raw WebGL context for fallback |
| Learning curve for shader writing | Low | Lambert is a well-documented, simple shading model |
