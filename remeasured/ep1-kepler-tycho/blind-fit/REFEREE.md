# Referee report: episode 1 (Kepler from Tycho), post-freeze comparison

Reviewer: independent referee, 14 Oct 2026. Read-only on the repo; all reproductions in a scratch folder.
Inputs: `remeasured/PROTOCOL.md`; `out/BATCH.md`; `out/mars_positions.csv` (sha256 `626925e4…8183c`, matches
`out/mars_positions.sha256`); `blind-fit/{BRIEF,PLAN,REPORT}.md`, `fit.py`, `report.py`, `ORBIT.json`, `results.json`,
`FROZEN.txt`, the three figures; `paper/PRIOR-ART.md`. Modern values: JPL Horizons API, DE441 (details in section 2).

## Verdict: ship after fixes

The frozen numbers stand: the fit reproduces bit for bit, and the Mars elements agree within 2σ in a, e, Ω, ϖ, P and
L0 with what the same two-body model recovers from the DE441 ephemeris at the same nights (the like-for-like
comparison; against instantaneous osculating elements P and L0 differ by more, a matter of definition). The fixes are all in wording and disclosure, none in the
numbers. One of them is a protocol matter (Blocker B1): the brief named the model families and Kepler's 8′, which
PROTOCOL rule 1 forbids, so the run must be described as a blind measurement under prescribed models, not as a discovery
of the ellipse.

## 1. Freeze verified

- `FROZEN.txt` = `35500e04fe23ad4820fee4cf64cc07bf7acab644164f127bf7583cdfd7364012` = sha256 of `ORBIT.json`.
- Re-ran `python3 fit.py` in a scratch copy (numpy 1.24.2, scipy 1.10.1, pyerfa 2.0.0, matplotlib 3.7.1; 5 min 42 s):
  `ORBIT.json` byte-identical (same hash), `results.json` identical, `REPORT.md` identical, run log identical to `run.log`.
- `fit.py` reads `mars_positions.csv` from its own folder; the committed `blind-fit/` has no copy (the fitter ran in a
  sandbox). I copied `out/mars_positions.csv` (checksum matched) before running.
- Git: every blind-fit file, `PLAN.md` included, entered the repo in one commit (`fa7e58b`, 23:47). The claim that the
  plan was written before the fit rests on the plan's own statement and `run.log`, not on git (finding S2).

## 2. Comparison with modern values (same frame, same epoch)

**Source.** Horizons refuses `499` before 1600-01-02 TDB, so Mars barycenter (`4`, DE441) is used; the Mars–barycenter
offset is under 20 km, nothing at this level. EMB = `3`; Earth `399` only for the lunar wobble. Heliocentric state vectors
(`500@10`, ecliptic J2000, 5-day steps 1579.6–1602.9, plus the exact epoch JD 2301792.5 TT) were rotated from Horizons'
ecliptic of J2000 (ICRF rotated by the IAU76 obliquity 84381.448″, as the Horizons manual states) to the mean ecliptic
and equinox of J1590.0 with `erfa.ltecm(1590.0)`, the same long-term precession model `fit.py` used (the alternative
route `ltecm(1590) · ltecm(2000)ᵀ` differs by 0.003″). Osculating elements were computed from the rotated states with
GM_sun (DE440 value); Horizons' own element table at the epoch is reproduced to 1e-9 in a when GM_sun+GM_body is used,
a 1 ppm detail that does not matter here. a_EMB is 1.0000009 au at the epoch and 1.0000043 au on average over the span;
a_Mars is expressed as a_Mars/a_EMB, as the fit defines it.

**Three modern columns.** (A) osculating at J1590.0, what the brief asked for; (B) averages over the data span
(JD 2298474–2306097, 20.9 yr): mean of a, e, i, circular mean of Ω and ϖ, and P, L0 from a linear fit to the unwrapped
mean longitude; (C) `fit.py`'s own model 3 (two Kepler ellipses, light time and aberration from its own orbits) fitted to
the DE441 geocentric apparent positions (Horizons quantity 31, center `500@399`, true ecliptic of date, passed through the
same `load()` transformation) at the 179 retained epochs with the data's σ. (C) is the fair comparator: it is the best
any two-body fit to these epochs can do, so ours minus (C) is the data's error and (C) minus (A)/(B) is the model's limit.

