# Phase 07: Open Graph Images — Research

**Researched:** 2026-03-22
**Phase goal:** Generate a 1200×630 SVG social sharing image for every stop (all 50) and inject 5 OG + Twitter Card meta tags into every stop's `index.html`.

---

## Don't Hand-Roll

| Problem | Recommended solution | Why |
|---------|---------------------|-----|
| oklch-to-hex conversion | Inline math in the script (oklch → oklab → linear sRGB → sRGB → hex) | No dependency needed; Node 20 has no built-in color conversion; the math is short and exact |
| HTML meta tag injection | String-based `replace()` targeting the existing `<meta name="description">` line | All 50 stop pages have a consistent head structure; regex or string replacement on a known anchor is reliable and avoids a DOM parser dependency |
| SVG text escaping | A small `escapeXml()` helper: replace `&`, `<`, `>`, `"`, `'` with XML entities | 15 stop titles contain apostrophes (e.g., "Aristotle's Theory of Motion") and will corrupt SVG if not escaped |

---

## Common Pitfalls

### oklch is not supported in SVG renderers for social crawlers
**What goes wrong:** Writing `fill="oklch(0.72 0.12 60)"` in SVG is valid CSS Color Level 4 but SVG renderers in Chromium-based headless crawlers (Twitter, LinkedIn, Facebook) may not honor it, producing black or fallback fills.

**Why:** Social crawlers render `og:image` content using their own image-fetching stack, which often uses an older Chromium or a custom renderer. CSS Color Level 4 support in SVG fill attributes is inconsistent in headless contexts.

**How to avoid:** Use pre-converted hex values for all SVG `fill` attributes. The five era hex equivalents (computed from the canonical oklch values) are:
- `ancient` → `#db9152` (oklch 0.72 0.12 60)
- `revolution` → `#61bd67` (oklch 0.72 0.15 145)
- `classical` → `#0099f0` (oklch 0.65 0.18 240)
- `modern` → `#be6df2` (oklch 0.68 0.20 310)
- `contemporary` → `#ff4a5d` (oklch 0.68 0.22 20)

The dark background colors (for the SVG body) are near-black; `oklch(0.10 0 0)` can safely be expressed as `#1a1a1a` without perceptual difference.

### SVG og:image is not reliably rendered by Twitter and LinkedIn
**What goes wrong:** Twitter's card crawler does not officially support SVG as an `og:image` format. It accepts JPG, PNG, WEBP, and GIF. LinkedIn and Facebook also have inconsistent SVG support. A shared link may show a broken preview or no image at all.

**Why:** The OG spec does not mandate SVG support. Crawlers only guarantee raster format rendering.

**How to avoid:** The CROSSCUTTING.md research document explicitly acknowledges this: ship SVG in Phase 07 (v2.0) and convert to PNG with Playwright if social rendering proves inconsistent. This is already documented as a v3.0 candidate in REQUIREMENTS.md. The planner should note this limitation clearly in the plan so the executor does not consider it a bug when previews don't render on Twitter.

### Missing `/Episodio4/` in the og:image URL
**What goes wrong:** CONTEXT.md (line 66) states the og:image URL as `https://faviovazquez.github.io/roadtoreality/stops/{stop-id}/og-image.svg`, omitting `/Episodio4/`. This URL would 404.

**Why:** The GitHub Pages `gh-pages` branch deploys the _contents_ of `Episodio4/` at the repo root (`https://faviovazquez.github.io/roadtoreality/`), not the `Episodio4/` subdirectory itself. The `stops/` directory is at the `gh-pages` root, so the correct URL is:
```
https://faviovazquez.github.io/roadtoreality/stops/{stop-id}/og-image.svg
```
This matches CONTEXT.md. The CROSSCUTTING.md example (`/Episodio4/stops/...`) is the older, incorrect pattern. The script should use `https://faviovazquez.github.io/roadtoreality/stops/{stop-id}/og-image.svg`.

### SVG `<text>` does not wrap automatically
**What goes wrong:** SVG has no native text wrapping. Long titles written in a single `<text>` element will overflow the 1200px canvas or get clipped.

**Why:** SVG `<text>` places characters along a baseline without line-break logic.

**How to avoid:** The longest title is 38 characters ("Special Relativity: Length Contraction"). At 60px Georgia bold, this renders at roughly 1000px — tight but fits on one line at x=80 with 80px right margin. The planner should verify the font-size choice accommodates the longest title without overflow. A simple rule: at 60px, a 38-char title in Georgia fits within 1100px. Reduce to 52px if a safety margin is needed. No manual word-wrap logic is required given the actual data.

### Scientist name "Lemaître, Hubble & Penzias/Wilson" contains a special character
**What goes wrong:** The accent in "Lemaître" (`è`) is a multi-byte UTF-8 character. SVG handles UTF-8 correctly as long as the file encoding is UTF-8 and the XML declaration or `charset=UTF-8` is present. The `/` in "Penzias/Wilson" and `&` in the name are also present.

