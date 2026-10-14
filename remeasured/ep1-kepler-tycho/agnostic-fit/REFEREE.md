# Referee report: episode 1, model-agnostic blind fit (`agnostic-fit/`)

Reviewer: independent referee, 14 Oct 2026. Read-only on the repo; every reproduction ran in a scratch copy
(`…/scratchpad/agn/`, with `out/mars_positions.csv` copied in as `positions.csv`, sha256 `626925e4…8183c` verified).
Inputs: `BRIEF.md`, `PLAN.md`, `fit.py`, `report.py`, `MODEL.json`, `REPORT.md`, `FROZEN.txt`, `work/` (logs, scripts,
residual tables), `../out/mars_positions.csv`, `../out/BATCH.md` (the reduction's own per-session check against DE441),
`../blind-fit/{REPORT,REFEREE}.md` (context), `remeasured/PROTOCOL.md`, `remeasured/paper/PRIOR-ART.md`.

## Verdict: ship after fixes

The numbers stand: the fit reproduces, no held-out row touched any fit, selection or outlier scale, the brief names no
model family, and the pre-registered criterion alone picks the two Kepler ellipses (held-out median 2.46′ against 16.3′
for the next family, no tie, so BIC never enters the pre-registered decision). The exponent recomputes from the full
covariance to q = 0.666622 ± 0.000065 (0.7σ from 2/3). Every fix is wording or disclosure. The largest one is a
mis-attributed caveat: the +2′ longitude offset of the 1600 rows is in the model's extrapolation, not in Tycho's
Benatky series, which the reduction's own DE441 check shows to be good to +0.5′.

## 1. Freeze and reproduction

- `FROZEN.txt` = `0d8ddbde…5390b` = sha256 of the committed `MODEL.json` (checked).
- Re-ran `python3 fit.py` in the scratch copy (numpy 1.24.2, scipy 1.10.1, pyerfa 2.0.0; 16 min 32 s): `MODEL.json`
  byte-identical (same sha256 `0d8ddbde…5390b`), `work/results.json` and `work/params.pkl` byte-identical, run log
  identical to `work/run3.log` line for line (timings aside). Two earlier attempts launched from the agent sandbox
  were killed at about ten minutes; the successful run went through the terminal panel.
- The three committed run logs (`work/run1.log` 00:51, `run2.log` 01:09, `run3.log` 01:25) carry identical numbers
  for every family; the later runs only add the post-hoc variants (family 7 was already in run 1; the apsidal variant
  and the 153-row BIC came in runs 2 and 3).
- `fit.py` has no random number generator, so a bit-identical re-run is expected on the same numpy/scipy/erfa
  (1.24.2 / 1.10.1 / 2.0.0).

## 2. Was the brief clean? Was the hold-out real?

**Brief.** `BRIEF.md` contains none of: ellipse, heliocentric, Kepler, Sun, focus, 8′, circle, equant, epicycle. The
only words that presuppose anything are "planet", "orbital or planetary parameters" and the forbidden-tools list
("solar-system bodies such as `get_body` or `get_sun`"), which tell the agent it is looking at a planet from the
Earth, something the CSV's own `flags` column already says (it names Mars and the sites Hven, Wandsbek, Benatky,
Prague). So the run was blind to the model family and to modern values, not to which planet it was. PROTOCOL rule 1
is satisfied; the blind-fit deviation (families and 8′ named in the brief) is not repeated.

**Hold-out.** Verified in `work/results.json` and in the code: the fit masks of all 11 models contain 0 of the 28
held-out rows (train: 159 rows before JD 2304000.5 = 1596-01-15 TT); `ridge_starts`, `periodogram_freqs`, the spline
and harmonic linear solves, and both BIC reference sets use `D['train']` or subsets of it; the outlier scale `s` is
the training MAD and is applied frozen to the held-out rows (`scores()`, `fit.py:285-297`). The held-out rows enter
only the pre-registered decision statistic (held-out median), which is what a prediction test is for.

