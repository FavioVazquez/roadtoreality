# Phase 06: Foundation & UX Polish — Research

**Researched:** 2026-03-21
**Phase goal:** Deliver all cross-cutting infrastructure (KaTeX, Fuse.js search, global UX polish, stub page canvas teasers, mobile improvements) before simulation work begins in Phases 7–13.

---

## Don't Hand-Roll

| Problem | Recommended solution | Why |
|---------|---------------------|-----|
| Math equation rendering | KaTeX self-hosted (`assets/katex/`) with `auto-render.min.js` | Synchronous render, no layout shift, ~155 KB total, ~95% LaTeX coverage for all physics equations needed. MathJax is async and doubles the bundle. |
| Fuzzy search over 50 stops | Fuse.js self-hosted (`assets/js/vendor/fuse.min.js`) | No build step, ~10 KB, pass `stops.json` directly. Index creation <50ms, search <5ms for 50 docs. Pagefind requires a build step (rejected per DEC-002). |
| Stub page teaser animations | Vanilla Canvas 2D IIFE following the DEC-004 `window.SimAPI` contract | Same pattern as all 13 existing sims. p5.js is available in vendor/ if needed for complex particle systems, but most teaser concepts can be done in <100 lines of vanilla canvas. |
| Search modal keyboard focus trap | Manual DOM focus management, not a library | The modal is simple enough: one input + N result rows. Adding a focus-trap library adds a dependency that must be self-hosted. The pattern is well-understood: Tab/Shift-Tab cycles inside, Escape closes. |

---

## Common Pitfalls

### KaTeX: deferred JS fires before auto-render inline script runs

**What goes wrong:** The pattern `<script defer src="katex.min.js">` + `<script defer src="auto-render.min.js">` + an inline `<script>` calling `renderMathInElement()` — the inline script does NOT wait for deferred scripts. Deferred scripts run after DOM parse, but inline scripts run immediately. The inline init script calls `renderMathInElement` before `auto-render.min.js` has executed, throwing `renderMathInElement is not defined`.

**Why:** The `defer` attribute only applies to external scripts. An inline `<script>` without `defer` executes in document order, not after deferred scripts.

**How to avoid:** Put the `renderMathInElement` call inside a separate deferred external script file (e.g., `assets/js/katex-init.js`) that is also `defer`ed. Deferred scripts execute in document order relative to each other, so if `katex-init.js` appears after `auto-render.min.js` in the HTML, it runs after it. Alternatively, use `document.addEventListener('DOMContentLoaded', ...)` inside an inline script — but this does NOT guarantee that deferred external scripts have run first. The only safe pattern is: all three scripts external + `defer`.

Correct load order in each stop page `<body>` (before `</body>`):
```
<script defer src="../../assets/katex/katex.min.js"></script>
<script defer src="../../assets/katex/auto-render.min.js"></script>
<script defer src="../../assets/js/katex-init.js"></script>
```

### KaTeX: font path resolution from stop pages vs landing page

**What goes wrong:** KaTeX's CSS references fonts with relative paths like `fonts/KaTeX_Main-Regular.woff2`. When the CSS is at `assets/katex/katex.min.css`, the fonts must be at `assets/katex/fonts/`. This works correctly. The pitfall is if the planner puts fonts in `assets/fonts/` (where site fonts live) and edits the KaTeX CSS — this breaks on KaTeX upgrades.

**Why:** KaTeX CSS is generated and contains relative font paths that assume the `fonts/` directory is a sibling of the CSS file.

**How to avoid:** Keep the entire KaTeX distribution intact at `assets/katex/` with its internal `fonts/` subdirectory. Do not relocate KaTeX fonts to `assets/fonts/`. Do not edit `katex.min.css`.

### KaTeX: `$` delimiter conflicts with dollar sign text

**What goes wrong:** The `$...$` delimiter will match any text that happens to contain two dollar signs: prices, LaTeX-unrelated math prose ("the cost is $5 and the refund is $3"). On stop pages with text like "$5 million joules", this produces garbled output or a KaTeX render error.

**Why:** The auto-render extension scans all text nodes in `document.body` by default.

**How to avoid:** Set `throwOnError: false` in the auto-render config (already recommended in CROSSCUTTING.md). Additionally, scope the render call to a specific container (e.g., `document.querySelector('.takeaway-box')` or `document.querySelector('.stop-body')`) rather than `document.body`. The KaTeX equation for Phase 06 scope goes in the takeaway box only — a targeted container eliminates any ambiguity.

### Fuse.js: stop pages do not have stops.json pre-fetched

