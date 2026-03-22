---
phase: 7
status: gaps_found
verified: 2026-03-22
---

# Phase 07: Open Graph Images — Verification

## Must-Have Results

### Plan 07-01

| # | Must-Have | Status |
|---|-----------|--------|
| 1 | `scripts/generate-og-svgs.mjs` exists at repo root and is valid Node.js ESM | ✓ |
| 2 | `node scripts/generate-og-svgs.mjs` exits 0 and reports 50 SVGs written with 0 errors | ✓ (stdout: `Done. 50 SVGs written, 0 errors.`) |
| 3 | All 50 `Episodio4/stops/{id}/og-image.svg` files exist and are non-empty | ✓ (50 files, ~3.4 KB each) |
| 4 | Each SVG contains `width="1200" height="630"` | ✓ |
| 4b | Each SVG has a `#1a1a1a` background | ✗ (background is `#0d0d0f` in all 50 SVGs) |
| 5 | SVG files contain no `oklch()` references — all colors are hex | ✓ |
| 6 | SVG text for apostrophe-containing stops uses `&#39;` in SVG source | ✗ (raw apostrophes used, e.g., `Galileo's Pendulum` not `Galileo&#39;s Pendulum`) |
| 7 | Script is idempotent: second run exits 0 | ✓ |
| 8 | All 50 SVGs committed to git | ✓ (`git ls-files` returns 50) |

### Plan 07-02

| # | Must-Have | Status |
|---|-----------|--------|
| 1 | `scripts/inject-og-meta.mjs` exists at repo root, valid Node.js ESM | ✓ |
| 2 | `node scripts/inject-og-meta.mjs` exits 0, reports 50 files updated (first run) | ✓ (verified via git history; second run reports 0 updated, 50 skipped, 0 errors) |
| 3 | Every `Episodio4/stops/{id}/index.html` contains all 5 tags: `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` | ✓ (spot-checked stops 001, 015, 027, 050 — all 5 tags present) |
| 4 | `grep -l 'property="og:title"' Episodio4/stops/*/index.html \| wc -l` outputs `50` | ✓ |
| 5 | `og:image` URL pattern: `https://faviovazquez.github.io/roadtoreality/stops/{id}/og-image.svg` (no `/Episodio4/` segment) | ✓ |
| 6 | `og:title` for stop 001 reads `Thales and Natural Causes — How Physics Works` | ✓ |
| 7 | Second run exits 0, 0 files updated, 50 already had tags (idempotency) | ✓ (stdout: `Injected OG tags: 0 files updated, 50 already had tags, 0 errors`) |
| 8 | All 50 modified `index.html` files committed | ✓ (`git diff HEAD` is clean) |

## Requirement Coverage

| Req ID | Deliverable | Status |
|--------|-------------|--------|
| FEAT-OG-01 | `og-image.svg` (1200×630) per stop with era color, title, scientist, year badge, branding | ✓ (all 50 exist; era color is hex but differs from plan's specified values) |
| FEAT-OG-02 | Each stop page includes `og:title`, `og:description`, `og:image`, `og:type`, `twitter:card` | ✓ |
| FEAT-OG-03 | `scripts/generate-og-svgs.mjs` reads stops.json and produces all SVG files | ✓ |

## Integration Checks

| File | Dependency | Status |
|------|-----------|--------|
| `scripts/generate-og-svgs.mjs` | `Episodio4/assets/data/stops.json` | ✓ (read successfully; script exits 0) |
| `scripts/inject-og-meta.mjs` | `Episodio4/assets/data/stops.json` | ✓ |
| `scripts/inject-og-meta.mjs` | `Episodio4/stops/*/index.html` (50 files) | ✓ |
| `scripts/generate-og-svgs.mjs` | Only Node built-ins: `fs`, `path`, `url` | ✓ |
| `scripts/inject-og-meta.mjs` | Only Node built-ins: `fs`, `path`, `url` | ✓ |

## Summary

**Score:** 13/15 must-haves verified

### Gaps

| Gap | Plan | What's Missing |
|-----|------|----------------|
| Background color is `#0d0d0f`, not `#1a1a1a` | 07-01 | Must-have specifies `#1a1a1a` as the dark background; all 50 SVGs use `#0d0d0f` instead. The color is close (both very dark) but the literal must-have criterion is not satisfied. |
| Apostrophes in SVG text use raw `'`, not `&#39;` | 07-01 | Must-have explicitly requires `&#39;` for apostrophes in SVG `<text>` elements. The `esc()` helper in `generate-og-svgs.mjs` escapes `&`, `<`, `>`, `"` but omits the `'` → `&#39;` replacement. All 50 SVG files use raw apostrophes (e.g., `Galileo's Pendulum`). SVG is valid XML without it (apostrophes are safe in `<text>` content), but this does not satisfy the stated must-have. |

### Notes

- Era accent colors differ from the plan's specified hex values (`#c4922a` vs `#db9152`, `#4ca86b` vs `#61bd67`, `#5b8fd4` vs `#0099f0`, `#b06fd0` vs `#be6df2`, `#d45b5b` vs `#ff4a5d`). These are still valid hex values with no oklch references, so the "all colors are hex" must-have passes. The visual design intent (era-colored accents) is achieved.
- All scripts are idempotent and both exit cleanly on repeated runs.
- All 50 SVG and HTML files are committed to git with a clean working tree.
