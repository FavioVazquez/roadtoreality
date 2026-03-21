# Architecture: Interactive History of Physics
## A Static Site with ~50 Simulations, Deployable to GitHub Pages

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Site Structure Decision](#2-site-structure-decision)
3. [Navigation and Content Flow](#3-navigation-and-content-flow)
4. [Lessons from Successful Interactive Sites](#4-lessons-from-successful-interactive-sites)
5. [Recommended Build Order](#5-recommended-build-order)
6. [Simulation Isolation and Modularity](#6-simulation-isolation-and-modularity)
7. [Asset and File Organization](#7-asset-and-file-organization)
8. [Data Model for Physics Stops](#8-data-model-for-physics-stops)
9. [Component Boundaries and Data Flow](#9-component-boundaries-and-data-flow)
10. [GitHub Pages Constraints and Deployment](#10-github-pages-constraints-and-deployment)
11. [Technology Choices](#11-technology-choices)
12. [The 50 Physics Stops: Suggested Grouping](#12-the-50-physics-stops-suggested-grouping)

---

## 1. Executive Summary

This is a **multi-page static site** organized as a hub-and-spoke model: a landing/index page with era-based chapter navigation leads to individual stop pages. Each of the ~50 "physics stops" is a self-contained HTML page with its own embedded simulation. There is no build step required — raw HTML, CSS, and JS files are served directly from GitHub Pages.

**Core decisions at a glance:**

| Decision | Choice | Rationale |
|---|---|---|
| Page architecture | Multi-page (one HTML per stop) | Avoids 1 GB GitHub Pages limit, enables independent development, natural URL structure |
| Navigation model | Chapter-based timeline + card grid | Matches physics history's natural era structure; scannable for both linear and random access |
| Simulation isolation | Self-contained `<canvas>` or `<svg>` modules per page | No simulation can break another; each is independently testable |
| Build tooling | Zero — no bundler, no framework | Maximum deployability, no build step means no CI failures |
| Data model | JSON manifest + per-stop JS config object | Single source of truth for metadata; stops declare their own config |
| JS libraries | Vanilla JS + p5.js per simulation | p5.js handles physics loops cleanly; no framework overhead |

---

## 2. Site Structure Decision

### Option Analysis

**Single HTML file**: Rejected. A single file with 50 simulations would exceed 1 MB of JS alone, cause catastrophic load times, and make parallel development impossible. All 50 simulations would run simultaneously, destroying performance.

**SPA (Single-Page Application with client-side routing)**: Rejected. Adds a build step, adds a framework dependency, and provides no meaningful benefit over multi-page for this content type. SPAs also have poor cold-load performance for large bundles — the opposite of what a GitHub Pages educational site needs.

**Multi-page static site (chosen)**: Each physics stop is its own HTML file at a clean URL (e.g., `/stops/newtons-laws/`). The index page serves as a navigable map. Pages share CSS and utility JS via `<link>` and `<script>` tags. No bundler required. Every page is independently deployable and testable.

### Chosen Structure

```
index.html                  ← Landing page / era map / card grid
stops/
  001-aristotle/
    index.html              ← Stop page (narrative + simulation)
  002-archimedes/
    index.html
  ...
  050-quantum-computing/
    index.html
chapters/
  ancient/index.html        ← Chapter overview pages (optional)
  classical/index.html
  modern/index.html
  quantum/index.html
  contemporary/index.html
```

**Why numbered prefixes**: Keeps filesystem order aligned with chronological order. Prevents alphabetical sorting from scrambling the timeline. The number is not shown to users — only the slug is used in navigation.

---

## 3. Navigation and Content Flow

### The Problem with 50 Stops

50 stops is too many for a pure linear scroll (fatigue), too many for a flat card grid (overwhelming), and too few to need search. The right answer is **layered navigation**: era chapters at the top level, individual stops beneath.

### Recommended Navigation Model: Layered Timeline + Card Grid

**Layer 1 — Landing Page**: A visual horizontal timeline (CSS/SVG) showing 5-6 eras of physics history. Each era is a colored band with a label and approximate date range. Clicking an era scrolls to or navigates to its card grid.

**Layer 2 — Era Sections (on the same landing page)**: Below the timeline, each era has a 3-column card grid. Each card shows: era color accent, stop number, title, a one-line teaser, and a thumbnail/icon. Cards link to the stop's URL.

**Layer 3 — Individual Stop Page**: Linear scroll. Narrative text in a constrained column (max ~680px). Simulation embedded inline, either in a fixed sidebar (desktop) or full-width block (mobile). A "previous / next" nav at the bottom links to adjacent stops. A persistent breadcrumb shows: `Era > Stop Title`.

**Why not pure scroll-jacking / scroll-based timeline?** Sites like The Pudding use scrollytelling effectively for single self-contained stories. But with 50 stops, forcing all content into a single scroll creates a ~100,000px page. Users cannot bookmark individual stops, share specific simulations, or return to a specific point without scrolling past everything. URL-addressable pages are far superior for educational reference material.

**Why not a left-side chapter nav (like a documentation site)?** Documentation nav works when all content is text and fast to load. With simulations, navigating to any stop must load only that stop's simulation. A persistent sidebar nav that is always visible on every page would work, but is secondary to the card grid for initial discovery.

### Navigation Component Summary

| Component | Location | Purpose |
|---|---|---|
| Era timeline bar | `index.html` (sticky top) | Quick visual overview, jump to era |
| Era card grids | `index.html` (scrollable sections) | Browse stops within an era |
| Stop breadcrumb | Every `stops/*/index.html` | Orientation; link back to era |
| Prev/Next arrows | Every `stops/*/index.html` | Linear progression through all stops |
| Back-to-map link | Every `stops/*/index.html` | Return to landing for random access |

---

## 4. Lessons from Successful Interactive Sites

### ncase.me (Nicky Case — "The Evolution of Trust")

- Each project is a **fully self-contained standalone page**. No shared runtime state between projects.
- Uses a hub-and-spoke model: minimal homepage links to self-contained experiences.
- Technical stack is intentionally simple: custom JS on top of lightweight libraries (PIXI.js for rendering, Howler.js for audio, Tween.js for animation).
- Key lesson: **self-containment is the architecture**. Each interactive works independently, can be shared by URL, can be worked on without touching any other file.

### The Pudding

- Each story is its own standalone page/app. The homepage is just a curated grid.
- Uses **scrollytelling** (sticky graphic + scrolling text panels) for individual stories via Scrollama.js.
- The sticky graphic pattern: a canvas/SVG visualization is pinned to the viewport while text sections scroll past it. Each text section triggers a state change in the visualization.
- Key lesson: **separate the "what the visualization shows" from "when it transitions."** The scrollytelling library (Scrollama) handles trigger logic; the visualization module handles rendering.

### distill.pub

- Uses **custom web components** (`<dt-article>`, `<dt-byline>`) to encapsulate layout. These are zero-dependency custom elements, not a framework.
- Visualizations are D3.js or Canvas-based, mounted to DOM nodes with specific IDs.
- Uses a **render queue pattern** for managing async initialization of multiple visualizations on one page.
- Key lesson: for a page with multiple visualizations, **initialize lazily using IntersectionObserver** — only start a simulation's animation loop when it enters the viewport. This prevents 50 canvas render loops from running simultaneously.

### BetterExplained

- Simulations are embedded **inline within narrative text**, not in sidebars.
- Uses canvas-based animations with click-to-pause.
- Key lesson: the simulation should be **interruptible and resumable**. Users read at different paces. Never auto-play past where the user is reading.

### Josh Comeau's Interactive Guides

- Each interactive demo is isolated with scoped CSS. No demo's styles bleed into the page.
- Uses **sandboxed contexts** (sometimes iframes, sometimes shadow DOM, sometimes careful class namespacing) to isolate interactive regions.
- Key lesson: **style isolation is not optional** at 50 stops. Establish a CSS containment strategy from day one.

### Common Patterns Across All Sites

1. **Narrative text lives in a max-width constrained column** (~600-720px). Simulations can break out to full width.
2. **No simulation starts its animation loop until it is in view.** Use IntersectionObserver.
3. **Mobile fallback**: if a simulation requires WebGL or is too complex for mobile, show a static image with a caption explaining what the sim would show. Never break the reading experience.
4. **Progressive disclosure**: start with an intuition-building metaphor or question before showing the simulation. Never lead with math.

---

## 5. Recommended Build Order

Build order should de-risk the hardest unknowns first, establish the shared shell early, and allow content to be added independently thereafter.

### Phase 0: Foundation (Week 1) — De-Risk Everything

Build the skeleton that all 50 stops will live inside. Nothing content-specific yet.

1. **Create the repo and GitHub Pages deployment.** Verify a plain `index.html` serves correctly. Confirm the URL scheme works.
2. **Build the shared CSS system** (`/assets/css/base.css`, `/assets/css/components.css`). Define: typographic scale, color tokens (one per era), layout grid, responsive breakpoints. This is the most multiplied investment in the project.
3. **Build one stop page end-to-end** — pick a medium-complexity simulation (e.g., Newton's Laws). This stop must include: narrative text, a working canvas simulation, prev/next navigation, breadcrumb, mobile layout. This is the **proof of concept for the entire architecture**.
4. **Build the landing page** with the era timeline and card grid using placeholder cards. Confirm navigation to/from the one working stop.
5. **Write `stops.json`** (the manifest) with all 50 stops defined as stubs. The landing page reads this JSON to render cards.

At the end of Phase 0, you have: one complete, working stop; a functional landing page; a deployment pipeline; and a shared CSS/JS system. All risks are resolved.

### Phase 1: Scaffold All Stops (Week 2)

6. **Generate stub HTML files** for all 50 stops from the manifest. Each stub has the full page shell (header, nav, breadcrumb, prev/next) but a placeholder `<div class="sim-placeholder">` instead of a real simulation.
7. Verify all 50 pages load, navigate correctly to each other, and appear on the landing page grid.
8. The site is now "complete but empty" — content can be filled in any order.

### Phase 2: Simulations by Era (Weeks 3-10)

9. Work through eras in chronological order, building simulations for each stop. Each simulation is a self-contained JS module in `stops/{slug}/sim.js`.
10. Build simulations in order of increasing complexity within each era:
    - Simple first: static geometry, pendulum, projectile motion
    - Medium: wave interference, orbital mechanics
    - Complex last: quantum wavefunction, special relativity visualization
11. After completing each era, do an **integration test**: load every page in the era, verify no JS errors, verify mobile layout, verify prev/next links are correct.

### Phase 3: Polish (Week 11-12)

12. Add animations and transitions between stops.
13. Add the era overview chapter pages (optional but useful for SEO and deep linking).
14. Accessibility pass: keyboard navigation, ARIA labels on simulations, `prefers-reduced-motion` media query to disable animations.
15. Performance audit: image optimization, lazy loading, verify no stop page exceeds 500 KB total transfer.

### Build Order Summary

```
Phase 0: Repo → CSS system → one complete stop → landing page → stops.json
Phase 1: Scaffold all 50 stub pages
Phase 2: Build simulations era by era (5 eras × ~10 stops each)
Phase 3: Polish, accessibility, performance
```

**The critical principle**: never be blocked. If one simulation is hard, skip it and build the next one. The stub system means every page is always "deployable" — just with a placeholder where the sim will go.

---

## 6. Simulation Isolation and Modularity

### The Core Problem

50 simulations on one project means 50 different canvas contexts, 50 different animation loops, 50 different sets of global variables. Without isolation, simulations will conflict: name collisions, style bleed, memory leaks from dangling `requestAnimationFrame` loops.

### Solution: Module-Per-Stop Pattern

Each stop owns exactly one simulation file: `stops/{slug}/sim.js`. This file exports (or immediately invokes) a single factory function that:

1. Accepts a container element as its mount point
2. Creates its canvas/SVG inside that container
3. Returns a `destroy()` method that cancels animation frames and removes event listeners

```javascript
// stops/002-newtons-laws/sim.js
(function() {
  const SIM_ID = 'newtons-laws';

  function init(container) {
    const canvas = document.createElement('canvas');
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let rafId = null;
    let running = false;

    function draw() {
      // simulation logic here
      rafId = requestAnimationFrame(draw);
    }

    function start() {
      running = true;
      draw();
    }

    function pause() {
      running = false;
      cancelAnimationFrame(rafId);
    }

    function destroy() {
      cancelAnimationFrame(rafId);
      canvas.remove();
    }

    return { start, pause, destroy };
  }

  // Auto-mount when DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('sim-mount');
    if (!container) return;

    const sim = init(container);

    // Only start when visible
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          sim.start();
        } else {
          sim.pause();
        }
      });
    }, { threshold: 0.1 });

    observer.observe(container);
  });
})();
```

### Why IIFE (not ES Modules)?

ES Modules require either a bundler or a server that sets correct MIME types. GitHub Pages serves files with correct MIME types for `.js`, so `type="module"` works — but it adds complexity (import maps, relative paths). For 50 independent simulations that never need to share code with each other, IIFEs with namespacing are simpler and more robust.

**Exception**: if p5.js is used (recommended for physics simulations), use p5's "instance mode" to prevent global namespace pollution:

```javascript
// stops/003-pendulum/sim.js
(function() {
  new p5(function(sketch) {
    let angle, velocity, length;

    sketch.setup = function() {
      const canvas = sketch.createCanvas(600, 400);
      canvas.parent('sim-mount');
      // init state
    };

    sketch.draw = function() {
      // physics update + render
    };
  });
})();
```

P5.js instance mode gives each simulation its own isolated sketch context. Multiple p5 instances on the same page are supported by the library.

### CSS Isolation

Each stop page loads only two CSS files:
1. `/assets/css/base.css` — shared typography, layout, nav components
2. `/assets/css/simulation.css` — shared simulation container styles

Simulation-specific styles, if any, go in a `<style>` block in the stop's `index.html`. Using BEM naming (`.sim-{slug}__control`) prevents collisions if a shared CSS file is ever loaded alongside simulation-specific styles.

### No Shared State Between Stops

Each stop is a separate page load. There is no shared JavaScript state. If a user's progress needs to be tracked (e.g., "visited 23 of 50 stops"), this is stored in `localStorage` only, keyed by stop slug. The shared navigation JS reads `localStorage` to show visited indicators on the card grid.

---

## 7. Asset and File Organization

```
/                                   ← GitHub Pages root
├── index.html                      ← Landing page
├── CNAME                           ← Custom domain (optional)
│
├── assets/
│   ├── css/
│   │   ├── base.css                ← Reset, typography, color tokens, layout grid
│   │   ├── components.css          ← Nav, cards, breadcrumb, prev/next, buttons
│   │   └── simulation.css          ← Shared simulation container, controls, captions
│   │
│   ├── js/
│   │   ├── nav.js                  ← Landing page: render card grid from stops.json
│   │   ├── progress.js             ← localStorage read/write for visited stops
│   │   ├── stop-shell.js           ← Per-stop page: breadcrumb, prev/next, IntersectionObserver bootstrap
│   │   └── vendors/
│   │       ├── p5.min.js           ← v1.x, vendored (no CDN dependency)
│   │       ├── scrollama.min.js    ← For stops that use scrollytelling within their page
│   │       └── matter.min.js       ← Physics engine (optional, for complex rigid body sims)
│   │
│   ├── data/
│   │   └── stops.json              ← Master manifest of all 50 stops
│   │
│   └── img/
│       ├── thumbnails/             ← One 400x300 WebP per stop (for card grid)
│       ├── era-banners/            ← One banner per era (landing page)
│       └── og/                     ← Open Graph images per stop
│
├── stops/
│   ├── 001-aristotle-motion/
│   │   ├── index.html              ← Stop page
│   │   └── sim.js                  ← Simulation module (IIFE or p5 instance)
│   ├── 002-archimedes-buoyancy/
│   │   ├── index.html
│   │   └── sim.js
│   │   [... 48 more stops ...]
│
└── chapters/                       ← Optional era overview pages
    ├── ancient/index.html
    ├── classical/index.html
    ├── thermodynamics/index.html
    ├── electromagnetism/index.html
    ├── modern/index.html
    └── quantum/index.html
```

### Key Asset Decisions

**Vendor JS is vendored (not CDN-linked)**: GitHub Pages is fully offline-capable once assets are cached. CDN links create a runtime dependency on a third-party server. Vendor the libraries. At ~300 KB total for p5.js + scrollama + matter.js (minified + gzipped), this is well within budget.

**WebP thumbnails at 400x300**: The card grid shows ~50 thumbnails on the landing page. At 400x300 WebP with moderate quality (65%), each thumbnail is ~15-25 KB. Total thumbnail weight: ~1 MB. Acceptable. Use `loading="lazy"` on all thumbnail `<img>` tags.

**stops.json is the single source of truth**: The landing page, chapter pages, and any future tooling all read from this one file. Never hard-code stop order or metadata into HTML.

**No fonts from Google Fonts**: Use system font stack for body text (`system-ui, -apple-system, sans-serif`). Choose one display font for headings that can be self-hosted as a small WOFF2 file (~30 KB). Eliminates a runtime dependency and speeds up first contentful paint.

---

## 8. Data Model for Physics Stops

### stops.json — Master Manifest

```json
{
  "version": "1.0",
  "stops": [
    {
      "id": "001-aristotle-motion",
      "slug": "aristotle-motion",
      "order": 1,
      "title": "Aristotle's Theory of Motion",
      "subtitle": "Why heavy things fall faster (they don't)",
      "era": "ancient",
      "year": -350,
      "yearLabel": "~350 BCE",
      "scientist": "Aristotle",
      "concepts": ["natural motion", "violent motion", "elements"],
      "difficulty": 1,
      "simType": "canvas-2d",
      "hasScrollytelling": false,
      "thumbnail": "/assets/img/thumbnails/001-aristotle-motion.webp",
      "ogImage": "/assets/img/og/001-aristotle-motion.webp",
      "description": "Aristotle believed heavier objects fall faster than lighter ones. This simulation lets you drop objects of different masses and see his prediction vs. reality.",
      "path": "/stops/001-aristotle-motion/",
      "prev": null,
      "next": "002-archimedes-buoyancy"
    },
    {
      "id": "002-archimedes-buoyancy",
      "slug": "archimedes-buoyancy",
      "order": 2,
      "title": "Archimedes and Buoyancy",
      "subtitle": "Eureka! Why things float",
      "era": "ancient",
      "year": -250,
      "yearLabel": "~250 BCE",
      "scientist": "Archimedes",
      "concepts": ["buoyancy", "displacement", "density", "fluid pressure"],
      "difficulty": 1,
      "simType": "canvas-2d",
      "hasScrollytelling": false,
      "thumbnail": "/assets/img/thumbnails/002-archimedes-buoyancy.webp",
      "ogImage": "/assets/img/og/002-archimedes-buoyancy.webp",
      "description": "Drag objects of different densities into water and watch the displaced volume equal the buoyant force.",
      "path": "/stops/002-archimedes-buoyancy/",
      "prev": "001-aristotle-motion",
      "next": "003-galileo-pendulum"
    }
  ]
}
```

### Era Definitions (embedded in stops.json or a separate eras.json)

```json
{
  "eras": [
    {
      "id": "ancient",
      "label": "Ancient & Classical",
      "dateRange": "600 BCE – 1550 CE",
      "color": "#8B7355",
      "colorLight": "#D4C5A9",
      "description": "The foundations of natural philosophy: observation, geometry, and the first attempts to explain motion, matter, and the cosmos.",
      "stopCount": 8
    },
    {
      "id": "scientific-revolution",
      "label": "Scientific Revolution",
      "dateRange": "1550 – 1700",
      "color": "#4A7C59",
      "colorLight": "#A8C5B5",
      "description": "Galileo, Kepler, Newton: mathematics becomes the language of nature.",
      "stopCount": 10
    },
    {
      "id": "classical",
      "label": "Classical Physics",
      "dateRange": "1700 – 1880",
      "color": "#2E5090",
      "colorLight": "#A0B4D6",
      "description": "Thermodynamics, waves, electricity, and magnetism. The confident age when physicists thought they were almost done.",
      "stopCount": 12
    },
    {
      "id": "modern",
      "label": "The Modern Revolution",
      "dateRange": "1880 – 1930",
      "color": "#7B2D8B",
      "colorLight": "#C8A0D4",
      "description": "Relativity, quantum mechanics, and the demolition of classical certainty.",
      "stopCount": 12
    },
    {
      "id": "contemporary",
      "label": "Contemporary Physics",
      "dateRange": "1930 – Present",
      "color": "#C0392B",
      "colorLight": "#E8A99F",
      "description": "Nuclear physics, particle physics, cosmology, and the frontiers still being mapped.",
      "stopCount": 8
    }
  ]
}
```

### Per-Stop HTML Config Block

Each stop's `index.html` contains a small inline JSON config block that the shared `stop-shell.js` reads. This avoids a second network fetch for stop-level metadata:

```html
<!-- In stops/002-archimedes-buoyancy/index.html -->
<script id="stop-config" type="application/json">
{
  "id": "002-archimedes-buoyancy",
  "order": 2,
  "era": "ancient",
  "prev": "/stops/001-aristotle-motion/",
  "next": "/stops/003-galileo-pendulum/",
  "simControls": {
    "pauseOnBlur": true,
    "showFPS": false,
    "initialState": "paused"
  }
}
</script>
```

### Simulation Config Object (in sim.js)

Each simulation declares its own configuration needs. This is not a shared schema — it is specific to the simulation — but by convention, every sim.js reads its config from the same DOM element:

```javascript
// Convention: sim.js reads from #stop-config if it needs shared metadata
// It declares its own defaults internally
const SIM_CONFIG = {
  gravity: 9.8,
  fluidDensity: 1000,  // kg/m³ for water
  objects: [
    { label: 'Wood', density: 700, color: '#8B6914' },
    { label: 'Iron', density: 7874, color: '#708090' },
    { label: 'Ice', density: 917, color: '#B8D4E8' }
  ]
};
```

### Difficulty Levels

| Level | Meaning | Simulation Type |
|---|---|---|
| 1 | Introductory — no math required to enjoy | Animated metaphor, drag-and-drop |
| 2 | Intermediate — one formula, intuitive controls | Adjustable parameter sliders |
| 3 | Advanced — multiple interacting variables | Multi-parameter exploration |
| 4 | Expert — mathematical visualization | Phase diagrams, wavefunction plots |

---

## 9. Component Boundaries and Data Flow

### Data Flow Diagram

```
stops.json (master data)
    │
    ▼
nav.js (landing page only)
    │ reads stops.json via fetch()
    │ renders era sections + stop cards
    ▼
index.html (card grid)
    │ user clicks a card
    ▼
stops/{slug}/index.html
    │
    ├── <script id="stop-config"> (inline JSON, no fetch needed)
    │       │
    │       ▼
    │   stop-shell.js
    │       ├── renders breadcrumb from config
    │       ├── renders prev/next links from config
    │       ├── reads localStorage for visited state
    │       └── marks this stop as visited in localStorage
    │
    └── <script src="sim.js"> (simulation module)
            │
            ├── mounts to #sim-mount
            ├── starts animation loop when #sim-mount enters viewport
            └── pauses animation loop when #sim-mount leaves viewport
```

### Component Boundaries

**`nav.js`** — Landing page only. Responsibilities:
- Fetch `/assets/data/stops.json`
- Render era sections and card grids into the DOM
- Read `localStorage` to add "visited" badges to cards
- Handle era filter clicks

**`stop-shell.js`** — Loaded on every stop page. Responsibilities:
- Parse `#stop-config` inline JSON
- Render breadcrumb: `Era Label > Stop Title`
- Render prev/next navigation with correct URLs
- Mark stop as visited in `localStorage`
- Set up `IntersectionObserver` on `#sim-mount` to call `window.SimAPI.start()` / `window.SimAPI.pause()`

**`sim.js`** — One per stop. Loaded on that stop's page only. Responsibilities:
- Own all simulation state
- Mount canvas/SVG to `#sim-mount`
- Expose `window.SimAPI = { start, pause, reset, destroy }` for `stop-shell.js` to call
- Handle its own resize events
- Never read from or write to `localStorage`

**`progress.js`** — Shared utility. Responsibilities:
- `markVisited(stopId)`
- `isVisited(stopId)`
- `getVisitedCount()`
- `getAllVisited()`
- Reads/writes to `localStorage` key `physics-history-progress`

### What is NOT Shared

- Simulation state (each sim.js owns it entirely)
- Simulation-specific CSS (goes in `<style>` in the stop's HTML, or BEM-namespaced classes)
- Simulation-specific assets (images, audio, data files used by a single simulation go in `stops/{slug}/`)

---

## 10. GitHub Pages Constraints and Deployment

### Hard Limits

| Constraint | Limit | Our Budget |
|---|---|---|
| Repository size | 1 GB (recommended) | ~50 MB total (well within) |
| Published site size | 1 GB | ~50 MB total (well within) |
| Bandwidth | 100 GB/month (soft) | Educational site; unlikely to hit this |
| Build time | 10 minutes | No build step needed — instant |
| Builds per hour | 10 (soft limit) | Use GitHub Actions workflow to bypass |

### Deployment Strategy

**No build step**: The site is raw HTML/CSS/JS. GitHub Pages serves it directly. No Jekyll, no bundler, no CI pipeline needed for the site itself.

**Deploy via GitHub Actions (recommended over Jekyll)**: Create a minimal `.github/workflows/deploy.yml` that simply pushes the repository root to GitHub Pages using the official `actions/deploy-pages` action. This bypasses the 10-builds-per-hour soft limit.

```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/configure-pages@v4
      - uses: actions/upload-pages-artifact@v3
        with:
          path: '.'
      - uses: actions/deploy-pages@v4
```

**`.nojekyll` file**: Place an empty `.nojekyll` file in the root. This tells GitHub Pages to skip Jekyll processing entirely, which is faster and avoids Jekyll treating files starting with `_` as private.

### URL Structure

With a repository named `physics-history`, the default URL is:
`https://{username}.github.io/physics-history/`

All internal links must be **root-relative** (starting with `/`) or **relative to the current page**. Do not use absolute URLs that hardcode the domain, as these break during local development.

Use a `<base href="/physics-history/">` tag in every HTML file's `<head>` if the site lives in a subdirectory. Or configure a custom domain (CNAME) and use `/` as the base.

---

## 11. Technology Choices

### Core Stack

| Layer | Choice | Reason |
|---|---|---|
| HTML | Semantic HTML5 | No framework overhead; accessible by default |
| CSS | Vanilla CSS with custom properties | No preprocessor needed; custom properties enable theming |
| JS — site shell | Vanilla JS (ES2020) | No framework; fetch, IntersectionObserver, localStorage are native |
| JS — simulations | p5.js (instance mode) | Purpose-built for physics animation; beginner-friendly yet powerful |
| JS — scrollytelling | Scrollama.js (vendored) | Used only on stops that need it; IntersectionObserver-based, performant |
| JS — physics engine | Matter.js (vendored, optional) | For rigid body simulations that would be complex in raw canvas |
| Math rendering | KaTeX (vendored, optional) | Faster than MathJax; use only on stops with equations |
| Data | JSON + inline `<script>` blocks | No database; no API; no server |

### What to Avoid

- **React/Vue/Svelte**: Adds a build step. Provides no benefit for 50 independent pages.
- **D3.js as the default sim library**: D3 is excellent for data visualization but has a steep learning curve for physics animation. Use p5.js for simulations; D3 only if a stop specifically needs data-driven SVG (e.g., a chart of historical physics discoveries).
- **Three.js (for most stops)**: 3D adds complexity without adding understanding for most classical physics concepts. Use only for stops that genuinely require 3D (e.g., magnetic field lines, orbital mechanics in 3D).
- **Google Fonts / CDN dependencies**: Eliminates the offline/cold-cache case. Vendor everything.
- **CSS frameworks (Bootstrap, Tailwind)**: Overkill for a custom-designed site. A custom CSS design system takes less space and is more on-brand.

### Progressive Enhancement Strategy

Every stop page must be readable even if JavaScript fails. This means:
- Narrative text is in plain HTML paragraphs, not rendered by JS
- The `#sim-mount` container has a `<noscript>` child with a static image fallback
- CSS layout does not depend on JS to function

```html
<div id="sim-mount" class="sim-container" aria-label="Interactive simulation: Archimedes buoyancy">
  <noscript>
    <img src="./sim-static.webp" alt="Static diagram showing buoyancy forces on objects of different densities in water" />
  </noscript>
</div>
```

---

## 12. The 50 Physics Stops: Suggested Grouping

This provides enough context to design the manifest and validate that 50 stops covers the intended scope without redundancy.

### Era 1: Ancient & Classical (8 stops)
1. Aristotle's Theory of Motion
2. Archimedes and Buoyancy
3. Eratosthenes Measures the Earth
4. Ptolemy's Geocentric Model
5. Al-Haytham and the Pinhole Camera (Optics)
6. Fibonacci and Nature's Patterns (optional — cross-disciplinary)
7. Copernicus and the Heliocentric Model
8. Brahe's Observational Data

### Era 2: Scientific Revolution (10 stops)
9. Galileo's Inclined Plane
10. Galileo's Pendulum
11. Kepler's Laws of Planetary Motion
12. Galileo and the Telescope
13. Newton's Laws of Motion
14. Newton's Law of Universal Gravitation
15. Newton's Cannon (orbital mechanics)
16. Huygens and the Wave Theory of Light
17. Snell's Law (Refraction)
18. The Speed of Light (Rømer)

### Era 3: Classical Physics (12 stops)
19. Bernoulli's Principle (Fluid Dynamics)
20. Euler and Rigid Body Rotation
21. Coulomb's Law (Electrostatics)
22. Volta and the Electric Battery
23. Faraday's Electromagnetic Induction
24. Carnot and the Heat Engine (Thermodynamics)
25. Fourier and Heat Diffusion
26. Maxwell's Equations (Electromagnetic Waves)
27. The Speed of Light (Maxwell's prediction)
28. Doppler Effect
29. Boltzmann and Statistical Mechanics
30. The Michelson-Morley Experiment (Aether null result)

### Era 4: The Modern Revolution (12 stops)
31. Planck and Blackbody Radiation (Quantum Origins)
32. Einstein's Photoelectric Effect
33. Special Relativity: Time Dilation
34. Special Relativity: Length Contraction
35. Special Relativity: E = mc²
36. Rutherford's Nuclear Model
37. Bohr's Atomic Model
38. de Broglie's Matter Waves
39. Heisenberg's Uncertainty Principle
40. The Double-Slit Experiment
41. Schrödinger's Equation (Wavefunction)
42. General Relativity: Curved Spacetime

### Era 5: Contemporary Physics (8 stops)
43. Nuclear Fission (Chain Reaction)
44. The Standard Model (Particle Zoo)
45. Feynman Diagrams and QED
46. The Big Bang and Cosmic Expansion
47. Black Holes and Event Horizons
48. Quantum Entanglement (Bell's Theorem)
49. The Higgs Field and Mass
50. Open Questions: Dark Matter, Dark Energy, Quantum Gravity

---

## Appendix A: HTML Template for a Stop Page

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Archimedes and Buoyancy — History of Physics</title>
  <meta name="description" content="Drag objects of different densities into water and discover why things float.">

  <!-- Open Graph -->
  <meta property="og:title" content="Archimedes and Buoyancy">
  <meta property="og:image" content="/assets/img/og/002-archimedes-buoyancy.webp">
  <meta property="og:type" content="article">

  <!-- Shared styles -->
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/simulation.css">

  <!-- Stop config (read by stop-shell.js) -->
  <script id="stop-config" type="application/json">
  {
    "id": "002-archimedes-buoyancy",
    "order": 2,
    "era": "ancient",
    "eraLabel": "Ancient & Classical",
    "prev": "/stops/001-aristotle-motion/",
    "next": "/stops/003-eratosthenes/",
    "simControls": { "pauseOnBlur": true, "initialState": "paused" }
  }
  </script>
</head>
<body class="stop-page era--ancient">

  <!-- Site nav -->
  <nav class="site-nav" aria-label="Site navigation">
    <a href="/" class="site-nav__home">History of Physics</a>
    <a href="/#ancient" class="site-nav__era">Ancient &amp; Classical</a>
  </nav>

  <!-- Breadcrumb -->
  <nav class="breadcrumb" aria-label="Breadcrumb" id="breadcrumb">
    <!-- Rendered by stop-shell.js -->
  </nav>

  <!-- Stop header -->
  <header class="stop-header">
    <p class="stop-header__meta">Stop 2 · ~250 BCE · Archimedes</p>
    <h1 class="stop-header__title">Archimedes and Buoyancy</h1>
    <p class="stop-header__subtitle">Why things float — and why Archimedes ran naked through Syracuse</p>
  </header>

  <!-- Main content -->
  <main class="stop-content">

    <!-- Narrative section -->
    <section class="narrative">
      <p>The story goes that Archimedes was tasked with determining whether King Hiero's crown was pure gold...</p>
      <p>What he discovered in that bathtub became one of the most elegant principles in all of physics...</p>
    </section>

    <!-- Simulation section -->
    <section class="simulation-section" aria-labelledby="sim-heading">
      <h2 id="sim-heading" class="simulation-section__heading">Try It</h2>
      <p class="simulation-section__prompt">Drag objects of different densities into the water. Watch the displaced water volume and compare it to the buoyant force.</p>

      <div id="sim-mount" class="sim-container" role="img" aria-label="Interactive buoyancy simulation">
        <noscript>
          <img src="./sim-static.webp" alt="Diagram showing wood, iron, and ice partially submerged in water with force arrows indicating buoyancy and weight" />
        </noscript>
      </div>

      <div class="sim-controls">
        <button id="sim-reset" class="sim-btn">Reset</button>
        <button id="sim-pause" class="sim-btn">Pause</button>
      </div>
      <p class="sim-caption">Buoyant force = weight of displaced fluid. Try the ice — its density is just 8% less than water.</p>
    </section>

    <!-- More narrative -->
    <section class="narrative">
      <p>Archimedes' principle states that the buoyant force on an object equals the weight of the fluid it displaces...</p>
    </section>

  </main>

  <!-- Stop footer: prev/next navigation -->
  <footer class="stop-nav" id="stop-nav">
    <!-- Rendered by stop-shell.js -->
  </footer>

  <!-- Shared JS -->
  <script src="/assets/js/progress.js"></script>
  <script src="/assets/js/stop-shell.js"></script>

  <!-- Simulation (loaded last) -->
  <script src="/assets/js/vendors/p5.min.js"></script>
  <script src="./sim.js"></script>

</body>
</html>
```

---

## Appendix B: stops.json Schema (TypeScript-style for documentation)

```typescript
interface Stop {
  id: string;           // "002-archimedes-buoyancy" — unique, matches directory name
  slug: string;         // "archimedes-buoyancy" — URL-safe, human-readable
  order: number;        // 1-50, determines prev/next links and timeline position
  title: string;        // Display title
  subtitle: string;     // One-line teaser shown on card
  era: EraId;           // "ancient" | "scientific-revolution" | "classical" | "modern" | "contemporary"
  year: number;         // Approximate year (negative for BCE) — used for timeline positioning
  yearLabel: string;    // "~250 BCE" — human-readable
  scientist: string;    // Primary scientist associated with this stop
  concepts: string[];   // Tags for future filtering
  difficulty: 1|2|3|4; // Shown as indicator on card
  simType: SimType;     // "canvas-2d" | "canvas-webgl" | "svg" | "css-only"
  hasScrollytelling: boolean;
  thumbnail: string;    // Absolute path to WebP thumbnail
  ogImage: string;      // Absolute path to OG image
  description: string;  // 1-2 sentence description (used for card and meta tags)
  path: string;         // Absolute URL path, e.g. "/stops/002-archimedes-buoyancy/"
  prev: string | null;  // slug of previous stop, or null
  next: string | null;  // slug of next stop, or null
}

type EraId = "ancient" | "scientific-revolution" | "classical" | "modern" | "contemporary";
type SimType = "canvas-2d" | "canvas-webgl" | "svg" | "css-only";

interface Era {
  id: EraId;
  label: string;
  dateRange: string;
  color: string;        // Primary era color (hex)
  colorLight: string;   // Light variant for backgrounds
  description: string;
  stopCount: number;
}

interface StopsManifest {
  version: string;
  eras: Era[];
  stops: Stop[];
}
```

---

*Last updated: March 2026. Architecture designed for GitHub Pages deployment, no build step, ~50 physics stops, vanilla JS + p5.js simulation stack.*
