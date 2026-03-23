---
title: Update episodio4.md with phases 7 & 8 + upcoming preview
quick_task: "001"
---

# Quick Task 001 — Plan

## Task 1: Add phases 07 and 08 to the project example section

<files>
- Episodio4/episodio4.md
</files>

<action>
Three edits:

1. Update the `.planning/` directory tree (currently shows phases 01-06 only) to include
   phases 06.1, 07, and 08.

2. Change "Al terminar la fase 06" → "Al terminar la fase 08" in the closing sentence
   of that section.

3. Insert a new narrative block about phases 07 and 08 between the directory tree +
   closing sentence and the transition sentence "El paso a paso exacto...".

   Phase 07 content:
   - ESM script generates 50 SVG OG images (1200×630) from stops.json
   - Era hex colors (oklch can't be used in SVG) — decision documented in script
   - inject-og-meta.mjs adds og:title, og:description, og:image, twitter:card to all 50 HTMLs
   - Result: any stop pasted on LinkedIn or Twitter shows a visual preview

   Phase 08 content:
   - Two missing stubs from Eras 1-2: stop 002 (Pythagoras) + stop 014 (Hooke's Law)
   - Stop 002: Web Audio API, lazy AudioContext (iOS requires gesture-triggered creation),
     6 ratio buttons (1:1 to 9:8), standing wave formula A·sin(nπ(x-x₀)/L)·cos(ωt)
   - Stop 014: split-canvas design (spring left, F vs. x graph right), piecewise physics
     (elastic/plastic/rupture), 18-frame shake animation, 3 material presets
   - Result: Eras 1-2 fully implemented, 14 interactive simulations
</action>

<verify>
- The directory tree shows phases 01-08
- Phase 07 and 08 narrative is present and sounds like the author's voice
- No "Al terminar la fase 06" text remains
</verify>

<done>
New content integrated into the project example section, reading naturally
as a continuation of the existing phase 06 narrative.
</done>

## Task 2: Add "Lo que viene" section before "El próximo paso"

<files>
- Episodio4/episodio4.md
</files>

<action>
Insert a new section "## Lo que viene: de la física clásica al borde del conocimiento"
immediately before "## El próximo paso".

Content:
- Phase 09: Era 3 Classical Physics — 12 stops (Bernoulli → Michelson-Morley)
  Fluid dynamics, electromagnetism, statistical thermodynamics, electromagnetic waves
  Maxwell's equations as the pivot that leads to Einstein
- Phases 10-11: Modern Physics — 13 stops (Planck → Dirac)
  Quantization, photoelectric effect, special relativity, E=mc², Bohr atom,
  general relativity, double-slit, Schrödinger, Heisenberg, Pauli, Dirac
- Phases 12-13: Contemporary Physics — 11 stops (nuclear fission → open questions)
  Stop 050 explicitly about open questions (dark matter, dark energy, GR+QM reconciliation)
- Phase 14: Integration pass — all 50 stops verified, Lighthouse audit, v2.0 deploy
- Closing note: same Phase Loop, same structure, six more phases
</action>

<verify>
- Section exists before "## El próximo paso"
- Content is specific (names phases, names stops, gives counts)
- Tone matches author's voice — measured, precise, honest
</verify>

<done>
"Lo que viene" section present and readable as a natural bridge between
the project narrative and the "next step" CTA.
</done>
