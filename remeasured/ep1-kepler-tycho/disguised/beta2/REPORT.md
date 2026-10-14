# Report: the law behind positions.csv

## Winner: F2, two Kepler ellipses seen from one of them (11 parameters)
The direction is that of r = P(t) - O(t). O (the observer) moves on a Kepler ellipse in the reference plane, and P (the
target) moves on a Kepler ellipse tilted to that plane. Each orbit has its own mean motion, eccentricity, perihelion
and phase. The only scale is the size ratio rho, and no period-size relation was imposed.

| family | k | train kept / clipped | train median / RMS (') | held-out median / RMS (') unflagged | held-out median / RMS (') all 29 rows | verdict |
|---|---|---|---|---|---|---|
| F0 trig regression of the unit vector (no physics) | 66 | 19 / 139 (clip cascade) | 1.1 / 3.1 | none (all 29 flagged) | 6875 / 7464 | failed to predict |
| F0 same, no clipping | 66 | 158 / 0 | 537 / 1982 | – | 6975 / 7277 | failed |
| F1 two circles (deferent+epicycle) | 7 | 71 / 87 | 135 / 203 | 206 / 307 (10 rows) | 570 / 1247 | predicts, badly |
| **F2 two Kepler ellipses** | 11 | 152 / 6 | **1.33 / 2.02** | **2.13 / 3.20** (28 rows) | 2.23 / 188.7 | **winner** |

Decision rule from PLAN.md: F0 fails to predict. F2 has the best held-out RMS, 3.2' against 307' for F1, so F2 wins
outright and no BIC tie-break is needed. F2's robust scale is s = 1.14, so its residuals are close to the quoted
errors. Held-out RMS / train RMS = 1.6, and the held-out residuals do not grow steadily over the 2,500 units after the cut. They are 0.4-2.7' up to
t = 6980, 3-8' around the loop at t ≈ 7800 (where the quoted σ are larger, 1.1-3.5'), and 0.9-3.2' at t = 8550.

Recording slips found by the 6·s rule:
- training: t = 329.2, 1199.5, 1228.2, 1940.6, 5099.1, 5194.3;
- held-out: t = 6974.0. Its y = -14.3° against neighbours near +2.5°, and it alone makes the all-rows held-out RMS 189'.

## Parameters (σ from the Jacobian scaled by the reduced chi², T0 = 3000, angles are in the data's frame)
- Observer period P_O = 440.065 ± 0.002 units. Eccentricity e_O = 0.0169 ± 0.0001, perihelion longitude 156.0 ± 0.4°.
- Target period P_T = 827.680 ± 0.005 units. e_T = 0.09304 ± 0.00007, perihelion longitude 282.97 ± 0.05°.
- Size ratio a_T/a_O = rho = 1.52362 ± 0.00006. The target is the outer body.
- Inclination of the target's orbit = 1.8555 ± 0.0012°, ascending node at 25.14 ± 0.03°.
- Synodic period = 939.677 ± 0.004 units. The independent seed from the retrograde episodes was 938.
- Both bodies move toward decreasing x. Either the x axis is mirrored, or time runs backward relative to the usual
  convention. In that sense of motion, both orbits go the same way.

## How the system works
Two bodies orbit a common centre that is never observed, and that centre sits at a focus of both ellipses. The observer is the
inner, faster and nearly circular body. The target is outer, slower, more eccentric and slightly inclined. Every
apparent loop (about 10% of each 940-unit synodic cycle) happens when the inner observer overtakes the outer body;
nothing in the target's own motion reverses. The loops come at uneven spacings (900-980 units) and have unequal
sizes, and the largest latitudes (-6.3° near t ≈ 4970, +4.6° near t ≈ 1205) occur at close approaches. All of these
come from the two eccentricities, which is why two circles (F1) miss by degrees and Kepler ellipses fit to arcminutes.

## Regularity between the numbers
(P_T/P_O)² = 3.53746 ± 0.00001 and rho³ = 3.5370 ± 0.0004. These agree to 1.4 ± 1.1 × 10⁻⁴, so P ∝ a^(3/2): the fitted
exponent is 1.50017 ± 0.00014. The model never assumed this law (periods and size ratio were free), so it is a result.
The second regularity, 1/P_syn = 1/P_O - 1/P_T, is satisfied by construction.

## Recognition
This looks like Mars seen from Earth. It was recognised after the fit, from rho = 1.524, e_T = 0.093, e_O = 0.017,
i = 1.85° and a period ratio of 1.881. All of these match values I know, and the loop shape and latitude range match Mars' retrograde loops. The
time unit would be about 0.83 day (P_O = 440 units for a year), and the longitude axis is mirrored or time is
reversed. None of this knowledge entered the fit: every start came from the data (retrograde-episode spacing, the drift
of the direction at each loop, and alignment at the loop centres), and every parameter was left free.

## Notes
- F0 is the required no-physics family. Its periodogram frequencies are aliases of the sparse, clustered sampling. Even
  where it fits training rows it extrapolates to the wrong part of the sky, and the clipping rule cascades on it.
- F1's chi² is dominated by the equation of centre, which a circle cannot absorb. It gets the period structure right
  (its mean motions are within 1.2% of F2's) but not the positions.
- About 2' of residual remains, roughly 1.1× the quoted errors. It may be small unmodelled perturbations or mildly
  understated errors, and it is not structured enough to justify more parameters.
