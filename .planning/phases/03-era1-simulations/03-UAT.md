---
status: complete
phase: 03-era1-simulations
source:
  - 03-01-PLAN-SUMMARY.md
  - 03-02-PLAN-SUMMARY.md
  - 03-03-PLAN-SUMMARY.md
started: 2026-03-20T19:31:00Z
updated: 2026-03-20T19:31:00Z
---

## Current Test
number: complete
awaiting: done

## Tests

### 1. Thales sim — Play button starts animation
expected: Navigate to http://localhost:8765/stops/001-thales-natural-causes/index.html. Click Play — the simulation starts showing two panels (left supernatural, right natural explanation). Both panels should have some animation (particles, lightning, or charge arc).
result: pass
note: Redesigned — Poseidon/earthquake vs Thales Earth-on-water. Play auto-sweeps perspective.

### 2. Thales sim — slider changes perspective
expected: On the Thales stop, drag the slider. The canvas should shift between the supernatural view and the natural scientific view. Both extremes look visually distinct from each other.
result: pass

### 3. Democritus sim — zoom levels
expected: Navigate to http://localhost:8765/stops/003-democritus-atoms/index.html. Move the slider through all 5 positions — each step shows a clearly different visualization: apple → cells → molecules → atom → quarks. A scale label updates at each level (e.g. "~1 m", "~10 µm").
result: pass

### 4. Aristotle sim — equal fall time with no air resistance
expected: Navigate to http://localhost:8765/stops/004-aristotle-motion/index.html. Set air resistance to None, then click Drop (or Play). Both balls reach the bottom at the same time. A label appears confirming this (e.g. "Same time! Aristotle was wrong.").
result: pass
note: Fixed loop()/rAF NaN bug and canvas W=0 init race.

### 5. Aristotle sim — air resistance creates difference
expected: On the Aristotle stop, set air resistance to Heavy, then drop. The lighter ball (left, lower mass) now lands noticeably later than the heavy ball. The outcome label changes accordingly.
result: pass

### 6. Archimedes sim — wood floats, iron sinks
expected: Navigate to http://localhost:8765/stops/005-archimedes-buoyancy/index.html. Select "Wood" and press Play — the object floats at the surface. Select "Iron" and reset — it sinks to the bottom. Force arrows appear while the object is in motion.
result: pass
note: Ice 91.7% submerged is physically correct (icebergs are ~92% underwater). Wood sits ~40% above waterline.

### 7. Archimedes sim — water level rises on submersion
expected: On the Archimedes stop with a dense material (stone or iron), the water level visibly rises as the object enters the water.
result: pass
note: Fixed rise formula — pixel-space area ratio now produces visible rise

### 8. Eratosthenes sim — geometry is legible
expected: Navigate to http://localhost:8765/stops/006-eratosthenes-earth/index.html. The diagram shows a curved Earth, two sticks, and parallel dashed sun rays. The shadow angle at Alexandria is visible. The two cities are at different positions on the Earth circle.
result: pass

### 9. Eratosthenes sim — Measure reveals calculation
expected: On the Eratosthenes stop, click the Measure button. A calculation panel appears showing: 360° ÷ 7.2° = 50, 50 × [distance] km = circumference result, with an error percentage vs actual 40,075 km.
result: pass

### 10. Ptolemy sim — epicycle animation runs
expected: Navigate to http://localhost:8765/stops/007-ptolemy-geocentric/index.html. Click Play — four planets orbit Earth in the geocentric model with visible epicycle motion (each planet traces a looping path, not a simple circle).
result: pass

### 11. Ptolemy sim — retrograde trail loops appear
expected: On the Ptolemy stop, turn trails ON and let the simulation run for 30+ seconds (use speed 3× or higher). The trails for Mars (or other outer planets) show visible retrograde loops — backward arcs in the trail.
result: pass

### 12. Reset button works on all Era 1 sims
expected: On any Era 1 stop (e.g. Aristotle), click Play to start, then click Reset. The simulation returns to its initial state and stops running. The Play button resets to "▶ Play".
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0

## Gaps

none yet
