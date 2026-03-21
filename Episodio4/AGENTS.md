# AGENTS.md — How Physics Works

*Project context for Cascade and other AI agents working on this codebase.*

---

## Current Phase

**Milestone:** v2.0 — Full Spectrum
**Phase:** 6.1 — Episodio4 Article — Learnship Behind the Scenes
**Status:** planning
**Last updated:** 2026-03-21

---

## Project Overview

"How Physics Works" is a static educational website: 50 interactive physics stops covering
the history of physics from Thales (~600 BCE) to contemporary frontiers. Each stop is a
self-contained HTML page with a narrative essay and a Canvas-based interactive simulation.

**No backend. No build step. Pure HTML/CSS/JS served by any static host.**

---

## Output Directory

**All site code lives in `Episodio4/`.** Planning lives in `.planning/`.

```
Episodio4/
├── index.html                      ← Landing page
├── .nojekyll                       ← GitHub Pages: disable Jekyll
├── assets/
│   ├── css/
│   │   ├── base.css                ← Design tokens, reset, typography, @font-face
│   │   ├── components.css          ← Cards, era timeline, nav, buttons
│   │   └── simulation.css          ← Stop page layout, sim container, controls
│   ├── data/
│   │   └── stops.json              ← Single source of truth: all 50 stops
│   ├── fonts/                      ← Self-hosted WOFF2: Cormorant Garamond + DM Sans
│   ├── js/
│   │   ├── nav.js                  ← Landing page: renders card grid from stops.json
│   │   ├── progress.js             ← localStorage visited-stop tracking
│   │   ├── stop-shell.js           ← Per-stop: breadcrumb, nav, SimAPI wiring
│   │   └── vendor/
│   │       ├── p5.min.js           ← p5.js v1.9.4 (reserved for future sims)
│   │       └── matter.min.js       ← Matter.js v0.19.0 (reserved for future sims)
│   └── img/                        ← (thumbnails, era banners — Phase 5/v2.0)
└── stops/
    ├── 001-thales-natural-causes/
    │   ├── index.html
    │   └── sim.js                  ← window.SimAPI = { start, pause, reset, destroy }
    ├── 002-pythagoras-harmony/
    │   └── index.html              ← Stub (placeholder sim slot)
    └── ... (50 total stop directories)
```

---

## Key Architectural Rules

### SimAPI Contract
Every `sim.js` MUST expose:
```js
window.SimAPI = { start, pause, reset, destroy }
```
`stop-shell.js` calls these. Do not change this interface without updating `stop-shell.js`.

### Stop Page HTML Contract
Every stop `index.html` MUST have these elements with these exact IDs/classes:
- `<script id="stop-config" type="application/json">` — stop metadata JSON
- `#stop-breadcrumb` — populated by stop-shell.js
- `#stop-counter` — populated by stop-shell.js
- `#sim-mount` — IntersectionObserver target; canvas created inside by sim.js
- `#sim-play-btn` — wired by stop-shell.js → SimAPI.start/pause
- `#sim-reset-btn` — wired by stop-shell.js → SimAPI.reset
- `.sim-caption__dot` — animated by stop-shell.js (is-running class)
- `#stop-nav` — populated by stop-shell.js with prev/next links

### Script load order on stop pages (MUST follow this order):
```html
<script src="../../assets/js/progress.js"></script>
<script src="../../assets/js/stop-shell.js"></script>
<script src="sim.js"></script>  <!-- omit on stub pages -->
```

### stops.json is the single source of truth
When adding or modifying a stop:
1. Update `stops.json` first
2. Create/update the stop directory and `index.html`
3. Ensure the `id` field in stops.json exactly matches the directory name
4. Ensure `prev`/`next` chain remains unbroken (verify: `stops[i].next === stops[i+1].id`)

### Era colors via data-era attribute
Apply era to the `.stop-page.container` element:
```html
<main class="stop-page container" data-era="ancient">
```
Valid values: `ancient`, `revolution`, `classical`, `modern`, `contemporary`

---

## Development

```bash
# Serve locally
python3 -m http.server 8765 --directory Episodio4
# Open: http://localhost:8765
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| HTML | Plain HTML5 | No template engine |
| CSS | CSS4 (oklch, clamp, custom properties) | No preprocessor |
| JS | ES5 IIFEs | No bundler, no TypeScript |
| Simulations | Vanilla Canvas 2D | p5.js/Matter.js available but not yet used |
| Physics integration | Euler (simple) / RK4 (orbital, pendulum) | See DECISIONS.md DEC-006 |
| Fonts | Cormorant Garamond + DM Sans | Self-hosted WOFF2 |
| Hosting | GitHub Pages | .nojekyll present |

---

## Simulation Physics Patterns

### Euler integration (simple sims)
```js
vel += acc * dt;
pos += vel * dt;
```
Use for: free fall, buoyancy settling, inclined plane, block friction.

### RK4 integration (orbital/pendulum)
```js
function rk4Step(dt) {
  function accel(p, v) { /* return acceleration */ }
  var k1v = vel, k1a = accel(pos, vel);
  var k2v = vel + 0.5*dt*k1a, k2a = accel(pos + 0.5*dt*k1v, k2v);
  var k3v = vel + 0.5*dt*k2a, k3a = accel(pos + 0.5*dt*k2v, k3v);
  var k4v = vel + dt*k3a,     k4a = accel(pos + dt*k3v,     k4v);
  pos += (dt/6)*(k1v + 2*k2v + 2*k3v + k4v);
  vel += (dt/6)*(k1a + 2*k2a + 2*k3a + k4a);
}
```
Use for: pendulum, Kepler orbit, Newton's cannon.

### RAF loop pattern
```js
var lastTs = null;
function loop(ts) {
  if (!running) return;
  if (!lastTs) lastTs = ts;
  var dt = Math.min((ts - lastTs) / 1000, 0.05); // ALWAYS cap dt
  lastTs = ts;
  update(dt);
  draw();
  rafId = requestAnimationFrame(loop);
}
```

---

## Planning Artifacts

All in `.planning/`:
- `PROJECT.md` — project vision and milestone history
- `ROADMAP.md` — completed milestones + v2.0 candidates
- `STATE.md` — current milestone status, accumulated context, milestone history
- `DECISIONS.md` — 10 architectural decisions with context and consequences
- `milestones/v1.0-ROADMAP.md` — archived v1.0 full phase roadmap
- `milestones/v1.0-REQUIREMENTS.md` — archived v1.0 requirements
- `research/` — ARCHITECTURE.md, FEATURES.md, STACK.md, PITFALLS.md
- `phases/` — per-phase CONTEXT.md, RESEARCH.md, PLAN.md, SUMMARY.md, VERIFICATION.md
