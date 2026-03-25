---
status: complete
phase: 10-v2-era4-modern-a
source:
  - 10-01-SUMMARY.md
  - 10-02-SUMMARY.md
  - 10-03-SUMMARY.md
  - 10-04-SUMMARY.md
started: 2026-03-25T00:00:00Z
updated: 2026-03-25T00:00:00Z
---

## Current Test
number: 1
name: Stop 027 — Planck blackbody spectrum
expected: |
  Open HowPhysicsWorks/stops/027-planck-blackbody/index.html.
  The sim shows two curves on the same graph: a dashed Rayleigh-Jeans line and a solid Planck curve.
  Dragging the Temperature slider changes both curves live.
  Dragging the h slider toward 0 collapses the Planck curve onto the Rayleigh-Jeans line (they converge).
awaiting: user response

## Tests

### 1. Stop 027 — Planck blackbody spectrum
expected: Two curves on graph (Rayleigh-Jeans dashed, Planck solid); temperature slider shifts both live; h slider toward 0 collapses Planck onto classical line
result: issue
reported: "When is in play mode the temperature slider is not working, in pause they update"
severity: major

### 2. Stop 028 — Photoelectric threshold behavior
expected: Dual frequency + intensity sliders. At low frequency + high intensity → "HIGH INTENSITY — NO EJECTION" banner. Raising frequency above threshold → electrons visually eject. KE readout shows live value (0 below threshold, positive above).
result: pass

### 3. Stop 029 — Twin paradox age divergence
expected: Two twin figures visible. Velocity slider 0–0.99c. As velocity increases, the two age readouts diverge live. Gamma readout shows 1.000 at v=0 and ~7.09 at v=0.99c.
result: pass
note: "Enhancement idea — visually age the traveling twin figure as the gap grows (wrinkles, posture, gray hair) so the time difference is felt, not just read"

### 4. Stop 030 — Length contraction ruler
expected: Train-car shape visibly squashes horizontally as velocity increases. A ghost outline of the rest length stays fixed for comparison. Live L readout shows ~14.1 m at v=0.99c (rest length 100 m).
result: issue
reported: "It's working but is not that cool to look at, it's too simplistic, and the train-car shape looks more like a ruler, this should be enhanced"
severity: cosmetic

### 5. Stop 031 — E = mc² mass-to-energy slider
expected: Mass slider updates live scale labels: TNT kilotons/megatons, number of Hiroshima bombs, city power hours. 1g position shows ~21.5 kilotons. Velocity slider shows stacked rest energy + relativistic KE bars growing as v → c.
result: issue
reported: "This is another one is not easy to understand, also the scales are flickering looks weird. We need something more advance here to showcase the concepts"
severity: major

### 6. Stop 031 — Both SR equations in KaTeX
expected: Takeaway box shows both $$E = mc^2$$ and $$E^2 = (pc)^2 + (mc^2)^2$$ rendered by KaTeX. Narrative text explicitly states that E = mc² is the special case when p = 0 (object at rest).
result: pass

### 7. Stop 032 — Rutherford gold foil scattering
expected: Stream mode: 8 alpha particles fire continuously; most pass straight through, a few deflect at large angles. Nucleus charge slider Z increases deflection. Mode toggle switches to manual aim; aim slider changes deflection angle live.
result: issue
reported: "The switch to manual aim didn't work, some things overlapped and if I click play nothing happens, we should have a play button for both ways, also when the user changes the nuclear charge the line that says Au foil should update, let's have some examples, I see for 1 is hydrogen but let's have a few more and the line updates"
severity: major

### 8. Stop 033 — Bohr classical collapse then quantum fix
expected: On load/play: electron spiral collapses inward over ~3.5 seconds, ending with a flash at the nucleus. The "Switch to Bohr Model" button is disabled during collapse. After collapse ends, button becomes active. Clicking it shows stable circular orbits (n=1–4). Clicking orbit rings triggers electron jumps and adds colored Balmer lines to the spectrum bar (red ~656nm, cyan ~486nm, violet ~434nm).
result: issue
reported: "All working but the clicking on the orbit rings doesn't update the Balmer line or the spectrum"
severity: major

### 9. All stops — no JS errors
expected: Open each of the 7 stops (027–033) in the browser. Browser console shows zero JavaScript errors on load and during interaction.
result: pass

## Summary

total: 9
passed: 4
issues: 5
pending: 0
skipped: 0

## Gaps

- truth: "Temperature slider updates both curves live in play mode"
  status: failed
  reason: "User reported: temperature slider not working in play mode, works in pause"
  severity: major
  test: 1

- truth: "Train-car shape visibly squashes with ghost outline comparison"
  status: failed
  reason: "User reported: too simplistic, shape looks like a ruler, needs visual enhancement"
  severity: cosmetic
  test: 4

- truth: "Mass slider with live scale labels; velocity slider shows stacked energy bars; easy to understand"
  status: failed
  reason: "User reported: not easy to understand, scales flickering looks weird, needs more advanced design to showcase concepts"
  severity: major
  test: 5

- truth: "Mode toggle switches to manual aim; aim slider changes deflection live; no overlap; play works in both modes; element label updates with charge slider"
  status: failed
  reason: "User reported: manual aim didn't work, things overlapped, play does nothing in aim mode; element label should update (e.g. Au→H); wants named element presets"
  severity: major
  test: 7

- truth: "Clicking orbit rings triggers electron jumps and adds colored Balmer lines to spectrum bar"
  status: failed
  reason: "User reported: clicking orbit rings doesn't update Balmer line or spectrum"
  severity: major
  test: 8
