# Referee report: episode 3, Mercury's unexplained perihelion advance from Newcomb's 1677-1881 transit contacts

Reviewer: independent referee (read-only). Date: 13 Oct 2026. Brief: judge whether D = 43.7 ± 1.0″/cy
(pre-registered time-offset form) or 43.5 ± 0.8 (radial-offset form) is a sound measurement, which form the paper
should quote, the 1677 finding, the planetary budget, and the claims the paper can make. The comparison with general
relativity (42.98″/cy) and with Newcomb's own 1882 value is made here for the first time, as the protocol requires.

What I read: `PROTOCOL.md`; `out/KILLTEST.md`, `out/MEASUREMENT_PLAN.txt`, `out/MEASUREMENT.md`,
`out/fit_results.json`, `out/fit_arrays.npz`, `out/fit_log.txt`, `out/fit_time_wide_log.txt`, `out/check_valley.json`,
`out/planet_budget.json`, the five figures, `data/fit_log_attempt1.txt`; `scripts/nbody.py`, `fit.py`, `measure_prep.py`,
`check_valley.py`, `planet_budget.py`, `fit_time_wide.py`, `transit.py`, `hz.py`, `run_killtest.py`, `stats_extra.py`;
`out/newcomb_extract.csv`, `out/newcomb_geocentric_summary.csv`, `out/measure_input.csv`, `out/residuals_obs.csv`;
the page images `data/pages/p384.png`, its crop and the p. 451 crop; printed p. 484 (the corrigenda), which I
rendered myself from the checksummed `data/src/vol1.pdf`; the OCR text of the volume (checksum matches `SHA256SUMS`)
for pp. 384, 456-457, 472-474 and 484; git commits `0086618` and `dd39887`.

What I ran myself (all in a scratch copy, nothing in the project was modified):
- a full re-run of `scripts/fit.py` from the committed code and the cached Horizons responses (see finding 1);
- linear re-solves around both solutions from the saved design matrices (`fit_arrays.npz`), to reproduce σ_D and the
  variants, and to add variants the authors did not run (Newcomb's final-solution weighting; a time-offset model with
  the common mode removed; no per-type constants);
- the singular values of the two weighted design matrices;
- a historical refit started from Horizons' 1780 elements with D = 0 (see finding 2);
- live Horizons probes of the 1677 St Helena parallax reduction (as printed; latitude sign flipped; hour angle
  mirrored; longitude sign flipped);
- the ecliptic-of-date correction to the planetary budget, by rotating Mercury's orbit vectors;
- the solar-J2 contribution and the effect of Newcomb's Venus mass, by hand from the constants in `nbody.py`.

## Verdict

**PUBLISHABLE AFTER FIXES.** The measurement is sound: the historical contacts, fitted with a Newtonian N-body model
and modern masses, require an extra uniform apsidal advance of Mercury of 43.6-43.7 ± 1.0″/cy (pre-registered nuisance
model) or 43.5 ± 0.8 (post-hoc, better-conditioned nuisance model), and every variant I could construct from the saved
design lies between 43.2 and 44.3. The pipeline is validated by the control to 0.01″/cy, and the full re-run from the
committed code reproduces the committed numbers bit for bit (every D, σ, rms, variant, jackknife and Monte Carlo
value in `fit_results.json` identical to the last digit; 16 min on six cores). The fixes are to wording, provenance
and disclosure, not to the number. None is a blocker: my refit of the historical data from Horizons' 1780 elements with D = 0 (finding 2) arrives at
the same values (radial 43.532 ± 0.837 in two iterations; time 43.63-43.69 ± 1.02).

## Findings

### Should-fix

