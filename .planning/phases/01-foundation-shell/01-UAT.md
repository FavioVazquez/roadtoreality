---
status: complete
phase: 01-foundation-shell
source:
  - 01-01-PLAN-SUMMARY.md
  - 01-02-PLAN-SUMMARY.md
started: 2026-03-20T19:10:00Z
updated: 2026-03-20T19:10:00Z
---

## Current Test
number: complete
name: —
awaiting: done


## Tests

### 1. Landing page loads and renders
expected: Navigate to http://localhost:8765 — the page loads with a dark background, the site title "How Physics Works" in the header, and a hero section with a headline and subtitle.
result: pass

### 2. Starfield animation
expected: A background of animated star particles is visible on the landing page. Stars twinkle or drift slowly.
result: pass
note: OS has prefers-reduced-motion enabled — static stars rendered correctly after fix. Root cause was canvas hidden entirely; changed to render static frame instead.

### 3. Era tabs visible and sticky
expected: Five era tabs are visible (Ancient & Classical, Scientific Revolution, Classical Physics, The Modern Revolution, Contemporary Physics). Scrolling down, the tab bar sticks to the top of the viewport.
result: pass

### 4. Era sections and card grid render
expected: Below the hero, five era sections appear with stop cards grouped under each. Cards show the stop title, scientist name, and year.
result: pass

### 5. Era accent colors are distinct
expected: Each of the five era sections has a visually distinct accent color — roughly: Ancient=gold, Revolution=teal/green, Classical=blue, Modern=purple, Contemporary=coral/red.
result: pass

### 6. Fonts load correctly
expected: Headings use a serif display font (Cormorant Garamond — elegant, high-contrast serifs). Body text and labels use a clean sans-serif (DM Sans). Neither falls back to a generic system font.
result: pass

### 7. Era tab scroll-spy
expected: Click an era tab — the page smoothly scrolls to that era's section. As you scroll manually through the page, the active tab updates to highlight the era currently in view.
result: pass

### 8. Progress bar on landing page
expected: A progress bar is visible somewhere on the landing page (hero section or header area) showing visited stop count. Initially shows 0 stops visited (or 0%).
result: pass

### 9. Stub stop cards are non-clickable
expected: Stop cards for stub stops (014 onwards, and 002) appear visually distinct (dimmed, no hover effect, or "Coming soon" indicator) and clicking them does nothing / does not navigate.
result: pass

### 10. Implemented stop cards are clickable
expected: Stop cards for the 12 implemented stops (001, 003–013) are clickable and navigate to the correct stop page.
result: pass

### 11. Mobile layout at 375px
expected: Resize the browser to 375px wide. The landing page remains readable: cards stack vertically, header is not overflowing, era tabs are scrollable horizontally if needed.
result: pass

### 12. window.PhysicsProgress API exists
expected: Open browser console on the landing page. Type `window.PhysicsProgress` — it returns an object with methods: `markVisited`, `isVisited`, `getVisitedCount`, `getAllVisited`.
result: pass

### 13. stops.json fetch error message
expected: Open `Episodio4/index.html` directly by double-clicking it (file:// protocol, not http://). The page should show a human-readable error message mentioning `python3 -m http.server` instead of a blank/broken page.
result: skipped
reason: user chose not to test file:// protocol scenario

## Summary

total: 13
passed: 12
issues: 0
pending: 0
skipped: 1

## Gaps

none yet
