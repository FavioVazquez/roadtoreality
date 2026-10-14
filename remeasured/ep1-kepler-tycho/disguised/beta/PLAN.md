# PLAN (pre-registered, written before any fit)

Data seen so far: only column summaries (187 rows, t from -633 to 8550, 158 training rows with t < 6009.989529,
29 held-out rows; observations come in bursts).

## Residual definition
For a predicted direction (x_p, y_p): dx = (x - x_p wrapped to [-180,180)) * cos(y) * 60, dy = (y - y_p) * 60 (arcmin).
Normalised residual r = sqrt((dx/sx)^2 + (dy/sy)^2). Reported scores: median and RMS of the angular residual
sqrt(dx^2+dy^2) in arcmin, in-sample (training, clean) and held-out (all held-out rows, and held-out rows passing the
outlier rule).

## Outlier rule (fixed)
Fit each model first with a robust loss (scipy least_squares, loss='soft_l1', f_scale=3). Any row (training or held-out)
whose normalised residual r > 6 under that model is flagged as a recording slip. Training flagged rows are dropped
and the model is refitted with ordinary least squares; flags are recomputed once with the same threshold (6) and
the fit repeated if the set changes (max 3 rounds). Held-out rows are flagged with the frozen model, same threshold.

## Families, in order
1. **F1 - no physics: harmonic series.** The unit direction vector (3 components) modelled as a constant plus a sum
   of sinusoids in t. Frequencies picked greedily from a weighted periodogram of the training residuals; terms added
   while BIC decreases (max 8 frequencies; post hoc cut to 6 for time). Also a cubic-spline-free variant is not used (cannot extrapolate).
2. **F2 - one Keplerian orbit centred on the observer.** Object moves on a Kepler ellipse around the observer
   (6 elements + mean anomaly epoch; distance scale unobservable, so a = 1). Starting period from the periodogram.
3. **F3 - two Keplerian orbits around a common centre.** Observer and object each on a Kepler ellipse around an
   unseen centre; seen direction = r_object - r_observer. Observer orbit defines the reference plane (inclination 0).
   Free: observer (P, e, varpi, epoch), object (P, a ratio, e, i, node, varpi, epoch). Periods start from the
   periodogram (the two strongest independent frequencies / combinations). Variant F3c: both orbits circular.
4. Post-hoc families, if any, are listed under "post hoc" below.

## Complexity penalty
BIC = chi2 + k ln(n) on clean training rows (chi2 from normalised residuals, k = free parameters).

## Decision rule
1. A family whose held-out median angular residual is more than 3x its in-sample median "fails prediction" and
   cannot win.
2. Among the rest, take the lowest held-out RMS (clean held-out rows). Every family whose held-out RMS is within
   25% of that and whose in-sample BIC is within 10 of the best BIC is a tie; the tie goes to the fewest parameters.
3. Parameter σ from the covariance (J^T J)^-1 of the final least-squares fit, scaled by sqrt(reduced chi2) if > 1.

## Regularities
After the winner is chosen, check relations between its numbers (e.g. period vs size ratio power laws) using only
fitted values, with σ propagated.

## Post hoc
(none yet)
- (post hoc, after the first run crashed) Guard on the outlier rule: if the threshold would flag more than 20% of the
  training rows, the model is too poor for flags to mean recording slips, so no training rows are dropped for that
  model. Threshold (6) unchanged. Multistart sizes were trimmed for the time budget (machine is shared).
- (post hoc) F3c seeding: the random-phase multistart never converged (all rows at the cap), so seeds now come from a
  vectorised grid over size ratio and both phases scored on longitude alone; periods still from the periodogram.
  F1 runs as a separate process (`python3 fit.py f1`) in parallel.
- (post hoc) The 30-minute budget was overrun: the 6-core machine was shared with other jobs (load average > 100).