**What goes wrong:** On the landing page, `nav.js` fetches `stops.json` on load and the data is available. On individual stop pages, `nav.js` is not loaded — only `stop-shell.js` and `sim.js`. A naive `search.js` that assumes stops data is already in memory will fail on stop pages with a `ReferenceError` or an empty index.

**Why:** `nav.js` is landing-page-only (it renders the card grid). Stop pages load only `progress.js` and `stop-shell.js`. The stops.json fetch must happen in `search.js` itself on stop pages.

**How to avoid:** `search.js` must self-fetch `stops.json`. The fetch path differs between pages: the landing page is at root (`assets/data/stops.json`), and stop pages are at `stops/{slug}/index.html` (relative path: `../../assets/data/stops.json`). The cleanest solution for a static site without a base URL: include a `<meta name="stops-data-path" content="...">` or a global JS variable in each page's HTML that `search.js` reads. Alternatively, use an absolute path anchored to the GitHub Pages base URL (`/roadtoreality/Episodio4/assets/data/stops.json`) — but this hardcodes the deployment path. The most portable approach is a `data-stops-path` attribute on the search modal's container element, set per-page template.

**Simplest approach that works:** In each stop page, define `window.STOPS_DATA_PATH = '../../assets/data/stops.json'` before loading `search.js`. In `index.html`, define it as `'assets/data/stops.json'`. `search.js` reads `window.STOPS_DATA_PATH || 'assets/data/stops.json'`.

### Fuse.js: search modal and arrow key navigation conflict with stop-shell.js arrow nav

**What goes wrong:** Both `search.js` (keyboard nav inside modal results) and `stop-shell.js` (left/right arrow keys for prev/next stop) register `keydown` listeners on `document`. When the search modal is open and the user presses Arrow Down to move through results, `stop-shell.js` also fires and navigates away from the page.

**Why:** Both listeners receive the same `keydown` event. There is no shared state to suppress one from the other.

**How to avoid:** In `stop-shell.js`'s arrow key listener, add a guard that exits early if the search modal is open. A simple check: `if (document.getElementById('search-modal').getAttribute('aria-hidden') !== 'true') return;` — or check a CSS class like `.is-open`. The stop-shell.js listener must also already guard against focused inputs (sliders, any text input) — add `input[type="search"]` to that guard. Document the required DOM contract between the two files: the search modal must have a stable `id="search-modal"` and expose its open/closed state via an attribute or class.

### stop-shell.js: arrow key listener fires when a slider is focused

**What goes wrong:** `<input type="range">` uses left/right arrow keys for fine adjustment. If the arrow key listener in `stop-shell.js` does not guard against slider focus, pressing ArrowLeft on a slider navigates to the previous stop instead of adjusting the slider value.

**Why:** Arrow key events bubble from range inputs. `event.target` is the input element, not `document`.

**How to avoid:** In the keydown handler, check `document.activeElement` before acting:
```javascript
if (document.activeElement && (
  document.activeElement.tagName === 'INPUT' ||
  document.activeElement.tagName === 'TEXTAREA' ||
  document.activeElement.tagName === 'SELECT'
)) return;
```
This is the standard guard for this pattern. The UX-POLISH.md research already notes "only fires when no input is focused."

### stop-shell.js: `data-autoplay` and IntersectionObserver double-start

**What goes wrong:** The current `_initSimObserver()` calls `api.start()` unconditionally when the sim-mount enters the viewport. If `data-autoplay="false"` is set, the observer must NOT call `api.start()` on intersection. But the play button listener also calls `api.start()`. If the observer fires before the user clicks play, the sim starts even with `data-autoplay="false"`.

**Why:** The `IntersectionObserver` fires immediately if the observed element is already in the viewport when `observe()` is called — which is always the case for the sim on load, since the user starts at the top of the page.

**How to avoid:** The `data-autoplay` attribute lives on `.sim-wrapper`, not on `#sim-mount`. The observer watches `#sim-mount`. The observer callback should read the wrapper's attribute:
```javascript
var wrapper = mount.closest('.sim-wrapper');
var autoplay = wrapper ? wrapper.dataset.autoplay !== 'false' : true;
if (entry.isIntersecting && autoplay) api.start();
```
This also means the IntersectionObserver still calls `api.pause()` when the sim leaves the viewport, regardless of autoplay — that is correct behavior for performance.

Additionally: when `data-autoplay="false"`, the play button's initial `data-state` must remain `'paused'`, and the sim should start in its initial/reset state. The existing `_bindPlayButton()` already handles this correctly because it checks `btn.dataset.state`.

### CSS: line-height 1.9 on elements with explicit overrides

