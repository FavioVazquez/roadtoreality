# PLAN (pre-registered, written before any fit; only the raw table was looked at)

Data: 187 rows, direction (x, y) in degrees vs t. Train: t < 6009.989529 (158 rows). Test: t >= 6009.989529 (29 rows), predicted without refitting.

## Residual definition
For each row: dx = wrap(x_obs - x_mod) * cos(y_obs) [arcmin], dy = y_obs - y_mod [arcmin].
Normalised residuals: dx/sx, dy/sy. Angular residual = sqrt(dx^2 + dy^2) [arcmin].

## Outlier rule (fixed)
Iterative, on training rows only, per model family: a row is an outlier if
max(|dx/sx|, |dy/sy|) > 6 * s, where s = max(1, 1.4826 * MAD of all normalised residuals of the kept rows).
Refit after each pass until the set is stable (max 10 passes). The final s of the model is then used with the same
6*s rule to flag held-out rows (flagging only; never refit). Held-out scores are reported both on all held-out rows
and on the non-flagged ones.

## Families, in order
1. **F0 - no physics: trigonometric regression of the line-of-sight unit vector.** Components
   (cos y cos x, cos y sin x, sin y) each modelled as constant + sum of sinusoids. Frequencies: the strongest peaks
   of a weighted Lomb-Scargle periodogram of the training components, then the harmonics/combinations found by
   iterative prewhitening (stop when a peak's BIC gain < 0). Linear least squares for amplitudes, then nonlinear
   refinement of frequencies.
2. **F1 - geometric two-circle model (deferent + epicycle, equivalently two circular orbits).** Line of sight is the
   direction of r(t) = A(t) - B(t), A = circle radius 1 (fixed scale) in a tilted plane (node, inclination),
   B = circle radius rho in the reference plane; uniform angular rates n_A, n_B. Parameters: n_A, n_B, phases,
   rho, inclination, node (7) plus a small optional reference-plane tilt if needed.
3. **F2 - two Keplerian ellipses (heliocentric-style geometry with Kepler's equation).** As F1 but each orbit is a
   Kepler ellipse (e, perihelion argument, mean anomaly rate, epoch). Mean motions and radius ratio free;
   no relation between period and size is imposed (Kepler's third law is tested afterwards, not assumed).
   Parameters: 2 x (n, e, omega, M0) + rho + inclination + node (11).
Post hoc additions, if any, are listed below under "Post hoc".

Starting values: from the data only (periodogram frequencies, stationary-point timing, latitude extrema).
Multistart over a few starting points, process pool sized to free cores.

## Complexity penalty
BIC = chi2_clipped + k ln(N_kept) on the training set, chi2 using the quoted sigmas (scaled by s^2 when comparing
across families: BIC_s = chi2/s_ref^2 + k ln N with s_ref the smallest s over families).

## Decision rule
1. Primary: held-out RMS angular residual on non-flagged held-out rows. A family whose held-out RMS is > 3x its
   in-sample RMS is "failed to predict" and cannot win.
2. Among families whose held-out RMS is within 25% of the best, choose the lowest BIC_s (simplest that predicts).
3. Report in-sample and held-out median and RMS for every family tried.

## Post hoc
(added after the first runs; none of them changes the families, the outlier rule or the decision rule)
1. Seeds: the sense of usual motion was first taken from a count of short steps, which is biased by the dense
   sampling around reversals (it picked the wrong sense). Replaced by the time-weighted sign of steps < 150 units.
   Reversal-centre longitudes are now unwrapped along the sequence of centres, not along the sparse time series.
2. F0: the first version re-selected frequencies inside the clipping loop on the shrinking kept set (runaway).
   Frequencies are now chosen once on all training rows; only amplitudes are refitted in the loop. A no-clipping
   score of F0 is also reported. Held-out scores are "None" when every held-out row is flagged.
3. Speed (45-min budget, shared machine): Kepler solver 10 Newton steps; F2 multistart reduced to 15 starts
   (F1 solution with small eccentricity offsets). Pool size = free cores from vm.loadavg.
4. BIC: s_ref is applied in the assembly step as written above (BIC_sref); each family's own-s BIC is also listed.
5. Units: seeds for the geometric families use the reversal (retrograde) episodes: their mean spacing gives the
   synodic period S, the drift of their direction per S gives the slower body's mean motion modulo 360/S
   (k = 0,1,2 tried), and the alignment at a reversal centre gives the phases. Both "observer inside" and
   "observer outside" configurations are started.