| element | ours ± σ (frozen) | (A) osc. J1590.0 | (B) span mean | (C) model 3 on DE441 | Δ vs C | Δ vs A |
|---|---|---|---|---|---|---|
| a_M / a_EMB | 1.523697 ± 0.000065 | 1.523716 | 1.523670 | 1.523781 | −55 ppm (−1.3σ) | −13 ppm (−0.3σ) |
| e_M | 0.093065 ± 0.000072 | 0.093099 | 0.093028 | 0.093049 | +16e-6 (+0.2σ) | −34e-6 (−0.5σ) |
| ϖ_M | 328.5979° ± 0.0359° | 328.5639° | 328.5185° | 328.5474° | +182″ (+1.4σ) | +122″ (+0.9σ) |
| Ω_M | 46.3652° ± 0.0367° | 46.3918° | 46.3885° | 46.3726° | −26″ (−0.2σ) | −96″ (−0.7σ) |
| i_M | 1.85644° ± 0.00126° | 1.85247° | 1.85229° | 1.85262° | **+13.7″ (+3.0σ)** | +14.3″ (+3.1σ) |
| P_M (d) | 686.9736 ± 0.0020 | 686.9971 | 686.9796 | 686.9759 | −3.4 ppm (−1.1σ) | −34 ppm (−11.5σ, see note) |
| L0_M | 354.4681° ± 0.0036° | 354.4802° | 354.4786° | 354.4738° | −20″ (−1.6σ) | −44″ (−3.3σ) |
| e_E | 0.017003 ± 0.000091 | 0.016884 | 0.016877 | 0.016905 | +98e-6 (+1.1σ) | +119e-6 (+1.3σ) |
| ϖ_E | 95.04° ± 0.40° | 95.84° | 95.91° | 95.31° | −0.27° (−0.7σ) | −0.80° (−2.0σ) |
| P_E (d) | 365.2552 ± 0.0011 | 365.2551 | 365.2564 | 365.2562 | −2.8 ppm (−0.9σ) | +0.3 ppm (+0.1σ) |
| L0_E | 97.3067° ± 0.0061° | 97.3146° | 97.3153° | 97.3137° | −25″ (−1.1σ) | −28″ (−1.3σ) |

