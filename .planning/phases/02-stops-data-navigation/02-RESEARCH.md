# Phase 2: Stops Data & Navigation — Research

**Completed:** 2026-03-20
**Phase:** 02-stops-data-navigation
*(Retroactively documented)*

---

## Don't Hand-Roll

### Stop page generation
For 38 stub pages sharing identical structure, use a Python script with a template string
rather than hand-crafting each HTML file. The script reads `stops.json` as the single
source of truth and generates only files that don't already exist (idempotent).
**Used:** `gen_stubs.py` (deleted after use).

### Navigation chain integrity
The prev/next chain across 50 stops is a linked list. Verify it by checking
`stops[i].next === stops[i+1].id` in stops.json rather than by manually navigating
every page. A single typo breaks navigation across the rest of the chain.

### Relative URL construction in stop-shell.js
Stop pages live at `stops/{id}/index.html`. The shared JS at `../../assets/js/stop-shell.js`
constructs prev/next hrefs as `../{next_id}/index.html` — relative to the current stop
directory. This works because all stops are siblings under `stops/`. Do not use absolute
paths or root-relative paths; they break on GitHub Pages with non-root deployments.

---

## Common Pitfalls

### stops.json fetch fails from file:// protocol
`fetch()` is blocked by browsers when `index.html` is opened via double-click
(`file://` URL). **Fix:** All development must use `python3 -m http.server`.
nav.js handles this case with a visible error message.

### Stub pages loaded as non-stub by nav.js
If `isStub: true` is missing from a stop's entry in `stops.json`, nav.js renders it as
a clickable card even though the sim doesn't exist. Always set `isStub: true` for all
stops without a real `sim.js`. The 12 implemented stops have `isStub: false`.

### Stop directory name mismatch
`nav.js` constructs card hrefs as `stops/{id}/index.html` using the `id` field from
stops.json. The filesystem directory must exactly match that `id`. A mismatch produces
a 404. Convention: `id` = `{order:03d}-{slug}`, directory name = same string.

### #stop-config JSON parse errors
`stop-shell.js` wraps the JSON parse in try/catch and logs a warning. But if the
JSON is malformed (trailing comma, unescaped quotes), the breadcrumb and prev/next
won't render. Always validate stop-config JSON with a JSON linter before committing.

### prev/next null handling
The first stop (001) has `"prev": null` and the last (050) has `"next": null`.
`stop-shell.js` must check for null before rendering nav buttons — render an empty div
to maintain the CSS grid layout when one side is missing.

### Script load order on stop pages
`sim.js` must load **after** `stop-shell.js`, not before. If `sim.js` runs first and sets
`window.SimAPI`, then `stop-shell.js` hasn't registered the IntersectionObserver yet.
In practice the IntersectionObserver is registered inside `stop-shell.js`'s init(), so
it runs on DOMContentLoaded — after all scripts are parsed. But explicit load order
(`progress.js → stop-shell.js → sim.js` at bottom of `<body>`) makes this reliable.
