# Tech Stack Research: Static Interactive Physics Education Website

> Research compiled March 2026 for a self-contained, static (~50 simulations), no-backend
> interactive physics history site — pure HTML/CSS/JS, dark luxurious visual style.

---

## Table of Contents

1. [Physics Simulation Libraries](#1-physics-simulation-libraries)
2. [Rendering Layers: Canvas API vs WebGL vs SVG](#2-rendering-layers-canvas-api-vs-webgl-vs-svg)
3. [CSS Frameworks and Dark Luxury Styling](#3-css-frameworks-and-dark-luxury-styling)
4. [Animation Libraries](#4-animation-libraries)
5. [How Reference Physics Sites Handle Their Stacks](#5-how-reference-physics-sites-handle-their-stacks)
6. [Build Tools and Bundlers](#6-build-tools-and-bundlers)
7. [What NOT to Use and Why](#7-what-not-to-use-and-why)
8. [Recommended Stack Summary](#8-recommended-stack-summary)
9. [Per-Simulation Decision Guide](#9-per-simulation-decision-guide)

---

## 1. Physics Simulation Libraries

Physics libraries split into two tiers: **engines** (handle rigid body dynamics, collision detection, constraints) and **math/rendering helpers** (give you the tools but you write the physics yourself). For an educational site with 50 varied simulations, you will use both tiers depending on the simulation type.

---

### 1.1 Matter.js — RECOMMENDED for 2D Rigid Body Simulations

| Property | Detail |
|---|---|
| **Current version** | 0.19.0 (npm stable); 0.20.0-alpha on GitHub master |
| **License** | MIT |
| **Size** | ~87 kB minified, ~24 kB gzipped |
| **GitHub stars** | ~17k |

**What it does well:**
- Complete 2D rigid body physics: mass, density, restitution (elastic/inelastic collisions), friction, constraints (springs, hinges, distance joints), gravity, compound bodies, sleeping bodies
- Broad-phase, mid-phase, and narrow-phase collision detection built in
- Stable stacking, conservation of momentum, convex and concave hull bodies
- Ships with a built-in Canvas renderer (`Matter.Render`) adequate for prototyping; for production use a custom renderer drawing on your own canvas
- Touch and mouse support out of the box via `Matter.Mouse` and `Matter.MouseConstraint`
- 40+ interactive demos in the official repository
- Node.js compatible (useful for testing simulations headlessly)

**Weaknesses:**
- Performance degrades with very large numbers of bodies (>500 dynamic bodies at 60fps)
- No built-in soft body, fluid, or cloth simulation
- The built-in renderer (`Matter.Render`) is not suitable for polished production visuals — replace it
- Does not support WebGL natively; you must pair it with PixiJS or Three.js if you want GPU rendering

**Best for:** Newton's cradle, pendulum systems, projectile motion, inclined planes, pulley systems, collision experiments, compound pendulums, Rube Goldberg machines.

---

### 1.2 Planck.js — RECOMMENDED for Precision 2D Physics

| Property | Detail |
|---|---|
| **Current version** | ~1.0.x (TypeScript rewrite of Box2D, actively maintained) |
| **License** | MIT |
| **GitHub stars** | ~5.2k |
| **Language** | TypeScript-first (99.1% TypeScript) |

**What it does well:**
- Direct port of Box2D, the gold standard 2D physics engine used in professional games
- More numerically stable than Matter.js for complex constraint systems
- TypeScript native — full type safety without additional setup
- Joint types: revolute, prismatic, distance, pulley, gear, mouse, weld, friction, rope, motor joints
- Box2D's constraint solver is more robust for educational simulations requiring precise physics (e.g., gear trains, mechanical linkages)
- Active community, Discord support

**Weaknesses:**
- Box2D API conventions (meters as units, not pixels) require a coordinate scaling layer
- Steeper learning curve than Matter.js
- No built-in renderer — you must supply your own Canvas/WebGL rendering

**Best for:** Mechanical linkages, gear systems, multi-joint robotic arms, any simulation where constraint accuracy matters.

---

### 1.3 Rapier (rapier2d / rapier3d via WebAssembly) — BEST PERFORMANCE

| Property | Detail |
|---|---|
| **npm packages** | `@dimforge/rapier2d-compat`, `@dimforge/rapier3d-compat` |
| **Version** | ~0.14.x |
| **License** | Apache 2.0 |
| **Runtime** | WebAssembly (compiled from Rust) |

**What it does well:**
- Written in Rust, compiled to WASM — far faster than any pure-JS physics engine
- Cross-platform determinism: the same simulation produces identical results on any machine (critical for reproducible educational demos)
- SIMD-optimized builds available for browsers that support it
- Both 2D and 3D physics in a single ecosystem
- `-compat` builds embed the .wasm as base64, avoiding WASM fetch/CORS issues on static sites
- Modern API, actively maintained by the dimforge team

**Weaknesses:**
- Async initialization required (WASM must load before physics can run)
- Larger initial bundle size due to WASM
- Less beginner-friendly API than Matter.js
- Fewer browser-side tutorials and community examples than Matter.js

**Best for:** Simulations requiring many bodies, high-fidelity 3D physics (e.g., orbital mechanics, fluid-adjacent particle systems), any simulation where you need deterministic replay.

---

### 1.4 p5.js — RECOMMENDED for Custom/Artistic Simulations

| Property | Detail |
|---|---|
| **Current version** | 2.2.2 (stable, February 2026); p5.js 2.0 is current |
| **License** | LGPL 2.1 |
| **GitHub stars** | ~23.5k |
| **Size** | ~4MB full library; ~800kB minified |

**What it does well:**
- Not a physics engine — it is a creative coding environment. You implement your own physics using vectors and math
- `p5.Vector` class with full vector math (add, sub, dot, cross, normalize, heading, magnitude)
- `deltaTime` built in for frame-rate-independent simulation
- `frameRate()` control, `push()`/`pop()` state stacks
- WebGL rendering mode available for shader-based visuals within the p5 paradigm
- Extremely beginner-friendly — well suited to simulations written from first principles
- Active educational community (Processing Foundation), multilingual docs, 23.5k stars, 24.8k dependent projects

**Weaknesses:**
- Larger library footprint (~800kB minified) adds page weight if used for many simulations
- Not a physics engine: you write all the physics equations yourself (this is actually a *feature* for physics education — students can read the actual equations)
- Slower than raw Canvas for complex particle systems because of function call overhead
- p5.js 2.0 (beta) has breaking API changes from 1.x; pin your version

**Best for:** Wave motion, Lissajous figures, field line visualizations, particle systems (Brownian motion, gas simulation), any simulation where you want the physics equations visible and explicit in the code, historical/artistic reconstructions.

---

### 1.5 Three.js — RECOMMENDED for 3D Visualizations

| Property | Detail |
|---|---|
| **Current version** | r183 (February 2026) |
| **License** | MIT |
| **GitHub stars** | ~111k |
| **Size** | Core ~160kB gzipped (tree-shakeable modules) |

**What it does well:**
- The dominant WebGL abstraction library for 3D in the browser
- WebGL and WebGPU renderers; WebXR support
- Full 3D scene graph: cameras, lights, materials, textures, geometries, shaders
- Add-on library includes OrbitControls, TransformControls, CSS3DRenderer, EffectComposer (post-processing)
- Works with any physics engine for the simulation layer (pair with Rapier3D or cannon-es for physics calculations, use Three.js only for rendering)
- Massive community, 2,037 contributors, extensive documentation and forum

**Weaknesses:**
- No built-in physics — Three.js is a renderer, not a physics engine
- ~2GB full repository clone (shallow clone for development)
- Broad API surface; requires learning its object model for cameras, materials, lighting
- Must manage your own physics-to-render synchronization loop

**Best for:** 3D orbital mechanics (solar system, Kepler's laws), electromagnetic field lines in 3D, wave interference in 3D, special/general relativity visualizations, crystal structure displays, atomic orbital probability clouds.

---

### 1.6 D3.js — RECOMMENDED for Data-Driven and Graph Visualizations

| Property | Detail |
|---|---|
| **Current version** | 7.9.0 (March 2024) |
| **License** | ISC |
| **GitHub stars** | ~113k |
| **Size** | Full ~200kB; individual modules are tree-shakeable |

**What it does well:**
- SVG, Canvas, and HTML rendering — best-in-class for data binding to DOM elements
- `d3-force` module: N-body force simulations, link forces, collision forces, centering — usable directly for network/graph physics
- `d3-scale`, `d3-axis`, `d3-zoom`, `d3-brush` for interactive scientific charts
- Best option for: timeline visualizations, historical data charts, force-directed diagrams

**Weaknesses:**
- Steep learning curve — the data-join mental model takes time to internalize
- SVG-based rendering is slow for >5,000 elements; use Canvas mode for particle systems
- Not a rigid-body physics engine
- Verbose for simple animations compared to GSAP

**Best for:** Historical timelines of physics discoveries, force-directed concept maps, interactive charts of experimental data (blackbody radiation curves, photoelectric effect data), genealogy trees of theories.

---

### 1.7 PixiJS — FOR GPU-ACCELERATED 2D RENDERING (Pair with a physics engine)

| Property | Detail |
|---|---|
| **Current version** | 8.17.1 (March 2026) |
| **License** | MIT |
| **GitHub stars** | ~44k |

**What it does well:**
- Fastest 2D renderer for the browser (WebGL/WebGPU first)
- Sprite batching, texture atlases, blend modes, masks, filters — all GPU-accelerated
- Designed as a pure renderer: pair with Matter.js or Planck.js for physics, PixiJS for visuals
- Far better visual quality than Matter.js's built-in renderer

**Weaknesses:**
- Renderer only, no physics
- Adds weight (~300kB minified) on top of whatever physics library you use
- Overkill for most educational simulations; Canvas 2D API is sufficient for ≤200 dynamic objects

**Best for:** Simulations that need rich particle effects, sprite-based physics visualizations (billiard balls with texture, planetary surfaces), any sim where you need GPU filters (glow, blur, color correction).

---

## 2. Rendering Layers: Canvas API vs WebGL vs SVG

Understanding which rendering primitive to use per simulation type is critical for performance and quality.

### Canvas 2D API (Built-in, Zero Dependencies)

**Use when:**
- Fewer than ~500 moving objects
- 2D only
- You want zero dependencies for that simulation
- You are pairing with Matter.js or Planck.js (they output positions, you draw)

**Performance ceiling:** ~500-1,000 dynamic objects at 60fps on modern hardware.

**How to use:**
```js
const ctx = canvas.getContext('2d');
// requestAnimationFrame loop
// ctx.clearRect, ctx.fillStyle, ctx.arc, ctx.strokeStyle, ctx.lineTo, etc.
```

### WebGL (via Three.js, PixiJS, or OGL)

**Use when:**
- 3D visualizations required
- >1,000 particles needed
- Shader effects required (glow, field lines, plasma)
- You need GPU compute for visualization (not physics)

**Avoid raw WebGL** unless you are building a shader effect with < 200 lines. The abstraction cost of Three.js is worth it in every realistic scenario.

### SVG

**Use when:**
- Static diagrams that must be resolution-independent
- Interactive charts (with D3.js)
- Historical apparatus diagrams
- Crisp iconography at any DPI

**Avoid SVG for animation** with >100 elements — DOM manipulation overhead makes it noticeably slower than Canvas.

### OGL (Alternative to Three.js)

| Property | Detail |
|---|---|
| **Version** | Active, MIT |
| **Size** | ~29kB minzipped (vs Three.js ~160kB gzipped) |

A minimal WebGL library with a Three.js-like API. Use OGL if you need a lightweight WebGL abstraction for one or two simulations and don't want Three.js's full weight. Suitable for developers comfortable writing custom shaders.

---

## 3. CSS Frameworks and Dark Luxury Styling

### 3.1 Tailwind CSS v4 — PRIMARY RECOMMENDATION

| Property | Detail |
|---|---|
| **Current version** | 4.2 |
| **License** | MIT |
| **Production CSS size** | <10kB for most projects |

**Why it fits this project:**
- Dark mode is first-class with the `dark:` prefix variant
- Native support for `oklch` colors, `color-mix()`, wide-gamut P3 colors — essential for a rich, vibrant dark palette
- Backdrop blur (`backdrop-blur-*`), filters, 3D transforms, arbitrary values (`[value]` syntax)
- CSS variables and `@theme` directive for a design token system
- No JS runtime — pure generated CSS
- 6.4x faster render time than v3, 4.2x frame rate improvement (v4 engine)
- Container queries, cascade layers, logical properties built in

**Recommended Tailwind v4 dark theme approach:**
```css
@theme {
  --color-void: oklch(0.08 0.02 285);        /* near-black background */
  --color-deep: oklch(0.12 0.03 285);        /* card backgrounds */
  --color-gold: oklch(0.78 0.18 82);         /* accent color */
  --color-plasma: oklch(0.72 0.25 310);      /* highlight color */
  --font-display: "Cormorant Garamond", serif;
  --font-mono: "JetBrains Mono", monospace;
}
```

**Avoid:** Using Tailwind for Canvas/WebGL simulation containers — those elements manage their own rendering pipeline.

---

### 3.2 Open Props v1 — DESIGN TOKEN SYSTEM (Use alongside or instead of Tailwind)

| Property | Detail |
|---|---|
| **Current version** | 1.7.20 |
| **License** | MIT |
| **Size** | 4.0 kB (minified + Brotli) |

500+ CSS custom properties (design tokens): colors (228 variants), typography, animations, shadows, gradients, easing curves, sizes.

**Why use it:**
- Provides a complete `oklch`-based color system with consistent dark/light ladder
- Shadow system with adjustable hue and saturation — excellent for making simulation cards feel elevated
- Pre-built animation easings as CSS custom properties (`var(--ease-spring-3)`)
- Works perfectly alongside Tailwind (use Open Props tokens as Tailwind theme values)
- Non-prescriptive — just variables, no utility classes

---

### 3.3 CSS Architecture Approach

For a dark, luxurious, visually rich static site with interactive simulations, the recommended CSS architecture is:

**Layer 1 — Reset/Normalize:** Use a modern CSS reset (Andy Bell's `reset.css` or `@layer base` in Tailwind). Skip the old `normalize.css` — it was designed for IE compatibility which is no longer relevant.

**Layer 2 — Design Tokens:** `@theme` in Tailwind v4 or a dedicated `tokens.css` file with CSS custom properties. Define all colors in `oklch`, spacing in `rem`, and type scales using `clamp()` for fluid typography.

**Layer 3 — Layout:** CSS Grid for page structure, Flexbox for component internals. Every simulation lives in an `<article>` with `aspect-ratio` set to maintain proportions.

**Layer 4 — Simulation Containers:** Each `<canvas>` or `<div>` hosting a simulation should use `contain: layout paint;` to isolate repaints. Use `will-change: transform` on elements that animate with GSAP.

**Dark Luxury Palette Principles:**
- Background: `oklch(0.06–0.12 0.02 285)` (near-black with a subtle blue-violet cast)
- Primary text: `oklch(0.92 0.01 100)` (warm off-white, never pure #fff)
- Accent: Single saturated oklch color (gold/amber or plasma-blue) for interactive highlights
- Use `box-shadow` with color (not just opacity) for glow effects: `0 0 40px oklch(0.72 0.25 310 / 0.4)`
- Glassmorphism for panels: `backdrop-filter: blur(12px); background: oklch(0.15 0.03 285 / 0.7);`

**Typography Stack:**
- Display: `Cormorant Garamond` (Google Fonts, free) — editorial, historical gravitas
- Body: `Inter` or `DM Sans` — readable at small sizes
- Mono (for equations/code): `JetBrains Mono` or `Fira Code`
- Math rendering: Use **KaTeX** (not MathJax) — KaTeX is synchronous, fast, and does not reflow the page

---

### 3.4 What NOT to Use for Styling

| Library | Why to Avoid |
|---|---|
| **Bootstrap 5** | Opinionated component system fights a custom luxury aesthetic; dark mode requires additional configuration; produces predictable "Bootstrap look" |
| **Material UI / MUI** | React-only; completely wrong aesthetic register (Google's material design language) |
| **Bulma** | Lacks dark mode primitives; color system is not oklch-based |
| **Foundation** | Largely dead community; no significant updates since 2020 |
| **Sass/SCSS** | Not needed when Tailwind v4 + CSS custom properties cover all use cases natively |

---

## 4. Animation Libraries

### 4.1 GSAP 3 — PRIMARY ANIMATION LIBRARY

| Property | Detail |
|---|---|
| **Current version** | 3.14.2 |
| **License** | Free for all use (as of Webflow acquisition) |
| **Size** | Core ~23kB minzipped; full bundle with plugins ~60-80kB |

**Why GSAP is the right choice:**
- Framework-agnostic: works with vanilla JS, no framework required
- Animates any numeric CSS property, SVG attribute, Canvas draw call, or arbitrary JS object property
- `ScrollTrigger` plugin: trigger simulation start/stop/scrub based on scroll position — essential for a long-form educational site
- `Timeline` API: sequence explanatory animations with precise timing control
- `SplitText` plugin: character-level text animations for dramatic section reveals
- `DrawSVG`: animate SVG path drawing (ideal for showing historical apparatus diagrams)
- `MotionPath`: move elements along a curve (pendulum arcs, orbital paths)
- Consistent cross-browser behavior, battle-tested performance
- `gsap.matchMedia()` for accessibility (respects `prefers-reduced-motion`)

**Core patterns for this project:**
```js
// Scroll-triggered simulation activation
ScrollTrigger.create({
  trigger: '#pendulum-section',
  start: 'top 60%',
  onEnter: () => startSimulation('pendulum'),
  onLeaveBack: () => pauseSimulation('pendulum'),
});

// Section reveal animation
gsap.timeline({ scrollTrigger: { trigger: '.physics-card', start: 'top 80%' }})
  .from('.physics-card', { opacity: 0, y: 60, stagger: 0.1, duration: 0.8, ease: 'power3.out' });
```

---

### 4.2 Anime.js v4 — LIGHTWEIGHT ALTERNATIVE

| Property | Detail |
|---|---|
| **Current version** | 4.0.0 |
| **License** | MIT |
| **Size** | 24.5 kB total bundle |

**When to use instead of GSAP:**
- For individual simulation UI elements where you want a lightweight solution
- Spring physics in the draggable API
- SVG shape morphing within a simulation's UI chrome
- Scroll observer for simple entrance animations

**When GSAP is still better:**
- ScrollTrigger's scrubbing capabilities have no equivalent in Anime.js
- GSAP's Timeline API is more powerful for complex choreography
- GSAP's plugin ecosystem (DrawSVG, SplitText, MotionPath) has no Anime.js equivalent

**Verdict:** Use GSAP as your primary animation system. Anime.js is a valid fallback if bundle size for a specific page is a concern.

---

### 4.3 Motion (formerly Framer Motion) — DO NOT USE

Motion v11+ is primarily a React animation library. While it has vanilla JS capabilities, the documentation and ecosystem are React-centric. For a pure HTML/CSS/JS static site, there is no advantage over GSAP.

---

### 4.4 Tween.js v23 — FOR SPECIFIC INTERPOLATION USE CASES

| Property | Detail |
|---|---|
| **Current version** | 23.1.3 |
| **npm** | `@tweenjs/tween.js` |

Tween.js is minimal (numeric interpolation only, no DOM awareness). Useful if you need a lightweight tweening utility inside a simulation's own animation loop without loading GSAP. It does not manage CSS units or colors — you bring your own render loop. For most use cases, GSAP is preferable.

---

### 4.5 CSS Animations (Native)

For simple, state-based transitions (hover effects, panel reveals, loading states), native CSS transitions and `@keyframes` are always preferable to a JS library. They run on the compositor thread and cannot be blocked by JS.

Patterns to use:
- `transition: opacity 0.3s ease, transform 0.4s cubic-bezier(0.4,0,0.2,1)`
- `@keyframes` for looping animations (particle orbits in decorative backgrounds, loading indicators)
- `animation-play-state: paused/running` controlled by JS class toggling

---

## 5. How Reference Physics Sites Handle Their Stacks

### 5.1 PhET Interactive Simulations (phet.colorado.edu)

PhET is the gold standard for interactive physics education. Their stack:

- **Simulation runtime:** HTML5 (JavaScript). All modern simulations are pure HTML5/JS. Legacy simulations (pre-2014) were Java or Flash.
- **Custom framework:** PhET uses internally developed frameworks: **Scenery** (scene graph), **Axon** (reactive data model/observables), **Kite** (geometry), **Dot** (math), and **Chipper** (build tooling). These are not publicly distributed libraries — they are part of the PhET "sim framework" monorepo.
- **Site infrastructure:** The phet.colorado.edu website runs on Meteor 3.4 with React for the frontend. Individual simulations are self-contained HTML5 packages.
- **Key takeaway:** PhET chose to build their own scene graph and reactive system because no existing library met their accessibility, performance, and cross-platform requirements. For a ~50-simulation history site, you do not need a custom framework — but PhET's architecture validates the "self-contained simulation module" pattern (each simulation is an isolated HTML5 bundle).

### 5.2 Paul Falstad's Math/Physics Applets (falstad.com)

- **Original stack:** Java applets (JVM)
- **Current stack:** Converted to JavaScript — mostly vanilla JS with Canvas 2D API
- **Approach:** Each simulation is a single self-contained JS file. Falstad's simulations compute physics manually (he writes the differential equations directly, not using a physics engine library). This is the "write-your-own-physics" approach.
- **Some simulations use WebGL** for field visualizations (e.g., hydrogen orbital applets)
- **Key takeaway:** Falstad's simulations run extremely well with zero dependencies. For historical physics (Maxwell's equations, Schrödinger equation) where you want to show the actual mathematics, writing the physics by hand (optionally with p5.js for the drawing layer) is a valid and educationally superior approach.

### 5.3 Walter Fendt's Physics Applets (walter-fendt.de)

- Converted from Java to HTML5 Canvas + vanilla JS
- Each simulation is a single self-contained file
- Uses `requestAnimationFrame` loops with Euler integration for simple mechanics

### 5.4 oPhysics (ophysics.com)

- Built on plain HTML/CSS + JavaScript
- Uses Chart.js for graph overlays
- Canvas API for 2D simulations
- No heavy framework

### 5.5 MyPhysicsLab (myphysicslab.com)

- Custom JavaScript physics engine (written by Erik Neumann)
- Uses TypeScript compiled to JS
- Canvas-based rendering
- Serves as an example of a "hand-rolled" physics engine designed specifically for educational simulation

**Common pattern across all reference sites:**
1. Each simulation is a self-contained module (HTML + JS)
2. Physics computation and rendering are separated
3. No React/Vue/Angular — pure DOM manipulation or Canvas
4. Simulations lazy-load when they enter the viewport
5. Mobile fallback (touch events alongside mouse events)

---

## 6. Build Tools and Bundlers

### 6.1 Vite 8 — RECOMMENDED

| Property | Detail |
|---|---|
| **Current version** | 8.0.1 |
| **License** | MIT |
| **GitHub stars** | ~75k |
| **Weekly npm downloads** | ~40 million |

**Why Vite for a static physics site:**
- Instant dev server with native ES module serving (no bundling during development)
- HMR (Hot Module Replacement) works with vanilla JS — edit a simulation file and see changes immediately
- Production build uses Rolldown (Rollup successor) with tree-shaking, code splitting, and minification
- Built-in support for: TypeScript, WebAssembly (needed for Rapier), Web Workers (physics off main thread), CSS Modules
- Static site output: `vite build` generates optimized HTML/CSS/JS in `dist/`
- Multi-page app support: define multiple HTML entry points in `vite.config.js` — one per simulation

**Recommended `vite.config.js` structure for 50 simulations:**
```js
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        // Each simulation is its own entry point
        'sim-pendulum': 'simulations/pendulum/index.html',
        'sim-projectile': 'simulations/projectile/index.html',
        // ... etc
      },
    },
    chunkSizeWarningLimit: 500,
  },
});
```

**For truly static deployment (no build step):** Vite is still recommended during development. The `dist/` output is pure static files deployable to any CDN, GitHub Pages, Netlify, S3, etc.

---

### 6.2 Vanilla JS (No Build Tool) — VALID FOR SIMPLE ARCHITECTURES

If each simulation is a genuinely self-contained `.html` file (like Falstad's approach), you can ship raw HTML/JS/CSS with zero build tooling. This has real advantages:

- Zero configuration, zero dependencies to maintain
- Each simulation page works as a standalone URL
- No build step means no build failures
- Easy for contributors to edit and test

**When vanilla-with-no-build works:** If simulations load their libraries from a local `vendor/` directory (self-hosted copies of Matter.js, p5.js, etc.) and each simulation is a single HTML file.

**When you need Vite:** When simulations share significant amounts of code (a shared physics utilities module, a shared UI chrome library, shared Tailwind styles), you need a bundler to avoid duplication across 50 HTML files.

**Recommendation:** Use Vite for the site framework and shared UI code. Treat each simulation as a module imported into a simulation container. This gives the benefits of both approaches.

---

### 6.3 What NOT to Use

| Tool | Why to Avoid |
|---|---|
| **Webpack 5** | Configuration complexity is not justified for a static site; Vite is faster in every metric and simpler to configure |
| **Parcel 2** | Good zero-config experience but less flexible for multi-page apps with unusual module types (WASM, Web Workers); timed out in testing |
| **Rollup directly** | Rollup is the engine inside Vite; use Vite's abstraction instead |
| **Grunt / Gulp** | Dated task-runner paradigm; no module graph awareness; abandoned by the community |
| **Create React App** | React is not needed; CRA is deprecated even for React projects |
| **Next.js / Nuxt** | Server-side frameworks — fundamentally wrong for a pure static site with no backend |
| **esbuild directly** | Very fast but lacks the plugin ecosystem for CSS processing and WASM; use as a sub-tool inside Vite, not standalone |

---

## 7. What NOT to Use and Why

### 7.1 Dead or Unmaintained Physics Libraries

| Library | Status | Why to Avoid |
|---|---|---|
| **cannon.js** | Last release: v0.6.2 (March 2015) — 11 years abandoned | Do not use. Use `cannon-es` (the maintained fork) if you specifically need its API, or Rapier for new 3D physics |
| **PhysicsJS** | Archived December 2019; v0.7.0 beta, never left beta | Creator explicitly recommends Matter.js as the replacement |
| **Raphael.js** | 404 on GitHub; last meaningful update ~2018 | SVG library superseded by D3.js and direct SVG manipulation |
| **Box2Dweb** | No updates since 2011 | Superseded by Planck.js (which is Box2D rewritten in modern JS/TS) |

### 7.2 Wrong Tool for the Job

| Library/Tool | Why Not for This Project |
|---|---|
| **React / Vue / Angular** | A JS framework adds ~100kB+ and a component lifecycle model that fights the "self-contained simulation" pattern. 50 simulations do not need virtual DOM diffing. |
| **Framer Motion / Motion** | React-centric; no meaningful advantage over GSAP for vanilla JS animation |
| **jQuery** | DOM manipulation utility from 2006. Everything jQuery does, modern vanilla JS does without a library. Its presence would be incongruous on a modern site. |
| **Babylon.js** | Excellent 3D engine (v8.56.1) with integrated Havok physics, but it is a full game engine at ~500kB gzipped. Overkill for a site where most simulations are 2D. Use Three.js + Rapier3D for any 3D simulations that need physics. |
| **MathJax** | Correct tool for LaTeX rendering but causes page reflow during async render. Use **KaTeX** instead — it is synchronous, 10x faster, and produces identical output |
| **Socket.io / any WebSocket library** | No backend = no real-time server communication. Static site simulations are self-contained. |
| **Web Workers with heavy libraries** | While Web Workers are valid for heavy physics (Rapier runs well in a Worker), offloading Matter.js to a Worker and messaging positions back to the main thread every frame adds complexity that only pays off for >300 bodies |

### 7.3 WebGL Pitfalls

- **Do not write raw GLSL shaders for every visualization.** Raw WebGL requires 200+ lines of boilerplate for a spinning cube. Use Three.js or OGL.
- **Do not use WebGL for 2D rigid body simulations.** Canvas 2D API is sufficient and far simpler. Save WebGL for 3D or shader-based effects.
- **Do not mix Three.js r122 (or older) with modern bundlers.** The modular import system changed significantly after r122. Always use the current r183 with `import { ... } from 'three'`.

---

## 8. Recommended Stack Summary

### Core Stack

| Layer | Choice | Version | Notes |
|---|---|---|---|
| **2D Physics (rigid body)** | Matter.js | 0.19.0 | For most 2D collision/constraint simulations |
| **2D Physics (precision)** | Planck.js | ~1.x | For mechanical linkages, gear systems |
| **3D / High-performance Physics** | Rapier (`@dimforge/rapier2d-compat` / `rapier3d-compat`) | ~0.14.x | WASM, deterministic, fastest option |
| **Custom/Creative Simulations** | p5.js | 2.2.2 | For write-your-own-physics simulations |
| **3D Rendering** | Three.js | r183 | For any 3D visualization |
| **2D Data Visualizations / Charts** | D3.js | 7.9.0 | For data-driven SVG/Canvas charts |
| **High-perf 2D Rendering** | PixiJS | 8.17.1 | Only if Canvas 2D is too slow for a simulation |
| **CSS Framework** | Tailwind CSS | v4.2 | Dark mode, oklch colors, utility-first |
| **Design Tokens** | Open Props | 1.7.20 | CSS custom properties, shadow/easing system |
| **Animation** | GSAP | 3.14.2 | Scroll triggers, timelines, DOM animation |
| **Math Rendering** | KaTeX | latest | Synchronous LaTeX rendering, no reflow |
| **Build Tool** | Vite | 8.0.1 | Multi-page, WASM support, fast dev server |

### Fonts (Google Fonts — free, self-hostable)
- Display/Headers: `Cormorant Garamond` (weight 300, 400, 600, 700 italic) — historical gravitas
- Body: `DM Sans` or `Inter` — clean, readable
- Monospace/Equations: `JetBrains Mono`

### Dependencies to Self-Host
For a truly self-contained static site (no CDN dependencies):
1. Download and commit all library files to a `vendor/` or `public/libs/` directory
2. Or use Vite to bundle them into `dist/` at build time
3. Do NOT rely on `unpkg.com` or `cdnjs.com` — CDN outages break the site

---

## 9. Per-Simulation Decision Guide

| Simulation Type | Physics Library | Renderer | Notes |
|---|---|---|---|
| Pendulum (single, double, coupled) | Matter.js or Planck.js | Canvas 2D | Write own for triple+ pendulum (chaos) |
| Projectile motion | Vanilla math (no library) | Canvas 2D | F=ma is 5 lines of JS |
| Elastic/inelastic collisions | Matter.js | Canvas 2D | Use `restitution` property |
| Inclined planes, friction | Matter.js | Canvas 2D | Use constraints for wedge |
| Spring-mass systems | Matter.js (constraints) or Planck.js | Canvas 2D | |
| Planetary orbits / Kepler | Vanilla math (Euler or Runge-Kutta) | Canvas 2D or Three.js | DO NOT use a rigid body engine for orbits |
| Solar system (3D) | Rapier3D or vanilla math | Three.js | Rapier for N-body realism |
| Wave motion (1D, 2D) | Vanilla math (wave equation) | Canvas 2D | p5.js draws well here |
| Wave interference, diffraction | Vanilla math | Canvas 2D with `imageData` pixel ops | |
| Brownian motion / gas | p5.js (custom) or Matter.js | Canvas 2D | p5.js shows the code more elegantly |
| Electric field lines (2D) | Vanilla math (Coulomb's law) | Canvas 2D or D3.js SVG | SVG for export quality |
| Magnetic fields (3D) | Vanilla math | Three.js (ArrowHelper, Line) | |
| Electromagnetic waves | Three.js + custom shader | Three.js (WebGL) | Oscillating E/B field visualization |
| Blackbody radiation curve | D3.js | SVG | Interactive slider for temperature |
| Photoelectric effect | Canvas 2D + GSAP | Canvas 2D | Photon particle animation |
| Rutherford scattering | Vanilla math | Canvas 2D | Alpha particle trajectory simulation |
| Quantum wave function | Vanilla math (Schrödinger TDSE) | Canvas 2D with `imageData` | Complex number visualization |
| Hydrogen orbital (3D) | Vanilla math | Three.js + custom shader (WebGL) | Probability cloud as particle system |
| Interference fringes | Vanilla math | Canvas 2D with `imageData` | Direct pixel manipulation |
| Special relativity (spacetime) | Vanilla math (Lorentz transforms) | D3.js SVG | Minkowski diagram |
| Crystal lattice structures | Three.js | Three.js (WebGL) | Instanced mesh for performance |
| Mechanical linkages | Planck.js | Canvas 2D | Box2D constraints excel here |
| Gear trains | Planck.js | Canvas 2D | Gear joint type |
| Fluid simulation (approximate) | p5.js (Navier-Stokes simplified) | Canvas 2D | Full CFD is too heavy; use Jos Stam's method |
| Historical data charts | D3.js | SVG | Timeline, scatter plots |
| Interactive equation explorer | KaTeX + GSAP | DOM + SVG | Slider adjusts variables, KaTeX re-renders |

---

*Research compiled from: Matter.js GitHub (liabru/matter-js), p5.js GitHub (processing/p5.js), Three.js GitHub (mrdoob/three.js, r183), D3.js GitHub (d3/d3, v7.9.0), GSAP docs (gsap.com, v3.14.2), Anime.js (animejs.com, v4.0.0), Tailwind CSS (tailwindcss.com, v4.2), Open Props (open-props.style, v1.7.20), Vite (vite.dev, v8.0.1), Planck.js (shakiba/planck.js), Rapier (dimforge/rapier.js), PixiJS (pixijs/pixijs, v8.17.1), PhET Interactive Simulations (phet.colorado.edu), Paul Falstad's applets (falstad.com), cannon-es (pmndrs/cannon-es, v0.20.0), OGL (oframe/ogl), WebGL MDN documentation, KaTeX, Tween.js (v23.1.3). March 2026.*
