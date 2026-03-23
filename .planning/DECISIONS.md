# Architectural Decisions — How Physics Works

*Project: How Physics Works | Milestone: v1.0 — First Light*
*Format: ID · Date · Decision · Context · Alternatives · Consequences*

---

## DEC-001 · 2026-03-20 · All site code lives in Episodio4/

**Status:** Active

**Decision:** All generated HTML, CSS, JS, fonts, and data files live under `Episodio4/`. Planning artifacts live in `.planning/`. No project code at the repo root.

**Context:** The project lives inside a multi-project repository (`roadtoreality/`). Keeping all output in `Episodio4/` prevents pollution of the root and keeps it consistent with the episode-based folder structure of the repo.

**Alternatives considered:**
- Root-level `src/` or `site/` directory — rejected: inconsistent with existing repo structure
- Build artifacts in `dist/` — rejected: no build pipeline used

**Consequences:**
- All relative paths in HTML/CSS/JS are relative to `Episodio4/`
- GitHub Pages must be configured to serve from the `Episodio4/` subdirectory
- Local development: `python3 -m http.server 8765 --directory Episodio4`

---

## DEC-002 · 2026-03-20 · No build pipeline — pure static HTML/CSS/JS

**Status:** Active

**Decision:** No bundler, no transpiler, no build step required to run the site. All JS is plain ES5 IIFEs. All CSS is plain CSS4 (oklch, clamp, custom properties). No TypeScript, no Sass, no PostCSS.

**Context:** The site must be hostable on GitHub Pages with zero CI/CD configuration. It must serve correctly from `python3 -m http.server` with no preprocessing. Simplicity and maintainability over developer ergonomics.

**Alternatives considered:**
- Vite — rejected for v1.0: adds complexity, breaks "just open with http.server" development
- Eleventy/Jekyll — rejected: overkill for a site with static HTML shells
- Webpack — rejected: too heavy for this use case

**Consequences:**
- All JS must be valid in modern browsers without transpilation (no optional chaining on old Safari, etc.)
- CSS custom properties require `:root` declarations (no nesting without native support check)
- No tree-shaking — vendor libs loaded whole (p5.js ~1MB if used)

---

## DEC-003 · 2026-03-20 · stops.json as single source of truth for all stop metadata

**Status:** Active

**Decision:** `assets/data/stops.json` contains all metadata for all 50 stops. `nav.js` reads this file to render the card grid. `stop-shell.js` reads a JSON script tag per-page (which mirrors the relevant fields from stops.json). Both sources must stay in sync.

**Context:** The alternative of hardcoding HTML for 50 stop cards would make maintenance painful. With stops.json, adding a stop requires only one file change.

**Alternatives considered:**
- Hardcoded HTML stop cards — rejected: brittle, 50 × maintenance overhead
- Separate JSON per stop — rejected: requires 50 fetch calls to render the landing page

**Consequences:**
- stops.json must be kept in sync with per-stop #stop-config JSON script tags
- fetch() required for the landing page — `file://` protocol breaks this (must use http server)
- nav.js shows a visible error message with `python3 -m http.server` hint on fetch failure

---

## DEC-004 · 2026-03-20 · window.SimAPI contract for all simulations

**Status:** Active

**Decision:** Every `sim.js` exposes `window.SimAPI = { start, pause, reset, destroy }`. `stop-shell.js` calls these methods — it does not know anything about the sim's internals.

**Context:** This decouples the simulation from the page infrastructure. stop-shell.js can be written once and reused for all 50 stops. Each sim can be replaced or upgraded independently.

**Alternatives considered:**
- Custom events (dispatchEvent) — rejected: more complex wiring, harder to debug
- Direct DOM manipulation by sim.js — rejected: tight coupling, prevents reuse of stop-shell.js

**Consequences:**
- All 12 sim.js files must set `window.SimAPI` synchronously during script execution
- `window.SimAPI` must be set before stop-shell.js wires the IntersectionObserver (load order enforced)
- `destroy()` method must clean up canvas element and remove event listeners

---

## DEC-005 · 2026-03-20 · oklch color system throughout

**Status:** Active

**Decision:** All colors in CSS and canvas draw calls use `oklch()` notation. No hex, no rgb, no hsl in the design system layer (only in vendor code).

