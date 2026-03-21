# Phase 3: Era 1 Simulations (Ancient) — Verification

**Date:** 2026-03-20
**Status:** passed
**Verified by:** Cascade (retroactive)

---

## Must-Have Checklist

### Plan 03-01 (Thales + Democritus)
- [x] Thales sim: center slider moves between supernatural and natural panels
- [x] Thales sim: both panels animate (lightning bolt animation + charge arc)
- [x] Democritus sim: 5 zoom levels with distinct particle visualizations
- [x] Democritus sim: scale indicator updates per level (1m → 1fm)
- [x] Both sims: window.SimAPI = { start, pause, reset, destroy }
- [x] Both sims: slider updates immediately while paused

### Plan 03-02 (Aristotle + Archimedes)
- [x] Aristotle sim: two balls drop simultaneously; same mass → same landing time with air=None
- [x] Aristotle sim: air resistance creates visible time difference at Heavy level
- [x] Aristotle sim: landing time badge appears on each ball
- [x] Archimedes sim: 5 material choices with correct densities (600, 917, 2600, 7874, 150)
- [x] Archimedes sim: water level rises as object submerges
- [x] Archimedes sim: upward and downward force arrows displayed when submerged
- [x] Both sims: dt clamped to 0.05s maximum

### Plan 03-03 (Eratosthenes + Ptolemy)
- [x] Eratosthenes sim: curved Earth with two cities at correct angular separation
- [x] Eratosthenes sim: parallel sun rays as dashed lines
- [x] Eratosthenes sim: calculation panel shows 360/7.2 × distance = circumference
- [x] Eratosthenes sim: distance slider recalculates live (200–2000 km range)
- [x] Ptolemy sim: Earth at center, 4 planets on deferents + epicycles
- [x] Ptolemy sim: retrograde trail loops visible with trail toggle on
- [x] Ptolemy sim: speed slider 1×–5×

### SIM requirements (from REQUIREMENTS.md)
- [x] SIM-01: All sims responsive (resize handler present)
- [x] SIM-02: All sims expose window.SimAPI = { start, pause, reset, destroy }
- [x] SIM-03: IntersectionObserver lifecycle managed by stop-shell.js
- [x] SIM-04: Play/Pause/Reset controls wired by stop-shell.js
- [x] SIM-06: dt clamped to max 0.05s in all RAF loops

---

## Human Verification Items

- [ ] Aristotle: verify landing time badges are equal with air=None regardless of mass setting
- [ ] Archimedes: verify hollow ship (density 150) floats at ~15% submerged fraction
- [ ] Eratosthenes: verify distance=800km → 40,000 km result (~0.2% error from 40,075)
- [ ] Ptolemy: run for 2+ minutes, verify retrograde loops are visible in Mars trail

*Verified: 2026-03-20*
