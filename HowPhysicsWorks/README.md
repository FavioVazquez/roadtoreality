# How Physics Works

An interactive history of physics — 50 stops from Thales (~600 BCE) to the contemporary frontiers. Each stop is a self-contained page with a narrative essay and a Canvas-based interactive simulation.

**Live site:** [roadtoreality.dev](https://roadtoreality.dev/HowPhysicsWorks)

---

## Local Development

The site requires a local HTTP server because `fetch()` is blocked on `file://` URLs.

```bash
# From the repository root
python3 -m http.server 8765 --directory HowPhysicsWorks

# Then open:
# http://localhost:8765
```

That's it. No build step, no npm install, no dependencies to resolve.

---

## Adding a New Stop

Each stop is a directory under `stops/` containing `index.html` and (for implemented stops) `sim.js`.

**Step 1 — Update `stops.json`**

Open `assets/data/stops.json` and find the stop entry. Set `"isStub": false`. Verify that the `prev`/`next` chain remains unbroken:

```bash
python3 -c "
import json
d = json.load(open('assets/data/stops.json'))
s = d['stops']
assert s[0]['prev'] is None
assert s[-1]['next'] is None
for i in range(len(s)-1):
    assert s[i]['next'] == s[i+1]['id'], f'broken at {i}: {s[i][\"id\"]}'
print('Chain OK —', len(s), 'stops')
"
```

**Step 2 — Upgrade the stop's `index.html`**

Replace the `<div class="sim-placeholder">` block with the full simulation controls structure:

```html
<div class="sim-container" id="sim-mount" style="min-height:400px;"
     aria-label="Interactive: [brief description]">
  <noscript><div class="sim-placeholder"><div class="sim-placeholder__text">
    Simulation requires JavaScript</div></div></noscript>
</div>
<div class="sim-controls">
  <div class="sim-control">
    <label class="sim-control__label" for="my-slider">
      Label <span class="sim-control__value" id="my-val">default</span>
    </label>
    <input type="range" id="my-slider" min="0" max="100" step="1" value="50"
           aria-label="Describe what this controls">
  </div>
  <div class="sim-actions">
    <button class="sim-btn sim-btn-play" id="sim-play-btn" data-state="paused">▶ Play</button>
    <button class="sim-btn sim-btn-reset" id="sim-reset-btn">↺ Reset</button>
  </div>
</div>
<div class="sim-caption">
  <div class="sim-caption__dot"></div>
  <span id="sim-status">Caption text here.</span>
</div>
```

Add `.stop-body`, `.takeaway-box`, and `.stop-bridge` sections with narrative content.

**Step 3 — Write `sim.js`**

Every `sim.js` must expose:

```js
window.SimAPI = { start, pause, reset, destroy }
```

Use the IIFE pattern with vanilla Canvas 2D. See any existing `sim.js` for the full template. Key rules:
- Always clamp dt: `var dt = Math.min((ts - lastTs) / 1000, 0.05)`
- Size canvas from the mount element: `var rect = mount.getBoundingClientRect()`
- Set `window.SimAPI` synchronously (not inside async callbacks)
- Add `window.addEventListener('resize', resize)` for responsiveness

**Step 4 — Add the script tag**

At the bottom of `index.html`, the load order must be:

```html
<script src="../../assets/js/progress.js"></script>
<script src="../../assets/js/stop-shell.js"></script>
<script src="sim.js"></script>
```

**Step 5 — Test**

```bash
# Verify the stop loads
curl -s http://localhost:8765/stops/YOUR-STOP-ID/index.html | grep -c "sim-mount"
# Should return 1

# Navigate to the stop in the browser and verify:
# - Breadcrumb renders with correct era and title
# - Play button triggers the simulation
# - Reset button resets to initial state
# - Prev/next links navigate correctly
# - Mobile layout works at 375px width
```

---

## Project Structure

```
HowPhysicsWorks/
├── index.html                      ← Landing page
├── .nojekyll                       ← Disables Jekyll on GitHub Pages
├── README.md                       ← This file
├── AGENTS.md                       ← Context for AI agents working on this project
├── assets/
│   ├── css/
│   │   ├── base.css                ← Design tokens, reset, typography, @font-face
│   │   ├── components.css          ← Era timeline, stop cards, breadcrumb, buttons
│   │   └── simulation.css          ← Stop page layout, sim container, controls
│   ├── data/
│   │   └── stops.json              ← Single source of truth: all 50 stops
│   ├── fonts/
│   │   ├── CormorantGaramond-*.woff2
│   │   └── DMSans-*.woff2
│   ├── js/
│   │   ├── nav.js                  ← Renders card grid from stops.json
│   │   ├── progress.js             ← localStorage visited-stop tracking
│   │   ├── search.js               ← Fuse.js fuzzy search modal (Cmd/Ctrl+K)
│   │   ├── stop-shell.js           ← Per-stop: breadcrumb, nav, SimAPI wiring
│   │   └── vendor/
│   │       ├── fuse.min.js         ← Fuse.js v7 (client-side search)
│   │       ├── p5.min.js           ← p5.js v1.9.4 (available for future sims)
│   │       └── matter.min.js       ← Matter.js v0.19.0 (available for future sims)
│   └── katex/                      ← Self-hosted KaTeX (math rendering)
│       ├── katex.min.css
│       ├── katex.min.js
│       ├── auto-render.min.js
│       └── fonts/
└── stops/
    ├── 001-thales-natural-causes/  ← 25 stops have full sim.js (stops 001–026)
    │   ├── index.html
    │   └── sim.js
    ├── 027-planck-blackbody/       ← Stops 027–050: HTML shell, sim coming in later phases
    │   └── index.html
    └── ... (50 total)
```

---

## Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| HTML | Plain HTML5 | No template engine |
| CSS | CSS4 — oklch, clamp(), custom properties | No preprocessor |
| JavaScript | ES5 IIFEs | No bundler, no TypeScript |
| Simulations | Vanilla Canvas 2D | p5.js/Matter.js vendored, available for future sims |
| Math rendering | KaTeX (auto-render) | Self-hosted; `\(...\)` for inline, `$$...$$` for display |
| Search | Fuse.js (fuzzy) | Client-side full-text search across all 50 stops |
| Physics — simple | Euler integration | Free fall, buoyancy, friction |
| Physics — orbital/pendulum | RK4 integration | Kepler, Newton cannon, pendulum |
| Display font | Cormorant Garamond | Self-hosted WOFF2, 4 weights |
| Body font | DM Sans | Self-hosted WOFF2, 2 weights |
| Hosting | GitHub Pages | Zero configuration required |

---

## Deploying to GitHub Pages

**Option A — Subdirectory deploy (recommended)**

1. Push to `main` branch
2. Go to repository Settings → Pages
3. Source: **Deploy from a branch**
4. Branch: `main`, folder: `/HowPhysicsWorks`
5. Save — site will be live at `https://username.github.io/repo/`

**Option B — gh-pages branch**

```bash
# From repository root
git subtree push --prefix HowPhysicsWorks origin gh-pages
```

The `.nojekyll` file at `HowPhysicsWorks/` root ensures GitHub Pages serves the HTML directly without Jekyll processing.

---

## Design System Quick Reference

### Era colors (CSS custom properties)
| Era | Variable | oklch | Hue |
|-----|----------|-------|-----|
| Ancient | `--color-era-ancient` | `oklch(0.72 0.12 60)` | Gold |
| Revolution | `--color-era-revolution` | `oklch(0.68 0.15 145)` | Teal |
| Classical | `--color-era-classical` | `oklch(0.65 0.18 240)` | Blue |
| Modern | `--color-era-modern` | `oklch(0.68 0.20 310)` | Purple |
| Contemporary | `--color-era-contemporary` | `oklch(0.68 0.22 20)` | Coral |

Apply era color to a stop page via: `<main class="stop-page container" data-era="ancient">`

### SimAPI contract
```js
window.SimAPI = {
  start()   // begin or resume animation loop
  pause()   // stop animation loop, preserve state
  reset()   // restore to initial state, stop loop
  destroy() // remove canvas element, clean up listeners
}
```

`stop-shell.js` calls these automatically via `IntersectionObserver` (enters viewport → `start`, leaves → `pause`) and the Play/Reset buttons.