**Context:** oklch is perceptually uniform — equal numeric steps in L, C, H produce visually equal steps. This makes it easy to derive era accent colors, hover states, and disabled states by simple arithmetic on the L or C channel.

**Alternatives considered:**
- hsl — rejected: not perceptually uniform (hsl yellows look much brighter than hsl blues at same L)
- hex — rejected: no semantic meaning, no arithmetic
- CSS color-mix() — rejected: limited browser support as of 2026

**Consequences:**
- Canvas 2D `ctx.fillStyle = 'oklch(...)'` — supported in Chrome 111+, Firefox 113+, Safari 15.4+
- All era accent colors are distinct oklch hue values: ancient=60°, revolution=145°, classical=240°, modern=310°, contemporary=20°

---

## DEC-006 · 2026-03-20 · RK4 for orbital/pendulum physics; Euler for simple cases

**Status:** Active

**Decision:** Use Runge-Kutta 4th order integration for: Kepler orbital mechanics, Newton's cannon, Galileo pendulum. Use Euler for: Aristotle free fall, Archimedes buoyancy, Galileo inclined plane, Newton's block friction.

**Context:** RK4 conserves energy to 4th order — critical for systems that orbit (energy drift causes orbits to spiral in or out) or pendulums (energy drift changes the period). Euler is sufficient for short-duration, one-directional sims where drift is not visible.

**Alternatives considered:**
- Verlet integration — good for orbital mechanics but requires different code structure
- Symplectic Euler — better energy conservation than Euler, simpler than RK4
- Using a physics library (Matter.js, Rapier) — rejected for orbital mechanics: not designed for it

**Consequences:**
- RK4 requires 4× derivative evaluations per step — use sub-stepping (4–30 per frame) for accuracy
- Newton's cannon uses 30 sub-steps per frame to handle near-Earth fast motion accurately
- Kepler and pendulum use 4–8 sub-steps per frame

---

## DEC-007 · 2026-03-20 · Simulation units for orbital mechanics

**Status:** Active

**Decision:** Kepler and Newton orbital sims use astronomical units (AU) and simulation years for physics, not SI units. GM is derived from: if A=1 AU and T=1 year, then GM = 4π²A³/T² = 4π² AU³/yr².

**Context:** Using SI units (meters, seconds) for orbital mechanics causes floating point issues: Earth-Sun distance is 1.5×10¹¹ m, orbital period is 3.15×10⁷ s. Computing GM × m_sun in SI produces numbers that lose precision in JavaScript's 64-bit floats.

