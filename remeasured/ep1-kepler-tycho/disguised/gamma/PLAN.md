# PLAN (pre-registered, written before any fit)

Only the column names, ranges and the train/test row count (158 train, 29 held out) were looked at before writing this.

## Data handling
- Train: t < 200.668654. Held out: t >= 200.668654. Held-out rows are never used in any fit, outlier decision or start value.
- Residuals: dx = wrap(x_obs - x_mod) * cos(y_obs) (on-sky arcmin), dy = y_obs - y_mod. Normalised: zx = dx/sx, zy = dy/sy,
  row score z = sqrt(zx^2 + zy^2)/sqrt(2).
- Sky residual per row (arcmin) r = sqrt(dx^2 + dy^2); reported scores are median(r) and RMS(r).

## Outlier rule (fixed)
- Iteratively reweighted fit on training rows: fit, flag rows with max(|zx|,|zy|) > 5, refit without them, repeat until the
  flagged set stops changing (max 10 passes). Threshold 5 sigma, fixed for every family.
- Held-out rows: scored with the same rule (a held-out row with max(|zx|,|zy|) > 5 under the frozen model is counted as a
  flagged row and listed). Scores are reported both on all held-out rows and on unflagged held-out rows. The count of
  flagged held-out rows is part of the score (a model that needs to flag many held-out rows is failing).

## Families, in order
1. **F1 no physics**: x (unwrapped) and y each as polynomial in t plus Fourier terms at K periods found by a
   Lomb-Scargle periodogram of the detrended training data (K chosen by BIC, K <= 4, polynomial degree <= 3).
2. **F2 geocentric two-circle (deferent + epicycle)**: direction of the vector sum of two uniform circular motions
   (radii ratio, two periods, two phases) with the plane tilted: the sum vector lies in a plane with inclination i and node
   Omega for the slow circle, the fast circle in the reference plane. This equals "observer and target both on circular
   orbits about a third point", fitted without assuming which.
3. **F3 two Kepler ellipses**: observer and target each on a Keplerian ellipse about a common centre (observer orbit
   in the reference great-circle plane, target orbit inclined), period, e, perihelion longitude, mean anomaly at epoch for
   each, plus a, i, Omega for the target (observer a = 1 as unit). Starting values from the F2 fit.
0. **F0 single Kepler ellipse, observer at the focus** (added before any fit was run): the object moves on one Keplerian
   ellipse (n, mean longitude at epoch, e cos w, e sin w, i, Omega; 6 params) about the observer. Tests "observer is the
   centre" directly. Run first.
- F3 also has a nested variant F3a (only the target ellipse eccentric, 9 params); F2 vs F3a vs F3 chosen by BIC within the
  family, and all three are scored on held-out rows.
- Eccentricity parameterised as (e cos w, e sin w); epoch at the middle of the training span; mean motions signed (either
  sense of motion allowed).
- Periods for F2/F3 start from periodograms of the training data (slow drift rate of x and the retrograde-loop period),
  then multistart (6 processes).

## Complexity penalty
- BIC = chi2_clipped + k ln(n_clipped) on training rows (chi2 over both coordinates, n = 2 x rows kept).

## Decision rule
- Primary: held-out RMS sky residual on unflagged held-out rows, with flagged held-out count as tie-break against.
- A model wins if its held-out RMS is lowest; if a simpler model (fewer params) is within 10% of the best held-out RMS and
  flags no more held-out rows, the simpler one wins. BIC is reported and used only between nested variants within a
  family.
- Regularities: compare fitted periods and size ratios (e.g. power-law relation between period ratio and size ratio),
  reported with sigma; only claimed if within 2 sigma.

## Post hoc
- Guard added after F0 crashed the clipping loop (it flagged nearly every row): if the 5-sigma rule would drop more than
  half the training rows, clipping is disabled for that model and all rows are kept. It only affects a model that fails.
- First run: F2 multistart from periodogram starts did not converge (phase aliasing over the long baseline). Changes:
  start phases on a 6x6 grid, starts pre-screened on |t - T0| < 60, and every multistart fit grows its time window
  (60, 110, 170, all) before the final clipped fit on all training rows. Families, outlier rule, penalty and decision rule
  unchanged.
