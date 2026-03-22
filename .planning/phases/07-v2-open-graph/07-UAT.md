---
status: complete
phase: 07-v2-open-graph
source:
  - 07-01-SUMMARY.md
  - 07-02-SUMMARY.md
started: 2026-03-22T00:00:00Z
updated: 2026-03-22T00:00:00Z
---

## Tests

### 1. All 50 SVG files exist
expected: `ls Episodio4/stops/*/og-image.svg | wc -l` outputs 50
result: pass

### 2. SVG visual inspection — ancient era stop
expected: Open `Episodio4/stops/001-thales-natural-causes/og-image.svg` in a browser. Should see a 1200×630 dark canvas (#1a1a1a) with a warm amber/gold accent bar on the left, the title "Thales and Natural Causes", scientist name "Thales of Miletus", year label "~600 BCE", and "How Physics Works" branding.
result: pass
note: Ghost number repositioned to lower-right (260px, 7% opacity). Small "Stop XX" badge removed.

### 3. SVG visual inspection — modern era stop
expected: Open `Episodio4/stops/037-heisenberg-uncertainty/og-image.svg` in a browser. Should see purple/violet era accent color, title "Heisenberg and Uncertainty", scientist "Werner Heisenberg", year label "1927".
result: pass

### 4. SVG apostrophe escaping
expected: Run `grep "&#39;" Episodio4/stops/009-galileo-inclined-plane/og-image.svg`. Should output the title line containing `Galileo&#39;s Inclined Plane`.
result: pass

### 5. No oklch in any SVG
expected: Run `grep -r "oklch" Episodio4/stops/*/og-image.svg`. Should return no output (zero matches).
result: pass

### 6. All 50 stop pages have OG meta tags
expected: Run `grep -l 'property="og:title"' Episodio4/stops/*/index.html | wc -l`. Should output 50.
result: pass

### 7. OG meta tags are correct on stop 001
expected: Run `grep -A5 'name="description"' Episodio4/stops/001-thales-natural-causes/index.html | head -10`. Should show all 5 tags: og:title with "Thales and Natural Causes — How Physics Works", og:description, og:image URL at `https://faviovazquez.github.io/roadtoreality/stops/001-thales-natural-causes/og-image.svg`, og:type="article", twitter:card="summary_large_image".
result: pass

### 8. og:image URL has no /Episodio4/ segment
expected: Run `grep "og:image" Episodio4/stops/013-newton-gravity/index.html`. URL should be `https://faviovazquez.github.io/roadtoreality/stops/013-newton-gravity/og-image.svg` — not `…/Episodio4/stops/…`.
result: issue
reported: "The actual page is published under https://faviovazquez.github.io/roadtoreality/Episodio4/index.html — URL needs /Episodio4/ segment"
severity: major
fix: Updated inject-og-meta.mjs BASE_URL and patched all 50 stop pages. Correct URL: https://faviovazquez.github.io/roadtoreality/Episodio4/stops/{id}/og-image.svg

### 9. SVG generator script is idempotent
expected: Run `node scripts/generate-og-svgs.mjs` a second time. Should exit 0 and output `Done. 50 SVGs written, 0 errors.` — same as the first run, no corruption.
result: pass

### 10. Meta injection script is idempotent
expected: Run `node scripts/inject-og-meta.mjs` a second time. Should exit 0 and report something like `Injected OG tags: 0 files updated, 50 already had tags, 0 errors`.
result: pass

## Summary

total: 10
passed: 10
issues: 2 (both fixed inline)
pending: 0
skipped: 0

## Gaps

- truth: "Stop number ghost watermark must not overlap title text"
  status: fixed
  reason: "Executor added unplanned 180px ghost number + 'Stop XX' badge overlapping title area"
  severity: major
  fix: Repositioned ghost watermark to lower-right (260px, 7% opacity); removed small badge

- truth: "og:image URL must resolve on the live GitHub Pages site"
  status: fixed
  reason: "URL missing /Episodio4/ segment — live site is at /Episodio4/ not root"
  severity: major
  fix: Updated inject-og-meta.mjs and patched all 50 stop pages with correct URL
