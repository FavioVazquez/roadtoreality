---
status: complete
phase: 02-stops-data-navigation
source:
  - 02-01-PLAN-SUMMARY.md
  - 02-02-PLAN-SUMMARY.md
started: 2026-03-20T19:23:00Z
updated: 2026-03-20T19:23:00Z
---

## Current Test
number: complete
name: —
awaiting: done

## Tests

### 1. All 50 stop directories exist
expected: Open http://localhost:8765 and verify the card grid shows stops from 001 through 050. Alternatively, the landing page card count across all five era sections adds up to 50.
result: pass

### 2. Full stop page loads — breadcrumb and header
expected: Navigate to http://localhost:8765/stops/004-aristotle-motion/index.html — the page shows a breadcrumb (e.g. "Ancient & Classical → Aristotle's Theory of Motion"), an era label, a large h1 title, and a subtitle line.
result: pass

### 3. Prev/Next navigation chain works
expected: On the Aristotle stop (004), click the "Next" button. It navigates to Archimedes (005). Click Next again → Eratosthenes (006). Click "Prev" → back to Aristotle (005→004). The chain is unbroken.
result: pass

### 4. First stop has no Prev, last stop has no Next
expected: Navigate to http://localhost:8765/stops/001-thales-natural-causes/index.html — no "Previous" button is shown. Navigate to http://localhost:8765/stops/050-frontiers/index.html — no "Next" button is shown.
result: pass

### 5. Stub stop shows placeholder, not broken
expected: Navigate to http://localhost:8765/stops/020-carnot-heat-engine/index.html (a stub stop). The page loads correctly, shows the stop title and era, and displays a placeholder slot with the ⚗️ icon and "Simulation coming in a future update" text. No JS errors.
result: pass

### 6. Visited badge appears after visiting a stop
expected: Navigate to any full stop (e.g. stop 003 Democritus), then return to http://localhost:8765. The card for stop 003 should show a visited indicator (badge, checkmark, or color change).
result: issue
reported: "visited badge is not appearing"
severity: major

### 7. Stop counter in header
expected: On any stop page, the header area shows a stop counter such as "Stop 4 of 50" or similar positional indicator.
result: pass

### 8. Era color applied to stop pages
expected: The Aristotle stop page (era: ancient) has a gold/amber accent color on its header or era label. The Copernicus stop page (era: revolution) has a teal/green accent. They look visually distinct from each other.
result: pass

### 9. Takeaway box and bridge text on full stops
expected: On the Archimedes stop (005), below the simulation area there is a "Key Takeaway" box with bullet points, and a bridge sentence at the bottom connecting to the next discovery.
result: pass

### 10. Stub stop pages have correct era data
expected: Navigate to http://localhost:8765/stops/027-planck-blackbody/index.html (era: modern). The page header shows the correct era label "The Modern Revolution" and the page accent color is purple (not gold/ancient).
result: pass

## Summary

total: 10
passed: 9
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Visited badge appears on landing page card after navigating to a stop"
  status: fixed
  reason: "User reported: visited badge is not appearing (8px dot too subtle to notice)"
  severity: major
  test: 6
  root_cause: "Badge existed and logic was correct, but 8px dot was invisible at a glance"
  fix: "Replaced dot with pill-shaped '✓ Visited' label + gold border on visited cards in components.css"