**Alternatives considered:**
- SI units with double precision — technically works but fragile and less readable
- km/s units (used in Newton's cannon) — appropriate for near-Earth cannon sim

**Consequences:**
- Kepler sim: all physics in AU/yr, screen coordinates converted at draw time only
- Newton cannon sim: uses km and km/s (near-Earth scale, different from Kepler sim)
- Conversion to screen: `screenX = cx + AU_value * scale_px_per_AU`

---

## DEC-008 · 2026-03-20 · Self-hosted fonts, no CDN dependencies

**Status:** Active

**Decision:** Cormorant Garamond and DM Sans are downloaded as WOFF2 files and served from `assets/fonts/`. No Google Fonts CDN links in any HTML file.

**Context:** CDN-hosted fonts introduce an external HTTP dependency, add latency (DNS lookup + TLS handshake), and break in offline environments. GitHub Pages serves the site without network restrictions — but a CDN dependency adds complexity.

**Alternatives considered:**
- Google Fonts CDN — rejected: external dependency, privacy implications (GDPR), breaks offline
- System font stack only — rejected: visual quality requirement needs display font

**Consequences:**
- Font files add ~130KB to repository
- `font-display: swap` required to prevent FOIT
- Load order in base.css: @font-face declarations must precede any font-family usage

---

## DEC-009 · 2026-03-20 · Era color coding via data-era attribute

**Status:** Active

**Decision:** Era is applied to elements via `data-era="ancient|revolution|classical|modern|contemporary"` HTML attribute. CSS selects the correct accent color via attribute selectors: `[data-era="ancient"] { --era-color: var(--color-era-ancient); }`.

**Context:** This separates the era assignment (HTML, semantic) from the color implementation (CSS, presentation). Adding a 6th era requires only one CSS rule and one new color variable — no JS changes.

**Alternatives considered:**
- CSS class `.era-ancient` — works but class names collide with BEM naming conventions
- JS-applied inline styles — rejected: presentation in JS, harder to override
- Data attribute with JS color lookup — rejected: unnecessary JS for a CSS concern

**Consequences:**
- Every stop page must have `data-era` on its `.stop-page.container` element
- `nav.js` must set `data-era` on each rendered `.stop-card` element
- stop-shell.js reads `config.era` and sets `data-era` on the header — not yet implemented (Phase 5 polish item)

---

## DEC-011 · 2026-03-23 · Use \\(...\\) for inline KaTeX, $...$ only for display math

**Status:** Active

**Decision:** Inline math within running text uses `\(...\)` delimiters. Display equations (standalone lines) use `$$...$$`. Never use `$...$` for inline math.

**Context:** The `$...$` delimiter is unreliable when inline math appears inside mixed HTML/text content (e.g., `<li>` elements). KaTeX's auto-render fails to detect it in some DOM contexts. `\(...\)` is always parsed correctly.

**Consequences:**
- katex-init.js registers all four delimiters: `$$`, `\[`, `\(`, `$`
- All existing inline math in stops 020, 021, 022 converted to `\(...\)` during Phase 09 fix pass
- Future stops: write inline math as `\(...\)` from the start

---

## DEC-012 · 2026-03-23 · Stage-based timing for educational animations

**Status:** Active

**Decision:** Simulations that explain a process with distinct phases use an explicit state machine (e.g., `hold-start → action → hold-end`) rather than a continuous `t % PERIOD` loop.

**Context:** Continuous loops repeat too fast for users to read labels and understand what is happening. A state machine with deliberate hold durations at each phase gives users time to read before the next transition.

**Consequences:**
- Each stage has an explicit `dur` (seconds); `advanceTime(1/60)` called each frame
- `resetCycle()` restores `stageIdx=0, stageTime=0` on reset or slider change
- Demonstrated in stop 021 (Joule PE→KE→Heat)

---

## DEC-013 · 2026-03-23 · Physics scale must produce observable timescales

**Status:** Active

**Decision:** Before finalising any time-based simulation, verify that interesting state changes take 1–10 seconds at 60fps. Adjust physical constants (object size, mass, length) to hit this window.

**Context:** Stop 016 (Euler rotation) initially used R=0.12m objects. With τ=5 N·m, moment of inertia I≈0.01 kg·m², all shapes hit ω_max in <100ms — sliders appeared broken because everything maxed instantly. Switching to R=0.5m made divergence visible over 1–3 seconds.

**Consequences:**
- Physical constants in sims are representative/scaled, not real-world exact
- Comments in sim.js should note the scale rationale
- Rule of thumb: aim for 2–5 seconds from zero to max observable state

---

## DEC-010 · 2026-03-21 · Noise-based procedural galaxy background

**Status:** Active

**Decision:** Landing page galaxy background uses Perlin fBm noise rendered pixel-by-pixel into an offscreen canvas at 1/4 resolution, then scaled up via `drawImage`. Nebulae are procedural, not composed of stacked radial gradient ellipses.

**Context:** User requested a realistic galaxy background. Initial approach used stacked radial gradients — produced smooth colored blobs with no internal structure. Real nebulae have filamentary structure with dark voids punched through them. This requires per-pixel evaluation of noise functions, not gradient primitives.

**Alternatives considered:**
- Stacked radial gradient ellipses (8–20 per nebula) — rejected: still smooth blobs, no filament texture
- WebGL/shader — rejected: overkill for a static educational site, adds external dependency risk
- Pre-rendered PNG background image — rejected: large file size, not generative, can't tweak parameters

**Consequences:**
- `buildBackground()` runs once on page load (~120ms at 1/4 res) — acceptable cold-start cost
- All CSS color tokens changed from `oklch(... 285)` (blue-tinted) to `oklch(... 0)` (neutral) to eliminate background blue cast
- Dark radial vignette via `::before` on `.page-content` protects hero text legibility against bright nebula regions
- Noise parameters (threshold, intensity multiplier, NS scale) are the primary tuning levers for visual brightness
