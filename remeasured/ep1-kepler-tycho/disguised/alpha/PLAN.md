# PLAN (pre-registered before any fit)

Split: train = rows with t < 1050.889543, test = rows with t >= 1050.889543. Test rows are never used for fitting,
outlier flagging during fitting, or model selection other than the decision rule below.

Residuals: for each row, dX = wrap(x_obs - x_mod) * cos(y_obs) and dY = y_obs - y_mod, in arcmin.
Normalised residual r = sqrt((dX/sx)^2 + (dY/sy)^2). Reported scores: median and RMS of the angular residual
sqrt(dX^2+dY^2) in arcmin, in-sample and held-out, both over all rows and over inliers.

## Families, in order
A. No physics. A1: cubic smoothing spline of the unit direction vector vs t (extrapolates linearly; baseline).
   A2: multi-frequency Fourier series of the 3-D unit vector (ux,uy,uz), frequencies = integer combinations
   n1*f1 + n2*f2 (|n1|+|n2| <= N) of the two strongest peaks of a complex periodogram of exp(i x); linear least
   squares; order N chosen by BIC on train.
B. Two uniform circles (geometric: direction = vector sum of a circle in the reference plane and an inclined circle;
   equivalent to a deferent+epicycle or a circular two-orbit model). Starting periods from the periodogram.
C. Two Keplerian ellipses around a common centre: observer on an ellipse in the reference plane, object on an inclined
   ellipse; direction = object - observer. Same periodogram starts; eccentricities start at 0 (i.e. from B's fit).

## Outlier rule (fixed)
Fit with Cauchy-robust least squares, then flag rows with normalised residual r > 5 as outliers, refit on the rest
by plain weighted least squares, re-flag with the same r > 5 threshold, repeat until the flagged set is stable
(max 5 passes). The same r > 5 threshold flags test rows against the frozen predictions.

## Complexity penalty
BIC = chi2_inliers + k * ln(n_inliers_train), with chi2 using the stated sigmas (2 coordinates per row, so n counts
2 per row).

## Decision rule
The winner is the family with the lowest training BIC whose held-out inlier RMS is no worse than 1.5x the best
held-out inlier RMS of all families. If it fails that, take the next-lowest BIC that passes. Ties (dBIC < 10): the
one with fewer parameters.

## Post hoc
(none yet)
- (post hoc, after the first run, before any family was compared) The flag-and-refit loop let poor fits
  flag most training rows and then score a tiny chi2. Changes: BIC now uses the capped chi2 over all training rows,
  sum(min(r,5)^2), so every flagged row costs 25 (n = 2 x all training rows); the r>5 threshold is unchanged. A2
  keeps the periodogram frequencies fixed (no frequency refinement, for time) and flags once after a Cauchy IRLS fit.
  Multistart sizes reduced for the time budget.
- (post hoc) B multistart widened to every ordered pair of the six strongest periodogram peaks as (observer, object)
  periods: the first run (two strongest peaks only) gave no adequate fit. The best B start then used the 3rd/4th peaks.
  Multistarts begin with a tolerant soft-L1 stage (scale 300 sigma) before the Cauchy stage.