Two things were chosen after seeing held-out numbers and are correctly labelled post hoc: family 7 (law imposed; its
trigger was the training fit's q, but its score was read on the held-out rows) and the apsidal-rotation variant
(motivated by the 1600 residuals, lost: 2.98′ vs 2.46′). Neither is needed for the headline.

## 3. Was the comparison fair?

- **Parameters and optimisation.** Kepler ellipses 11 parameters, equant circles 13, Ptolemaic 10, concentric circles
  7; all fitted by Levenberg–Marquardt with the same weights, outlier rule and training rows. I re-ran the equant
  family from 48 wider starts (equant fractions 0.5–3 for both orbits, random apse directions and eccentricities) and
  the Ptolemaic family from 24: the equant improves only from 4.92′/16.33′ to 4.79′/15.43′ (in-sample/held-out median;
  the inner orbit's centre offset goes to zero with the equant offset finite, the "ill-defined f_E" the report
  mentions), the Ptolemaic solution is unchanged (f = 1.951). No family was starved of optimisation. The Ptolemaic
  variant is, however, handicapped by construction (a uniform circular epicycle cannot carry the observer's
  eccentricity), so its 7.2′ should not be read as "geocentric geometry fails"; the fair equant comparison is the
  heliocentric one (4.9′ in sample, 16.3′ held out).
- **No-physics baselines.** The harmonic series K = 1–4 fit the training years as well as Kepler does (1.0′ at K = 3,
  4) and miss the later years by 21′ (K = 3) to 19° (K = 4): the right baseline and the right outcome for a Fourier
  extrapolation. The smoothing spline's 9713′ is not a comparison, it is cubic extrapolation of an interpolator; it
  satisfies the brief's "at least one no-physics family" but should not appear in any headline number (the commit
  message's "flexible fits 21′–9713′" should be "the best flexible fit, 21′"). Minor plan deviation, undisclosed:
  PLAN says |j|,|k| ≤ K, the code uses |j|+|k| ≤ K (`fit.py:224`); K = 1 then has 17 parameters, not 29.
- **BIC.** The pre-registered common inlier set has 10 rows (20 residuals) because the circle and K = 1 models reject
  most of the training set; on it concentric circles have the *lowest* BIC (23.1 vs Kepler 28.5), so the agent was
  right to call it uninformative and right to disclose the 153-row replacement as post hoc.
- **Does "ellipses win" hold on the pre-registered criterion alone?** Yes. Primary rule: lowest held-out median,
  ties within 1.25×. Kepler 2.46′; next family 16.33′ (equant circles, which also trips the "held-out > 3× in-sample"
  failure rule, as does the Ptolemaic model). No tie, so neither BIC is used. `MODEL.json:winner_preregistered` =
  `H_kepler`. The 153-row BIC only breaks the post-hoc tie between free Kepler (2.46′) and law-imposed Kepler
  (2.38′), 185.4 vs 180.2; the pre-registered 10-row BIC gives the same order (28.5 vs 25.5).

## 4. The third-law exponent

Recomputed from the frozen parameters with `fit.py`'s own `cov()` on the 153 Kepler-inlier training rows
(reduced χ² 1.548, matches `MODEL.json`): q = ln(a_P)/ln(P_P/P_E) = **0.666622 ± 0.000065** (χ²-scaled formal σ,
full covariance; 0.000052 unscaled). (q − 2/3)/σ = −0.70. a_P = 1.523649 ± 0.000062, (P_P/P_E)^(2/3) = 1.523692,
a³/P² ratio 0.999915 ± 0.000123. corr(a_P, n_E) = −0.02, corr(a_P, n_P) = +0.04, corr(n_E, n_P) = 0.97, so the error
is almost entirely σ(a_P), as the report says. No bootstrap was run here (the blind-fit referee found
bootstrap/formal = 1.14 for a on the full record), so quote 0.00006–0.00007. For context (not for the fit): the
modern span-mean elements give q = 0.666643, the osculating J1590 ones 0.666660, both within 0.3σ of this value.

Two wording points. (i) With two orbits and a_E ≡ 1, q is a *measurement* from two points, not a test of a power law;
"a³/P² is the same for both orbits" is the honest form, and the law across planets needs more planets. (ii)
"q = 0.66662 ± 0.00006, which is 2/3" (REPORT.md) should read "consistent with 2/3 (0.7σ)". The post-hoc rounding
rule (simplest fraction with denominator ≤ 4) was fixed in PLAN before the fit and gives 2/3; fine.

## 5. The caveats

**Directions alone cannot separate Sun-centred from Tycho-style geometry.** Correct. The model predicts the vector
P − E; any arrangement with the same relative motion (Tychonic, or the observer on the 687-d orbit and the body on a
0.656-size 365-d orbit, which gives the antipodal vector) produces the same directions. The report's "which orbit
carries the observer is a reading choice" is right, and the third law holds in either reading. The headline must
say "two Keplerian motions about one common point", not "around the Sun".

**The 1600 rows sit ~2′ east.** The number is right (my recomputation from `work/heldout_residuals.csv`: 15 rows of
1600, mean Δlon +2.29′, median +2.09′; 1596 +0.60′, 1598 +0.62′, 1601 −0.24′). The attribution is not. The
reduction's own per-session check against DE441 (`../out/BATCH.md`, which the fitter was forbidden to see and did
not need) gives, for the same 15 rows, data − DE441 mean **+0.55′** in longitude. So the model sits **−1.7′** west of
DE441 in 1600 (−2.3′ to −3.1′ for the Jan–Mar rows round the opposition of early 1600, falling to −0.3′ by June). The
training covariance propagated to those rows predicts only 0.45–0.85′ (1σ), so this is not parameter noise either.
What is demonstrated: the offset is not Tycho's. What is inferred, not demonstrated (I did not fit a two-body model
to DE441 on the training epochs and extrapolate it): the size is consistent with the two-body model's limit,
Jupiter's pull moving Mars's mean longitude by up to 0.64′ over the span (blind-fit REFEREE §2), amplified ×2.7 at
opposition, plus the unmodelled light time and aberration (≤0.5′, systematic), on a fit extrapolated four years past
its training span. The full-record blind fit shows the same +1.6′ apparition residual at 1600.23. **Fix:** replace
"most likely a systematic of that observing series" with "consistent with the two-body model's limit at the 1600
opposition, four years beyond the training span; not a data systematic (the data agree with the modern ephemeris
there to 0.5′)". This does not weaken the claim; it is the expected size of the next correction (perturbations),
which is what a 2.5′ held-out prediction from a two-body model should leave.

