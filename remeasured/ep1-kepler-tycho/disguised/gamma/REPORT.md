# REPORT

## Scores (arcmin on sky; train = t < 200.668654, 158 rows; held out = 29 rows, no refit)
| family | k | BIC | train median | train RMS (unflagged) | held-out median | held-out RMS all | held-out RMS unflagged | held-out flagged |
|---|---|---|---|---|---|---|---|---|
| F0 one Kepler ellipse, observer at focus | 6 | 7.7e8 | 505 | 1635 | 847 | 1376 | 1376 | 29/29 |
| F1 no physics (drift + 4 Fourier terms) | 23 | 7.1e6 | 151 | 897 | 1851 | 3080 | 3080 | 29/29 |
| F2 two circles about a common centre | 7 | 1.3e8 | 434 | 749 | 406 | 1252 | 1252 | 29/29 |
| F3a two orbits, target ellipse only | 9 | 51845 | 10.1 | 4.3 | 44 | 195 | 195 | 29/29 |
| **F3 two Kepler ellipses (winner)** | 11 | **654** | **1.34** | **1.96** | **2.18** | 189 | **3.02** | 4/29 |

**Winner: F3.** It wins on the pre-registered rule (lowest held-out RMS on unflagged rows) and on BIC.
Held-out flagged rows (>5 sigma): t = 265.195 (y = 14.3 deg against -2.5 deg for its neighbours, an obvious slip),
211.885, 320.199, 322.531. Training rows flagged: 8 of 158. chi2_red = 2.05 on kept rows (sigmas in MODEL.json are scaled up by sqrt(2.05)).

Caveats: F2 most likely did not reach its best circular solution (multistart stuck in a phase alias), so its score is
an upper bound, not a fair floor for circles. F1 extrapolates badly, as expected for a free function of time.
The three non-obvious flagged held-out rows were not inspected further (time budget); they may be slips or the edge
of what the model captures.

## What the model says
- The observer is **not** at the centre: F0 (everything about the observer) fails by ~14 deg. Both observer and object
  move on ellipses around a common, unseen centre, in the same sense (both mean motions negative, i.e. the motion runs
  against the x convention of the frame).
- Observer orbit: period 29.456 units, e = 0.0169, perihelion longitude 277 deg, lies in the reference plane by construction.
- Object orbit: period 55.401 units, size 1.52363 x the observer's, e = 0.0930, perihelion longitude 43.7 deg,
  inclined 1.86 deg to the reference great circle, node at 325.9 deg.
- Retrograde loops recur at the synodic period 62.898 units = 1/(1/29.456 - 1/55.401).
- Equal areas in equal times is built into the ellipse model; the eccentric version beats circles by a factor of ~200
  in held-out RMS, so the non-uniform speed is real.

## Regularity
Periods and sizes were fitted as independent parameters. The fit gives ln(P_tgt/P_obs) / ln(a_tgt/a_obs)
= **1.5001 +/- 0.0001** (formal), i.e. P^2 proportional to a^3 across the two orbits.

## Recognition
I believe this is **Mars seen from Earth** (geocentric ecliptic longitude/latitude, with the time axis in units of
about 12.4 days and the longitude sense reversed). Why: the fitted size ratio 1.5236, eccentricities 0.093 and 0.017,
inclination 1.86 deg, period ratio 1.881 and retrograde arcs taking ~9% of each synodic cycle all match what I remember
of Mars and Earth. None of this was used in the fit: every start value came from the complex periodogram of the
training data and coarse grids.
