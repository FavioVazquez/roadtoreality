# Phase 2: Stops Data & Navigation — Verification

**Date:** 2026-03-20
**Status:** passed
**Verified by:** Cascade (retroactive)

---

## Must-Have Checklist

### Plan 02-01 must_haves
- [x] stops.json is valid JSON with "stops" array of exactly 50 objects — confirmed (python3 validation passed)
- [x] All 5 era values used: ancient, revolution, classical, modern, contemporary
- [x] stops[0].prev === null (001-thales prev is null)
- [x] stops[49].next === null (050-frontiers next is null)
- [x] Navigation chain unbroken: stops[i].next === stops[i+1].id for all i in 0..48
- [x] 12 stops have isStub=false (001, 003-013); remaining 38 have isStub=true
- [x] Every stop has non-empty description

### Plan 02-02 must_haves
- [x] All 50 stop directories exist under Episodio4/stops/ — confirmed: `ls Episodio4/stops/ | wc -l` = 50
- [x] All 50 index.html files present — confirmed: `find Episodio4/stops -name index.html | wc -l` = 50
- [x] Every stop page has #stop-config JSON script tag with correct id field
- [x] Every stop page has #sim-mount, #stop-breadcrumb, #stop-nav
- [x] 12 full stops have .stop-intro, .stop-body, .takeaway-box, .stop-bridge
- [x] Stub stops have .sim-placeholder inside .sim-container
- [x] Script load order correct on full stops
- [x] Stub stops do not load sim.js

### NAV requirements (from REQUIREMENTS.md)
- [x] NAV-01: Era timeline renders from stops.json data
- [x] NAV-02: Breadcrumb present on all stop pages (rendered by stop-shell.js)
- [x] NAV-03: Prev/next navigation on all stop pages
- [x] NAV-04: Visited badge applied to stop cards (via PhysicsProgress)
- [x] NAV-05: Progress bar on landing page
- [x] NAV-06: Stub stops not navigable (stop-card--stub class applied)
- [x] NAV-07: Stop counter in header (#stop-counter populated by stop-shell.js)

---

## Human Verification Items

- [ ] Navigate from stop 001 through to 013 using Next button — verify chain is unbroken
- [ ] Visit stop 003, return to landing page — verify visited badge appears on stop 003 card
- [ ] Verify breadcrumb shows correct era and stop title on each full stop
- [ ] Verify stub stop pages render placeholder correctly (no broken JS errors)
- [ ] Verify era tab on landing page scrolls to correct era section

---

## Gaps Found

None — all automated criteria pass. Navigation chain integrity verified by python3 validation script during generation.

*Verified: 2026-03-20*
