# Episode 3 measurement: the perihelion drift that the planets leave unexplained, from 1677-1881 transits

Run on 13 Oct 2026 from 21:09 to 22:15 CST, entirely on the owner's Mac (the box was not used). The run was
blind to the value in the sense of a pre-registered analysis plan: the instructions named no expected value
and no theory, the plan (`out/MEASUREMENT_PLAN.txt`, 21:17) fixed the model, parameters, weights and variants
before the first historical fit, and no step was tuned to a target. The agents' prior knowledge of the
textbook number cannot be excluded and is not claimed to be. The control is called "Horizons' physics".

## Result

**Fitted to Newcomb's 58 transit contacts (1677-1881), a Newtonian model of Mercury with modern planetary
masses needs an extra uniform advance of the perihelion of D = 43.71 ± 1.04 arcseconds per century
(pre-registered nuisance model: one time offset per contact type).** That is the headline, from the
converged wide-search fit (`out/fit_time_wide_headline.json`, built on `out/fit_time_wide.json`). A
better-conditioned nuisance model (one offset of the contact separation per type), added post hoc after the
first fit stalled, gives **43.53 ± 0.84**. The two differ by 0.2, a fifth of the uncertainty; they are not
averaged.

**Control: the same pipeline on Horizons' own contact instants at the same 58 contacts gives
D = 43.008 ± 0.002.** This is what the pipeline extracts from perfect data generated with Horizons'
physics.