Also to state: the held-out set is 28 rows, 15 of them one apparition (1600), one rejected row (1598-03-02V, a 17°
latitude slip that every model misses by 1016′); so the held-out median is dominated by 1600, and the held-out RMS
"192′" is that single row and should never be quoted.

## 6. Honesty: hard-coded values in `fit.py`

Grep of every numeric literal. Not orbital: `T0 = 2302000.0` (frame epoch), `SPLIT`, `FLOOR = 0.5′`, `ZCUT/DCUT`,
the search band 100–6000 d, `f ∈ {1, 2}` equant seeds (the classical values, generic), `Q3 = 2/3` (set from the
fitted q by the pre-registered rounding rule). **Three literals are orbital in flavour and contradict the docstring
"every start value comes from a frequency search on the data":** `0.03` rad inclination start (`fit.py:353`) and
`0.02` / `0.08` eccentricity start magnitudes for the inner / outer orbit (`fit.py:410`); they are within rounding of
the textbook 0.0167, 0.093 and 1.85°. Starting values are not fit inputs, but the sentence as written is false and
must be qualified. I tested whether they matter: refits with the outlier rule from e = 0 for both orbits (i = 0.01
and 0.10 rad), e = 0.05/0.05, 0.15/0.15, 0.3/0.3 at various apse directions, swapped 0.08/0.02, a = 1.3 and 1.8,
periods from the coarse grid, and four random e ≤ 0.3 starts all converge to the identical solution (P_E 365.2544,
P_P 686.9756, e_E 0.01699, e_P 0.093007, a 1.523649, i 1.8561°, χ² 456.5, 6 rows rejected, held-out 2.46′). No leak
into the result; a disclosure fix only.

