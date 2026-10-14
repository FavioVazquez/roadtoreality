# Report

## Families tried (train t < 1050.889543: 158 rows; held-out: 29 rows; outlier rule r > 5 sigma)
| family | k | train BIC (capped chi2) | train inlier median / RMS (arcmin) | held-out inlier median / RMS | held-out all-rows median / RMS | held-out flagged |
|---|---|---|---|---|---|---|
| A1 cubic smoothing spline of unit vector (no physics) | 203 | 1798 | 0.89 / 1.95 | none left (all 29 flagged) | 834 / 1190 | 29 |
| A2 Fourier series, best order N=5 (no physics) | 183 | 2112 | 0.89 / 1.72 | none left | 6391 / 6552 | 29 |
| B two uniform circles (epicycle / circular orbits) | 7 | 3891 | fit only 4 rows; 154 flagged | none left | 939 / 2388 | 29 |
| **C two Kepler ellipses, common centre** | **11** | **848** | **1.26 / 1.86** | **2.05 / 2.96** | 2.39 / 189 | 5 |

Winner by the pre-registered rule: **C** (lowest BIC, and the only family that predicts the held-out rows).
The flexible functions fit the training rows but fail on held-out rows; uniform circles cannot fit at the
arcminute level. Ten training rows and five held-out rows exceed 5 sigma (e.g. t=1267.1, y=-14.3, a clear slip).

## What the model says
The object and the observer each move on an ellipse around a common centre, with uniform areal speed (Kepler
equation); the direction is object minus observer. Observer orbit in the reference plane: period 98.718 +- 0.0004
units, e = 0.0169. Object: period 185.669 +- 0.001 units, semi-major axis 1.52363 +- 0.00005 observer units,
e = 0.0931, inclination 1.86 deg to the reference plane (fitted as -178 deg with negative periods, same geometry).
Synodic period 210.8 units, the spacing of the retrograde loops. Sigmas are formal (Jacobian, scaled by reduced chi2).

## Regularity
(a2/a1)^3 / (P2/P1)^2 = 0.99987: a ∝ P^(2/3) (fitted exponent 0.6666). Nothing in the fit imposed it; the periods
and the size ratio were free.

## Recognition
Yes, after the fit: a period ratio of 1.881, size ratio 1.524, e 0.093 and inclination 1.86 deg match Mars seen from
Earth (Earth e 0.017); the time unit would be about 3.7 days. Starting values came only from the periodogram, and
no known constant was typed in.

## Post hoc / caveats
See PLAN.md "Post hoc": capped-chi2 BIC, wider B multistart over periodogram-peak pairs. The derived ratios
(abs periods, exponent, synodic period) were first computed by a short post-processing step and are now in fit.py.
A2 used the two strongest periodogram peaks, which turned out to be the object period and a long alias (not the
observer period, the 4th peak); a Fourier series on the right pair was not tried, for the time budget.
