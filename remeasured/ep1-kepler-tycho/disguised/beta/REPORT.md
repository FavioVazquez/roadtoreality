# Report: no model won

## Result
No family I tried reaches measurement precision. The errors are about 1 arcmin; the best held-out median is about
1045 arcmin (17 degrees). `MODEL.json` sets `winner: null` and records every family's scores and parameters.

| Family | k | in-sample median / RMS (′) | held-out median / RMS (′, all 29 rows) | passes 3x rule |
|---|---|---|---|---|
| F1 harmonic series on the direction vector (4 frequencies, no physics) | 31 | 184 / 289 | 2998 / 3414 | no |
| F2 one Kepler orbit centred on the observer | 6 | 1040 / 1425 | 2649 / 2851 | yes (uniformly bad) |
| F3c two circular orbits around a common centre | 7 | 773 / 1224 | 8338 / 7111 | no |
| F3 two Kepler orbits around a common centre (pre-registered fit) | 11 | 307 / 768 | 1045 / 1362 | no |
| F3 post hoc: unweighted fit in angle space (stage3.py) | 11 | 215 / 814 | 1049 / 1435 | no |

Under the pre-registered rule, F2 is the only family whose held-out median is under 3x its in-sample median.
That is only because it is equally bad everywhere, so I do not call it the winner. No held-out row passes the
outlier threshold (6σ) under any model, so the "clean held-out" scores are empty and outlier flags mean nothing here.

## What the data do show (facts, not a model)
- Observations come in bursts about 300 t-units long, roughly every 840 to 1000 units.
- The weighted periodogram has peaks near 840 (aliases at 818 and 860) and near 6700 (aliases 5570, 8370).
- Overall, the object drifts toward decreasing x: every fit returned negative periods, and the centres of the turnaround
  loops step down by roughly 35 to 70 degrees per burst. Within a burst, x usually runs down fast (up to about 0.4
  degrees per unit), stops, and turns back for 10 to 15 degrees. The apparent rate changes by more than an order of
  magnitude between and within bursts.
- y stays between about −6 and +5 degrees, apart from one row.
- Two rows look like recording slips by eye: t=3455.7 (x=227 between neighbours near 80 and 340) and t=6974.0
  (y=−14.3 next to a row with y=+2.6 five units later). No fitted model is good enough to flag them formally.
- The best F3 solutions push one eccentricity to the 0.95 clamp. The fit is straining, not converging on a real
  configuration.

## Regularities
None I can support. The F3 numbers (best: observer period about −918, object period about −7118, size ratio about 1.67)
come from a model that misses by degrees. A power law between them would mean nothing.

## Did I recognise the system?
No. Turnaround loops in a slowly drifting direction look like a body seen from another moving body. But the loops
here are much wider and the fast part of the motion lasts longer than two circular or Kepler orbits around a shared
centre can produce from the periods in the data. I did not use any outside constants.

## Process and caveats
- Pipeline: `fit.py` (families, outlier rule, scoring; `python3 fit.py f1` runs F1), `stage3.py` (seeding in angle
  space), `stage4.py` (grid over both periods), `final.py` (σ-weighted fits from those seeds). The post hoc changes
  are listed in PLAN.md.
- The 30-minute budget was overrun by more than 40 minutes. The 6-core machine was shared, with load averages above
  100. The first two runs were lost: the random-phase multistart never converged, and the outlier rule emptied the
  training set before the guard was added.
- Next steps I did not take: lift the eccentricity clamp to 0.99; free the observer's orbital plane (2 more
  parameters); try a family where the object orbits a body that is itself orbiting (a hierarchical model), which
  would explain wide loops with a short period inside a long one.
