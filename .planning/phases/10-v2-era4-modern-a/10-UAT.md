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
  root_cause: |
    The animation loop (drawFrame, sim.js lines 231–239) computes its own local temperature
    via `var T = 5500 + 4500 * Math.sin(animT * 0.018)` and passes that value directly to
    drawScene(T, hFactor), completely ignoring the global `temperature` variable that the
    slider updates. drawScene itself temporarily overrides and then restores the global, but
    the override value is always the loop's own oscillating T, not the slider's value.
    The slider input handler (lines 264–269) updates `temperature` and then checks
    `if (!running) drawStatic()` — meaning when running it performs no redraw at all.
    The fix requires the animation loop to read `temperatureSlider.value` live on each
    frame (or use the global `temperature` as the loop's base) instead of computing its
    own independent sweep value.
  affected_files:
    - HowPhysicsWorks/stops/027-planck-blackbody/sim.js

- truth: "Train-car shape visibly squashes with ghost outline comparison"
  status: failed
  reason: "User reported: too simplistic, shape looks like a ruler, needs visual enhancement"
  severity: cosmetic
  root_cause: |
    drawScene (sim.js lines 102–228) draws the contracted car as a plain rounded rectangle
    with a gradient fill and evenly-spaced ruler-style tick marks (drawTicks, lines 88–100).
    There are no windows, no wheels, no roof panel lines, no undercarriage details — nothing
    that visually reads as a train car. The tick marks reinforce the ruler appearance.
    The ghost outline (lines 120–138) is just a dashed rectangle with the same geometry.
    This is a cosmetic rendering gap: the shape lacks the visual vocabulary of a train car.
  affected_files:
    - HowPhysicsWorks/stops/030-special-relativity-length/sim.js

- truth: "Mass slider with live scale labels; velocity slider shows stacked energy bars; easy to understand"
  status: failed
  reason: "User reported: not easy to understand, scales flickering looks weird, needs more advanced design to showcase concepts"
  severity: major
  root_cause: |
    Flickering: The sigfig3 helper (sim.js lines 74–78) uses Math.log10 + Math.round to
    produce 3-significant-figure strings. At boundary values very close to a power-of-ten
    threshold (e.g. restEnergyJ near 4.184e12 = 1 kiloton TNT), floating-point rounding
    causes Math.log10 to fluctuate across the boundary on successive animation frames,
    making the formatted string alternate between two unit scales (e.g. "999 tons TNT"
    and "1.00 kilotons TNT") every frame. The glow animation (running=true) drives
    continuous RAF redraws via drawFrame (lines 145–166) even when the slider has not
    moved, so the boundary flicker is visible as rapid label oscillation during animation.
    Hard to understand: The layout divides the screen into two stacked numeric panels
    (mass-to-energy and relativistic energy) with bar graphs and text readouts but provides
    no intuitive narrative bridge — the user sees numbers and bars but no immediate
    visceral sense of scale. There is no single strong visual anchor connecting "1 gram"
    to a real-world explosion or power source.
  affected_files:
    - HowPhysicsWorks/stops/031-einstein-emc2/sim.js

- truth: "Mode toggle switches to manual aim; aim slider changes deflection live; no overlap; play works in both modes; element label updates with charge slider"
  status: failed
  reason: "User reported: manual aim didn't work, things overlapped, play does nothing in aim mode; element label should update (e.g. Au→H); wants named element presets"
  severity: major
  root_cause: |
    (a) Aim slider not visible after toggle: The aim-slider-row div has inline style
    `style="display:none;align-items:center;..."` (index.html line 78). The mode toggle
    handler (sim.js line 443) sets `aimRow.style.display = ''` to reveal it. Setting
    display to empty string clears only the display property from the inline style,
    leaving the rest of the inline styles intact — since no stylesheet rule overrides
    display for this element, the effective display reverts to the default block/inline
    value and the row does appear. However the flex layout of the parent container
    (flex-wrap:wrap) may cause the aim-slider-row to stack below other controls and
    overlap the canvas caption area, creating the reported visual overlap.
    (b) Play inert in aim mode: SimAPI.start() (lines 477–486) sets running=true and
    calls loop(). In aim mode, loop() dispatches to drawAimMode() which redraws the
    same static trajectory diagram every frame. Since aimDone is always true and nothing
    changes per frame, the canvas visually shows no motion — the play button appears
    inert. There is no animated behaviour defined for aim mode.
    (c) Element label hardcoded: drawFoil() (line 216) always renders the string
    'Au foil' on the canvas regardless of the Z slider value. The charge slider input
    handler (lines 422–432) updates the HTML readout element but does not update the
    canvas drawing label. Only Z=79 (Gold) and Z=1 (Hydrogen) get named labels in the
    readout; all other Z values show no element name.
  affected_files:
    - HowPhysicsWorks/stops/032-rutherford-nucleus/sim.js
    - HowPhysicsWorks/stops/032-rutherford-nucleus/index.html

- truth: "Clicking orbit rings triggers electron jumps and adds colored Balmer lines to spectrum bar"
  status: failed
  reason: "User reported: clicking orbit rings doesn't update Balmer line or spectrum"
  severity: major
  root_cause: |
    The canvas click handler (sim.js lines 409–430) calls triggerJump(closest) when the
    click is within 14px of an orbit ring. triggerJump (lines 368–406) adds a spectrum
    line to the spectrumLines array ONLY when the jump is downward (nTarget < bohrLevel,
    line 376). When the user clicks a higher orbit ring (upward jump), no spectrum line
    is added — only an inward-travelling photon dot is pushed to the photons array, which
    is only drawn during animation frames.
    The critical bug: after triggerJump completes, no redraw is triggered. There is no
    drawStatic() or drawBohr() call at the end of the click handler or inside triggerJump.
    So even when a downward jump does add a spectrum line, the canvas does not repaint
    unless the animation is already running. When the sim is paused, clicking a lower
    orbit ring correctly adds to spectrumLines but the spectrum bar stays visually
    unchanged because drawSpectrumBar() is never called after the click.
    Additionally, when running, the drawBohr() loop does call drawSpectrumBar() every
    frame, but most user clicks are upward jumps from the default bohrLevel=3 to n=4
    (since the hint says "click an orbit ring" and n=4 is the outermost visible ring),
    which produce no spectrum line at all.
  affected_files:
    - HowPhysicsWorks/stops/033-bohr-atom/sim.js
