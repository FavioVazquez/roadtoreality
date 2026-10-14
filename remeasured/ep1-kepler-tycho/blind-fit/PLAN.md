# PLAN (pre-registered, written before any fit)

Written 2026-10-13, after reading `BRIEF.md` and listing the rows of `mars_positions.csv`, before fitting anything.
I know roughly what the modern orbit of Mars and Earth is. That knowledge is kept out of the fit: no starting value,
prior, bound or check uses it. Every start comes from the data by the steps in section 3.

## 1. Data reduction
- Input: all 187 rows, none dropped by hand (flags are not used to drop rows; quality A/B is only reported).
- Frame: true ecliptic and equinox of date -> mean ecliptic of date by subtracting the nutation in longitude
  (`erfa.nut06a`, Δψ; latitude unchanged) -> mean ecliptic and equinox of J1590.0 using the long-term precession
  matrices `erfa.ltecm` (date -> ICRS -> J1590.0). Epoch of elements and of the frame: J1590.0 = JD(TT) 2301792.5.
- Earth's orbital plane is the reference plane (inclination 0 by definition of the ecliptic of J1590.0).
- Units: lengths in Earth's semi-major axis (or circle radius) = 1. Time in days (TT).
- Light time and annual aberration are modelled from each model's own fitted orbits, taking Earth's a = 1 au and
  c = 1 au / 499.005 s (the only external constant; it sets the time scale of light, not any orbital element). Mars at
  t - τ, Earth at t; then stellar aberration with Earth's model velocity. Diurnal parallax and refraction: assumed already
  removed by the reduction (positions are geocentric); not modelled.

## 2. Models (in this order)
Common Mars plane: node Ω and inclination i (heliocentric, Sun in the plane).
1. **Circle + equant (Kepler's vicarious hypothesis), free equant**. Mars on a circle of radius R centred at
   distance e_c·R from the Sun along the apse line (longitude ϖ), uniform angular motion (period P, mean longitude L0 at
   epoch) about the equant at distance e_q·R from the Sun on the same side. Earth: circle of radius 1, centre offset e_E
   toward longitude ϖ_E, uniform motion about the centre (period P_E, mean longitude L_E0). Params:
   R, e_c, e_q, ϖ, L0, P, Ω, i, e_E, ϖ_E, L_E0, P_E -> 12 params.
   1b (secondary, reported): same with bisected equant, e_c = e_q/2 (11 params).
2. **Kepler ellipse for Mars** (Kepler's equation, Sun at focus): a, e, ϖ, L0 (mean longitude at epoch), P, Ω, i;
   Earth: eccentric circle as in model 1. 11 params.
3. **Two Kepler ellipses**, Sun at a focus of both: Mars a, e, ϖ, L0, P, Ω, i; Earth a = 1, e_E, ϖ_E, L_E0, P_E.
   11 params. Kepler's third law is NOT imposed (a and P are fitted separately).
Angles in the J1590.0 frame; longitudes of perihelion and mean longitudes measured in the ecliptic from the equinox
(ϖ = Ω + ω).

## 3. Starting values (all from the data)
- Oppositions: split rows into apparitions (gap > 120 d). In each apparition with a retrograde arc, fit a cubic to
  longitude vs time; opposition time = time of most negative dλ/dt; opposition longitude = λ there. At opposition both
  heliocentric longitudes equal the geocentric longitude.
- Mean motions: the opposition longitudes are fit by λ = L + n·t for one n; the set of n that fit (aliases) gives the
  synodic period. For each alias pair (n_E, n_M = n_E − 360°/P_syn, both positive) fit a coplanar two-circle model
  (Mars radius free) to all rows with Huber loss; keep the pair with the lowest cost. Starting R from that fit.
- Node and inclination: from the two-circle fit, take Mars's heliocentric longitude at the latitude sign changes
  (ascending: − to +) as Ω start; i start from a 1-parameter fit of the latitudes with Ω fixed.
- Eccentricities start at 0.05 with ϖ on a grid of 8 values (0°, 45°, ...); best by cost. Earth likewise (4 values).
- Each model is started from the previous model's converged values where they map (1 -> 2 -> 3), plus the grid.

## 4. Loss and outlier rule (fixed, same for every model)
Normalised residuals z = (obs − model)/σ_formal, longitude residual multiplied by cos(lat).
a) Robust fit: `scipy.optimize.least_squares`, loss='huber', f_scale = 2 (on z), multi-start as above.
b) Iterative clipping: robust scale s_k = 1.4826·median(|z_k|) over retained rows, separately for k = lon, lat.
   A row is rejected if |z_lon| > 5 s_lon or |z_lat| > 5 s_lat (both coordinates of the row are dropped). The retained set
   is recomputed from all 187 rows each iteration (rows can come back). Refit with plain least squares (linear loss) on
   the retained rows. Repeat until the set is unchanged (max 20 iterations).