**1. Provenance of the headline number.** `out/fit_time_wide.json` was never written: `scripts/fit_time_wide.py`
writes it at the end, and the run was stopped after 11 iterations (`out/fit_time_wide_log.txt` ends in a leaked-semaphore
warning, no JSON). So the headline 43.7 traces only to the log of a killed run and to a hand reading of its last six
iterations (43.69-43.72); the ±1.0 comes from a different point (the main run's linear-step point at 43.78, σ 1.02).
Protocol rule 3 is not met for the headline. The number itself is right: a linear re-solve of the pre-registered
time-offset model around the *radial* solution (same Jacobian) gives D = 43.62 ± 1.03 at weighted rms 8.174 s, which is
the valley floor the wide re-fit reached (8.181 s); removing the common mode of the three offsets (fitting only
III-II and IV-II) gives 43.62 ± 1.02 at 8.181 s.
Fix: either finish `fit_time_wide.py` (set `iters` so it converges or add a `tol` on D) and cite its JSON, or quote the
pre-registered form as "43.6-43.7 ± 1.0, the valley-floor value, see check_valley and the linear re-solve" and add
that re-solve to `check_valley.py` so it writes a file. Also unify the MEASUREMENT.md tables: the robustness table
quotes "43.78 ± 1.02" for the headline row while the result table says 43.7; one number, one σ.

Re-run of the committed pipeline: `python -I scripts/fit.py` from the committed scripts, the committed input CSVs
and the cached Horizons responses, in a scratch copy, reproduced `out/fit_results.json` exactly (closures, both
controls, both historical fits, all variants, jackknife and Monte Carlo σ: maximum absolute difference 0). So the
post-fit edits to `nbody.py` and `hz.py` (finding 9) did not change the results, and the committed code is the code
that produced them.

**2. The historical fits were started at the control solution, i.e. at D = 43.007.** `scripts/fit.py` line 244:
`fh = gauss_newton(T_OBS["jd_tt_obs_em"], W, cpd, G, tables, fc["p"][:7], XS[xk], ...)` passes `fc["p"][:7]`, the
control fit's parameters, as the starting point. The control had already found D = 43.007 from Horizons' instants, so
the historical fit began at the textbook value and moved 0.5-0.8 from there in two iterations. The first attempt
(`data/fit_log_attempt1.txt`) started from D = 0 but crashed in the degenerate time form before finishing. This does
not bias a converged least-squares fit (the closure tests from perturbed starts recover injected D exactly, and the
radial form's rms dropped monotonically to 6.640 s), but the paper's "blind" claim is weaker without a run that
arrives at 43 from 0 on the historical data.
Fix: one historical refit per form from `p0 = [EL0, 0]`, reported in MEASUREMENT.md. My own refit from D = 0 in the
scratch copy (`refit_from_zero.py`, same `gauss_newton`, Newcomb weights, Espenak-Meeus ΔT): radial form, two
iterations, weighted rms 6.6406 → 6.6402 s, **D = 43.532 ± 0.837**, offsets +0.896″, +0.373″, −0.872″ (the committed
run: 43.531 ± 0.838 and +0.897, +0.374, −0.872); time form, three iterations with damping, rms 8.188 → 8.184 s,
**D = 43.63 at the last evaluated point and 43.69 after the final linear step, ± 1.02**, offsets +916 s (the committed
run sat at −2450 s: a different point on the same flat valley, with the same D). So the data take D from 0 to 43.5-43.7
on their own; the control-start was a convenience, not a steer. Disclose it in the method section regardless, and
replace it with the D = 0 start (or report both) in the archived run. The script I used (drop it in `scripts/`, run
from the episode root with the venv's `python -I`; it reads the cache and writes `out/refit_from_zero.json`):

```python
"""Historical fits started from Horizons' 1780 elements with D = 0 (not from the control solution)."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N

if __name__ == "__main__":
    cpd = json.load(open(N.hz.ROOT / "data" / "calibration.json"))["c_per_D"]
    G = F.T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    p0 = np.concatenate([F.EL0, [0.0]])
    out = {}
    for xk, iters in (("radial", 10), ("time", 8)):
        f = F.gauss_newton(F.T_OBS["jd_tt_obs_em"], F.W, cpd, G, tables, p0, F.offsets_matrix(xk),
                           iters=iters, label=f"from-zero/{xk}")
        s = F.summarize(f, F.W, f"historical from D=0, {xk}")
        out[xk] = {k: s[k] for k in ("D", "sigma_D", "wrms_s", "rms_hist")}
        out[xk]["offsets"] = f["p"][7:].tolist()
        print(xk, json.dumps(out[xk]), flush=True)
    json.dump(out, open(N.hz.ROOT / "out" / "refit_from_zero.json", "w"), indent=1)
```

**3. The 1677 finding is Newcomb's own printed corrigendum, not a discovery; it is also mis-described as a "sign
misprint", and the arithmetic in KILLTEST.md is wrong.** The volume has a CORRIGENDA leaf on printed p. 484 (listed in
the Part VI contents; PDF index 515). I rendered it from `data/src/vol1.pdf` (SHA-256 matches `SHA256SUMS`; KILLTEST
matched that PDF to archive.org's sha1) and read it on the image: "Page 384, Reduction to geocentric phase for
contacts I and II, for +29s.2 read −25s.1, and carry the correction forward." That is Horizons' value to 0.1 s, and it
is why p. 451 carries 21h34m01s. The same leaf corrects p. 405 (Altona, +58 → +54 s) and p. 406 (1832 contacts II,
21h3m32s → 21h3m30s; the summary CSV already has 21:03:30, so p. 451 carries that correction too), and warns that the
longitude list beginning on p. 374 "does not, in all cases, give the longitude of the station actually adopted",
which accounts for the 5 s (London) and 4 s (Sydney) differences `out/stations.csv` records between his table and his
row arithmetic. The kill test rediscovered the p. 384 error independently from the geometry, which is a good check of
the pipeline, but the paper and the article cannot present it as a finding about Newcomb's work: it is in the book.
Severity is Should-fix only because nothing public has gone out; if any public text already says "we found an error
in Newcomb", that is a blocker for that text.

I also verified the p. 384 reading on the page image (`data/pages/p384.png`, rendered from the same checksummed PDF;
printed p. 384 = PDF index 415): the "Red. to geocentric phase" column prints **+29** for Halley's contact I and
**+29.2** for contact II, **+22.0** for III and **+22** for IV; the GMT column is 21 33 42, 21 34 55, 2 47 28, 2 49 34.
The reading is correct. What the data say, independently of the corrigenda:
- Horizons for St Helena (15°55′ S, 0h22m52s W, Newcomb's adopted values) gives a reduction of **−25.1 s** at ingress
  and **+22.0 s** at egress (my probe; `out/residuals_obs.csv` agrees). The egress value matches Newcomb's to 0.0 s,
  so the site and the convention (geocentric = topocentric + red.) are right; the ingress value is wrong in both sign
  and magnitude, not just sign.
- "Flipping the sign removes exactly 54.3 s" (KILLTEST.md, Method §6) is not what the numbers show: 2 × 29.2 = 58.4 s.
  54.3 s = 29.2 + 25.1, i.e. replacing the printed +29.2 by the correct −25.1. That is the real finding, and it is
  stronger than a sign flip: 21h34m55.2s − 54.3 s = 21h34m00.9s against Newcomb's Part II value 21h34m01s (p. 451),
  agreement to 0.3 s.
- Newcomb's Part II used the corrected value. Two independent checks from his own text (p. 456-457, OCR, checksummed
  copy): (a) his equations of condition for 1677 carry constants −6.1 (II) and −9.5 (III); their ratio 0.64 equals the
  ratio of the p. 451 residuals against Le Verrier's tables, +29.4 s and −45.9 s (0.64), not of the Part I values
  (+83.4 s and −45.9 s, ratio 1.82); (b) he writes that Halley's observations imply a solar semi-diameter "some 3″.5
  less than its true value". With the corrected ingress, the II→III chord is 75 s short of the tables, which at
  5.93″/min and dL/dR = 4R/L for that chord implies a semi-diameter error of 3.57″; with the printed ingress it would
  be 6.1″. So Part II is consistent with −25 s and inconsistent with +29.2.
- The p. 384 commentary ("both of Halley's phases at ingress are a minute or more late") was written with the wrong
  reduction: 21 34 55 is 83 s after the tabular 21 33 31.6. With the correct reduction, ingress II is 29 s late (and
  26 s late against Horizons). Newcomb's Part II hypothesis of a "personality" in Halley's contacts rests on the
  75 s discordance, which survives the correction, so his conclusion stands; only the Part I table and its commentary
  are affected.
- No single computational slip reproduces +29.2 (with St Helena's latitude taken north the reduction is −29.1 s;
  with the hour angle mirrored, +25.2 s; with the longitude sign flipped, −18.5 s), so the origin of the Part I value
  stays unknown; it does not matter now that the corrigendum is in hand.
- It does not affect the measurement: the fit uses the p. 451 values (`out/newcomb_geocentric_summary.csv`), which
  already carry the correction, and 1677 has weight 0.1 (dropping 1677 entirely moves D by +0.06 (time) / +0.02
  (radial), my linear re-solve).
Fix the wording everywhere it appears: KILLTEST.md (Method §6, the summary's "sign misprint", and the "Worth a
reviewer's look" sentence), MEASUREMENT.md ("printed + instead of −", "found in the kill test"),
`out/newcomb_extract.csv` row 1677/II ("after a phase correction" is a guess; it is the corrigendum's −25.1 s),
`paper/PRIOR-ART.md` line 8 ("not found as known": it is known, p. 484), and the commit message of `0086618` ("1677
ingress sign misprint found", which cannot be rewritten; the paper carries the corrected statement). Recommended
wording: "Newcomb's Part I table (p. 384) prints the reduction of Halley's ingress contacts to the geocentre as
+29.2 s; the volume's corrigenda (p. 484) correct it to −25.1 s, the value the geometry gives, and his concluded
times (p. 451) carry the correction. Our independent reduction reproduced the corrected value before we found the
corrigenda, which we take as a check of the reduction rather than as a finding." Add the p. 374 longitude caveat
from the same leaf to the stations note.

**4. "Newcomb's weights" means the Part I weights, which are not the weights of his final solution.** The fit used the
weights printed on pp. 451-452. Newcomb's own solution (p. 457, items I-III) then (I) combined 1677 II and III into
one equation of weight 0.3 to eliminate the semi-diameter, rejecting them individually; (II) doubled every May weight
because a May transit determines the heliocentric place better (0.80″ geocentric per 1″ heliocentric against 0.46″ in
November); (III) omitted 1740 II and 1786 II, and dropped 1756 entirely. Linear re-solves around the fitted solutions
with his final weighting (May ×2; 1740 II, 1786 II, 1756 removed; 1677 kept as is):

| | Part I weights (as fitted) | May ×2 only | Newcomb's final weighting | + drop 1677 |
|---|---|---|---|---|
| time offsets | 43.78 ± 1.02 | 43.83 ± 0.94 | 43.73 ± 0.87 | 43.80 ± 0.89 |
| radial offsets | 43.53 ± 0.84 | 43.61 ± 0.80 | 43.39 ± 0.66 | 43.40 ± 0.67 |

Nothing moves by more than 0.2σ. Fix: say "the weights printed in Newcomb's Part I summary (pp. 451-452)" and add
the final-weighting row to the variants table; it is also the natural answer to "does it depend on his weights".

**5. The planetary budget's frame caveat is right but should be quantified.** 529.1″/cy is the rate of Mercury's ϖ
referred to the fixed J2000 ecliptic. The classical figures (Clemence 1947: 531.5; Nobili & Will 1986: 531.63 ± 0.69;
"532" is a rounding of these; all from memory, to be verified against the papers) refer ϖ to the mean ecliptic of date,
with the general precession removed. The ecliptic of date tilts at 47.0″/cy about the node Π_A = 174.87°; rotating
Mercury's orbit vectors into that frame changes its ϖ rate by **+2.31″/cy** (my computation; the analytic form
π_A sin(Ω − Π_A) tan(i/2) gives the same). The sign is physical, not a convention: the obliquity decreases, so the
ecliptic of date lies north of J2000 at Π_A + 90°, and that case gives +2.31. Hence 529.1 + 2.3 = 531.4 against 531.5,
with masses, solar J2 (0.03) and asteroids accounting for the rest. So "the frame explanation" is correct and closes
the gap. Fix: replace "a few arcsec per century" with "+2.3″/cy", cite the two classical values with their frames,
and keep the sentence that D is in-plane and frame-independent. Also note that Venus (275.9) and Jupiter (153.1)
individually differ from Clemence's (277.9, 153.6) by far more than the modern mass changes allow; those differences
are the same frame effect distributed over the planets (the ecliptic's motion is itself driven mostly by Venus and
Jupiter), not a discrepancy.

**6. The comparisons the paper can now make (made here, post-unblinding).**
- *Control = DE441's physics by construction.* General relativity's advance for Mercury is 42.98″/cy; the Sun's J2
  (2.11-2.2 × 10⁻⁷, as in DE440/441) adds 0.027-0.028; asteroids are negligible for Mercury. 42.98 + 0.027 = 43.007,
  which is the control (43.007/43.008). So the control validates the pipeline and the inverse-cube parametrisation to
  about 0.01″/cy; it says nothing about the historical data. The paper must present it that way, and must not present
  43.008 as a second measurement.
- *Newcomb 1882.* On p. 473 he finds p = +42.95″/cy, "the observed centennial motion of the perihelion of Mercury is
  greater by 43″ than the theoretical motion computed from the best attainable values of the masses of the planets",
  with the mass of Venus adopted as 1/405 000. The GMs in `nbody.py` give Sun/Venus = 408 523.7; Newcomb's Venus is
  0.87% heavier, which raises his planetary Venus term by about 2.4″/cy. His 42.95 therefore sits on a planetary
  subtraction about 2.4″ larger than ours; with the modern mass his excess would be nearer 45. The agreement of 42.95
  with 43 is partly fortuitous (as the later history of Newcomb's own revisions shows), and the paper must say that
  his number and ours are not on the same footing. What is on the same footing is the data: the same 58 contacts.
- *Our result against GR:* 43.7 ± 1.0 is +0.7σ above 42.98; 43.5 ± 0.8 is +0.6σ; historical minus control +0.7 ± 1.0
  (time) and +0.5 ± 0.8 (radial). Consistent, not a test beyond the 2% level.

**7. What "blind" may mean in the paper.** The agents know the textbook value; nothing can make an LLM blind to 43″.
What the record supports is narrower and should be stated as such: (a) the instructions named no value and no theory;
(b) `out/MEASUREMENT_PLAN.txt` (21:17:47) fixed the model, the parameters, the weights and the variants before the
first historical fit (`data/fit_log_attempt1.txt`, 21:35); (c) no script contains 43, 42.98 or any theory constant
(I grepped); (d) the control value was computed, not typed; (e) the closure tests recover injected values from
perturbed starts. Against this stand findings 2 (the historical fit started from the control's D) and the post-hoc
radial form (finding 8). Recommended phrase: "blind to the value in the sense of a pre-registered analysis plan,
with the expected value never named and no step tuned to it; the agents' prior knowledge of the textbook number
cannot be excluded and is not claimed to be." Do not use "blind" unqualified in the public article.

**8. Which form to quote.** The pre-registered time-offset form is a poorly posed nuisance model: a common time offset
of all contacts is almost the same thing as a shift of Mercury's mean longitude l at the two sampled longitudes (the
nodes), so the design has a near-null direction. Quantitatively, the smallest singular value of the column-normalised
weighted design is 7 × 10⁻⁴ for the time form against 0.029 for the radial form (condition numbers about 2700 and
64). That is why the first attempt crashed ("SVD did not converge"), why the main run stalled at the ±2000 s search
edge, and why the fitted offsets are −2450 ± 1150 s with l shifted by −317″ (−317″ / 0.129″ per s of synodic motion
= −2450 s, exactly the degeneracy). D is immune (correlation −0.07 with the offsets; same D along the valley to ±0.1),
and the radial form (an offset of the contact circle, which moves ingress and egress in opposite directions) is both
better conditioned and better fitting (6.64 s against 8.18 s weighted rms with the same number of parameters), with
constants that mean something (+0.9″, +0.4″, −0.9″: the same ingress-early/egress-late pattern the kill test saw).
Recommendation: quote the pre-registered value first, as the protocol says, and the radial value beside it, labelled
post hoc with the reason it was added; do not average them. Suggested paragraph for the methods: "The pre-registered
nuisance model (one time offset per contact type) is nearly degenerate with Mercury's mean longitude, because transits
sample the orbit at two longitudes only; the fit converges only along a flat valley in which D changes by ±0.1. After
the first fit stalled we added, post hoc, an offset of the contact separation per contact type, which is not
degenerate and fits better. We report the pre-registered value as the headline and the post-hoc value alongside; they
differ by 0.2″/cy, a fifth of the uncertainty." If a future episode re-registers, register the radial form.

### Polish

**9. Scripts edited after the fit.** `nbody.py` (21:59, the `EP3_WIDE` block) and `hz.py` (22:00) were modified
after `fit_results.json` (21:52) and committed in that state. The re-run (finding 1) shows the committed code
reproduces the committed numbers, so this is a provenance note, not a problem; say in COSTS.md or MEASUREMENT.md that
the results were regenerated from the committed code, or regenerate them.

**10. 1677 II and III individually at weight 0.1.** Newcomb used them only as a combined equation (finding 4). Fine
as a choice, but the paper should not say the fit "uses Newcomb's treatment of 1677".

**11. KILLTEST.md, "a Haiku sub-agent counted them"**: fine for the log; the paper needs only "about 770 rows".

**12. Jackknife smaller than the formal σ.** 0.58 against 0.84 (radial) and 0.82 against 1.02 (time). With 23
groups the jackknife's own sampling scatter is about 15%, so a 30% shortfall is a 2σ-ish fluctuation, or Newcomb's
low weights are pessimistic for a few contacts (the unweighted rms is 16.6 s against a weighted 6.6 s, i.e. the
low-weight points carry the large residuals). Quoting the formal, χ²-scaled σ is the conservative choice; keep it,
and keep the sentence that the Monte Carlo is not independent (it is). No change needed beyond one clause.

**13. Figures.** All five are legible and match the JSON. `sensitivity_D.png`'s right panel is the strongest
evidence in the report (the unique part of D's signature: opposite Nov/May trends of 1-4 s per ″/cy); put it in the
paper. In `residuals_after_fit.png` the two largest historical residuals (1677 II at +4.7″ and 1740 II at +4.9″) are
the two weight-0.1 contacts, which the caption should say.

## What I checked and found sound

- **Inverse-cube parametrisation.** a = −C r̂/r³ gives, to first order, a uniform apsidal advance of πC/h² per orbit
  (Newton, Principia I.44). The three calibrations agree: analytic 2.452480 × 10¹², two two-body runs 2.452482 × 10¹²
  (linear to 10⁻⁷ between C = 4 and 8 × 10⁻¹²), N-body 2.451992 × 10¹² (0.02% lower; irrelevant at 0.01″/cy). The force
  law is not general relativity's (whose leading term is velocity-dependent and ∝ r⁻⁴), but at first order any
  such perturbation is a uniform rotation of the apse, and the control proves the point empirically: an r⁻³ force
  reproduces DE441's relativistic Mercury at the 58 contacts to 12 ms rms after the fit. D is a theory-agnostic
  "extra uniform apsidal advance", which is exactly what the paper should call it.
- **0.99 correlation with a.** Expected and harmless. The inverse-cube term changes the mean motion for a given
  osculating a; a absorbs that together with the Newtonian-vs-Horizons mean-motion mismatch (the ±1200 s pre-fit
  drift). What determines D is the Nov/May asymmetry of its signature; σ_D already includes the correlation, and the
  control (σ_D 0.0015 at 12 ms noise) scales to 1.0 at 8 s noise, as observed. The 0.994/0.998 is not a defect.
- **Time offsets vs mean longitude.** Diagnosed correctly by the authors; quantified above (finding 8).
- **Earth and Sun from Horizons.** The geocentre and the Sun's barycentric position are empirical inputs, as the
  Earth's orbit was for Newcomb (from solar observations). DE441's Earth includes relativity, but the Earth's own
  relativistic perihelion motion (3.8″/cy) displaces it in longitude by at most e × 3.8″ ≈ 0.06″ per century, which
  maps to a few hundredths of an arcsecond at Mercury, far below the 1.4″ scatter; and the same geometry enters the
  control and the historical fit identically, so it cancels in "historical minus control". No leak that matters.
  State it in one sentence: the Earth's orbit is observed input, Mercury's is the system under test.
- **Light-time and aberration.** Three-pass light-time for Sun and Mercury, first-order annual aberration with the
  geocentre's barycentric velocity, applied to both directions (the differential aberration between the two
  directions is ~0.1″ and is included). No light deflection, which for a body in front of the Sun is well below
  0.01″ differentially. The control's 12 ms rms against Horizons' apparent-place finder is the end-to-end check.
- **Newcomb's concluded contacts.** Using them imports his acceptance/rejection decisions, his phase corrections
  (e.g. +20 s on Halley IV) and his equation of time and longitudes, all marked "cited". It does not import his
  ephemeris in any way that matters: the geocentric reduction is a parallax term whose dependence on the ephemeris is
  second order, and the kill test's independent topocentric reductions agree with his to 1.4 s for every 1753 and
  1881 row (and expose the one 1677 error). His Le Verrier tabular times were not used. The residual risk is that
  some rejections were ephemeris-informed; the planned 770-row re-reduction is the right answer and should be named
  as future work, not as a caveat that weakens the result.
- **Control.** Tests the model, finder, calibration and fit against Horizons' physics; does not test ΔT, the
  astronomical-day convention, the reductions or the weights. MEASUREMENT.md says this correctly.
- **ΔT.** Not limiting (0.01 change between models); correct reasoning (a clock error has the same sign at both
  nodes, D's signature does not).
- **Closures.** D = 0 and D = 5 with offsets recovered to 10⁻⁵ from perturbed starts.
- **Uncertainty arithmetic.** σ_D reproduced from the saved design to four digits for both forms; dof = 48; the
  jackknife formula is the standard delete-one form over 23 transits.
- **Data transcription.** Spot-checked p. 384 against the image; the summary CSV's three printing notes (1782 II
  mislabelled, 1786 II bracketed pair, 1848 IV date) are plausible and low-stakes.
- **The blind-protocol evidence** (timestamps, grep, commit contents) as listed in finding 7.

## What I could not check

- The classical planetary-budget figures (Clemence 1947, Nobili & Will 1986, Meeus's mean-element rates) and DE440's
  solar J2 are quoted from memory; verify the three numbers against the papers before they go in print.
- Whether the p. 384 error was noticed anywhere outside the volume itself (one web search found nothing; the
  volume's own corrigenda settle the substance, so this no longer matters).
- The individual-observer rows (about 770) and Newcomb's rejections behind the 58 concluded contacts.
- ΔT models other than Espenak & Meeus and Stephenson-Morrison-Hohenkerk.
- My Horizons probes used live calls, which are not in the project's cache; the numbers are in this report only.
- I did not re-derive the REBOUND contact finder line by line; I rely on the control and closure tests for it.

## Recommended headline sentences

**Paper.** "Fitted to the 58 geocentric transit contacts that Newcomb concluded from the observations of 1677-1881, a
Newtonian N-body model of the solar system with modern planetary masses needs an extra uniform advance of Mercury's
perihelion of 43.7 ± 1.0″ per century (pre-registered nuisance model; 43.5 ± 0.8 with a better-conditioned model
added after the first fit stalled). The same pipeline applied to JPL DE441's own contact instants returns 43.01, the
relativistic value plus the Sun's oblateness, which validates it to 0.01″ per century. General relativity predicts
42.98; Newcomb's 1882 value from the same contacts was 42.95, on a planetary subtraction that used the Venus mass of
his day."

**Public article.** "We re-measured Mercury's unexplained perihelion drift from the 1677-1881 transit timings that
Newcomb collected in 1882, using a modern Newtonian model of the planets and an analysis plan fixed before any fit.
The data demand an extra advance of 43.7 ± 1.0 arcseconds per century. Einstein's general relativity predicts 42.98;
Newcomb himself found 43 from these timings in 1882, with the planetary masses of his day." (No "first", no
"proves", no unqualified "blind"; the last clause is required, because his planetary subtraction differs from ours
by about 2.4″ (finding 6) and his number is not an independent confirmation.)
