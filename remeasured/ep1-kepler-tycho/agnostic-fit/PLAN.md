# PLAN (pre-registered before any fit)

Data: `positions.csv`, sha256 626925e4...183c (checked). 187 rows, one planet, 1580-1601.
Split (fixed by the brief): TRAIN = jd_tt < 2304000.5 (159 rows), TEST = the rest (28 rows). Every model is fitted on
TRAIN only and then predicts TEST with no refit.

Note on prior knowledge: the flags name the planet (Mars) and the observer sites, and I know textbook astronomy. None
of that goes into a fit: no orbital or planetary number is typed in. Periods, sizes, eccentricities, orientations are
found from the data (periods by a grid search over a wide frequency range, then least squares).

## Frame
Input is apparent ecliptic lon/lat, true ecliptic and equinox of date. With erfa (frame only) each unit vector is
rotated to one fixed frame (mean ecliptic and equinox of the fixed epoch JD 2302000.0 (mid-1590), chosen so the
Earth orbit plane stays within ~0.5' of the reference plane over the span; via the IAU 2006/2000A precession-nutation matrix and true
obliquity), so all models live in a non-rotating frame. Predictions are rotated back to true-of-date before residuals are
taken. Not modelled (each below ~0.3'): light time, aberration, topocentric parallax.

Eccentricities are parametrized as (e cos w, e sin w) to avoid the e = 0 singularity; multistart over w.

## Residual metric
Per row: dlon* = (lon_obs - lon_mod) cos(lat_obs), dlat = lat_obs - lat_mod; angular residual
d = sqrt(dlon*^2 + dlat^2) in arcmin. Fit weights: 1/sigma_eff with sigma_eff^2 = sigma^2 + (0.5')^2 (a fixed floor for the unmodelled light time,
aberration and parallax, which stack to ~0.5'), with a common free scale. Fits work on unit vectors / wrapped
longitude differences, so 0/360 is not an issue.

## Families, in this order
1. **No physics, A: smoothing spline in time** (per coordinate of the unit vector, cubic B-spline, knots every 60 days
   where data exist). Pure interpolator; extrapolates by holding the end polynomial.
2. **No physics, B: empirical harmonic series.** The unit direction vector (x, y, z) is a linear combination of
   cos/sin of (j f1 + k f2) t for |j|,|k| <= K, with f1, f2 found from the data by a 2-D frequency search, K chosen by
   training BIC (K = 1..4). No geometry.
3. **Geocentric (Ptolemaic) deferent + epicycle**: Earth fixed at the centre; planet = eccentric deferent with equant
   (uniform angular motion about the equant point, equant offset = 2x deferent eccentricity, i.e. bisected) carrying a
   circular epicycle with uniform motion; deferent plane inclined; epicycle plane parallel to the ecliptic.
   (Amended before any fit: the equant fraction is FREE, not fixed at 2x the eccentricity; bisection, if it appears,
   is then a finding.)
4. **Heliocentric circles (Copernican-like)**: two concentric circular orbits, Earth in the reference plane, planet orbit
   inclined (node, inclination), uniform motion.
5. **Heliocentric eccentric circles + equant on both orbits** (Earth's orbit eccentric too), equant fraction free per
   orbit.
6. **Heliocentric Kepler ellipses**: both orbits are Keplerian ellipses (Kepler equation, equal areas) with free
   P, e, perihelion, mean anomaly at epoch; planet a (Earth a = 1 sets the scale), i, node.
7. **Kepler ellipses with a harmonic law imposed**: only if family 6's fitted numbers show a relation between sizes and
   periods; it would then tie a_planet to the period ratio (one parameter fewer). (Decided after 6 only if 6 shows it; if
   so it is reported under "post hoc" but its form is fixed here: a_p = (P_p/P_e)^q with q fixed from the data of
   family 6 rounded to a simple fraction.)

Start values: periods from a 2-D grid search with the linear trick (for two circular coplanar motions the condition
"model vector parallel to observed direction" is linear in the two complex amplitudes; smallest singular vector), over
periods 100-6000 d, then all other parameters from that circular solution, then nonlinear least squares
(scipy least_squares, multistart).

## Outlier rule (fixed)
For each model, iterate up to 5 times: fit; z = residual/sigma per coordinate; s = 1.4826 * MAD of all training z
(both coordinates pooled); a row is an outlier if max(|z_lon|, |z_lat|) > 5 s **or** d > 60 arcmin; refit without
outliers (rows can come back). The final training scale s and threshold are frozen and applied unchanged to the TEST
rows for the "inlier" scores.

## Scores (every model)
In-sample and held-out: median d and RMS d over (a) all rows and (b) inlier rows; number of outliers.

## Complexity penalty
BIC on training: BIC = n ln(chi2_w / n) + k ln n, n = 2 x (number of training rows that are inliers for every model),
each model refitted on that common set; k = number of free parameters.

## Decision rule
Primary: held-out median angular residual d (all test rows; median is robust to bad rows). Models within 1.25x of the
best held-out median are "tied"; among tied models the lowest training BIC wins. A model whose held-out median is more
than 3x its in-sample median is declared to fail on the later years and cannot win.

# Post hoc (added after the first full run; none of this changes the pre-registered winner rule)
1. **Family 7 triggered.** Family 6 gave a_P/a_E = (P_P/P_E)^q with q = 0.66662 +- 0.00006, so family 7 was fitted with
   q = 2/3 (the simple fraction, denominator <= 4, as fixed above).
2. **BIC reference set.** The pre-registered "inlier for every model" set turned out to be only 10 training rows,
   because the poor models (concentric circles, K = 1 harmonics) reject most rows under the outlier rule. BIC on that
   set is kept and reported but is not informative. Added: BIC with every model refitted on the training inliers of the
   Kepler fit (153 rows). The decision is reported under both.
3. **Apsidal motion check.** The held-out 1600 rows show a +2' mean longitude offset under Kepler. To test whether
   it is a slow change of the orbits, a Kepler variant with uniformly rotating apse lines (2 extra rates) was fitted on
   the training set and scored on the held-out rows in the same way.
4. Residual atan2 form: before the first full run, the residual was changed from a tangent-plane chord to an atan2
   form because the chord form cannot tell a direction from its antipode (found on a trial fit).
5. Implementation note: residuals are computed in the fixed frame (observations rotated once into it) rather than by
   rotating predictions back to true-of-date. The angular distance d is frame-invariant, and the lon/lat axes of the two
   frames differ by only ~3', so the scores and fits are equivalent to the wording in "Frame" above.