| | D, arcsec per century | 1 sigma: formal (scaled) / Monte Carlo / leave-one-transit-out jackknife | Weighted rms after fit |
|---|---|---|---|
| **Historical, headline** (time offsets per contact type, Part I weights, Delta T Espenak & Meeus) | **43.71** | 1.04 / 1.03 / 0.78 | 8.2 s (1.4" rms along path) |
| Historical, radial offsets per contact type (post hoc) | 43.53 | 0.84 / 0.83 / 0.58 | 6.6 s (1.4") |
| **Control**, Horizons' contact instants, time offsets | **43.007** | 0.0015 (a numerical floor of a noise-free fit, not a measurement uncertainty) | 0.012 s |
| Control, radial offsets | 43.008 | 0.0015 | 0.012 s |
| Historical minus control | +0.70 ± 1.04 (headline); +0.52 ± 0.84 (radial) | | |

The historical value and the control agree within 1 sigma. The control reproduces the relativistic
advance of Mercury plus the Sun's oblateness (42.98 + 0.03 = 43.01) by construction of the Horizons physics:
it validates the pipeline and the inverse-cube parametrisation to about 0.01"/cy, and says nothing about the
historical data. It is not a second measurement.

**Comparisons made after unblinding** (the protocol allowed them only then). General relativity predicts
42.98"/cy; 43.71 ± 1.04 is +0.7 sigma above it, and 43.53 ± 0.84 is +0.7 sigma. The data are consistent with
it at the 2% level, not a test beyond that. Newcomb's own 1882 value from the same contacts (p. 473) is
+42.95"/cy, "greater by 43"" than the motion computed from the masses of his day, with the mass of Venus
taken as 1/405 000. The masses used here give Sun/Venus = 408 524, so Newcomb's Venus is 0.87% heavier, which
raises his planetary Venus term by about 2.4"/cy; with the modern mass his excess would be nearer 45. His
number and ours are not on the same footing, and the agreement is partly fortuitous. What is the same is the
data: the same 58 contacts.

**How the uncertainties compare.** The Monte Carlo is not an independent check: it draws Gaussian noise
through the same linearised design matrix, so its agreement with the formal σ only confirms the covariance
arithmetic. The leave-one-transit-out jackknife is the independent estimate, and it is smaller than the
formal σ (0.58 against 0.84, and 0.78 against 1.04). With 23 groups the jackknife's own scatter is about 15%,
so the shortfall is a 2-sigma-ish fluctuation, or Newcomb's low weights are pessimistic for a few contacts;
the formal, chi-squared-scaled values are quoted as the conservative ones.

**Which constants to prefer.** The radial form fits better than the pre-registered time form with the
same number of parameters (weighted rms 6.6 s against 8.2 s), converges cleanly and gives interpretable
constants. The independent referee recommended quoting the pre-registered form first, as the protocol says,
and the radial form beside it, labelled post hoc with the reason it was added. That is what is done here. If a
later episode re-registers, the radial form should be the one registered.

In short: the 1677-1881 transit record, fitted with Newton plus the planets, contains an unexplained
perihelion advance of 43.7 ± 1.0"/century (pre-registered form; 43.5 ± 0.8 in the post-hoc form). Perfect
data with Horizons' physics yields 43.01 through the same pipeline.
General relativity predicts 42.98; Newcomb found 43 from these timings in 1882, with the planetary masses of his day.

![D across variants](figures/D_variants.png)

### Robustness (linear re-solves around each solution, same Jacobian)

Time-offset column: around the converged headline point (differences from the Part I solution added to the
headline D). Radial column: around the radial solution.

| Variant | Time offsets (pre-registered) | Radial offsets (post hoc) |
|---|---|---|
| Part I weights (as fitted; headline) | 43.71 ± 1.04 | 43.53 ± 0.84 |
| May weights doubled only | 43.74 ± 0.96 | 43.61 ± 0.80 |
| **Newcomb's final-solution weighting** (May x2; 1740 II, 1786 II and 1756 omitted; 1677 kept) | 43.64 ± 0.89 | 43.39 ± 0.66 |
| Newcomb's final weighting, 1677 dropped | 43.69 ± 0.91 | 43.40 ± 0.67 |
| Unweighted | 44.20 ± 1.90 | 44.02 ± 1.82 |
| Delta T from Horizons (Stephenson, Morrison & Hohenkerk 2016) instead of Espenak & Meeus | 43.69 ± 1.03 | 43.53 ± 0.84 |
| Without the four weight-0.1 contacts (1677 II, III, IV and 1740 II) | 43.48 ± 1.01 | 43.21 ± 0.76 |
| Interior contacts only (II, III; 37 contacts) | 43.62 ± 1.21 | 43.45 ± 1.11 |
| Leave one transit out, range over 23 transits | 43.37 (without 1845) to 44.04 (without 1786) | 43.19 (without 1740) to 43.95 (without 1786) |

Sources: `out/fit_time_wide_headline.json`, `out/fit_results.json`, `out/variants_newcomb_final.json`.
"Part I weights" are the weights printed in Newcomb's Part I summary (pp. 451-452), which the fit uses. They
are not the weights of his final solution (p. 457), which (I) combine 1677 II and III into one equation of
weight 0.3, (II) double every May weight, because a May transit fixes the heliocentric place better, and
(III) omit 1740 II and 1786 II and drop 1756. The fit does not use his treatment of 1677; there the two
weight-0.1 contacts II and III enter individually. The final-weighting rows are the answer to "does D depend
on his weights": nothing moves by more than 0.2 sigma. Around the main run's (unconverged) time-form point the
same re-solve gives 43.73 ± 0.87 for the final weighting.

- **Delta T is not a limiting systematic here.** Switching models moves D by less than 0.01. A clock
  error shifts November and May contacts the same way in time, while D's unique signature has opposite
  slopes at the two nodes (figure below).
- **Removing the weight-0.1 contacts** (Halley 1677 and Winthrop 1740) lowers D by 0.2-0.3.
- The two largest historical residuals (1677 II at +4.7" and 1740 II at +4.9") belong to the two weight-0.1 contacts.
- **The leave-one-out extremes come from single transits:** see the table above.

## Method

**Data.** Newcomb's 58 concluded geocentric contacts (*Astron. Papers* vol. 1 part VI, pp. 451-452): 23
transits, made up of 37 interior contacts (18 at II, 19 at III) and 21 at IV, with the weights printed there
(0.1-6; "Part I weights" below). Times
are GMT on the astronomical day (+12 h), converted to TT with Espenak & Meeus (2006) Delta T. Inputs are
in `out/measure_input.csv`. Newcomb's own *k* Delta-t terms were not used.

**Model (Newtonian only).** Built in REBOUND 4.4.10 with IAS15, from source because the 5.x wheel does
not load on this Intel Mac.

- **Bodies:** point masses for the Sun, Mercury, Venus, the Earth-Moon barycentre, and the Mars,
  Jupiter, Saturn, Uranus, Neptune and Pluto system barycentres.
- **Masses:** GM values from DE440/DE441 (Horizons headers and Park et al. 2021).
- **Initial conditions:** Horizons DE441 barycentric states at 1780-01-01 TDB, in the J2000 ecliptic
  frame.
- **Left out:** everything beyond Newtonian point-mass gravity, solar oblateness, asteroids, and the Moon
  as a separate body.

**Geometry.** Only Mercury's heliocentric motion comes from the model. The geocentre and the Sun's
barycentric position are Horizons' (bodies 399 and 10). The Earth's orbit is treated as known, as it was
from solar observations, and Mercury is the system under test. The Earth's own relativistic perihelion motion displaces it by hundredths of an arcsecond at Mercury at most, and the same geometry enters the control and the historical fit identically, so it cancels in historical minus control.

- **Corrections:** light-time for the Sun and Mercury, and first-order annual aberration. No light
  deflection.
- **Contact condition:** the centre separation equals R☉ − r☿ for II and III, or R☉ + r☿ for IV, with
  Horizons' radii (695,700 km and 2,440.53 km).
- **Finder:** spline-interpolated on a 1-second grid.

**The parameter D.** An extra inverse-cube central acceleration on Mercury, a = −C r̂ / r³. By Newton's
theorem of revolving orbits, this rotates the orbit uniformly, which is a pure apsidal advance. C was
calibrated to arcsec per century three ways:

| Method | ″/cy per unit C (AU⁴/day²) |
|---|---|
| Two-body run at C = 4e-12 | 2.452482 × 10¹² |
| Two-body run at C = 8e-12 (linearity check) | 2.452482 × 10¹² |
| Analytic, π C / h² per orbit | 2.452480 × 10¹² |
| Full N-body difference run | 2.451992 × 10¹² |

D is the advance of Mercury's heliocentric longitude of perihelion in the inertial J2000 ecliptic frame,
positive prograde, beyond the Newtonian model.

**Starting point of the historical fits.** In the main run (`scripts/fit.py`) each historical fit was started
from the control solution, that is from D = 43.007, not from D = 0. That does not bias a converged
least-squares fit (the closure tests recover injected values from perturbed starts), but it is a disclosure:
the first attempt, started from D = 0, crashed in the degenerate time form. A historical refit of each form
started from Horizons' 1780 elements with D = 0 (`scripts/refit_from_zero.py`, `out/refit_from_zero.json`)
gives radial D = 43.532 ± 0.837 (2 iterations; weighted rms 6.640 s; offsets +0.896″, +0.373″, −0.872″) and time-offset D = 43.629 at the last evaluated point and 43.686 after the final linear step, ± 1.02 (3 iterations with damping; weighted rms 8.184 s; the offsets, near +915 s, sit at a different point on the same flat valley). The independent referee's own from-zero refit gave radial 43.532 ± 0.837
and time 43.63-43.69 ± 1.02. The data take D from 0 to 43.5-43.7 on their own; the control start was a
convenience, not a steer. The results in `out/fit_results.json` were regenerated bit for bit from the committed code by the
referee (`nbody.py` and `hz.py` were edited after the first run, and the committed code reproduces the
committed numbers).

**Fit.** Damped Gauss-Newton with numerical Jacobians (8 integrations per iteration, 6 processes). The 10
parameters are:

- Mercury's heliocentric osculating a, e, i, Ω, ϖ, l at the 1780 epoch
- D
- one constant per contact type (II, III, IV)

Weights are σ_i ∝ 1/√w_i. The covariance is scaled by χ²/dof. The Monte Carlo used 2,000 linearised
realisations at the observed scatter, and the jackknife is leave-one-transit-out. Halving the
finite-difference steps changes the Jacobian columns at the radial solution by:

| a | e | i | Ω | ϖ | l | D |
|---|---|---|---|---|---|---|
| 0.001% | 0.2% | 3.5% | 1.4% | 0.7% | 0.2% | 0.0004% |

The columns behind D (a and D) are stable; the 3.5% on inclination touches σ_i, not D.

**Two forms of the per-type constant.** Both are reported.

- **Time offsets (pre-registered).** One time offset per type, in seconds.
  - A common time offset is almost the same as shifting Mercury's mean longitude l, so this form is
    nearly degenerate. On the historical data the offsets came out −2,450 ± 1,150 s, absorbed by a
    compensating l shift. That is physically meaningless, but D is not affected: its correlation with
    the offsets is −0.07.
  - In the main run the damped iterations stalled at the edge of the ±2,000 s contact search, so that
    run's time-form value (43.67-43.78) is not the headline.
  - The headline comes from a re-fit with a ±5,600 s search (`scripts/fit_time_wide.py`, started from the
    radial solution), run until the proposed change of D fell below 0.005"/cy (24 iterations). It moved along
    the valley with the weighted rms within 4 ms (8.181-8.193 s) and D between 43.48 and 43.72. The converged,
    model-evaluated point is **D = 43.706, weighted rms 8.182 s; σ_D = 1.036** (`scripts/finalize_time_wide.py`
    -> `out/fit_time_wide_headline.json`, quoted as 43.71 ± 1.04). Log: `out/fit_time_wide_log.txt`.
  - `out/fit_time_wide.json` stores the parameters after one more linear step (D = 43.858). In this flat
    valley that extrapolation is not reliable: evaluating the model there gives a worse weighted rms (8.299 s
    against 8.182 s), so it is not used.
  - That minimum really does sit at the shifted l (l differs from the radial solution's by −195″): the time
    form evaluated at the radial solution's dynamical parameters, offsets re-solved, gives 9.42 s
    (`out/check_valley.json`) against 8.18 s on the valley floor. A linear re-solve of the time form around
    the radial solution (same Jacobian; `scripts/check_valley.py`) gives D = 43.51 ± 1.05 at 8.166 s with all
    three offsets, and 43.64 ± 1.02 at 8.194 s with the common mode removed (only III-II and IV-II fitted).
    The valley is flat in D to about ±0.1-0.2, small next to σ.
  - Conditioning: the smallest singular value of the column-normalised weighted design is about 7e-4 for the
    time form against 0.029 for the radial form (condition numbers about 2,700 and 64), because transits sample
    the orbit at two longitudes only and a common time offset is almost a shift of l. That is why the first
    attempt (`data/fit_log_attempt1.txt`) crashed and the main run stalled.
  - In the noise-free closure test this form recovered D exactly, with the three offsets at 0.19 s
    instead of 0 (the same degeneracy).
- **Radial offsets (post hoc).** One offset of the contact separation per type, in arcseconds: an effective change
  of the contact circle (irradiation, phase definition).
  - It moves ingress earlier and egress later by offset / |radial rate|, so it cannot be traded against l.
    It converges cleanly.
  - Fitted values: II +0.90 ± 0.15", III +0.37 ± 0.16", IV −0.87 ± 0.20". These are the same pattern the
    kill test found: the internal contact circle is effectively larger, and the external notch is lost
    early.
  - It was added after the first historical run with time offsets failed to converge, i.e. post hoc. It is
    reported alongside the pre-registered form, not as a replacement. The pre-registration is in
    `out/MEASUREMENT_PLAN.txt`, timestamped 21:17, before any historical fit.

**Closure tests** (synthetic contacts from this Newtonian model, fitted from a perturbed start):

| Injected | Recovered |
|---|---|
| D = 0 | D = −0.00001 |
| D = 5"/cy with radial offsets (+1.0, +0.5, −1.5)" | D = 5.000001; offsets 1.000001, 0.499999, −1.500000 |

## Correlations of D with the other parameters

| | a | e | i | Ω | ϖ | l | II | III | IV |
|---|---|---|---|---|---|---|---|---|---|
| Historical, time offsets | 0.994 | −0.26 | −0.04 | 0.08 | 0.09 | −0.07 | −0.07 | −0.07 | −0.07 |
| Historical, radial offsets | 0.998 | −0.22 | −0.10 | 0.06 | 0.14 | 0.06 | −0.15 | −0.10 | −0.09 |
| Control, radial offsets | 0.998 | −0.22 | −0.09 | 0.06 | 0.14 | 0.06 | −0.14 | −0.09 | −0.09 |

**D's correlation with a is about 0.99 by construction.** The inverse-cube term also changes Mercury's mean
motion for a given starting state, so a and D move together. The fitted a absorbs that, and also the
Newtonian-versus-Horizons mean-motion difference (a changes by a fraction of +4.8 × 10⁻⁷; without it the
contacts drift by ±1,200 s over the span). What separates D from the mean motion is a small signature
that no other parameter reproduces: about 1-3 s of contact time per "/century, with opposite slopes in
November and May transits. Its correlations with the angular elements and the constants are 0.26 or
less.

![D sensitivity](figures/sensitivity_D.png)

![residuals](figures/residuals_after_fit.png)

**Before any fit**, starting the Newtonian model from Horizons' 1780 state puts it out of step with
Horizons' contacts by up to ±1,200 s at the ends of the span. That is the mean-motion drift that fitting
a removes.

![pre-fit drift](figures/prefit_drift.png)

## The Newtonian planetary contribution (from this integration)

This is the rate of Mercury's heliocentric osculating longitude of perihelion in the inertial J2000
ecliptic frame, from a straight-line fit. The 1,000-year run is centred on 1780; the second column covers
only the data window. "Single planet" means Sun + Mercury + that planet.

| Planet | 1,000-yr run, ″/cy | 1677-1881 run, ″/cy |
|---|---|---|
| Venus | 275.94 | 275.86 |
| Jupiter | 153.13 | 153.15 |
| Earth-Moon | 90.21 | 90.23 |
| Saturn | 7.18 | 7.17 |
| Mars | 2.47 | 2.47 |
| Uranus | 0.14 | 0.15 |
| Neptune | 0.04 | 0.04 |
| Pluto | 0.00 | 0.00 |
| Sum of single-planet runs | 529.12 | 529.08 |
| **All planets together** | **529.14** | **529.10** |
| Sun + Mercury alone | 0.000 | 0.000 |

The frame has no precession of the equinoxes. Omitted: solar oblateness, asteroids, and the Moon as a
separate body.

**Frame term.** These rates refer ϖ to the fixed J2000 ecliptic. Tables that refer the perihelion to the
mean ecliptic of date also contain the ecliptic's own slow rotation. The ecliptic of date is tilted by
47.0"/cy about the node Π_A = 174.88° (Meeus, *Astronomical Algorithms*, 2nd ed., ch. 21 constants). Rotating
Mercury's orbit vectors (from the 1780 elements) into that frame changes its ϖ rate by **+2.32"/cy**
(`scripts/frame_term.py`, `out/frame_term.json`; the same size as the analytic form
π_A sin(Ω − Π_A) tan(i/2) = 2.32 in magnitude). The sign is physical: the obliquity decreases, so the ecliptic of
date lies north of the J2000 plane at longitude Π_A + 90°. So 529.1 + 2.3 = 531.4"/cy in the ecliptic of
date (1,000-year run: 529.14 + 2.32 = 531.46). For comparison, the planetary contribution is quoted as 531.5"/cy
for Clemence (1947, *Rev. Mod. Phys.* 19, 361), as reported by Pogossian, arXiv:2112.07301 (2021), which lists
531.54 for Misner, Thorne and Wheeler as well; I have not checked the original papers. The remaining 0.1 is
within what the solar J2 (0.03), asteroids and the choice of masses account for. I do not compare the
single-planet rows with any published split. D itself is an in-plane rotation and does not depend on the frame
choice.

![planet budget](figures/planet_budget.png)

## What the result does and does not say

- **What it says.** A Newtonian solar system with the planets' modern masses cannot reproduce the
  1677-1881 contacts without an extra perihelion advance of 43.5-43.7 ± about 1"/century. That advance is
  separately determined by the data, and every variant tried lies between 43.2 and 44.3.
- **The control is a pipeline test, not a theory value.** It recovers 43.01 from Horizons' physics. That
  number includes everything Horizons models and this model omits: whatever Horizons adds beyond
  Newtonian point masses, plus asteroids, solar oblateness and light deflection. The historical and
  control values agree to within 1 sigma.
- **Systematics not in the error bar:**
  - Newcomb's concluded times carry his phase judgements and rejections, which the ~770 individual rows
    could test later.
  - The Earth's orbit is taken from Horizons, not fitted.
  - The Jacobian step sensitivity (up to 3.5%, on inclination) affects σ for the angular elements at the
    few-percent level, not D.
- **The 1677 ingress reduction (p. 384).** Newcomb's Part I table prints the reduction of Halley's ingress
  contacts to the geocentre as +29.2 s. The volume's own corrigenda (printed p. 484) correct it to −25.1 s
  ("Page 384 ... for +29s.2 read −25s.1"), the value the geometry gives, and his concluded times (p. 451) carry
  the correction. The kill test's independent reduction recovered the corrected value before we found the
  corrigenda, which we take as a check of the reduction, not as a finding about Newcomb's work. Replacing +29.2
  by −25.1 moves the time by 54.3 s (29.2 + 25.1; a sign flip alone would move it by 58.4 s): 21h 34m 55.2s − 54.3 s =
  21h 34m 00.9s against his 21h 34m 01s. It does not affect the measurement: the fit uses the p. 451 values,
  and 1677 has weight 0.1 (dropping 1677 moves D by about +0.06 in the time form and +0.02 in the radial).
  The same leaf notes that the longitude list beginning on p. 374 "does not, in all cases, give the longitude
  of the station actually adopted", which accounts for the 5 s (London) and 4 s (Sydney) differences between
  his station table and his row arithmetic in `out/stations.csv`.
- **Frame of the planetary budget:** see the frame term above; it is a frame effect, not a discrepancy.

## Files

- **Scripts** (in `scripts/`):
  - `nbody.py`: model, geometry, calibration
  - `measure_prep.py`: inputs
  - `fit.py`: closures, control, historical and variants; writes `out/fit_results.json` and
    `out/fit_arrays.npz`
  - `planet_budget.py`: writes `out/planet_budget.json`
  - `figures.py`: writes `out/figures/*.png`
  - `debug_hist.py`: the linearisation check that exposed the time-offset degeneracy
  - `fit_time_wide.py`: the wide-search re-fit of the time form (run with `EP3_WIDE=1`; converges on a tolerance of 0.005"/cy in D)
  - `check_valley.py`: the flat-valley and per-column Jacobian checks and the linear re-solve of the time form around the radial solution (`out/check_valley.json`)
  - `finalize_time_wide.py`: the headline of the time form from the converged wide fit (`out/fit_time_wide_headline.json`)
  - `refit_from_zero.py`: historical refits started at D = 0 (`out/refit_from_zero.json`)
  - `variants_newcomb_final.py`: Part I, May x2 and Newcomb final-solution weightings (`out/variants_newcomb_final.json`)
  - `frame_term.py`: ecliptic-of-date term for the planetary budget (`out/frame_term.json`)
- **Logs:** `out/fit_log.txt`, `out/fit_time_wide_log.txt`, `out/refit_from_zero_log.txt`, `out/planet_budget_log.txt`.
- **Horizons cache:** 689 responses, checksums in `SHA256SUMS.horizons`. The C calibration is cached in
  `data/calibration.json`.

## Time and compute

- **Wall clock:** about 65 minutes (21:09-22:15) for the measurement; the referee fixes added about 1.5 hours on a loaded machine.
- **Compute:** Mac only, $0. Three full fit runs, the last taking 10.4 min on 6 processes; a wide-search
  re-fit of the time form, about 10 min; the planet budget took 18 s.
- **Horizons:** about 500 new cached calls (689 cached responses in total), free.
- **Not used:** the box and Devin.
