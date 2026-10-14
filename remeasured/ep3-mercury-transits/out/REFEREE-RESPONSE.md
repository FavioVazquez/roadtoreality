# Response to the referee report (out/REFEREE.md)

Headline after the fixes: pre-registered time-offset form **43.71 ± 1.04** "/cy (converged wide fit,
`out/fit_time_wide_headline.json`); post-hoc radial form **43.53 ± 0.84**. One number and one sigma per form
everywhere in `MEASUREMENT.md`.

1. Provenance of the headline: fixed. `fit.py` gained a `tol_D` stop; `fit_time_wide.py` now stops when the proposed change of D is below 0.005"/cy (24 iterations) and wrote `out/fit_time_wide.json`. Its stored D (43.858) is a linear step that the model does not confirm (weighted rms 8.299 s against 8.182 s), so `scripts/finalize_time_wide.py` takes the converged, model-evaluated point, D = 43.706 ± 1.036 (`out/fit_time_wide_headline.json`). The linear re-solve around the radial solution is in `check_valley.py` / `out/check_valley.json` (43.51 ± 1.05; 43.64 ± 1.02 with the common mode removed; the referee's 43.62 differs by about 0.1, inside the valley's flatness). The 43.78 row is replaced throughout.
2. Start from the control solution: fixed by disclosure plus `scripts/refit_from_zero.py` and `out/refit_from_zero.json` (radial 43.532 ± 0.837; time 43.63-43.69 ± 1.02, identical to the referee's). Disclosed in the method section.
3. 1677: fixed. `KILLTEST.md` and `MEASUREMENT.md` now say the kill test independently recovered the value Newcomb corrected in his own corrigenda (p. 484); the arithmetic reads 29.2 + 25.1 = 54.3 s; the p. 374 longitude remark explains the London/Sydney 4-5 s differences; the other corrigenda (p. 405, p. 406) are noted. `out/newcomb_extract.csv` row 1677/II corrected. Deferred: `paper/PRIOR-ART.md` line 8 and the old commit message (outside this episode folder / cannot be rewritten); the paper owner should replace "not found as known" with the p. 484 statement.
4. Weights: fixed. "Newcomb's weights" renamed "Part I weights"; Newcomb's final-solution weighting added (`scripts/variants_newcomb_final.py`): time 43.64 ± 0.89 around the converged headline (43.73 ± 0.87 around the main-run point, the referee's number), radial 43.39 ± 0.66.
5. Planetary budget: fixed. Frame term +2.32"/cy (`scripts/frame_term.py`), 529.1 + 2.3 = 531.4. Classical value quoted only as Clemence 1947 = 531.5 as reported in Pogossian (arXiv:2112.07301), original not checked. Deferred: Nobili & Will 531.63 and the Venus/Jupiter split (could not be verified from a citable source here).
6. Post-unblinding comparisons: fixed. Control described as validation by construction, not a second measurement; GR and Newcomb comparisons added with the Venus-mass caveat.
7. "Blind": fixed. Wording replaced by the pre-registered-analysis-plan qualification.
8. Which form to quote: fixed. Pre-registered form first, radial form beside it, labelled post hoc, not averaged; conditioning numbers added.
9. Scripts edited after the fit: fixed by disclosure in `MEASUREMENT.md` (committed code reproduces the committed numbers).
10. 1677 II/III weights: fixed by wording (the fit does not use Newcomb's treatment of 1677).
11. "Haiku sub-agent": fixed in `KILLTEST.md` (now "a sub-agent"); "about 770 rows" kept.
12. Jackknife: fixed by one clause (about 15% sampling scatter; formal sigma kept as conservative).
13. Figures: deferred. The sensitivity panel is already in `MEASUREMENT.md`; the residuals-figure caption is noted in text (the two largest residuals are weight-0.1 contacts), but the PNGs are not regenerated. The new time-form headline is not drawn in `figures/D_variants.png` (still the older values); regenerating it is deferred to the paper figures.
