---
status: complete
phase: 06-v2-foundation-ux-polish
source:
  - 06-01-SUMMARY.md
  - 06-02-SUMMARY.md
  - 06-03-SUMMARY.md
  - 06-04-SUMMARY.md
started: 2026-03-21T00:00:00Z
updated: 2026-03-21T00:00:00Z
---

## Current Test
number: —
name: complete
awaiting: —

## Tests

### 1. Search modal opens on landing page
expected: Open Episodio4/index.html. Press Cmd+K (Mac) or Ctrl+K (Windows/Linux). A centered dark overlay appears with a search input and placeholder "Search stops, scientists, concepts…"
result: pass
note: Works correctly. No visible hint to users that Cmd/Ctrl+K opens search.

### 2. Search returns results with era colors
expected: With the search modal open, type "newton". At least 2 results appear. Each card shows stop title, scientist name, and era badge. Cards are interactive.
result: pass

### 2. Search returns results with era colors
expected: With the search modal open, type "newton". At least 2 results appear (Newton Laws, Newton Gravity). Each result card shows the stop title, scientist name, and a colored era badge. Results are interactive.
result: pending

### 3. Search keyboard navigation
expected: With results visible, press ArrowDown to move focus to the first result (it highlights). Press ArrowDown again to move to the second. Press Enter — the page navigates to that stop.
result: pass

### 4. Search closes on Escape and backdrop click
expected: Open the search modal (Cmd/Ctrl+K). Press Escape — modal disappears. Open again, then click outside the modal panel on the dark overlay — modal disappears.
result: pass

### 5. KaTeX equation renders on an implemented stop
expected: Open any implemented stop page, e.g. Episodio4/stops/013-newton-gravity/index.html. Scroll to the takeaway box near the bottom. A properly typeset math equation (not raw LaTeX text like $$F = GMm/r^2$$) should be rendered in beautiful KaTeX font.
result: pass

### 6. Stub card is clickable on landing page
expected: Open Episodio4/index.html. Click on any gray/stub stop card (e.g. stop 015 Bernoulli or 027 Planck). The card should navigate to that stop's page — it should NOT be disabled or do nothing. The cursor should be a pointer, not default.
result: pass

### 7. Stub card shows Coming Soon badge
expected: On the landing page, stub stop cards should have a small "Coming Soon" pill badge visible in the top-right corner of the card. The badge should be subtle — small text, pill shape, not a large banner. Implemented stop cards should NOT have this badge.
result: pass

### 8. Stub stop page has real content and teaser animation
expected: Navigate to any stub stop (e.g. Episodio4/stops/027-planck-blackbody/index.html). The page should show: a proper era-styled header with scientist name and year, a description paragraph, a canvas animation running (the Planck curve / ultraviolet catastrophe visualization), a "What you'll explore" list, a takeaway box with a key concept, and a GitHub contribution link.
result: issue
reported: "all working overall, but 027 is not running an animation — only a static image, and Play button does nothing"
severity: major

### 9. Arrow-key navigation between stops
expected: Open any implemented stop page (e.g. stop 009 Galileo Inclined Plane). Press the right arrow key → the page navigates to the next stop (stop 010). Press the left arrow key ← on that page and it navigates back to stop 009. Make sure no input/slider is focused when testing this.
result: pass

### 10. Arrow keys blocked when search modal is open
expected: On any stop page, open the search modal (Cmd/Ctrl+K). While the modal is open, press the left or right arrow key. The page should NOT navigate — the arrows should only move through search results. Close the modal and arrow keys should navigate stops again.
result: pass

### 11. Mobile sim viewport (resize or DevTools)
expected: Open any implemented stop page with a simulation. Using browser DevTools, set viewport to 375×812 (iPhone). The simulation canvas area should be at least 60% of the viewport height — it should feel tall and usable, not cramped at the old 360px fixed height.
result: pass

### 12. Stub teaser animation plays on the canvas
expected: On the stub stop page (e.g. 027-planck-blackbody), look at the canvas area. There should be a canvas animation actually running — not a blank gray box. The animation should be specific to the concept (for Planck: two overlapping spectral curves, one dashed rising to infinity, one peaked). Press the Play button if it's paused.
result: issue
reported: "040-nuclear-fission shows animation but chain reaction lasts milliseconds then stops — does not loop"
severity: minor

## Summary

total: 12
passed: 10
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Search shortcut (Cmd/Ctrl+K) is discoverable by users"
  status: failed
  reason: "User reported: not obvious to users that cmd+k or ctrl+k exists in the page"
  severity: minor
  test: 1

- truth: "Stub teaser canvas animations are visibly animated (not static-looking)"
  status: failed
  reason: "User reported: 027-planck-blackbody shows only a static image, Play button does nothing"
  severity: major
  test: 8
  note: "Code is correct — start() fires rAF loop. Root issue: animation motion is imperceptible (±0.2 opacity glow only). Fix: replace with clearly dynamic motion (curve build-in, pulsing peak, temperature sweep). Likely affects multiple sims with similar subtle effects."

- truth: "Stub teaser animations loop continuously while running"
  status: failed
  reason: "User reported: 040-nuclear-fission chain reaction lasts milliseconds then stops, does not loop"
  severity: minor
  test: 12
  note: "One-shot animations need a reset+restart cycle after sequence completes. Likely affects other event-based sims (039-dirac, 031-emc2, etc.)."
