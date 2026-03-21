# Cross-Cutting Features Research: Search, KaTeX, Open Graph Images
> Research for v2.0 milestone — compiled 2026-03-21

---

## 1. Client-Side Search

### Library Comparison

| Feature | Fuse.js | Lunr.js | Pagefind | MiniSearch | FlexSearch |
|---------|---------|---------|----------|-----------|-----------|
| No build step | ✓ | ✓ | ✗ (requires build) | ✓ | ✓ |
| CDN available | jsDelivr | jsDelivr | No CDN | npm/self-host | npm/self-host |
| Index size (50 docs) | ~15–20 KB | ~30–50 KB | ~10–15 KB | ~10–20 KB | ~20–30 KB |
| Search latency | <5ms | <10ms | <2ms | <3ms | <2ms |
| Setup complexity | Very simple | Simple | Medium | Very simple | Medium |
| Fuzzy search | Yes (default) | Yes | Yes | Yes | Yes |

### Decision: **Fuse.js**

**Why:** No build step + CDN (jsDelivr). Simplest integration — pass `stops.json` directly. Fuzzy matching catches typos ("thals" → Thales). ~10 KB minified. Pagefind rejected (requires build step, violates no-build constraint). Lunr.js has a larger serialized index and more setup for 50 docs.

### Implementation

```javascript
// Load stops.json (already fetched by nav.js — share the data)
const fuse = new Fuse(stopsData, {
  keys: ['title', 'subtitle', 'scientist', 'description', 'era'],
  includeScore: true,
  threshold: 0.4
});

// Cmd/Ctrl+K to open
document.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault();
    openSearchModal(fuse);
  }
});
```

### Search UI

- Dark modal overlay matching site aesthetic
- Real-time results, debounced 200ms
- Result cards: stop title, scientist, era, highlighted match
- Keyboard nav: arrow keys to move results, Enter to navigate
- Close: Escape or click outside

### Performance

- Index creation: <50ms
- Search latency: <3ms for 50 documents
- Memory: ~30 KB in-memory index
- Network: ~10 KB (fuse.min.js) + stops.json (already loaded)

### Files needed

- `assets/js/fuse.min.js` (self-hosted from jsDelivr download)
- `assets/js/search.js` (~200 lines: Fuse instance, modal, keyboard handlers)
- `assets/css/search.css` (~150 lines: modal styles, result cards)
- Search modal HTML skeleton in `index.html` and each stop page

---

## 2. KaTeX Equation Rendering

### KaTeX vs MathJax

| Metric | KaTeX | MathJax 3 |
|--------|-------|-----------|
| First render | 50–100ms | 150–300ms |
| Render mode | Synchronous (fast) | Async |
| LaTeX subset | ~95% | ~99% |
| Bundle (self-hosted) | ~150 KB (CSS + fonts) | ~300 KB |
| Auto-render extension | Built-in, simple | Built-in, complex config |
| Accessibility | Limited | Full (MathML) |

### Decision: **KaTeX with self-hosted fonts**

**Why:** Synchronous rendering (no layout shift). Auto-render extension scans `$...$` and `$$...$$` out of the box. 95% LaTeX coverage handles all physics education equations. ~150 KB self-hosted (fonts + CSS + JS) — worth it for instant render. MathJax is overkill for this use case.

### Files to self-host

```
assets/katex/
├── katex.min.css          (~10 KB)
├── katex.min.js           (~70 KB)
├── auto-render.min.js     (~8 KB)
└── fonts/                 (~60 KB total, ~14 woff2 files)
    ├── KaTeX_AMS-Regular.woff2
    ├── KaTeX_Main-Regular.woff2
    ├── KaTeX_Math-Italic.woff2
    └── ... (all fonts from katex/dist/fonts/)
```

**Total: ~155 KB**

### Initialization pattern

In `<head>`:
```html
<link rel="stylesheet" href="../../assets/katex/katex.min.css">
```

Before `</body>`:
```html
<script defer src="../../assets/katex/katex.min.js"></script>
<script defer src="../../assets/katex/auto-render.min.js"></script>
<script>
  document.addEventListener("DOMContentLoaded", () => {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$',  right: '$',  display: false }
      ],
      throwOnError: false
    });
  });
</script>
```

### Loading strategy

- CSS in `<head>` for above-fold equations
- JS deferred — doesn't block rendering
- Fonts loaded by CSS, cached after first page

### Performance

- First equation render: 50–80ms
- Layout shift: none (KaTeX accounts for font metrics)
- Repeat pages: fonts cached, ~0ms overhead