**What goes wrong:** Setting `body { line-height: 1.9; }` in `base.css` is a global change, but several elements in `simulation.css` and `components.css` have explicit `line-height` values that will NOT be affected (e.g., `.stop-intro { line-height: 1.8; }`, `.stop-body p { line-height: 1.8; }`, `.stop-bridge { line-height: 1.7; }`, `.takeaway-box__list li { line-height: 1.6; }`, `h1–h6 { line-height: 1.2; }`). These will stay at their hardcoded values.

**What is actually affected by the body change:** Only elements that inherit `line-height` without overriding it — primarily the `.stop-intro` fallback if it inherits, `.sim-controls` labels, breadcrumb text, footer text, and any plain `<p>` tags without extra selectors.

**How to avoid confusion:** The planner should decide whether the intent is (a) change only the base body default (affecting inheritance fallbacks), or (b) systematically update all long-form reading content. If (b), the change must also update `.stop-intro`, `.stop-body p`, and `.stop-bridge` line-height values explicitly. Given the CONTEXT.md says "body line-height increased to 1.9," approach (a) is sufficient and low-risk.

### CSS: `--color-text-muted` is used in many places

**What goes wrong:** Changing `--color-text-muted` from `oklch(0.50 0.02 90)` to `oklch(0.55 0.02 90)` lightens every element that uses this token. This includes: `.breadcrumb`, `.sim-caption`, `.sim-control__label`, `.stop-header__meta`, `.stop-card__meta`, `.era-timeline__dates`, `.era-section__tagline`, `.site-footer`, `.hero__stat-label`, `.era-tab` (default state). All of these become slightly lighter — which is the intent (improved contrast), but the planner should visually verify that `.sim-caption` and `.era-tab` (which use muted color as their base resting state) still feel clearly muted and do not become too prominent.

**How to avoid:** The change is one line in `:root` in `base.css`. No cascade side effects beyond the token's consumers. The risk is low — 0.55 L in oklch is still clearly subordinate to `--color-text-secondary` at 0.70 L. The change is safe to make.

### stub-shell.js vs stop-shell.js: load order with no sim.js on stubs

**What goes wrong:** The existing stop page template loads `stop-shell.js`, which calls `_initSimObserver()`. On a stub page, there is no `sim.js` and no `window.SimAPI`. The observer fires when `#sim-mount` is intersected and does `var api = window.SimAPI; if (!api) return;` — which is safe (there is a null guard). However, the play and reset button listeners are also bound by `stop-shell.js`. On a stub page, if the stub teaser canvas exposes `window.SimAPI`, those buttons will work. If the stub page uses a different element id for the canvas mount (not `#sim-mount`), the observer will never fire.

**How to avoid:** Stub pages must use the same DOM structure as implemented stop pages: `id="sim-mount"` for the canvas container, `id="sim-play-btn"` and `id="sim-reset-btn"` for buttons, and `.sim-wrapper` with optional `data-autoplay`. The stub's `sim.js`-equivalent (call it the teaser script) must set `window.SimAPI = { start, pause, reset, destroy }` before `stop-shell.js` wires up the observer. Alternatively, the teaser script can be inline in the stub's HTML, loaded before `stop-shell.js`. Either approach works; the key is load order: teaser script first, `stop-shell.js` second.

### nav.js: stub cards currently render as `<div>` with `pointer-events: none`

**What goes wrong:** In `nav.js` `_cardHtml()`, stub cards use `tag = 'div'` and `href = '#'` with `aria-hidden="true"`. The `.stop-card--stub` CSS rule applies `pointer-events: none; cursor: default; opacity: 0.5`. To make stubs clickable, three things must change in concert: (1) `nav.js` must change `tag` to `'a'` and set `href` to the stub stop path, (2) the CSS `.stop-card--stub` rule must remove `pointer-events: none` and `opacity: 0.5`, and (3) the "Coming soon" `::after` pseudo-element becomes a real badge element in the card HTML (since `::after` positioning cannot be easily styled as a pill without layout hacks when the card is a block element).

**How to avoid:** The planner must coordinate the nav.js `_cardHtml()` change with the CSS `.stop-card--stub` change. They are tightly coupled — changing one without the other either makes stubs clickable but still visually disabled, or makes them look interactive but still not navigate anywhere.

---

## Existing Patterns in This Codebase

- **IIFE module pattern:** All JS is `(function() { 'use strict'; ... }())`. Every new file (`search.js`, `katex-init.js`, any stub teaser scripts) must follow this same pattern. No ES module syntax (`import`/`export`). No arrow functions or `const`/`let` if ES5 compatibility is strictly needed — though the site already uses `Array.from`, `fetch`, `IntersectionObserver`, so ES2017+ is fine in practice.

