---
status: testing
phase: 08-v2-era-gap-fills
source:
  - 08-01-SUMMARY.md
  - 08-02-SUMMARY.md
started: 2026-03-23T00:00:00Z
updated: 2026-03-23T00:00:00Z
---

## Tests

### 1. Stop 002 loads without errors
expected: Open `http://localhost:8765/stops/002-pythagoras-harmony/` (or the file path). Page loads fully — title "Pythagoras and Mathematical Harmony", era header visible, 6 ratio buttons visible (1:1, 2:1, 3:2, 4:3, 5:4, 9:8), canvas area present.
result: issue
reported: "I don't see the buttons, they are there invisible and I can touch them but I can't see them"
severity: major
fix: Added background/border/color to .sim-btn base class in simulation.css — buttons now visible.

### 2. Stop 002 standing wave animates on page load
expected: The canvas starts animating automatically (data-autoplay=false means the IntersectionObserver calls SimAPI.start for canvas, but audio stays silent). A standing wave line should be visible on the canvas, gently oscillating.
result: pass

### 3. Stop 002 audio plays on ratio button click
expected: Click the "2:1" button (octave). You should hear a clear musical tone that fades out over ~1 second (plucked-string envelope). The canvas wave should change shape to show 2 humps (harmonic n=2).
result: pass

### 4. Stop 002 all 6 ratios work
expected: Click through all 6 ratio buttons: 1:1 (unison, 1 hump), 2:1 (octave, 2 humps), 3:2 (fifth, 3 humps), 4:3 (fourth, 4 humps), 5:4 (major third, 5 humps), 9:8 (whole tone, 9 humps). Each plays a distinct tone and the wave pattern updates to match the harmonic number.
result: pass

### 5. Stop 002 KaTeX equation renders
expected: Scroll to the takeaway box at the bottom of Stop 002. The equation $$f_n = n \cdot f_1$$ should render as a beautiful typeset formula — not as raw LaTeX text.
result: pass

### 6. Stop 014 loads without errors
expected: Open `http://localhost:8765/stops/014-hooke-elasticity/`. Page loads — title "Hooke's Law and Elasticity", a coil spring visible on the left half of the canvas, F vs. x graph on the right, a Load slider, and material selector (Steel / Rubber / Glass).
result: issue
reported: "play button didn't do anything; 'elastic' label overlapping material name"
fix: Added sinusoidal oscillation offset to springEndY in draw() using t. Removed canvas zone label from top (overlapping material name), re-added it at H*0.88 above F readout. Wrapped material+load controls in a column flex container.

### 7. Stop 014 spring stretches with slider
expected: Drag the Load slider from 0 to maximum. The spring should visibly stretch downward. The tracking dot on the F vs. x graph should move along the elastic (green) line, then into the gray plastic zone.
result: pass

### 8. Stop 014 rupture animation
expected: With Steel selected, drag the Load slider all the way to maximum. The spring should snap — brief canvas shake and red flash. The slider should become disabled (grey out). The tracking dot should be at or past the red rupture dot on the graph.
result: pass

### 9. Stop 014 material selector changes behavior
expected: Click "Rubber" in the material selector. Spring resets to unloaded state. Drag slider to maximum — rubber has a much larger elastic range and softer spring (sags more per unit load). Click "Glass" — glass is very stiff and ruptures almost immediately at small loads.
result: issue
reported: "material selector not good color contrast, white background grey letters"
fix: Changed select inline styles to oklch(0.18 0 0) background and oklch(0.85 0 0) text to match dark theme.

### 10. Stop 014 KaTeX equation renders
expected: Scroll to the takeaway box at the bottom of Stop 014. The equation $$F = -kx$$ should render as a typeset formula.
result: pass

### 11. Both stops appear as non-stubs on landing page
expected: Open the landing page `http://localhost:8765/`. In the Ancient era tab, Stop 002 (Pythagoras) should NOT have a "Coming Soon" pill badge. In the Scientific Revolution era tab, Stop 014 (Hooke) should NOT have a "Coming Soon" pill. Both should look like fully implemented stops.
result: pass

### 12. Navigation chain intact — Stop 002
expected: On Stop 002, click the "→ next" navigation link. Should navigate to Stop 003 (Democritus). Click "← prev" on Stop 002 — should navigate to Stop 001 (Thales).
result: pass

## Summary

total: 12
passed: 10
issues: 3
pending: 0
skipped: 0

## Gaps

[none yet]
