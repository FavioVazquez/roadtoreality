---
phase: 09-v2-era3-classical
type: phase-retrospective
date: 2026-03-23
status: complete
---

# Phase 09 Retrospective — Era 3: Classical Physics

## What was built

12 fully interactive Classical Physics stops (015–026): Bernoulli through Michelson-Morley.
Every stop has a real sim.js with ≥2 interactive controls, live physics, and KaTeX equations.
UAT round 1 found 10 issues; all resolved in a 3-plan fix pass; UAT round 2 passed 7/7.

---

## What worked well

**Parallel worktree execution** — Running 6 plans simultaneously in isolated git worktrees cut execution time dramatically. Merging by file copy (rather than branch merge) avoided conflicts cleanly.

**Stage-based animation timing** — For educational sims, a state machine (hold-start → action → hold-end) is far cleaner than a continuous `t % PERIOD` loop. The user can actually read what's happening. Stop 021 is the clearest example.

**Two-panel canvas layouts** — Computing `splitX` as a fraction of `W` inside `resize()` keeps both panels proportional on any screen size. Stops 022 and 024 use this well.

**Physics at human-readable scale** — Stop 016's first implementation used R=0.12m objects, causing everything to max out in milliseconds. Switching to R=0.5m made the divergence visible over seconds. Always sanity-check that simulation timescales are observable.

---

## What was harder than expected

**Slider wiring** — Multiple stops (016, 021, 022, 026) had sliders declared in HTML but never wired in sim.js. Root cause: plans specified the HTML controls but didn't always make wiring an explicit must-have in the plan checklist. Add "wire all HTML controls" as a required must-have in future plan templates.

**KaTeX inline math** — The `$...$` delimiter is unreliable when inline math appears inside mixed text/HTML. The `\(...\)` delimiter is always reliable. Future stops should use `\(...\)` for inline and `$$...$$` for display from the start.

**Stop 026 narrative clarity** — The first implementation had a technically correct interferometer with no clear story. Three rewrites were needed before the three-mode narrative (Setup → Expected vs Found → Arm Ratio) made the physics legible. For complex historical experiments, narrative structure matters as much as physics accuracy.

**Canvas text layout** — Text placed with hardcoded pixel offsets overflows on smaller canvases. The fix pattern: compute all positions relative to `W` and `H`, use `ctx.save(); ctx.beginPath(); ctx.rect(0,0,W,H); ctx.clip()` as a global guard, and shorten strings to fit within bounded panels.

---

## Key deviations from plan (accepted)

| Stop | Plan spec | Actual | Impact |
|------|-----------|--------|--------|
| 021 | Pie chart showing energy conversion | Bar chart with stage-based timing | Better — clearer physics story |
| 022 | Two independent panels simultaneously active | Two panels with shared canvas, divider line | Same UX |
| 023 | source-frequency-slider in HTML | Added post-execution via fix plan | Working |
| 024 | `splitX` in `resize()` | `panelW` computed per frame | No visual impact |
| 026 | Three separate modes with sliders | Three narrative modes (Setup/Expected vs Found/Arm Ratio) | Better — clearer story |

---

## Carry forward to Phase 10

1. **Slider wiring must-have**: Every PLAN.md must include an explicit must-have: "all HTML sliders wired in sim.js with `addEventListener('input', ...)`".
2. **Use `\(...\)` for inline KaTeX** from the start — never `$...$` inline.
3. **Physics scale check**: before finalizing any time-based sim, verify that interesting state changes take 1–10 seconds at 60fps, not milliseconds.
4. **Narrative-first for complex stops**: for Modern Physics stops (quantum, relativity), define the user story (what should the user understand after 60 seconds?) before writing any code.
5. **Canvas layout**: always compute layout positions as fractions of `W`/`H`, add a global clip, and keep right-panel text columns to max 44% of canvas width.