---

## 3. Open Graph Images Per Stop

### Options Analysis

| Approach | Pros | Cons |
|----------|------|------|
| Pre-generated PNG (Playwright) | Works everywhere, best quality | Requires Node.js script to run (optional build step) |
| SVG per stop | No build step, 3–5 KB each, version control friendly | Some social platforms inconsistent with SVG |
| Canvas on-the-fly | Dynamic | OG happens before page load — not viable |
| Cloudflare Workers | Edge delivery | Overkill for static site |

### Decision: **SVG first (v2.0) + Playwright PNG conversion if needed**

**Phase 1 (ship with v2.0):** Static SVG per stop in `stops/{slug}/og-image.svg`. Add `og:image` meta tag to each stop page.

**Phase 2 (if SVG rendering is inconsistent on social platforms):** Run a one-off Playwright script to convert all SVGs to 1200×630 PNGs. Update `og:image` URLs.

### OG Image spec (1200 × 630 px, 1.9:1 ratio)

Required elements:
1. **Background:** Era-specific dark color
   - Ancient: `oklch(0.22 0.04 50)` (ochre)
   - Revolution: `oklch(0.22 0.04 140)` (olive)
   - Classical: `oklch(0.22 0.04 240)` (slate)
   - Modern: `oklch(0.22 0.04 320)` (burgundy)
   - Contemporary: `oklch(0.22 0.04 30)` (amber)
2. **Stop title:** 64px bold, white, Cormorant Garamond (web-safe fallback: Georgia)
3. **Scientist name:** 36px, era accent color, DM Sans (web-safe: system-ui)
4. **Year/era badge:** 18px, muted, rounded rect background
5. **Site branding:** "How Physics Works" small text, bottom right, muted

### SVG template

```svg
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <rect width="1200" height="630" fill="#2a1f14"/>
  <!-- Era color accent bar, left edge -->
  <rect width="8" height="630" fill="#c8a060"/>
  <!-- Title -->
  <text x="80" y="260" font-size="60" font-weight="700" fill="white" font-family="Georgia, serif">
    Thales and Natural Causes
  </text>
  <!-- Scientist -->
  <text x="80" y="340" font-size="34" fill="#c8a060" font-family="system-ui, sans-serif">
    Thales of Miletus
  </text>
  <!-- Era + year badge -->
  <rect x="80" y="380" width="220" height="36" rx="18" fill="rgba(255,255,255,0.12)"/>
  <text x="190" y="403" text-anchor="middle" font-size="16" fill="rgba(255,255,255,0.7)" font-family="system-ui">
    Ancient · ~600 BCE
  </text>
  <!-- Branding -->
  <text x="1140" y="610" text-anchor="end" font-size="16" fill="rgba(255,255,255,0.4)" font-family="system-ui">
    How Physics Works
  </text>
</svg>
```

### Meta tags in each stop page

```html
<meta property="og:title" content="Thales and Natural Causes — How Physics Works">
<meta property="og:description" content="Thales of Miletus (~600 BCE) proposed that natural phenomena have natural causes — the first step toward science.">
<meta property="og:image" content="https://faviovazquez.github.io/roadtoreality/Episodio4/stops/thales-natural-causes/og-image.svg">
<meta property="og:type" content="article">
<meta name="twitter:card" content="summary_large_image">
```

### Implementation plan

- Create a Node.js script `scripts/generate-og-svgs.mjs` that reads `stops.json` and writes one SVG per stop (runs once, not in CI)
- Add meta tags to stop page template (`stop-shell.js` or manually per stop)
- Test on Twitter Card Validator, LinkedIn Post Inspector, Facebook Sharing Debugger

---

## Summary

| Feature | Library/Tool | CDN | Self-host | Build step | Bundle |
|---------|-------------|-----|-----------|-----------|--------|
| Search | Fuse.js | jsDelivr | Optional | No | ~10 KB |
| Equations | KaTeX | CDN optional | Fonts: yes | No | ~155 KB |
| OG Images | SVG files | N/A | Yes | No (v1) | ~200 KB total |

**Total new assets for v2.0:**
- JS: ~10 KB (Fuse.js) + ~78 KB (KaTeX)
- CSS: ~10 KB (KaTeX) + ~5 KB (search modal)
- Fonts: ~60 KB (KaTeX woff2)
- SVG images: ~4 KB × 50 = ~200 KB
- **Net addition: ~365 KB** — reasonable for a full physics education site