- **`window.SimAPI` contract (DEC-004):** Every simulation (including stub teasers) exposes `{ start, pause, reset, destroy }` on `window.SimAPI`. `stop-shell.js` calls these without knowing sim internals. Stub teasers must follow this exactly or `stop-shell.js`'s play/pause/reset buttons will silently fail.

- **`#stop-config` JSON script tag:** Each stop page embeds its metadata (id, order, era, title, prev, next, prevTitle, nextTitle) as `<script id="stop-config" type="application/json">`. `stop-shell.js` reads this with `JSON.parse(document.getElementById('stop-config').textContent)`. Stub pages use the same config block — this is already present in the 38 stub pages that exist.

- **`data-era` attribute for era colors (DEC-009):** Era colors cascade from the `data-era` attribute on `.stop-page.container`. The CSS rule `[data-era="ancient"] { --era-stop-color: ... }` in `simulation.css` propagates the era accent color to all child elements. Stub pages already have `data-era` set on their `.stop-page` element. Any new elements in stub pages or search modal results that need era coloring should read from this same token system.

- **oklch color token system (DEC-005):** All colors are oklch. The search modal must use existing tokens from `:root` in `base.css` (`--color-void`, `--color-deep`, `--color-surface`, `--color-raised`, `--color-text-primary`, etc.) and era color tokens (`--era-*-color`). Do not introduce hex values in `search.css`.

- **Relative path depth:** Stop pages are at `stops/{id}/index.html` — two levels deep from `Episodio4/`. All asset references use `../../assets/...`. New CSS files (`search.css`, `stub.css`) added to `assets/css/` are referenced with `../../assets/css/search.css` from stop pages. The landing page uses `assets/css/search.css` (no prefix).

- **`stops.json` `isStub` field:** 38 of 50 stops have `"isStub": true`. The `description` field is already populated for all 50 stops — stub pages can render the description as the concept preview without any data changes.

- **`stops.json` `prev`/`next` fields:** All navigation chains are already established in `stops.json`. Stub page nav uses the same `cfg.prev`/`cfg.next` fields that `stop-shell.js` already reads for `_renderStopNav()`. No changes needed to stops.json for stub navigation.

- **Vendor libs in `assets/js/vendor/`:** p5.min.js and matter.min.js are already there. Fuse.js goes at `assets/js/vendor/fuse.min.js`. KaTeX is a special case — it is a full distribution with fonts, so it gets its own `assets/katex/` directory per DEC-002 / CONTEXT.md decision.

- **`.stop-card--stub` CSS rule:** Currently in `components.css` lines 222–237. The `::after` pseudo-element adds "Coming soon" text. Both the opacity/pointer-events suppression and the `::after` content will need modification in this phase.

- **IntersectionObserver for sim lifecycle:** `stop-shell.js` uses a 0.15 threshold on `#sim-mount`. Stub teaser sims should also be observed at this threshold — they should pause when scrolled off-screen (especially important if multiple stubs in sequence). Since stub pages use `stop-shell.js` unchanged, this is automatic if the teaser exposes `window.SimAPI.pause()`.

- **`prefers-reduced-motion` handling:** The landing page galaxy background already checks `window.matchMedia('(prefers-reduced-motion: reduce)')` and falls back to a static render. Stub teaser canvas animations and the skeleton shimmer should follow the same pattern — check `prefers-reduced-motion` and reduce or eliminate animation if set. The `base.css` reset already applies `animation-duration: 0.01ms !important` to all elements under this media query — CSS animations on skeleton screens will be suppressed automatically. Canvas-based teaser animations must check manually.

---

## Recommended Approach

Phase 06 should be implemented in five sequential sub-tasks, each independently testable: (1) self-host KaTeX and wire it up with a shared `katex-init.js` deferred script added to all 50 stop page templates, plus add equations to the 13 implemented stops' takeaway boxes; (2) implement `search.js` + `search.css` with a per-page `window.STOPS_DATA_PATH` variable to handle path differences between landing and stop pages, and update both `index.html` and stop page templates to include the search modal HTML skeleton; (3) modify `stop-shell.js` to add arrow key navigation (with active-element guard) and `data-autoplay` reading in the IntersectionObserver; (4) upgrade `nav.js` `_cardHtml()` and `components.css` `.stop-card--stub` simultaneously to make stubs clickable with a Coming Soon pill, then build stub page HTML templates with rich canvas teaser animations following the `window.SimAPI` contract; (5) apply CSS polish (line-height, muted color token, mobile sim viewport, slider touch targets). The KaTeX and CSS polish sub-tasks are lowest risk and highest value to ship first.
