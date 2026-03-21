---
status: complete
phase: 04-era2-simulations
source:
  - 04-01-PLAN-SUMMARY.md
  - 04-02-PLAN-SUMMARY.md
  - 04-03-PLAN-SUMMARY.md
started: 2026-03-20T20:27:00Z
updated: 2026-03-20T20:27:00Z
---

## Current Test
number: complete
awaiting: done

## Tests

### 1. Copernicus sim — heliocentric mode
expected: Navigate to http://localhost:8765/stops/008-copernicus-heliocentric/index.html. Click Play — five planets (Mercury, Venus, Earth, Mars, Jupiter) orbit the Sun at the center. Trails form clean rings.
result: pass

### 2. Copernicus sim — geocentric mode retrograde
expected: On the Copernicus stop, switch to geocentric mode (slider). Let it run 30+ seconds at 3× speed. Mars trail shows visible retrograde loops.
result: pass

### 3. Galileo inclined plane — ball rolls down
expected: Navigate to http://localhost:8765/stops/009-galileo-inclined-plane/index.html. Set an angle, click Play/Drop. Ball rolls down the slope. Landing time displayed. Mini d vs t² graph is a straight line.
result: pass
note: Fixed graph position (was floating over slope), added axes labels.

### 4. Galileo inclined plane — mass has no effect
expected: On the inclined plane stop, drop two runs with different mass settings at the same angle. Landing time is identical regardless of mass. Ball radius changes with mass but arrival time does not.
result: pass

### 5. Galileo pendulum — swings with RK4
expected: Navigate to http://localhost:8765/stops/010-galileo-pendulum/index.html. Click Play — pendulum swings. Formula period T and measured period T converge after ~3 swings. Changing mass slider does NOT change period.
result: pass

### 6. Galileo pendulum — length changes period
expected: On the pendulum stop, change the length slider. Period T (formula) updates immediately. A longer pendulum swings slower.
result: pass

### 7. Kepler laws — elliptical orbit closes
expected: Navigate to http://localhost:8765/stops/011-kepler-laws/index.html. Click Play — planet traces a closed ellipse. No visible energy drift (orbit doesn't spiral in or out).
result: pass

### 8. Kepler laws — equal areas (2nd law)
expected: On the Kepler stop, select "2nd Law" mode. Colored swept-area wedges appear. Wedges near perihelion (close approach) are visibly wider/shorter; wedges near aphelion are taller/narrower — but all cover equal area.
result: pass
note: User requested adding 3rd law visualization — logged as gap

### 9. Newton laws — block accelerates with force
expected: Navigate to http://localhost:8765/stops/012-newton-laws/index.html. Set a force, click Apply. Block accelerates across the floor. F=ma readout updates live. Velocity graph rises.
result: pass

### 10. Newton laws — friction slows block
expected: On the Newton laws stop, set friction to Heavy. Apply force, then release. Block decelerates and stops. Compare to None friction where block coasts to the wall.
result: pass
note: Lowered friction coefficients (max 0.18) so High is visible but not blocking. Rounded v display to stop flickering.

### 11. Newton cannon — orbit vs escape
expected: Navigate to http://localhost:8765/stops/013-newton-gravity/index.html. Set speed near 7.9 km/s — trail turns green (orbit). Set speed above 11.2 km/s — trail turns orange (escape). Below 7.9 km/s — trail turns red (lands).
result: pass
note: Full rewrite — exact GM, RK4, always-visible cannon, trail live-colored, sim speed dial, outcome banner repositioned.

### 12. Reset button works on all Era 2 sims
expected: On any Era 2 stop, click Play, then Reset. Simulation returns to initial state, Play button resets.
result: pass

## Summary

total: 12
passed: 12
issues: 0
pending: 0
skipped: 0

## Gaps

- GAP-01: Kepler stop — add 3rd Law mode (T² ∝ a³ visualization comparing planet orbital periods)
