# Phase 1: Foundation & Shell — Research

**Completed:** 2026-03-20
**Phase:** 01-foundation-shell
*(Retroactively documented — research was implicit during execution)*

---

## Don't Hand-Roll

### CSS color system
Use `oklch()` throughout instead of hex or hsl. oklch is perceptually uniform — equal numeric steps produce visually equal changes in lightness. This matters for era accent colors: you can derive 5 perceptually consistent accent colors by varying the hue channel alone.

**Reference:** MDN oklch, CSS Color Level 4 spec. Supported in all modern browsers since ~2023.

### Fluid typography
Use `clamp(min, preferred, max)` for font sizes instead of media query breakpoints. This gives smooth scaling between viewport widths with a single declaration. The `preferred` value should be a `vw` unit.

### Canvas sizing
Never hardcode canvas pixel dimensions. Always read from `getBoundingClientRect()` on the mount element. Set `canvas.width` and `canvas.height` from those values, and re-read on `window.resize`. This ensures simulations are responsive without explicit CSS rules on the canvas element.

### localStorage error handling
Always wrap `localStorage` access in try/catch. Safari Private Browsing throws a `SecurityError` on any localStorage operation. Degrade silently — visited-stop tracking is a convenience feature, not critical.

### WOFF2 font loading
`font-display: swap` is the correct setting for these fonts. It prevents invisible text during font load (FOIT) at the cost of a brief flash of fallback font (FOUT). For a display/educational site this is the right tradeoff. Never omit `font-display` on self-hosted fonts.

---

## Common Pitfalls

### stops.json fetch fails when opening from filesystem
`fetch()` is blocked by CORS policy when the page is opened via `file://` (double-clicking index.html). **Fix:** Always serve from a local HTTP server (`python3 -m http.server`). Document this prominently in README. The site works correctly when served — this is a development tooling issue, not a bug.

**Mitigation implemented:** `nav.js` catches the fetch error and shows a human-readable message suggesting `python3 -m http.server`.

### IntersectionObserver and canvas sizing race
If `IntersectionObserver` triggers `SimAPI.start()` before the canvas has been sized (e.g., because the stop is immediately in the viewport on load), the canvas may have 0x0 dimensions. **Fix:** Always size the canvas synchronously in `setup()` using `getBoundingClientRect()`, before any IntersectionObserver callback can fire. The observer is registered *after* setup completes.

### CSS `oklch()` with relative syntax (`oklch(from var() ...)`)
The CSS relative color syntax (`oklch(from var(--color) calc(l + 0.1) c h)`) has inconsistent browser support as of 2026. **Fix:** Avoid using it for critical UI elements. Use explicit oklch values for all accent colors instead of deriving them dynamically.

### `roundRect()` on canvas
`CanvasRenderingContext2D.roundRect()` is available in Chrome 99+, Firefox 112+, Safari 15.4+. This covers all modern browsers but excludes older versions. **Decision:** Use it — the project targets modern browsers. If polyfill needed in future: implement a simple `roundRect()` helper function.

### Sticky header z-index stacking context
`backdrop-filter` on the sticky header creates a new stacking context. Elements with high z-index inside transformed ancestors may appear above the header. **Fix:** Give the sticky header `z-index: 100` and the page content `position: relative; z-index: 1`. All simulation overlays use lower z-index values.

### Font face order matters
The browser uses the first `@font-face` block that matches a requested weight/style. Declare regular (400) before semibold (600) before bold (700). If italic variants are declared after regular, they must explicitly specify `font-style: italic` — the browser won't infer style from filename.

### `p` tag `max-width` in flexbox/grid containers
Setting `max-width: 68ch` on `p` elements is overridden when the `p` is a flex/grid child with `flex: 1`. **Fix:** Apply `max-width` on the text column wrapper (`.content-column`) rather than on individual `p` elements.