**Why:** `&` in SVG text content must be escaped as `&amp;`. The slash is fine unescaped. The `è` character is fine in UTF-8 SVG.

**How to avoid:** The `escapeXml()` helper must convert `&` → `&amp;`. Verify the script writes SVG files with UTF-8 encoding (Node.js default for `fs.writeFileSync` with a string).

### Meta tag injection must not duplicate on re-runs
**What goes wrong:** If the script is run twice, a naive string injection appends the 5 meta tags a second time, producing duplicate OG tags that some parsers handle unpredictably.

**Why:** The script is explicitly designed to be idempotent (CONTEXT.md line 36).

**How to avoid:** Before injecting, check whether the file already contains `property="og:title"`. If found, skip injection (or replace the block). A simple guard: `if (html.includes('property="og:title"')) { /* already injected, skip */ }`.

### `stops.json` `id` field — the stop directory name is the `id` field, not the `slug`
**What goes wrong:** The `slug` field (e.g., `thales-natural-causes`) is different from the `id` field (e.g., `001-thales-natural-causes`). The stop directories are named after the `id`. Using `slug` to construct the file path would result in the SVG being written to a non-existent directory.

**Why:** Both fields exist in the JSON with different formats. The directory name always matches `id`.

**How to avoid:** Use `stop.id` (not `stop.slug`) for the directory path: `Episodio4/stops/${stop.id}/og-image.svg`.

### The `<meta name="description">` tag is the injection anchor, but it appears on line 6 in all 50 files
**What goes wrong:** If a stop page's head is ever restructured (e.g., KaTeX link inserted before the description tag), a positional injection would break.

**Why:** The injection relies on finding the existing `<meta name="description">` tag and inserting OG tags after it.

**How to avoid:** Use `String.replace()` with the pattern `/<meta name="description"[^>]+>/ ` and append the OG block after it, rather than relying on line number. All 50 current stop pages have `<meta name="description">` on line 6 with a consistent format.

---

## Existing Patterns in This Codebase

- **stops.json as source of truth:** Located at `Episodio4/assets/data/stops.json`. Contains all 50 stops with `id`, `slug`, `title`, `subtitle`, `scientist`, `yearLabel`, `era`, `description`, `isStub`, `path`. Every field needed for SVG generation is present. No stops are missing a `description` field (verified).

- **Stop directory naming:** All 50 stop directories exist under `Episodio4/stops/` and are named by `id` (e.g., `001-thales-natural-causes`). All 50 have `index.html`. None have `og-image.svg` yet.

- **Head section structure:** All 50 stop pages have an identical `<head>` structure: `charset` → `viewport` → `meta description` → `<title>` → CSS links → `</head>`. The `<meta name="description">` tag is always present and always uses single-line format. No OG tags exist anywhere in the site yet.

- **Era color tokens (CSS):** Defined in `Episodio4/assets/css/base.css` lines 24–28. The five era names match the `era` field values in stops.json exactly: `ancient`, `revolution`, `classical`, `modern`, `contemporary`.

- **Apostrophe-containing titles:** 15 titles use apostrophes (e.g., "Galileo's Pendulum", "Maxwell's Equations"). These require `&apos;` or `&#39;` in SVG `<text>` content and `&amp;apos;` or `&#39;` in HTML attribute values. The SVG escaping and the HTML meta tag escaping are separate concerns.

- **gh-pages deployment:** The `gh-pages` branch serves the contents of `Episodio4/` at the repo root. Deployed stop pages live at `https://faviovazquez.github.io/roadtoreality/stops/{id}/index.html`. Confirmed by inspecting the `origin/gh-pages` branch tree.

- **scripts/ directory:** Does not yet exist at repo root. The script must create it or the plan must include creating the directory before writing the script.

---

## Recommended Approach

The script `scripts/generate-og-svgs.mjs` should perform two passes over the 50 stops: first write an SVG to `Episodio4/stops/${stop.id}/og-image.svg` using pre-converted hex colors (not oklch), then inject the 5 meta tags into `Episodio4/stops/${stop.id}/index.html` after the `<meta name="description">` tag, guarded by an idempotency check. All SVG text content and HTML attribute values must pass through an `escapeXml()` helper to handle the 15 apostrophe-containing titles and the one `&`-containing scientist name. The `og:image` URL must use the full path `https://faviovazquez.github.io/roadtoreality/stops/${stop.id}/og-image.svg` (no `/Episodio4/` segment, because gh-pages serves Episodio4 content at the site root). The planner should note that SVG og:image rendering on Twitter and LinkedIn is unreliable and a PNG conversion path via Playwright is already documented as a potential follow-up.
