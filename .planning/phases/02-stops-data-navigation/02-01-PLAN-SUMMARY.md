# Plan 02-01 Summary — stops.json Data Manifest

**Completed:** 2026-03-20

## What was built

`Episodio4/assets/data/stops.json` — the single source of truth for all 50 stops. Each stop object contains: `id` (directory name slug), `slug`, `order` (1-50), `title`, `subtitle`, `era` (one of 5 values), `year` (integer), `yearLabel` (display string), `scientist`, `isStub` (boolean), `description` (2-3 sentences accurate physics history content), `path`, `prev` (null or id string), `next` (null or id string), `prevTitle`, `nextTitle`. The navigation chain is a complete linked list from stop 001 to stop 050. 12 stops have `isStub: false`; the remaining 38 have `isStub: true`.

## Key files

- `Episodio4/assets/data/stops.json`: 50-stop manifest, ~1,100 lines

## Decisions made

- Era assignment: ancient (001-007), revolution (008-013), classical (014-026), modern (027-041), contemporary (042-050)
- Stop 002 (Pythagoras) is a stub — mathematical harmony is covered by 001 (Thales context) and has low simulation aha-moment
- `id` field exactly matches filesystem directory name — no transformation needed in nav.js href construction
- All 50 descriptions written with physics history accuracy — dates and attributions match standard references

## Notes for downstream

- `nav.js` reads this file at runtime — changing field names here breaks the renderer
- `stop-shell.js` reads `prev`, `next`, `prevTitle`, `nextTitle` from `#stop-config` (not from stops.json) — both sources must be kept in sync
- `isStub: false` stops must have a real `sim.js` — adding a stop to Phase 3/4 requires toggling `isStub` to `false` in stops.json as well