c) Outliers are found per model by this rule only. The report lists, per model, the rejected rows.

## 5. Uncertainties
- Formal: covariance (JᵀJ)⁻¹ from the final linear fit on retained rows, scaled by the reduced χ² (χ²/(N−p)).
- Bootstrap: 300 resamples of the retained rows with replacement (both coordinates of a row together), each refit
  (linear loss, from the best fit, no re-clipping); σ_boot = standard deviation (circular for angles).
- Quoted σ = the larger of formal and bootstrap. Both are listed in ORBIT.json.

## 6. Reported diagnostics (per model)
- RMS and median |residual| in longitude (×cos lat) and latitude, arcmin, on the model's own retained rows and on the
  common set (rows retained by all three models).
- Near opposition vs elsewhere: elongation of Mars from the model's Sun ≥ 150° counts as "near opposition"; if either
  group has fewer than 15 rows, the threshold is 135° instead (fixed in advance).
- Largest systematic pattern: longitude and latitude residuals binned in 12 bins of Mars's mean anomaly (from model 3's
  elements for every model, so the bins are the same) and per apparition; report the largest |bin median| among bins with
  ≥ 4 rows, and its location.
- Figures: residuals vs time and vs Mars mean anomaly, lon and lat, for each model.

## 7. Decision rules
- Between models: on the common set, BIC_m = χ²_m / s3² + p_m·ln(2·N_rows), with χ² from formal σ and s3² the reduced χ²
  of model 3 on that set (one noise scale for all). Lowest BIC wins; ΔBIC > 10 is decisive, otherwise prefer the
  model with fewer parameters, then the earlier model in the list.
- The 8′ question: "systematic error" = largest |median| longitude residual in the mean-anomaly bins or apparitions
  (section 6). The answer is YES if model 1's value is ≥ 3′ AND model 3's value is ≤ half of model 1's. Secondary test,
  as Kepler did it: keep model 1's fitted Earth, refit model 1's Mars longitude parameters (e_c, e_q, ϖ, L0, P) to the
  near-opposition rows only (heliocentric longitudes fixed by those), then report the residuals of the other rows.

## 8. Freezing
`fit.py` writes ORBIT.json, REPORT numbers and figures. FROZEN.txt holds sha256(ORBIT.json). Nothing changes after.
Anything added after seeing residuals goes in a "post hoc" section of REPORT.md.

## 9. Amendment A (still before any fit; after an independent review of this plan)
Reason: models 1 and 2 share a non-Keplerian Earth (an eccentric circle with uniform motion about its centre cannot match
both the longitudes and the distances of a Kepler orbit), so "model 1 vs model 3" mixes the Earth's shape with Mars's.
- Added models, same loss/outlier rule: **1c** (free equant) and **1cb** (bisected equant) for Mars and **2c** (Mars
  ellipse), each with a Kepler-ellipse Earth (2c is the same model as 3). The primary 8′ statistic compares **1c vs 3**
  (same Earth, only Mars's shape differs). 1 vs 3 and 1b are still reported.
- Kepler-style secondary test (section 7) uses model 3's fitted Earth (fixed), for both the free and the bisected
  equant: Mars longitude parameters (e_c, e_q [or e_q only for bisected], ϖ, L0, P) fitted to near-opposition rows;
  R, Ω, i then fitted to all retained rows with those fixed; residuals reported for the other rows.
- Second-harmonic statistic: least-squares fit of a1 sinM + b1 cosM + a2 sin2M + b2 cos2M (+ constant) to each model's
  longitude residuals (M = Mars mean anomaly from model 3); report A1 = √(a1²+b1²), A2 = √(a2²+b2²).
- 8′ rule (replaces the one in section 7): YES if model 1c's systematic error (largest |median| longitude residual in
  the mean-anomaly bins or apparitions with ≥ 4 rows) is ≥ 3′ AND model 3's is ≤ half of 1c's. The same numbers for
  model 1 are reported.
- "Outliers found" in the report = model 3's rejected rows; the other models' rejections are listed as model-dependent.
- Bootstrap uses a fixed seed (numpy default_rng(1590)); ORBIT.json has no timestamps, values rounded, so
  `python fit.py` reproduces the same file and hash.