(A) with GM_sun+GM_body for P (Horizons' convention); with GM_sun alone P_M = 686.9976, P_E = 365.2574. ϖ_E and L0 of
the EMB are read in the J1590.0 frame; the EMB's inclination to that frame at the epoch is 0.1″, so "i_E = 0" holds.

**Note on P and the perturbation budget (what is plausible beyond the formal σ).** From the DE441 series over 1580–1602,
in the J1590.0 frame: osculating a_M ranges ±78 ppm (1.8 of our σ), e_M ±71e-6 (1σ), ϖ_M ±0.05° = 186″ (5σ), Ω_M
±64″ (1.7σ), i_M ±1.8″, and the osculating period ±0.038 d (19σ) as Jupiter and the Earth pull on Mars. The mean
longitude of Mars deviates from a straight line by 0.28′ rms, 0.64′ max; a two-body model can match the DE441
geocentric positions at these epochs only to 0.47′ rms in longitude (max 1.5′, near opposition where Δ/r amplifies
by about 2.7) and 0.07′ in latitude. The "−11.5σ" in P against the instantaneous osculating value is therefore a
difference of definition, not an error; against the span-mean mean motion it is −3σ and against (C) −1.1σ. The lunar
wobble is 4678 km mean Earth–EMB distance = 6.45″ at 1 au (up to about 17″ in Mars's geocentric direction at
opposition), monthly, far below the 1.3′ residual; comparator (C) already contains it because Horizons' center was the
Earth. So differences of 1–3σ in a, e, ϖ, P and L0 are inside what "the Kepler element over 21 years" means.

**The one real anomaly: inclination, +13.7″ (3.0σ) against all three comparators.** It is in the data, not the model.
Data minus DE441 on the 179 retained rows has mean latitude +0.26′ (BATCH.md quotes +0.28′) and mean longitude −0.22′;
the longitude offset is the size of the −20″ to −44″ seen in both L0, and the latitude offset is the size of the
inclination difference. A constant latitude bias does not map one to one onto i, so this is consistency, not a
demonstrated cause: reduction-level zero points (star catalogue, instrument zeros, refraction) of this size are the
likely origin, and the formal σ do not contain them. The paper must not list i as "agreement" (finding S1).

**Prediction check.** The frozen orbit, evaluated at the 187 epochs against DE441 (positions, not elements): 0.59′ rms
in longitude, 0.39′ in latitude, max 1.8′ and 0.8′, mean +0.30′ / −0.17′.

## 3. Kepler's third law and the force law

`results.json` stores only the diagonal σ, so the full model-3 covariance was recomputed with `fit.py`'s own
`Fitter.fit` at the frozen solution on the 179 retained rows (χ²_red 2.454, as reported; the diagonal reproduces
`sigma_formal` to the last digit). corr(a, P) = 0.22, corr(a, P_E) = 0.25, corr(P, P_E) = 0.93.

- p = ln(P_M/P_E) / ln(a_M/a_E), with a_E ≡ 1 by construction: **p = 1.499977 ± 0.000123** (formal covariance, χ²-scaled);
  **± 0.000141** after scaling by the bootstrap/formal ratio 1.143 of a, P, P_E; ± 0.000152 with the quoted σ taken as
  uncorrelated. p − 1.5 = −0.16σ. The error is almost entirely a (1.2e-4); P and P_E contribute 7e-6 each because their
  ratio is well fixed.
- Force law, circular orbits, F ∝ r^−q with q = 2p − 1: **q = 1.99995 ± 0.00028**, −0.16σ from inverse square.
- a³ = 3.53749, (P/P_E)² = 3.53743: ratio 1 + 1.9e-5.
- Caveats for episode 2: with two bodies p is determined, not tested (a power law through two points always fits; a third
  body is needed for a test); the Sun+planet mass ratios shift p by 3e-6, negligible; the modern span-mean elements give
  p = 1.500053, so the two-body averages themselves sit 5e-5 from 1.5, within our σ.

## 4. The 8′ question

**Is the comparison fair?** Yes, and conservative for the equant:
- Same Earth: the primary statistic is model 1c vs model 3; both use the same Kepler-ellipse Earth (Amendment A, written
  before the fit). Model 1 (circular Earth) is reported but not used for the answer.
- Every parameter: 1c has R, free centre e_c and free equant e_q, apse ϖ, L0, P, Ω, i, plus the four Earth parameters
  (12). That is the vicarious hypothesis with the Earth Kepler only reached later, and it is fitted by least squares
  to all 185 retained rows, which minimises its systematic error. Kepler fitted four acronychal longitudes exactly, which
  pushes the error to the octants; the agent's 17.0′ is therefore a lower bound on what an equant leaves.
- Latitude is not the cause (my check): refitting 1c to longitudes alone on model 3's 179 clean rows leaves 6.4′ rms and a
  7.0′ systematic at M ≈ 45°, against 1.3′ and 1.55′ for the ellipse; the free equant converges to e_q ≈ 2 e_c
  (0.180 / 0.092), i.e. to the bisected solution Kepler was forced to by the latitudes.
- Post hoc is marked: the Δ/r heliocentric scaling, its figure and `post_hoc.curves` are labelled post hoc in REPORT.md
  and in `fit.py`.
- What is not Kepler's procedure: the pre-registered statistic is geocentric, over all rows, binned in mean anomaly; the
  secondary "Kepler-style" test uses 64 rows within 30° of opposition, not the moments of opposition, so distance errors
  of the circle leak into it (8.1′ rms near opposition vs Kepler's ~2′ fit at the acronychal points).

**Is "YES" honest?** Yes to the question as pre-registered ("a systematic error of several arcminutes that the ellipse
removes"): 17.0′ → 1.55′ geocentric (factor 11, rule threshold 3′ and one half); 2nd-harmonic amplitude 8.3′ → 0.4′; the
post-hoc heliocentric-equivalent error near opposition is 3.3′ rms (free) and 3.9′ (bisected), worst bins 5.0′ and 6.5′
at M ≈ 135–165°, 225° and 315°, the octants. It is not a recovery of Kepler's exact 8′, which came from a different
construction.

**Wording for publication (replace REPORT.md's "the same size as Kepler's 8′"):**
> Fitted to the whole record (185 rows after its own 5σ rule) with the same Keplerian Earth as the ellipse model, a
> circle with a free equant leaves
> systematic geocentric longitude errors of up to 17′ (second-harmonic amplitude 8′); the ellipse reduces them to 1.5′
> (0.4′), the measurement noise. Scaled to heliocentric longitude near opposition, the equant's error is 3–6′ at the
> octants, of the order of the 8′ Kepler reported. The test was pre-registered before the fit; the heliocentric
> scaling was added after seeing the residuals and is marked post hoc. We did not repeat Kepler's own construction
> (a vicarious hypothesis fitted to four acronychal longitudes), so we do not claim to have recovered his 8′.

## 5. Outliers: the 5σ rule against the reduction team's suspects

Model 3's pre-registered rule rejected 8 rows. Their residuals against DE441 (my recomputation; BATCH.md agrees):

| session | fitter Δlon / Δlat (′) | vs DE441 total (′) | BATCH.md list |
|---|---|---|---|
| 1598-03-02V | +6.5 / −1016.4 | 1016.0 | post-hoc suspect (>10′) |
| 1594-02-14V | +36.9 / 0.0 | 37.0 | post-hoc suspect |
| 1586-09-23V | −36.0 / +1.0 | 36.3 | post-hoc suspect |
| 1593-11-27V | −21.3 / +10.1 | 24.2 | post-hoc suspect |
| 1585-01-17M | +0.2 / +10.6 | 11.2 | post-hoc suspect |
| 1583-01-25V | −8.3 / −2.2 | 9.2 | >5′ outlier table |
| 1585-02-09V | +7.3 / +1.3 | 6.8 | >5′ outlier table |
| 1585-02-04V | +2.7 / −3.6 | 3.6 | not listed |

- All 5 of BATCH.md's post-hoc suspects (>10′ from Horizons) were rejected by the blind rule: 5/5.
- 7 of the fitter's 8 are in BATCH.md's >5′ table; 1585-02-04V (3.6′ from DE441, σ 0.53′/0.63′) is a small-σ rejection,
  not a bad night. Three ~8′ rows in BATCH.md's table (1585-01-21V 8.4′, 1586-11-08M 8.2′, 1600-03-23V 8.0′) were kept.
- That mismatch pattern (one non-suspect rejected, three 8′ rows kept) is the evidence that the two lists were made
  independently; identical lists would have been suspicious.
- Two qualifications for the paper. (i) The reduction team's suspects were found *through the Horizons verification*
  (BATCH.md says so), so the confirmation is "a model-only rule, with no ephemeris, finds the rows the ephemeris flags",
  not "two blind methods agree". (ii) BATCH.md and the CSV were in the same repository when the fitter ran; the
  fitter was forbidden to open the repository and states it did not. Write "was forbidden and states it did not", not
  "could not see".
- Data vs DE441 overall, retained rows: 1.26′ rms longitude, 1.77′ latitude (1.20′ / 1.49′ without the three 8′ rows),
  median |Δ| 0.70′ / 0.78′; BATCH.md's 1.50′ / 1.78′ (without its 5 gross outliers) is consistent.

## 6. Claims, novelty, what was blind

What was blind: the fit saw only the CSV; no ephemeris, no remembered elements (the fitter states rough knowledge of the
modern orbit and that it stayed out of the fit; I found no element, bound or start in `fit.py` that encodes it: every
start is derived in `starting_values()` from oppositions, aliases and latitude crossings; bounds are 0.2–20 for a,
0–0.6 for e, 50–5000 d for periods). Kepler's third law was not imposed. The outlier rule, loss, σ recipe and decision
rules were in `PLAN.md`.

What was not blind, and must be stated:
1. The brief prescribed the three model families (circle+equant, Kepler ellipse with the Sun at a focus, two ellipses)
   and quoted Kepler's 8′. PROTOCOL rule 1 forbids "the expected answer or its shape (no 'ellipse')". The run is a blind
   *measurement* under prescribed models; the ellipse was not discovered.
2. External inputs carrying no orbit: IAU 2006 precession and nutation (erfa), the light-time constant 499.005 s.
3. The data product's reduction was verified session by session against Horizons; the quality-class flag lists were
   revised once after seeing a class-level residual table (no per-session residual, per BATCH.md); the five suspects
   were listed, from Horizons, before the fit and left in. Horizons did not enter any position.
4. Modern reference-star positions were used in the reduction (the stars, not the planet).

Against prior art (PRIOR-ART.md): KeplerBench's pilot fits one ellipse to Pafko-transcribed declinations with a modern
Earth supplied (2.66′ median in sample); Li, Ji & Zhang use Kepler's 28 reduced heliocentric values; Carman and others
reconstruct Kepler's manuscripts. Here both longitude and latitude come from raw instrument readings, the Earth is fitted
from the same data, the equant is tested, and the residual is 0.74′ median. No "first": an ellipse has been fitted to
Tycho's Mars record before.

**Headline sentence, paper:**
> From 187 geocentric positions of Mars reduced session by session from Tycho Brahe's observing logs (1580–1601), and
> with no ephemeris or remembered element entering the fit, two Kepler ellipses fitted jointly for Mars and the Earth
> agree within 2σ in a, e, Ω, ϖ, P and L0 with the elements a two-body fit to the DE441 ephemeris at the same nights
> gives (a = 1.523697 ± 0.000065 a_E, e = 0.093065 ± 0.000072, P = 686.9736 ± 0.0020 d; the inclination is 14″ high,
> at the level of the reduction's latitude offset against DE441), give
> P ∝ a^(1.49998 ± 0.00014) without imposing it, and reject the circle-with-equant at 17′ against the ellipse's 1.5′.
> The three model families were prescribed in the brief; the fit was blind to modern values, not to the shape of the
> answer, and the data product had been verified against DE441 before the fit, without altering it.

**Headline sentence, public article:**
> Given only Tycho's Mars measurements, reduced night by night from his logs, and told nothing about today's orbit, an
> AI agent fitted the three shapes Kepler weighed, a circle with an equant and ellipses, and found what Kepler found: the
> circle leaves errors of several arcminutes, the ellipse fits to the limit of Tycho's instruments, and its orbit
> matches the modern one to within 0.01 per cent in size. We chose only the shapes to try; every number was its own.

## Findings

**Blocker**
- **B1. Protocol rule 1 broken by the brief.** `blind-fit/BRIEF.md` lines "Kepler ellipse (Kepler's equation, focus at the
  Sun)", "Two Kepler ellipses" and "(Kepler reported 8′)" give the shape of the answer; `PROTOCOL.md` rule 1 says
  "never the expected answer or its shape (no 'ellipse'…)" and that such runs are "labelled exploration and re-run".
  Fix: either label this run as what it is, a blind measurement under prescribed models, in REPORT.md, the paper and the
  article (the headline sentences above do this), with the deviation stated in the protocol section; or add a
  model-agnostic re-run ("find the orbit that fits") as the discovery claim. Nothing numerical changes.

**Should-fix**
- **S1. Inclination.** +13.7″ (3.0σ) against every modern comparator, tied to the data's +0.26′ mean latitude offset. State
  it as a reduction-level zero point; do not fold it into "agreement with modern values".
- **S2. Pre-registration evidence.** `PLAN.md`, `fit.py` and `ORBIT.json` share one commit (`fa7e58b`); ordering is
  attested only by the plan and `run.log`. Say so in the paper; for episodes 2–5 commit PLAN.md before any fit, or attach
  the session log to `out/provenance/` (PROTOCOL rule 3).
- **S3. Horizons use on the reduction side.** Disclose in the paper what BATCH.md already says: verification of every
  session, one class-level revision of the flag lists, and the suspects list made from Horizons before the fit.
- **S4. P vs osculating elements.** If the osculating J1590.0 column is printed, the P row must carry the ±0.038 d
  osculating-period note, or readers will see "−12σ".
- **S5. REPORT.md wording.** "That is several arcminutes, the same size as Kepler's 8′" → "of the order of"; the agent's
  3–6′ and Kepler's 8′ come from different constructions (section 4 wording).
- **S6. Uncommitted `ep1-kepler-tycho/SHA256SUMS` change in the working tree**: the `data/hip/hip2_all.tsv` hash changed
  and `data/horizons/batch_cache.json` plus three `raw/` files were dropped. A changed checksum of a reduction input
  needs an explanation (re-download, reformat) before the release; it is not part of the blind fit.

**Polish**
- P1. `blind-fit/` has no `mars_positions.csv`, yet `fit.py` reads it from its own folder; add one line to REPORT.md or
  BRIEF.md ("copy `out/mars_positions.csv` here; sha256 626925e4…") so `python fit.py` works from a checkout.
- P2. REPORT.md's "Kepler-style test" fits 64 rows within 30° of opposition, not opposition moments; say so where it is
  compared with Kepler.
- P3. The 8 flagged rows are named "outliers" in ORBIT.json; the paper should call them "rows rejected by the
  pre-registered 5σ rule" and keep the causes (date convention, transcription) as interpretation, as REPORT.md does.

## Checked and found fine

- Freeze: hash, bit-identical re-run, identical results.json and REPORT.md; CSV checksum.
- `fit.py`: frame transformation (true ecliptic of date → mean of date by subtracting Δψ → J1590.0 via `ltecm`), light
  time and first-order aberration from the fitted orbits, Kepler solver, equant geometry, Huber-by-IRLS then 5σ robust
  clipping as in PLAN section 4, covariance scaled by χ²_red, bootstrap with fixed seed; no planetary constant anywhere;
  starting values derived from the data as PLAN section 3 says (8 oppositions, aliases, latitude crossings).
- The pre-registered 8′ rule applied as written: 17.0 ≥ 3 and 1.55 ≤ 8.5 → YES; BIC decision (ΔBIC 9182) as written.
- REPORT.md numbers against results.json (RMS table, systematics, Kepler-style test, post-hoc bins): consistent;
  figures match the tables; "post hoc" is marked where PLAN section 8 requires.
- Formal σ recomputed to the last digit; quoted σ = max(formal, bootstrap) as PLAN section 5 says.
- Third law not imposed (a and P independent parameters; corr 0.22).
- Horizons quantity 31 is the apparent position on the IAU76/80 ecliptic of date (manual), matching the CSV's "true
  ecliptic and equinox of date"; precession-model differences over 410 yr are about 1″.

## Could not check

- The original sandbox run folder and its timestamps (the only evidence that PLAN.md preceded the fit).
- DE441 through jplephem/astropy (not installed; Horizons' DE441 used instead, which is the same ephemeris).
- The transcription and the session-by-session reduction themselves (out of scope; the product's 1.26′/1.77′ against
  DE441 is taken from my recomputation, not re-derived from the logs).
- Whether the fitter opened anything outside its folder; only its statement and the absence of leaked values in `fit.py`.

Scratch material (not in the repo): `…/scratchpad/repro/` (re-run, `cov_exponent.py`, `horizons_fit.py`) and
`…/scratchpad/modern/` (Horizons responses, `modern_elements.py`).