Day-slip claims reproduced (`work/slips.py`): 1583-01-25V 9.0′ → 1.1′ at +1 d, 1586-09-23V 35.8′ → 1.8′ at −1 d,
1594-02-14V 37.1′ → 0.6′ at +1 d.

**Pre-registration evidence.** All top-level files entered the repo in one commit (`d05cba7`, 01:28). `work/`
timestamps show trial fits before the first full run (`box.py` 00:28, `keptry.py` 00:31 with a Kepler fit; `run1.log`
00:51). PLAN's "amended before any fit: the equant fraction is FREE" and "atan2 residual, before the first full run"
therefore cannot be dated against those trials. Say so (same as blind-fit finding S2).

## Findings

**Blocker:** none.

**Should-fix**
- **S1. 1600 caveat mis-attributed** (REPORT.md "Limits", second bullet). Replace per §5; cite BATCH.md's +0.55′ and
  the −1.7′ model−DE441 as a referee check made with the ephemeris the fitter was forbidden.
- **S2. Typed start magnitudes.** `fit.py:1-4` docstring, `fit.py:353`, `fit.py:410`, REPORT.md "Disclosure" ("I typed
  no orbital or planetary number into any fit"). BRIEF.md's own rule is "every starting value must come from the
  data" and no known parameter "either as a start or as a check"; the three literals break its letter. What makes
  this a disclosure fix rather than a re-run is the start-independence test in §6 (identical solution from e = 0,
  e = 0.3, random starts). Qualify: "eccentricity and inclination *starting magnitudes* (0.02, 0.08, 0.03 rad) were
  typed; every other start comes from the data; refits from e = 0 and from random starts up to 0.3 converge to the
  same solution (referee check)".
- **S3. "which is 2/3".** REPORT.md §3 → "consistent with 2/3 (−0.7σ)"; add that with two orbits q is measured, not
  tested.
- **S4. Pre-registration.** State in REPORT.md and the paper that PLAN.md, fit.py and MODEL.json share one commit and
  that trial fits (`work/keptry.py`) preceded the first full run; the amendments are attested only by the plan.
- **S5. Held-out composition.** State 28 rows, 15 from the 1600 apparition, 1 rejected; never quote the 192′ RMS.

**Polish**
- P1. Spline baseline: present it as "cannot extrapolate (cubic end polynomial)" and use K = 3 harmonics (21′) as the
  flexible-model comparison; drop "9713′" from any summary line.
- P2. Harmonic index set |j|+|k| ≤ K differs from PLAN's |j|,|k| ≤ K; one line under "post hoc / implementation".
- P3. Ptolemaic model: note that its uniform circular epicycle cannot represent the observer's eccentricity, so the
  geocentric-vs-heliocentric comparison is not symmetric; the equant conclusion rests on the heliocentric equant model.
- P4. A wider equant multistart gives 4.79′/15.4′ instead of 4.92′/16.3′; either number supports the conclusion, but
  quote "about 5′ / 15–16′" rather than the third decimal.
- P5. `work/common.py` says the frame epoch is "1590 Jan"; it is mid-1590 (JD 2302000 ≈ 1590 Aug). REPORT.md is right.
- P6. KeplerBench was read under "do not distribute"; cite only the public OpenReview record (RdErwlc7jJ) and have
  the owner confirm citability before the public article.

## Headline sentences

**Paper:**
> Given 187 positions of one planet reduced session by session from Tycho Brahe's observing logs (1580–1601), with no
> model family named and every row after mid-January 1596 held out, an agent that pre-registered its plan chose its
> own candidate families from textbook astronomy and let the data select among them: two Keplerian ellipses about
> one common point, one carrying the observer, predict the held-out years to a median of 2.5′ (the 1600 opposition
> sits 2′ east, consistent with the two-body model's limit), against 16′ for eccentric circles with equants, 23′ for
> a deferent with a uniform epicycle, and 21′ for the best flexible fit, and give a = P^(0.66662 ± 0.00006) between
> the two orbits without that relation being imposed. The fit was blind to the model family and to modern values, not to the planet's identity, which the data
> file names; directions alone do not fix which orbit carries the observer. The closest prior work is KeplerBench's
> pilot, an ellipse fitted to Tycho's Mars declinations with the modern Earth orbit supplied (13.3′ held out), and
> Li, Ji & Zhang (2022) on Kepler's 28 reduced heliocentric values.

**Public article:**
> We gave an AI agent Tycho Brahe's Mars measurements from the 1580s and 1590s, reduced night by night from his logs,
> and asked only "find the law that predicts these". We did not say ellipse, Sun, or Kepler, and we hid the last six
> years. The agent proposed the shapes astronomers have argued about, circles with epicycles, circles with equants,
> ellipses, and flexible curves with no physics, and the hidden years decided: two ellipses about one common point
> predicted them to 2.5 arcminutes, the circles missed by 16 or more, and the sizes and periods of the two orbits came
> out in the ratio Kepler's third law gives, 0.66662 ± 0.00006 against 2/3, with nothing imposed. The agent knew the
> textbook and said so; what was blind was the choice of model and every fitted number. An ellipse has been fitted to
> Tycho's Mars record before (KeplerBench, 2026); here the reduced logs chose it under a held-out test.

## Checked and found fine

- CSV checksum; `FROZEN.txt` matches `MODEL.json`; run logs 1–3 consistent; no RNG in `fit.py`.
- Frame: true ecliptic of date → fixed mean ecliptic of JD 2302000 via `pnm06a`/`obl06`/`nut06a`/`ecm06`, frame only.
- Residual (atan2 tangent-plane form, exact angular distance), weights with the 0.5′ floor, MAD outlier rule with the
  scale frozen from training, as PLAN says.
- Kepler solver, equant geometry, Ptolemaic composition, harmonic and spline implementations.
- All start values except the three literals in §6 come from `ridge_starts`/`periodogram_freqs` on training rows.
- Decision rule applied as written; `winner_preregistered = H_kepler`; the 3× failure rule flags equant circles and
  the Ptolemaic model, not Kepler (2.46/1.38 = 1.8×).
- Derived parameters and σ in `MODEL.json` (periods, e, ϖ, i, Ω, synodic period 779.93 d) against my recomputation.
- The REPORT.md scores table against `MODEL.json` and `run3.log`; the figure against `work/heldout_residuals.csv`.
- Agreement with the blind-fit (prescribed-model, full-record) elements: a 1.523649 vs 1.523697 (0.75σ), e_P 0.093007
  vs 0.093065, P_P 686.9756 vs 686.9736, i 1.8561° vs 1.8564°, all within the combined σ.

## Could not check

- The sandbox timeline: whether PLAN.md's amendments preceded the trial fits in `work/` (only the agent's statement).
- Whether the agent opened anything outside its folder (only its statement and the absence of leaked values beyond the
  three start magnitudes).
- The citability of KeplerBench (read under "do not distribute").
- A bootstrap σ for q (not run by the agent; not re-run here).

Scratch material (not in the repo): `…/scratchpad/agn/` (re-run, `repro.log`, `chk/pred_unc.py`, `chk/starts.py`,
`chk/equant_ms.py`).
