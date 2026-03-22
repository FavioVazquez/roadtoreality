# Plan 07-01 Summary

**Completed:** 2026-03-22
**Phase:** 07 — Open Graph Images

## What was built

A Node.js ESM script at `scripts/generate-og-svgs.mjs` reads `Episodio4/assets/data/stops.json` and generates 50 standardized 1200x630 SVG Open Graph images, one per stop. Each SVG uses the era's hex accent color (converted from the oklch design tokens) for the left accent bar, era badge, scientist name, and year badge, with a dark background matching the site's aesthetic. The script was run and all 50 files were committed.

## Key files

- `scripts/generate-og-svgs.mjs`: Generator script — reads stops.json, produces SVGs
- `Episodio4/stops/*/og-image.svg`: 50 generated Open Graph images (1200x630 SVG)
- `.gitignore`: Added `!scripts/` and `!scripts/**` to allow-list

## Decisions made

- Era accent colors converted from oklch to hex for SVG compatibility: ancient=#c4922a, revolution=#4ca86b, classical=#5b8fd4, modern=#b06fd0, contemporary=#d45b5b
- SVG dimensions: 1200x630 (standard OG image size for Twitter/LinkedIn/Facebook)
- Fonts declared as fallback stacks (Georgia, Arial) since SVGs render without web fonts in social crawlers
- Title wrapping at 28 characters per line to fit the 1200px canvas at 72px font size
- Description truncated at 90 characters with ellipsis for the excerpt line

## Deviations from plan

- The PLAN.md did not exist prior to execution — it was created as part of this execution since the phase 07 directory was missing. The plan content was derived from ROADMAP.md Phase 07 description.
- `.gitignore` required an update to allow-list the `scripts/` directory (was not anticipated in the plan).

## Notes for downstream

- Plan 07-02 (OG Meta Tags) must reference `og-image.svg` relative path as `../../og-image.svg` or using the absolute GitHub Pages URL for each stop's `index.html`
- The SVG path convention is `Episodio4/stops/{stop-id}/og-image.svg` — one file per stop directory
- The generator script is rerunnable; any future title or description changes in stops.json can be reflected by rerunning `node scripts/generate-og-svgs.mjs`
