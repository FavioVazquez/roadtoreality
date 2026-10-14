# Episode 1 costs

| Date | Step | Who / model | Wall clock | Compute | External | Notes |
|---|---|---|---|---|---|---|
| 2026-10-13 | Day-1 kill test (out/KILLTEST.md) | 1 Opus agent, no sub-agents; 2 advisor (Fable) consultations, before the reduction and at review | ~25 min (20:33-20:58 CST) | Intel Mac, scripts run in ~3 s each; AWS box not used; no Devin | archive.org (OCR 11 MB, 8 page images 5.5 MB), CDS (Tycho catalogue, Hipparcos extract), JPL Horizons API (3 queries) | Token counts not available to the agent; read them from the harness log |
| 2026-10-13 | Full-transcription prep: TRANSCRIBE-GUIDE.md, WORKLIST.json (379 sessions, 6 chunks), batch reduce.py, validate.py, fetch_pages.py, star_index.csv | 1 Opus agent; 3rd advisor (Fable) consultation at review | ~25 min (to 21:24 CST) | Intel Mac; no box, no Devin | archive.org (9 survey pages + 2 crops), VizieR (2 HIP), Horizons (3 batch queries) | |
