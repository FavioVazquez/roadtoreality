# ep3 costs
- Day-1 kill test (13 Oct 2026, 20:33-21:08 CST): 35 min wall, one Opus agent + one Haiku sub-agent (~190k tokens); ~180 cached JPL Horizons calls (free); no box, no Devin.
- Measurement (13 Oct 2026, 21:09-22:15 CST): ~65 min wall, one Opus agent; Mac only (6 cores): three full fit runs (last one 10.4 min on 6 processes) + a ~10-min wide-search refit + planet budget (18 s) + closure/calibration runs; ~500 new cached JPL Horizons calls (689 total, free); REBOUND 4.4.10 built from source; no box ($0, 0 h), no Devin, no sub-agents.
