# Episode 5 — GW250114 horizon area: status

Date: 2026-10-14 (UTC). Status: **day 1 = feasibility (Parts A, B); session 2 = follow-up on open issues 1–2 and the A_i x A_f combination script (sections S2.x).** Day-1 text below is kept as written except where marked [S2].
All times UTC. Values are medians with 90% equal-tailed credible intervals unless stated. Masses in solar masses (M_sun = 1.98840987e30 kg); areas in m^2 (SI).

## Data (raw files in ../data/, checksums verified)
| source | files | licence | checksum file |
|---|---|---|---|
| Zenodo 10.5281/zenodo.16877102 (GW250114 discovery-paper release, arXiv:2509.08054) | 5 posterior files (NRSur7dq4, NRSur7dq4 no-calibration, IMRPhenomXPHM-SpinTaylor, SEOBNRv5PHM, IMRPhenomXO4a) + GW250114_data_release.tar.gz | CC BY 4.0 | ../data/zenodo_16877102/CHECKSUMS.tsv (Zenodo md5 verified; sha256 recorded) |
| GWOSC | H1/L1 GW250114_082203, O4b 4 kHz R1, 4096 s; H1/L1 GW150914, LOSC_4_V1, 4096 s | CC BY 4.0 | ../data/gwosc/CHECKSUMS.tsv (sha256; re-verified on ws before every fit) |

Fetch scripts: scripts/fetch_zenodo.py, scripts/fetch_gwosc.py (logs: logs/fetch_*.log).

## Part A — area change from the public IMR posteriors
Code: scripts/partA_area.py (results/partA_area_summary.csv, results/partA_area_samples.npz, results/partA_provenance.json), figure scripts/partA_figure.py -> figures/partA_area_change.png/.pdf.
Method: A = 8 pi (G M/c^2)^2 (1 + sqrt(1 - chi^2)); A_i = A(m1,a1) + A(m2,a2) using source-frame masses and spin magnitudes at f_ref = 20 Hz; A_f from the file's remnant columns (final_mass_source, final_spin). The ratio is frame-independent (checked against detector-frame masses in code).

| model | N | (A_f-A_i)/A_i median [5%, 95%] | min sample | P(dA>0) | remnant fit used in file |
|---|---|---|---|---|---|
| NRSur7dq4 | 19990 | 0.581 [0.565, 0.618] | 0.549 | 19990/19990 | NRSur7dq4Remnant |
| NRSur7dq4, no calibration | 19989 | 0.580 [0.566, 0.604] | 0.554 | 19989/19989 | NRSur7dq4Remnant |
| IMRPhenomXPHM-SpinTaylor | 19989 | 0.582 [0.563, 0.650] | 0.551 | 19989/19989 | UIB2016 + Healy et al. average |
| SEOBNRv5PHM | 19988 | 0.590 [0.568, 0.651] | 0.554 | 19988/19988 | UIB2016 + Healy et al. average |
| IMRPhenomXO4a | 19989 | 0.599 [0.570, 0.645] | 0.553 | 19989/19989 | UIB2016 + Healy et al. average |

NRSur7dq4: A_i = 2.37e11 [2.26e11, 2.45e11] m^2, A_f = 3.74e11 [3.63e11, 3.85e11] m^2.
With ~2e4 samples per model, the sample count alone only bounds P(dA>0) > 0.9999 (Jeffreys 90% lower limit).

**Caveat (important for the article):** these are full inspiral-merger-ringdown posteriors from GR waveform models, and A_f comes from NR fits to GR simulations. A positive dA is therefore built into the model; Part A is a consistency check of the public products, not a test of the area law. A real test needs A_i and A_f from disjoint data segments (pre-merger inspiral and post-merger ringdown), as in arXiv:2509.08054.

## Part B — our own 220-only ringdown fit (ringdown 1.1.0, Isi & Farr; on ws)
Code: scripts/ringdown_220_fit.py (one config per run in configs/), comparison scripts/partB_compare.py -> results/partB_summary.csv, figures/partB_ringdown.png/.pdf. Posteriors: results/ringdown/*_posterior.npz, *_summary.json, *_result.nc (ArviZ). Logs: logs/ws_job_*/ (per-fit logs with /usr/bin/time), logs/ws_setup_ringdown_env.log, logs/ws_pip_freeze_ringdown.txt.
Common settings: mode (p,s,l,m,n) = (1,-2,2,2,0); 2 detectors; 0.2 s analysis segment; decimate 4096 -> 2048 Hz; 20 Hz high-pass; ACF from 256 s of data around the event; priors M_f in [35, 150] M_sun (detector frame), chi in default range, a_scale_max = 5e-21; NUTS 4 chains x (1000 warm-up + 2000 samples); all runs r_hat = 1.00, bulk ESS >= 1397 for M_f.

**Start times (cited):**
- GW150914: geocentre peak 1126259462.4083147 s, ra/dec/psi = 1.95/-1.27/0.82 rad (Isi et al. 2019, arXiv:1905.00869; ringdown package GW150914 example); fundamental-only fit at +3 ms (Isi et al. 2019; Isi et al. 2021, arXiv:2012.04486).
- GW250114: peak time, ra, dec, psi and M_f = 68.409 M_sun (detector frame) from the NRSur7dq4 maximum-likelihood sample in the data release (data/analysis_settings_maxL_sample.txt); start 10.5 M_f after peak = +3.538 ms, which is the release's reference 220-only start time (t_ref_220 = 10.5 in scripts/define_area_and_ringdown_macros.py). Our resulting H1/L1 start times are 1420878141.22255 / .22201; the release lists the 'ringdown' effective 220 start times 1420878141.222534 / .220032 (agreement to about 20 µs).

**Calibration, GW150914 (+3 ms):** [S2: reference now the GWTC-2.1 detector-frame posterior, IMR median point at our 61% HPD — see S2.2] M_f = 76.8 [59.1, 92.8] M_sun, chi_f = 0.80 [0.43, 0.93]. Published IMR remnant (GWTC-1, arXiv:1811.12907; cited from the GWOSC event page): M_f = 63.1 +3.4/-3.0 M_sun (source), chi_f = 0.69 +0.05/-0.04, z = 0.09 +/- 0.03, so about 68.8 M_sun in the detector frame. The IMR point lies inside our 1-D 90% intervals and on our 55% 2-D HPD contour, so the calibration **passes, but it is weak**: the posterior is broad, and its median is high by about 8 M_sun.

**Target, GW250114, 220 at 10.5 M_f:** M_f = 76.4 [70.5, 82.1] M_sun (detector frame), chi_f = 0.785 [0.696, 0.848].
Published remnant interval (arXiv:2509.08054): M_f = 62.7 +1.0/-1.1 M_sun (source), chi_f = 0.68 +/- 0.01 (cited). Public NRSur7dq4 IMR posterior in the detector frame: M_f = 68.06 [67.16, 68.86], chi_f = 0.676 [0.665, 0.686].
**Result: the IMR remnant is outside our 90% intervals in both M_f (68.06 < 70.46) and chi_f (0.676 < 0.696); in 2-D it sits on our 96% HPD contour.** In plain terms, our 10.5 M_f fit is in mild (about 2 sigma) tension with the IMR remnant.

Robustness (pre-declared; we did not tune settings to match the published result):
- Changing settings at 10.5 M_f has no effect: 4096 Hz instead of 2048 Hz gives 76.8, 0.1 s segment 76.0, 64 s ACF 76.8, another seed 76.4 M_sun. The offset is not a sampler or conditioning artefact within these choices.
- Start-time scan, our M_f medians: 8 M -> 75.5, 10.5 -> 76.4, 12 -> 76.5, 13 -> 74.0, 15 -> 64.7, 18 -> 65.4, 20 -> 62.3. The IMR point's 2-D HPD level is 0.96 at 10.5–12 M, 0.85 at 13 M, and 0.08–0.43 at 15–20 M, so from 15 M_f on our fits are consistent with IMR.
- Against the published 220 fits in the data release (data/ringdown_areas/220_<t>M_*.hdf5, 'ringdown' pipeline at 4 kHz with calibration marginalisation; cited): at 15–20 M_f we agree within about 1 M_sun (for example, 15 M: 64.7 ours vs 64.3 published). At 10.5–13 M_f ours are 3–4 M_sun higher (10.5 M: 76.4 vs 72.4 published, whose 2-D HPD level for IMR is 0.57).

## S2 — Follow-up session (2026-10-14, 03:36–04:20 UTC)
Rules as before: one change at a time, everything reported, no settings chosen to match published numbers. New code: scripts/ringdown_fit.py (generalises ringdown_220_fit.py: multi-mode, ACF from a PSD file, extra model settings; identical defaults), scripts/make_pe_psds.py, scripts/partB_compare.py (v2), scripts/combine_area.py, scripts/make_dryrun_inputs.py. Tables: results/partB_summary.csv (all runs), results/partB_issue1_gap.csv. Figure: figures/partB_ringdown.png (regenerated).

### S2.1 Open issue 1 — the ~4 M_sun gap to the published 220 fits at 10.5–13 M_f
Medians of M_f (detector frame, M_sun); typical 1-sigma width of each posterior is 3.6–4.5 M_sun at these start times.

| start | baseline (data ACF, 20 Hz high-pass) | (a) PE PSD | (b) PE PSD, f<20 Hz x100 | (c) no high-pass, data ACF | published 220 (release) |
|---|---|---|---|---|---|
| 8 M_f | 75.5 | – | – | 74.9 | 77.6 |
| 10.5 M_f | 76.4 [70.5, 82.1] | 75.2 [69.1, 80.9] | 73.4 [66.9, 79.4] | **72.4 [65.8, 78.6]** | 72.4 [65.1, 79.0] |
| 12 M_f | 76.5 | 75.6 | – | 73.4 | 73.3 |
| 13 M_f | 74.0 | 73.5 | – | 74.3 | 70.2 |
| 15 M_f | 64.7 | – | – | 68.2 | 64.3 |
| 18 M_f | 65.4 | – | – | 67.4 | 65.0 |
| 20 M_f | 62.3 | – | – | 60.7 | 63.4 |

(a) **PE PSDs** (posterior_samples_NRSur7dq4.h5 -> psds, converted with ringdown's PowerSpectrum.to_acf; below 20 Hz the file's filler value replaced by PSD(20 Hz)): closes 30% (10.5 M), 29% (12 M), 13% (13 M) of the gap. The PE PSD and a Welch PSD of the 256 s of data agree to 1–3% at 150–600 Hz (where f_220 ≈ 245 Hz lies), so a small effect was expected. **Not the main cause.**
(b) The same PE PSD with a different, equally arbitrary treatment below 20 Hz (100 x PSD(20 Hz)) moves M_f by a further −1.8 M_sun. This showed that the fit is sensitive to how frequencies below 20 Hz are handled, which motivated (c); (c) was declared after seeing (b).
(c) **No 20 Hz high-pass** (ringdown's default, f_min = None; data ACF): at 10.5 M_f the median becomes 72.43 vs 72.38 published, and at 12 M_f 73.40 vs 73.27 — the gap closes at these two start times. **But it does not hold across the scan:** at 13, 15 and 18 M_f the no-high-pass fits are 4.1, 3.9 and 2.4 M_sun above the published values (where the high-passed fits had agreed within 0.4 M_sun at 15 and 18 M_f), and at 8 and 20 M_f they are 2.7 M_sun below.
Mechanism (plausible, not proven): ringdown's high-pass is a 4th-order Butterworth applied with scipy filtfilt (zero-phase, acausal) to the data but not to the template. With the analysis starting only 3.5 ms after the loudest part of the signal, this can leak merger power into the analysis window.
**Calibration-uncertainty marginalisation: not supported by ringdown 1.1.0** (no calibration code anywhere in the package; checked by searching the installed source). Bound from the calibration envelope in the PE file at 245 Hz: amplitude median 1.007 (H1) / 0.997 (L1) with ±0.5–1% 1-sigma, and phase within ±0.01 rad. Across 200–300 Hz the phase slope corresponds to a timing shift of at most 22 µs (H1) and 7 µs (L1), i.e. at most 0.07 M_f. That is too small to move f_220 or tau_220 by the ~5% needed to explain 4 M_sun, so I expect calibration not to be the cause; I have not tested this with a fit.
**Conclusion for issue 1.** None of the tested changes closes the gap at every start time. Every conditioning choice tested moves the 220-only M_f median by 0.5–4 M_sun (up to ~1 sigma), in a different direction at different start times. The published scan itself is not monotonic (e.g. 73.3 at 12 M_f, 70.2 at 13 M_f, 69.3 at 14 M_f). At 10.5 M_f the IMR remnant lies on our 96% (baseline), 93% (PE PSD), 81% (x100) and 70% (no high-pass) 2-D HPD contours; the published 220 fit gives 57%. **Whether the 10.5 M_f fit is in tension with IMR therefore depends on data-conditioning choices; this evidence is weak either way and must not be quoted as agreement or as tension without the full set of variants.**

### S2.2 Open issue 2 — GW150914 calibration
Reference: GWTC-2.1 'C01:Mixed' posterior (Zenodo 10.5281/zenodo.6513631, file IGWN-GWTC2p1-v2-GW150914_095045_PEDataRelease_mixed_cosmo.h5, md5 verified; checksums in ../data/zenodo_6513631/CHECKSUMS.tsv): M_f = 67.63 [64.41, 71.27] M_sun (detector frame), chi_f = 0.684 [0.638, 0.734]. Isi et al. 2019 (arXiv:1905.00869, cited): 220+221 at the peak gives 68 ± 7 M_sun, 0.63 ± 0.16 (68% credibility).

| run (all: t0 geocentre = peak 1126259462.4083147 unless stated) | M_f median [16%, 84%] | chi_f median [16%, 84%] | GWTC-2.1 point HPD | Isi+2019 point HPD |
|---|---|---|---|---|
| 220 at +3 ms (day 1) | 76.8 [65.6, 86.8] | 0.80 [0.61, 0.89] | 0.61 | – |
| 220 at +3 ms, no high-pass | 75.8 [64.3, 86.1] | 0.79 [0.59, 0.89] | 0.53 | – |
| 220+221 at peak, project priors | 79.1 [70.3, 88.0] | 0.80 [0.65, 0.88] | 0.88 | 0.71 |
| 220+221 at peak, ringdown-docs priors (a_scale_max 1e-21, M 50–150, cosi = −1) | 82.8 [74.9, 91.0] | 0.83 [0.72, 0.90] | 0.96 | 0.89 |
| same, no high-pass | 82.1 [74.1, 90.5] | 0.82 [0.71, 0.90] | 0.94 | 0.87 |

**Result: we do not reproduce Isi et al. 2019.** Our 220+221 medians are 11–15 M_sun higher, and their published point sits on our 71–89% contour, i.e. about 1–1.6 sigma. The GWTC-2.1 IMR remnant is inside our 2-D 90% region for both 220-only runs (53%, 61%) and for the 220+221 run with project priors (88%). It is outside it for the two 220+221 runs with ringdown-docs priors (96%, 94%), where it also falls below the 5% quantile of M_f (69.5 and 68.8 vs 67.6 M_sun). All GW150914 fits, like the GW250114 baseline, lean to high M_f and chi_f, so a common cause in our setup cannot be excluded. Untested differences from Isi 2019: their 16 kHz data and segment duration, ACF estimation details, the amplitude prior, and package version (2019 code vs 1.1.0). **Calibration status: the GW150914 220 fit is consistent with IMR but weak; the 220+221 reproduction of Isi 2019 fails at about the 1–1.5 sigma level and remains open.**

### S2.3 Area-combination script (for the inspiral-only lane)
scripts/combine_area.py takes pre-merger samples (m1, m2, chi1, chi2; --frame detector, or --frame source with a redshift column, converted per sample to the detector frame) and every ringdown posterior matching a glob/variation. Per start time it reports: median and 90% of (A_f − A_i)/A_i from 10^6 random independent pairs; P(A_f > A_i) = mean over A_f samples of the empirical CDF of A_i (exact for the samples, with bootstrap s.e.); a `saturated` flag when every A_f sample exceeds every A_i sample; and a Gaussian significance (mean difference / sqrt(sum of variances)). It writes CSV, JSON provenance (sha256 of all inputs) and a figure. No prior reweighting is applied; each posterior keeps its own priors (to be stated with any result).
Dry runs (results/dryrun/; logs/combine_dryrun_*.log). These use the **IMR** initial black holes, so they are machinery tests, **not** an area-law result:
- detector-frame and source-frame+z inputs give identical results (differences at 1e-15 relative);
- IMR A_i x IMR A_f with independent pairing gives median 0.582 [0.528, 0.654], versus 0.581 [0.565, 0.618] for the correlated Part A computation (wider, as expected once the correlation is dropped);
- IMR A_i x our ringdown A_f, baseline scan: medians 0.90, 0.86, 0.86, 0.79, 0.48, 0.48, 0.38 at 8, 10.5, 12, 13, 15, 18, 20 M_f. P(A_f > A_i) is 1 (saturated) up to 13 M_f, then 0.9975, 0.9935, 0.951 at 15, 18, 20 M_f;
- the same with the no-high-pass scan: medians 0.88, 0.74, 0.74, 0.76, 0.58, 0.55, 0.35; P = 1 (saturated) up to 13 M_f, then 0.9996, 0.9961, 0.967.
Ready to run on ../premerger/ as soon as you say the samples have arrived; it needs the column names and the frame.

## S3 — Literature pass for the series (2026-10-14, 04:20–05:10 UTC; no compute)
Outputs: literature/refs.bib (67 entries, each with a DOI or arXiv id; pybtex-parsed), literature/RELATED-WORK.md, and literature/SEARCH-LOG.md with the raw responses in literature/search_raw/.
The Literature Graph connector was not attached, so arXiv, OpenAlex and CrossRef were queried directly.
- Each bib entry's x-verification field records what was opened: 11 FT (full text read), 43 AB (abstract or landing page), 13 MD (record only, paywalled).
- Confirmed: Li, Ji & Zhang (arXiv:2111.12210) fit 28 heliocentric positions computed by Kepler, taken from Astronomia nova (Donahue's translation), not from Tycho's logs.
- Not found: KeplerBench (2026). Only a GitHub repository with a `keplerbench` package turned up. It is not in refs.bib; a citation is needed.
- Closest prior work per episode:
  1. Carman 2021–2026, manuscript reconstructions working from Tycho's logs.
  2. Aoki 1992/1996 on the Moon test (record only); Longhin 2025 fits Galileo's (not Newton's) Jupiter-satellite data.
  3. Morrison & Ward 1975 — about 2400 transit contacts 1677–1973; excess perihelion motion +41.9 ± 0.5″ per century.
  4. Will 2014 Eq. (67) for the 42.98″/cy coefficient; Park et al. 2017 (MESSENGER).
  5. LVK 2025a/b; independent analyses by Prasad 2026 and Chung et al. 2026. Kastha et al. 2022 report that single-mode ringdown fits overestimate M_f, consistent with our S2 finding.
- Directly relevant to Task 2: Wang & Shao 2023 trace the GW150914 overtone disagreements to noise estimation combined with sampling rate (2 kHz vs 16 kHz).

## S4 — Task 2: the open Isi et al. 2019 check (2026-10-14, ws job 2720e208, 05:22:51–05:29:32 UTC)
Fit: GW150914, 220+221 at the peak (geocentre 1126259462.4083147; ra/dec/psi 1.95/−1.27/0.82; cited from arXiv:1905.00869). Two prior bases: (P) project priors; (D) ringdown-docs priors (a_scale_max 1e-21, M 50–150, cosi = −1) without the 20 Hz high-pass. On each base, one change at a time:
- (i) 16 kHz input: the GWOSC O1 LOSC_16_V1 files, same release as the 4 kHz LOSC_4_V1 files, decimated ×8 to the same 2048 Hz. sha256 values are in ../data/gwosc/CHECKSUMS_16k.tsv; both files were re-verified on ws.
- (ii) 0.05 s analysis window instead of 0.2 s (102 samples instead of 410).

Table: results/task2_isi2019_check.csv; posteriors in results/ringdown/. M_f is detector frame, in M_sun; intervals are the 16–84% quantiles, to compare with Isi et al.'s 68% intervals.

| run | M_f median [16%, 84%] | chi_f median [16%, 84%] | Isi+2019 point (68, 0.63): HPD level | GWTC-2.1 IMR point: HPD level |
|---|---|---|---|---|
| P, 4 kHz, 0.2 s (reference, S2) | 79.1 [70.3, 88.0] | 0.80 [0.65, 0.88] | 0.71 | 0.88 |
| P, **16 kHz**, 0.2 s | 78.5 [70.1, 86.7] | 0.79 [0.65, 0.88] | 0.69 | 0.88 |
| P, 4 kHz, **0.05 s** | 78.7 [69.0, 88.5] | 0.78 [0.59, 0.88] | 0.68 | 0.91 |
| D, 4 kHz, 0.2 s (reference, S2) | 82.1 [74.1, 90.5] | 0.82 [0.71, 0.90] | 0.87 | 0.94 |
| D, **16 kHz**, 0.2 s | 81.1 [73.3, 89.0] | 0.82 [0.70, 0.89] | 0.85 | 0.93 |
| D, 4 kHz, **0.05 s** | 81.9 [73.1, 91.4] | 0.81 [0.68, 0.90] | 0.84 | 0.98 |

**Result.** Neither change closes the gap to Isi et al. 2019 (68 ± 7 M_sun, 0.63 ± 0.16). The 16 kHz input moves the M_f median by −0.6 (P) and −0.9 (D) M_sun; the 0.05 s window moves it by −0.45 (P) and −0.15 (D) M_sun. All are small compared with the posterior widths (≈ ±8–9 M_sun). Our medians stay 10.5–14 M_sun above Isi et al.'s, with their point on our 68–87% contours, i.e. about a 1σ-level difference that is not explained by sampling rate or window length.
- For the GWTC-2.1 IMR remnant: with project priors it stays inside our 90% region at 16 kHz (88%), but sits just outside with the 0.05 s window (91%). With docs priors it lies outside 90% in all three runs (93–98%).
- Remaining untested differences from Isi et al. 2019: the ACF/PSD estimate (data length and method), the amplitude prior and its scale, the polarization/inclination model (our D base fixes cosi = −1), and the package version (2019 code vs ringdown 1.1.0).
- Wang & Shao 2023 (arXiv:2311.13300) attribute the published disagreements mainly to noise estimation combined with sampling rate. Here, sampling rate alone did not matter once the data were decimated to the same 2048 Hz.

**Compute.** One ws job; 401 s wall; about 3,350 CPU-s (0.93 core-hours) for the 4 fits; plus about 1 GB of GWOSC download on ws. ws was in use 05:21–05:30 UTC, and the owner was told it could be stopped at about 05:31. The local 16 kHz download (992 MB) ran before the box was started.

## S5 — Task 3: like-with-like against Isi & Farr's 2023 comment (PRE-REGISTERED 2026-10-14 06:15 UTC, before any fit)
**Sources.** The repository github.com/maxisi/gw150914_rd_comment (commit a4e8e4bc10e37f7126946e1910b7b5306d1bb672; arXiv:2310.13869) is a showyourwork paper build and contains no fit code or configs. The fit configs and posterior summaries are in its Zenodo record 10.5281/zenodo.7597043. We downloaded figure2.tar.gz (95.5 MB, md5 3b5f3d920d8f4d7fc7783ce288f96f86 = Zenodo's value) to ../data/external/zenodo_7597043/; figure1.tar.gz (4.48 GB) was not downloaded. Their README says the runs used `ringdown` at git 49f2dc4ef5093128961d52c95ca1196167ad840e (Dec 2022, PyMC sampler); we read that source to translate the settings.

**Their configuration** (figure2/gw150914/config-ds8.ini; config-ds1.ini is the same without ds = 8 and digital_filter): GWOSC GWTC-1 files {H,L}-*_GWOSC_16KHZ_R1-1126257415-4096 (sha256 in ../data/gwosc/CHECKSUMS_16k_R1.tsv); high-pass 20 Hz; ds = 8 with scipy decimate (digital_filter = False); no slicing, so the full 4096 s file is conditioned (then 25% trimmed per edge, as in both versions); ACF method `td` (direct autocorrelation of the conditioned data); model mchi_aligned, modes 220+221; A_scale = 5e-21 fixed with flat_A = 1 (Gaussian quadratures re-weighted to a flat amplitude prior); M 35–140 M_sun; cosi ~ U(−1, −0.99); chi 0–0.99; ra/dec/psi 1.95/−1.27/0.82; duration 0.2 s; t0 = 1126259462.4083147 + t0M·69 M_sun·G/c³, scanned t0M = −6…10 in 0.2 steps.

**Their own numbers (the reproduction target), from figure2/gw150914/summary_samples.hdf5 at t0M = 0** (2,000 samples each; M detector frame, 16/50/84%):
- ds8 (2048 Hz): M = 72.3 [64.9, 79.0] M_sun, chi = 0.72 [0.56, 0.82].
- ds1 (16384 Hz): M = 68.6 [61.3, 76.7] M_sun, chi = 0.67 [0.48, 0.79].
- Our P run at matched sampling (16 kHz input, ds 8; S4): 78.5 [70.1, 86.7]. So the like-for-like gap at 2048 Hz is 6.2 M_sun, and 9.9 M_sun against their 16384 Hz run (the ~10 M_sun quoted in the task brief is the gap to Isi+2019's 68 ± 7 and to this ds1 run).

**Translation to ringdown 1.1.0** (a renaming, not ported code; the two `condition()` implementations are line-for-line the same apart from flow → f_min and the digital_filter default, False in 49f2dc4e vs True in 1.1.0; the `td` ACF code is identical; the old flat_A prior, 0.5·Σq² − Σ log A for the aligned model, equals 1.1.0's flat_amplitude_prior with marginalized = False and 2 quadratures, which also applies no upper cutoff in the likelihood run): condition_data(ds = 8, f_min = 20, digital_filter = False), no slice; compute_acfs(method = "td"); update_model(m_min = 35, m_max = 140, a_scale_max = 5e-21, marginalized = False, flat_amplitude_prior = True, cosi_max = −0.99). Sampler: ours (NumPyro NUTS, 4 chains × (1000 warm-up + 2000), seed 1234); theirs was PyMC NUTS. Runner: scripts/ringdown_fit.py with three new optional keys (slice null, condition_kws, acf_kws) whose defaults reproduce earlier runs; the earlier version is kept as scripts/archive/ringdown_fit_sha256_a27aab14c87d.py.

**Task 3(a) — does their config run unchanged under 1.1.0?** scripts/test_their_ini_rd110.py loads config-ds8.ini with `Fit.from_config` verbatim, then with [target] t0 added (their pipe supplies t0), builds the model, and records every error/warning. Expectation from reading the source (to be confirmed on ws): 1.1.0 matches model keys case-insensitively but has no `a_scale` or `flat_a` setting (they became `a_scale_max` and `flat_amplitude_prior`, and `marginalized = True` is now the default), so it logs "unknown model argument" for both; the required a_scale_max is then missing when the model is built; `flow` is accepted with a deprecation warning.

**Run order (configs in configs/task3/; each step changes exactly one setting from the previous one).**
Chain A, theirs → ours:
1. A0_theirs_ds8: their config-ds8 as published (reproduction check).
2. A0_theirs_ds1: their config-ds1 (16384 Hz) as published (reproduction check).
3. A1a_acf_fd: ACF method td → fd (Welch, 1.1.0 default nperseg) on the same full segment.
4. A1b_acf_slice128: data conditioned/used for the ACF: full 4096 s → ±128 s (A1a + A1b = our ACF/PSD estimate).
5. A2_amp_marg: amplitude prior: fixed A_scale + flat-A → marginalised quadratures with per-mode a_scale ~ U(0, 5e-21) (ours).
6. A3_pol_generic: polarization/inclination: aligned, cosi ~ U(−1, −0.99) → generic 4-quadrature model (ours).
7. A4a_digfilt: decimation: scipy decimate → FFT cut (digital_filter True, ours).
8. A4b_mmax150: m_max 140 → 150.
9. A4c_dataV1: data: GWTC-1 R1 16 kHz → O1 LOSC_16_V1 16 kHz. This config is identical to our S4 "P, 16 kHz" run (closure check: same seed, should reproduce 78.5).
Chain B, single changes on our P 16 kHz base (to check that the attribution does not depend on the order of chain A):
10. B1_acf_theirs: their ACF estimate only (td, full file).
11. B2_amp_theirs: their amplitude prior only.
12. B3_pol_theirs: their polarization model only.
13. B4_digfilt_off: their decimation filter only.

**Decision rules (fixed now).**
- Reproduction (a): A0 reproduces their run if its M median is within 1.5 M_sun of theirs (≈ 0.2σ; covers PyMC vs NumPyro and 2,000-sample noise) and its 16/84% bounds are within 2 M_sun. Otherwise we say it does not reproduce and stop attributing.
- Attribution (b): the step changes telescope to the total A0 → A4c shift by construction. A setting "explains" the gap if its chain-A step moves the median by ≥ 3 M_sun (half the 6.2 M_sun gap; MC noise on a median is ≈ 0.3 M_sun) and its chain-B single change moves our run by ≥ 3 M_sun in the opposite direction. If no step passes, we say the gap is spread over several settings or unexplained.
- Every run is reported, whatever it shows. No setting is chosen afterwards for matching a published value.

**Compute plan.** One ws job: data fetch + sha256 check, the parse test (seconds), then 13 fits with at most 3 at once (the ds1 run, n = 3,277 samples per detector, takes one slot throughout). Estimate 25–45 min wall.

### S5 results (ws job 52094c2c, 06:48:23–07:16:35 UTC; all 13 fits exit 0)
Table: results/task3_isifarr_ladder.csv (scripts/task3_compare.py); figure: figures/task3_ladder.png (scripts/task3_figure.py); logs: logs/ws_job_52094c2c/; posteriors: results/ringdown/T3_*. M_f is detector frame in M_sun, median [16%, 84%]. "Δ" is the change in median from the previous chain-A step, or, for chain B, from our base (A4c).

**Deviations from the pre-registered plan (compute only, no change to any fit setting).** The box was shared with the owner's bilby run, so at the owner's request at most 2 fits ran at once (not 3), with XLA_FLAGS=--xla_cpu_multi_thread_eigen=false and OMP/OPENBLAS/MKL threads = 4. The suggested `intra_op_parallelism_threads=4` was not used because it is not an XLA flag. B1 is invalid (see below).

**(a) Their config under ringdown 1.1.0 unchanged** (logs/ws_job_52094c2c/T3_parse_test.log): `Fit.from_config(config-ds8.ini)` logs "unknown model argument" for `name`, `a_scale` and `flat_a`, then stops with `TypeError: Data.condition() got an unexpected keyword argument 'flow'` (fit.py line 577 → condition_data → Data.condition). The same happens with [target] t0 added. My pre-registered expectation that `flow` would only give a deprecation warning was wrong: that deprecation path exists only in `PowerSpectrum.from_data`. Even with `flow` renamed, the amplitude settings would be silently dropped and 1.1.0's default (marginalised) prior used. The `ringdown_pipe` entry point exists (--help works). So the published files do not run as is. The hand translation (S5 above) does run, and it reproduces their numbers:

| run | M_f median [16%, 84%] | chi_f median | Δ median | R-hat / ESS(M) |
|---|---|---|---|---|
| Isi & Farr 2023 published, 2048 Hz (cited) | 72.3 [64.9, 79.0] | 0.72 | — | — |
| **A0** their config, 2048 Hz (our rerun) | 72.0 [64.8, 78.8] | 0.72 | −0.3 vs published | 1.00 / 3297 |
| Isi & Farr 2023 published, 16384 Hz (cited) | 68.6 [61.3, 76.7] | 0.67 | — | — |
| **A0** their config, 16384 Hz (our rerun) | 68.5 [60.8, 76.5] | 0.67 | −0.2 vs published | 1.00 / 1539 |
| A1a + ACF method td → Welch | 71.8 [64.7, 78.6] | 0.71 | −0.2 | 1.00 / 3972 |
| A1b + ACF/conditioning data: full file → ±128 s | 72.5 [65.7, 79.2] | 0.73 | +0.7 | 1.00 / 3760 |
| A2 + amplitude prior → marginalised (ours) | 73.3 [66.5, 80.1] | 0.74 | +0.9 | 1.00 / 7216 |
| A3 + polarization → generic (ours) | 75.3 [67.9, 82.6] | 0.76 | +1.9 | 1.00 / 4579 |
| A4a + decimation: scipy decimate → FFT cut (ours) | 78.5 [70.3, 86.8] | 0.79 | **+3.2** | 1.00 / 3579 |
| A4b + m_max 140 → 150 | 78.5 [70.3, 86.9] | 0.79 | +0.0 | 1.00 / 3462 |
| A4c + data R1 → V1 (= our run) | 78.5 [70.3, 86.9] | 0.79 | +0.0 | 1.00 / 3462 |
| B1 ours + their ACF only | invalid | — | — | R-hat NaN / ESS 4 |
| B2 ours + their amplitude prior only | 76.2 [67.9, 84.7] | 0.77 | −2.3 | 1.00 / 1651 |
| B3 ours + their polarization only | 74.7 [66.8, 83.0] | 0.75 | **−3.7** | 1.00 / 3508 |
| B4 ours + their decimation filter only | 75.3 [67.9, 82.4] | 0.76 | **−3.2** | 1.00 / 5347 |

- **Reproduction passes the pre-registered test.** Medians agree within 0.3 M_sun (rule: 1.5 M_sun) and the 16/84% bounds within 0.5 M_sun (rule: 2 M_sun), at both sampling rates.
- **Closure passes.** A4c gives 78.46 [70.32, 86.90], against S4's 78.49 [70.12, 86.68] for the same config. The runs are not bit-identical (different thread settings), but the difference is within Monte Carlo noise.
- **A4b → A4c is exactly zero, and that is expected.** The GWTC-1 R1 and O1 LOSC_16_V1 16 kHz files are bit-identical wherever both exist, for H1 and L1 (checked over the full overlap, GPS 1126257415–1126260736). The release choice therefore does not matter.
- **B1 is invalid, a defect in our design.** The L1 LOSC_16_V1 file is NaN for its first 189 s (GPS 1126256640–1126256829; 3,096,576 samples). The R1 file starts after that gap. Conditioning the full V1 file spreads the NaN through the filter, and the fit returned garbage (scipy warned about NaN input; R-hat NaN; ESS 4). We show it greyed out and do not use it. A valid B1 is the same change on the R1 file, which is bit-identical within ±128 s: one fit of about 1 min, not yet run.

**(b) Attribution.**
- Going from their settings to ours (2048 Hz) moves the median by +6.5 M_sun: 72.0 → 78.5.
- **The decimation filter is the only setting that meets the pre-registered rule** (≥ 3 M_sun in chain A and ≥ 3 M_sun the other way in chain B): +3.2 in chain A, −3.2 in chain B.
  - Their 2022 ringdown (49f2dc4e) downsamples with `scipy.signal.decimate`, an order-8 Chebyshev anti-alias filter run zero-phase. This is the default there (digital_filter = False).
  - ringdown 1.1.0 changed the default to digital_filter = True: zero all frequencies above the new Nyquist (1024 Hz), then keep every 8th sample.
  - All our earlier GW150914 and GW250114 fits used the 1.1.0 default.
- **The polarization model comes second.**
  - Aligned (cos ι in [−1, −0.99]) vs generic moves the median by +1.9 in chain A and −3.7 in chain B.
  - That fails the chain-A threshold, so by the pre-registered rule it does not "explain" the gap alone. It is still a contribution of about 2–4 M_sun.
- **Amplitude prior:** +0.9 in chain A and −2.3 in chain B.
- **ACF estimate (method plus data length):** +0.5 net in chain A; chain B is invalid.
- **m_max and data release:** 0.0 each.
- **The effects do not add up.** The three valid single changes in chain B sum to −9.2 M_sun, against a total of 6.5. The settings interact, so the chain-A split depends on the order of steps. Only the decimation filter is large in both chains.
- **About 3.5 M_sun more comes from the analysis sampling rate, which this task did not split up.** The ~10 M_sun gap in the brief is measured against their 16384 Hz run (68.6) and Isi+2019 (68 ± 7). Within their settings, analysing at 16384 Hz without decimation instead of at 2048 Hz moves the median from 72.0 to 68.5; their own published pair shows the same 3.7 M_sun. S4's "16 kHz" test changed only the *input* rate; it still decimated to 2048 Hz with the FFT cut. Our settings at 16384 Hz with no decimation were not run.
- **Conclusion.** At 2048 Hz the like-for-like gap (6.5 M_sun, about 0.8σ) is explained by settings, not by the data or a bug. The decimation filter is about half of it and the polarization model about a third, with the amplitude prior and ACF making up the rest. The remaining ~3.5 M_sun to the 16384 Hz result is the analysis rate (with decimation) in their own setup. **This test does not say which setting is right.**
  - The 3 M_sun response to the filter is surprising, because the two filters differ mainly above about 800 Hz (the scipy filter cuts at 0.8 × 1024 Hz), while the 220/221 frequencies are below about 400 Hz. We do not understand why yet.
  - The way to decide is an injection with a known remnant, analysed with both filters and at both rates (project rule 3). That has not been done.

**Implication for Part B (GW250114).** All our GW250114 220-only fits also used the FFT-cut decimation (4 kHz input, ds = 2). Whether the published GW250114 analysis (arXiv:2509.08054) used scipy decimation is not known here, and it could bear on the ~4 M_sun gap of S2.1. That test, one fit at 10.5 M_f with digital_filter = False, has not been run.

**Compute.** One ws job, shared box, 28.2 min wall:
- 06:48–06:54 UTC: re-download and verify the R1 16 kHz files on ws.
- 06:54–07:16 UTC: fits.
- CPU: 8,836 CPU-s (2.45 core-hours) for the 13 fits. The 16384 Hz fit alone took 22.5 min wall, 4,729 CPU-s and 9.8 GB peak RSS; each 2048 Hz fit took 0.8–1.7 min.
- The owner was told at about 07:17 UTC that the job had finished. The owner stops the box.
- Locally: the R1 16 kHz download (1.0 GB, 10.3 min), source reading, and the table and figure (seconds).

## S6 — Task 4: area-law combination for GW250114 (PRE-REGISTERED 2026-10-14 08:18 UTC, before any area was computed)
**Inputs.**
- "Before": the owner's pre-merger bilby run, ../premerger-box/GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000/…_result.json.
  - sha256 b45ccfdf62dd5ef9255fcb9ef6ebdf56e1df66d5663f3d330e5a05e32bde3151, re-verified locally; matches ../premerger-box/SHA256SUMS.
  - 4,772 posterior samples; IMRPhenomXPHM, 20–131 Hz, full likelihood, dynesty nlive 1000, dlogz 0.1, bilby 2.8.2 (run_meta.json).
  - The 131 Hz cutoff rule (branch remeasured-ep5-premerger, results/fc_rule.json) was derived by the other lane. It is not checked here and is marked as given.
  - So far only the checksum, column names and sample count were read. No masses, spins or areas were looked at before this section was written.
- "After": our own ringdown 220-only fits (ringdown 1.1.0) in results/ringdown/GW250114_220_*; 8,000 samples each; M_f is detector frame.
- The IMR posteriors of Part A are not used. Their area increase is built into the GR waveform models, so it is not a test.

**Frame.** Both sides use the detector frame: the pre-merger columns mass_1, mass_2 (detector frame) with a_1, a_2, against the ringdown detector-frame M_f and chi_f. A ∝ M², so with a common frame the factor (1+z)² cancels in A_f/A_i.
- Check, not a result: mass_1/mass_1_source − 1 must equal the sample's redshift column to < 1e-6. A source-frame A_i is also reported for information only.
- Area formula: A = 8π (G M / c²)² (1 + sqrt(1 − chi²)), in SI m² (CODATA G, c; M_sun = 1.98840987e30 kg). A_i = A(m1, a1) + A(m2, a2). The spin *magnitudes* enter, so precession (tilts) does not change A.

**Statistics, for every (start time, variant) cell.**
- ΔA/A_i = (A_f − A_i)/A_i: median and 90% interval, from 10⁶ random independent pairs.
- P(ΔA > 0): exact over all 4,772 × 8,000 sample pairs, with a 200-draw bootstrap standard error over both sample sets.
- A one-sided Gaussian-equivalent σ = Φ⁻¹(P). If no pair has ΔA ≤ 0, P is reported as "> 1 − 1/(N_i N_f)", flagged saturated, and the Gaussian-approximation σ is given.
- The two posteriors are treated as independent. The data segments are disjoint: pre-merger below 131 Hz, ringdown ≥ 8 M_f after the peak. No prior reweighting is done; each side keeps its own analysis priors.

**Which "after" posteriors.** Start times after the peak are 8, 10.5, 12, 13, 15, 18 and 20 M_f. 10.5 M_f is the release's reference 220 start, t_ref_220 (cited: Zenodo 10.5281/zenodo.16877102, scripts/define_area_and_ringdown_macros.py; arXiv:2509.08054).
- Conditioning variants in the decision set:
  - V0 baseline (project protocol: 20 Hz high-pass, ACF from data), at all start times;
  - V1 no high-pass, at all start times;
  - V2 PE PSD (PSD from the LVK PE file), at 10.5, 12 and 13 M_f only (not run at other times).
- **Decision set: start times 10.5–20 M_f × the variants above** (17 cells).
- 8 M_f is reported but not in the decision set, because it is earlier than the release's reference start for a 220-only model.
- Robustness rows at 10.5 M_f are reported in the table but not in the decision set: ACF from 64 s, 4096 Hz analysis, 0.1 s window, another seed. These were already shown to move M_f by ≤ 0.5 M_sun (Part B robustness).
- The `pePSDx100` run is a deliberate diagnostic (PSD × 100) and is excluded.

**Decimation-filter systematic (S5).** All GW250114 fits used the 1.1.0 FFT-cut decimation. No GW250114 fit with scipy decimation exists, and this task is local only, so it is **carried as a separate, not-yet-assessed variant (V3: empty slot)**, not folded in. As a stand-in, for every cell we report the robustness margin δ*: the uniform fractional decrease of all ringdown M_f samples, at fixed chi_f, that would bring P(ΔA > 0) down to 0.90 (δ*₀.₉₀) and to 0.50 (δ*₀.₅₀).
- Fixed chi is the conservative choice: in S5 the filter lowered both M and chi, and a lower chi raises the area at fixed M.
- For scale, S5's filter shift on GW150914 was −3.2/78.5 = −4.1% in M_f (a different event, so indicative only).

**How systematics are combined.** Start times are not averaged; they are not exchangeable alternatives, and the 220-only remnant moves with start time (Open issue 4).
- At each start time, the decision-set variants are also combined as an equal-weight mixture, as a secondary row.
- **The headline uses the envelope:** the minimum of P(ΔA > 0) over all 17 decision-set cells, and the range of medians of ΔA/A_i.

**Decision rule for the paper's sentence** (P_min = minimum P over the decision set; δ*_min = minimum δ*₀.₉₀ over the decision set):
1. P_min ≥ 0.99 and δ*_min > 4.1%: "The total horizon area increased: P(ΔA > 0) ≥ P_min at every ringdown start time and conditioning variant we tried, with fractional change between … and …"
2. P_min ≥ 0.99 but δ*_min ≤ 4.1%: as in 1, with the qualifier "conditional on the decimation-filter choice, which we have not yet tested for this event".
3. 0.90 ≤ P_min < 0.99: "The data favour an increase in total horizon area (P between P_min and P_max), but how strongly depends on the ringdown start time and conditioning."
4. P_min < 0.90: "Whether the area increased depends on analysis choices; with our ringdown fits we cannot claim it."
If P_min ≥ 0.99 but P_min − 2 × (its bootstrap s.e.) < 0.99, rule 3 applies instead of 1 or 2.

**Comparison with LVK** (arXiv:2509.08054; companion arXiv:2509.08099): only after our table and sentence are written in this file.

**Second pre-merger run (other lane).** It plugs in as a second `--premerger` input to the same driver (scripts/area_task4.py). The whole table is recomputed with it, and both sets are shown side by side. The headline stays tied to the run named here, unless the two runs' A_i medians differ by more than the larger 1σ width. In that case we report both and apply the decision rule to the union of cells.

### S6 results (computed 08:21 UTC, after the pre-registration above was saved as STATUS.md v10, sha256 3021e9e1…; copy in prereg/STATUS_S6_preregistered.md)
Run: scripts/area_task4.py (uses scripts/combine_area.py, extended with a bilby-JSON loader; the old version is in scripts/archive/). Log: logs/area_task4_run.log. Table: results/area_task4.csv. Provenance with the sha256 of every input posterior: results/area_task4.json. Figure: figures/area_task4.png (scripts/area_task4_figure.py). Local Intel Mac, 12 s wall.

**Checks.**
- Frame check passed: max |m/m_source − 1 − z| = 3e-16.
- Pre-merger medians (detector frame): m1 = 42.8 and m2 = 30.4 M_sun, a1 = 0.21, a2 = 0.27.
- A_i (detector frame) = 2.99 [2.54, 3.68] × 10¹¹ m² (median [5%, 95%]). In the source frame, for information only: 2.46 [2.09, 2.98] × 10¹¹ m².
- No cell is saturated: every cell has some pairs with ΔA ≤ 0, so P is resolved.
- **Counting error in the pre-registration.** It said "17 cells". Its own definition (10.5–20 M_f × V0, V1, plus V2 at 10.5/12/13 M_f) gives **15**. The set is used exactly as defined, and the count is corrected here.

| start [M_f] | variant | in decision set | M_f det [M_sun] | chi_f | ΔA/A_i median [5%, 95%] | P(ΔA>0) ± s.e. | σ (one-sided) | δ*₀.₉₀ | δ*₀.₅₀ |
|---|---|---|---|---|---|---|---|---|---|
| 8 | equal mixture of 2 variants | no | — | — | 0.75 [0.39, 1.13] | 0.9994 ± 0.0003 | 3.24 | 17.7% | 24.5% |
| 8 | V0 baseline | no | 75.5 | 0.72 | 0.76 [0.40, 1.14] | 0.9994 ± 0.0002 | 3.26 | 17.9% | 24.7% |
| 8 | V1 no high-pass | no | 74.9 | 0.71 | 0.75 [0.38, 1.12] | 0.9993 ± 0.0003 | 3.21 | 17.4% | 24.3% |
| 10.5 | equal mixture of 3 variants | no | — | — | 0.68 [0.32, 1.04] | 0.9989 ± 0.0004 | 3.06 | 15.6% | 22.8% |
| 10.5 | R: 4096 Hz | no | 76.8 | 0.79 | 0.73 [0.38, 1.10] | 0.9993 ± 0.0003 | 3.20 | 17.3% | 24.0% |
| 10.5 | R: ACF 64 s | no | 76.8 | 0.79 | 0.74 [0.38, 1.10] | 0.9993 ± 0.0003 | 3.21 | 17.4% | 24.1% |
| 10.5 | R: 0.1 s window | no | 76.0 | 0.78 | 0.72 [0.37, 1.08] | 0.9992 ± 0.0003 | 3.17 | 16.8% | 23.7% |
| 10.5 | R: seed 99 | no | 76.4 | 0.79 | 0.73 [0.38, 1.09] | 0.9993 ± 0.0003 | 3.20 | 17.2% | 23.9% |
| 10.5 | V0 baseline | yes | 76.4 | 0.79 | 0.73 [0.38, 1.09] | 0.9993 ± 0.0003 | 3.20 | 17.1% | 23.9% |
| 10.5 | V1 no high-pass | yes | 72.4 | 0.73 | 0.61 [0.27, 0.96] | 0.9983 ± 0.0004 | 2.93 | 13.8% | 21.2% |
| 10.5 | V2 PE PSD | yes | 75.2 | 0.77 | 0.69 [0.35, 1.06] | 0.9991 ± 0.0003 | 3.13 | 16.3% | 23.2% |
| 12 | equal mixture of 3 variants | no | — | — | 0.67 [0.32, 1.04] | 0.9989 ± 0.0003 | 3.07 | 15.5% | 22.7% |
| 12 | V0 baseline | yes | 76.5 | 0.79 | 0.72 [0.37, 1.08] | 0.9993 ± 0.0003 | 3.18 | 16.9% | 23.8% |
| 12 | V1 no high-pass | yes | 73.4 | 0.77 | 0.61 [0.27, 0.97] | 0.9984 ± 0.0005 | 2.94 | 13.9% | 21.2% |
| 12 | V2 PE PSD | yes | 75.6 | 0.78 | 0.69 [0.35, 1.05] | 0.9991 ± 0.0004 | 3.13 | 16.2% | 23.1% |
| 13 | equal mixture of 3 variants | no | — | — | 0.64 [0.29, 1.01] | 0.9985 ± 0.0004 | 2.97 | 14.5% | 22.0% |
| 13 | V0 baseline | yes | 74.0 | 0.75 | 0.66 [0.30, 1.03] | 0.9986 ± 0.0003 | 3.00 | 14.9% | 22.3% |
| 13 | V1 no high-pass | yes | 74.3 | 0.78 | 0.63 [0.29, 0.99] | 0.9985 ± 0.0004 | 2.96 | 14.3% | 21.7% |
| 13 | V2 PE PSD | yes | 73.5 | 0.75 | 0.64 [0.29, 1.01] | 0.9984 ± 0.0004 | 2.95 | 14.4% | 21.9% |
| 15 | equal mixture of 2 variants | no | — | — | 0.41 [0.05, 0.80] | 0.9702 ± 0.0011 | 1.88 | 5.8% | 15.8% |
| 15 | V0 baseline | yes | 64.7 | 0.60 | 0.37 [0.02, 0.75] | 0.9581 ± 0.0016 | 1.73 | 4.2% | 14.5% |
| 15 | V1 no high-pass | yes | 68.2 | 0.69 | 0.46 [0.10, 0.84] | 0.9823 ± 0.0010 | 2.10 | 7.6% | 17.1% |
| 18 | equal mixture of 2 variants | no | — | — | 0.39 [0.02, 0.79] | 0.9603 ± 0.0014 | 1.75 | 4.7% | 15.3% |
| 18 | V0 baseline | yes | 65.4 | 0.65 | 0.36 [0.00, 0.75] | 0.9513 ± 0.0018 | 1.66 | 3.7% | 14.3% |
| 18 | V1 no high-pass | yes | 67.4 | 0.68 | 0.43 [0.05, 0.83] | 0.9693 ± 0.0013 | 1.87 | 5.9% | 16.3% |
| 20 | equal mixture of 2 variants | no | — | — | 0.26 [-0.11, 0.71] | 0.8636 ± 0.0027 | 1.10 | -2.0% | 10.9% |
| 20 | V0 baseline | yes | 62.3 | 0.58 | 0.27 [-0.11, 0.73] | 0.8640 ± 0.0033 | 1.10 | -2.1% | 11.4% |
| 20 | V1 no high-pass | yes | 60.7 | 0.51 | 0.25 [-0.10, 0.70] | 0.8631 ± 0.0030 | 1.09 | -1.9% | 10.5% |

(δ* = uniform fractional decrease of every ringdown M_f sample, at fixed chi_f, that would bring P down to 0.90 or 0.50. Negative means P is already below that level. V3, scipy decimation, has an empty slot for every start time: not run.)

**Envelope over the decision set (15 cells).**
- P(ΔA > 0) runs from **0.863 (20 M_f, no high-pass)** to 0.9993 (10.5 M_f, baseline).
- Median ΔA/A_i runs from 0.25 to 0.73.
- By start time:
  - 10.5–13 M_f: P = 0.998–0.999 in every variant (2.9–3.2σ one-sided).
  - 15 and 18 M_f: P = 0.951–0.982.
  - 20 M_f: P = 0.86.
- The drop between 13 and 15 M_f matches the 9 M_sun fall of the 220-only remnant mass between those start times (Open issue 4), which we have not explained.
- Decimation margin:
  - At 10.5–13 M_f, δ*₀.₉₀ = 14–17%, well above the 4.1% shift seen in S5, so the untested filter choice could not overturn those cells.
  - At 15–18 M_f it is 3.7–7.6%, the same size as that shift.
  - At 20 M_f, P is already below 0.90.

**Decision rule → sentence 4** (P_min = 0.863 < 0.90). Headline for the paper:
> "Whether the total horizon area of GW250114 grew depends on analysis choices: combining an inspiral-only (20–131 Hz) posterior with our own 220-mode ringdown fits, P(ΔA > 0) is 0.998–0.999 for ringdown start times 10.5–13 M_f after the peak but falls to 0.95–0.98 at 15–18 M_f and 0.86 at 20 M_f, so with our ringdown fits we cannot claim it."

That is what the pre-registered rule gives, and we keep it as is. We did not drop the 20 M_f cell or move the decision-set boundary after seeing the numbers.
- Reading the numbers, apart from the rule: every cell favours an increase (P > 0.86 everywhere, medians ΔA/A_i > 0.24). The evidence is strong only at the earlier start times, which are also the times where our 220-only remnant sits ~4 M_sun above the published fits (S2.1).
- The most likely route to a firmer statement is to explain the 13→15 M_f jump, not to add more start times.

**Second pre-merger run (other lane), when it arrives:** `python scripts/area_task4.py --premerger lane1_XPHM_fmax131=<this run> --premerger lane2_<tag>=<their file>`. It needs columns mass_1, mass_2, a_1, a_2, redshift, mass_1_source, mass_2_source (bilby JSON, or npz/csv/hdf5 with the same names). The table gains a `premerger` column. The S6 rule on A_i medians decides whether the headline uses one run or both.

### S6 comparison with LVK (done 08:28 UTC, after the S6 results and headline above were saved as STATUS.md v11, sha256 93467e6d…)
Sources (cited):
- arXiv:2509.08054v1 full text: PDF from arxiv.org, sha256 1d10e5bc…, not stored in the project folder.
- The LVK data release, Zenodo 10.5281/zenodo.16877102: release/scripts/define_area_and_ringdown_macros.py, which generates the paper's area macros, and the files it reads, area_law_inspiral_data.hdf5 (sha256 85a113aa4e9e…), ringdown_areas/220_*M_final_mass_spin_area.hdf5 (10.5 M_f: sha256 0d64acd151c9…) and remnant_area_pyring_reweighted.npy (sha256 5486524aca50…).
- Script: scripts/area_task4_lvk_compare.py. Log: logs/area_task4_lvk_compare.log. Tables: results/area_task4_vs_LVK.csv, results/area_task4_LVK_scan.csv. Overlay added to figures/area_task4.png, panel c.
- The companion paper arXiv:2509.08099 (abstract checked) covers spectroscopy and GR tests and gives no separate area number we use.

**What LVK did and found.**
- Their "before" is a time-domain inspiral analysis truncated at t< = −40 t_M before the peak; ours is a frequency cut at 131 Hz.
- Their "after" is the 220 fit at 10.5 M_f, combining their `ringdown` and pyRing posteriors.
- Their statistic is the Gaussian significance (μ_f − μ_i)/sqrt(σ_f² + σ_i²). The paper argues that sampling the posterior tails beyond ~4σ is unreliable, and uses this statistic for that reason.
- Published (2509.08054): "For t< = −40 tM, Af > Ai at the 4.4σ level", and at least 3.4σ for all truncation times after −250 t_M.
- Our recomputation from the release files gives 4.447σ and a minimum of 3.358σ, matching both.
- They vary the *inspiral* truncation time and keep the ringdown start fixed at 10.5 M_f. We vary the *ringdown* start.

**Like-for-like** (A in 10¹¹ m², detector frame; "σ_exact" = Φ⁻¹ of our exact P(ΔA > 0); "σ_gauss" = their statistic):

| combination | A_i median | A_f median | ΔA/A_i median [5%, 95%] | P(ΔA>0) | σ_exact | σ_gauss |
|---|---|---|---|---|---|---|
| LVK before × LVK after (their headline) | 2.82 | 4.85 | 0.73 [0.41, 1.16] | 0.99991 | 3.76 | **4.45** |
| ours before × ours after (10.5 M_f, V0) | 2.99 | 5.18 | 0.73 [0.38, 1.09] | 0.99931 | **3.20** | 4.62 |
| LVK before × ours after | 2.82 | 5.18 | 0.84 [0.54, 1.29] | 0.999998 | 4.61 | 5.70 |
| ours before × LVK after | 2.99 | 4.85 | 0.61 [0.27, 0.98] | 0.9981 | 2.90 | 3.61 |

- **At their reference point the two analyses agree** on the fractional change (median 0.73 in both). On their own statistic ours is 4.6σ against their 4.4σ.
- **The difference in significance is mostly the choice of statistic.** On their own samples, the exact tail probability is 3.8σ against 4.4σ Gaussian. On ours it is 3.2σ against 4.6σ.
  - The pre-merger A_i posterior has a long upper tail (figure, panel a), so the Gaussian formula overstates the significance.
  - Our pre-registered statistic is the exact P. LVK's statement that tails beyond ~4σ are unreliable to sample applies to both: our P floors are ~2.6e-8 per cell, but only ~3e4 pairs fall below zero at 10.5 M_f.
- **Our "before" is the more conservative input.** Our A_i is 6% larger (2.99 vs 2.82). Swapping the "before" posteriors moves the significance more than swapping the "after" ones.
  - Why the 131 Hz frequency cut gives a larger A_i than their −40 t_M time cut is not investigated here.
  - It is the main thing the second pre-merger lane should check.
- **Ringdown start time** (results/area_task4_LVK_scan.csv; LVK A_i at −40 t_M × LVK 220 fits; our exact P):
  - P ≈ 0.9999 at 10.5–12 M_f.
  - 0.9994 at 13 M_f.
  - **0.983 at 15 M_f**; 0.97–0.98 at 16–18 M_f.
  - 0.949 at 19 M_f and 0.960 at 20 M_f.
- **The LVK samples show the same 13 → 15 M_f fall.** Their M_f median goes 70.2 → 64.3 M_sun, against our 74.0 → 64.7. So our Open issue 4 is a feature of the 220-only fits of this event, not of our pipeline alone.
- **Our pre-registered rule applied to LVK's own scan** over our decision range (10.5–20 M_f): P_min = 0.949, which gives rule 3 ("favour, strength depends on start time"). Ours gives P_min = 0.863, rule 4.
  - The gap between the two comes from the larger A_i in our "before" run and our lower remnant area at 20 M_f.
  - LVK do not make a ringdown-start-time statement of this kind. Their robustness scan is over the inspiral truncation time.

**Headline unchanged.** The S6 rule gives sentence 4, and the comparison does not change the pre-registered decision. One line for the article is supported by both analyses: at the LVK reference point we find the same fractional growth, about +73% (90% intervals +38% to +109% in ours, +41% to +116% in LVK's). A Gaussian approximation gives 4.4–4.6σ in both analyses. The exact tail gives 3.2–3.8σ. The evidence weakens to about 2σ or less for ringdown fits that start ≥ 15 M_f after the peak.

**[Added in S7] Calibration of the S6 method on GW150914:** the same construction (220-only ringdown at +3 ms with project settings × a frequency-cut pre-merger posterior × exact P) gives P = 0.946 against Isi et al. 2021's 95% (−0.04σ). The S6 headline stands, with a calibration uncertainty of about ±0.3σ in P. See S7.

## S7 — Task 5: calibrate the area method on GW150914 against Isi et al. 2021 (PRE-REGISTERED 2026-10-14 08:48 UTC, before any area was computed)
**Inputs.**
- "Before": the other lane's GW150914 pre-merger posterior, ../premerger-lane2/GW150914_premerger_posterior.csv.gz.
  - sha256 b8dad648e84a74628cbd6b67ccd19421798d258c4ff01c96a1dcfa34c1eee527, verified locally; 5,142 samples (all of them).
  - Setup: IMRPhenomXPHM, 20–132 Hz (the GWTC-1 cutoff, cited by that lane), dynesty nlive 1000, 1024 Hz, bilby 2.8.2 (GW150914_run_meta.json).
  - The file also has the lane's own area columns (area_*_km2). We do not use them, except as a check of our A_i at the end.
  - Only the checksum, run meta, column names and row count were read before this section was written.
- **Reproducibility note (from the owner): bilby ignored --seed in both pre-merger runs (dynesty's rstate took precedence).** Neither this run nor the GW250114 run of S6 is bit-reproducible. Rerunning them gives a statistically equivalent posterior, not the same samples. Their sha256 identify the exact samples we used.
- "After": our existing GW150914 ringdown posteriors (results/ringdown/), all detector frame; no new fits (local compute only).

**Isi et al. 2021** (arXiv:2012.04486v2, PRL 127, 011103; PDF sha256 291d187b…). To choose matching settings I read only their method sentences. They were extracted by a keyword filter that masked any percentage or σ value and dropped sentences about the area probability (literature/isi2021_methods_masked.txt). Their table of remnant (m_f, χ_f) posteriors was visible in that extract.
- **Caveat on blindness:** the published probabilities may also be in my training data. This pre-registration fixes the choices and the rule before any computation, but it cannot guarantee that I have no prior knowledge of their numbers.
- **Their method, as read:**
  - Before: a time-domain inspiral analysis with NRSur7dq4, truncated at the inferred peak (t = 1126259462.423 s GPS), 2048 Hz.
  - After: their own ringdown remnant posteriors from Isi et al. 2019 (arXiv:1905.00869), in two versions, N = 1 (220+221 at Δt0 = 0) and N = 0 (220 only at Δt0 = 3 ms).
  - Their combination: A_0 = A(m1, χ1) + A(m2, χ2) and A_f = A(m_f, χ_f), as in ours.
- **What we cannot match.**
  - Our "before" uses a frequency cut (20–132 Hz, XPHM), not a time-domain truncation at the peak with NRSur7dq4. This is the largest known difference, and it is fixed by the inputs.
  - Our "after" has no N = 0 run with their 2019/2023 settings, only our project settings.

**"After" posteriors used** (exactly these; results/ringdown/<label>_posterior.npz):
- N = 1, 220+221 at the peak (geocentre 1126259462.4083147):
  1. **N1-primary = T3_A0_theirs_ds1**: Isi & Farr's own published configuration for this measurement (arXiv:2310.13869, Zenodo 7597043 config-ds1.ini, 16384 Hz). It is chosen because it is the authors' own setup, which S5 showed reproduces their posterior. It was not chosen for its numbers.
  2. T3_A0_theirs_ds8 (same at 2048 Hz).
  3. S5 chain A, A1a … A4c, and chain B, B2–B4. B1 is invalid (S5) and excluded.
  4. Our P base: GW150914_220221_peak (4 kHz), _16k, _dur0p05.
  5. Our docs base: _docs, _docs_nohp, _docs_nohp_16k, _docs_nohp_dur0p05.
- N = 0, 220 only at +3 ms:
  1. **N0-primary = GW150914_220_dt3ms**: project settings, the only N = 0 run.
  2. GW150914_220_dt3ms_nohp.
- There is no GW150914 220-only scan over start times in our results beyond the +3 ms point, so none is used.

**Frame and formula.** As in S6: detector frame on both sides (mass_1, mass_2, a_1, a_2 against our detector-frame M_f, χ_f), A = 8π(GM/c²)²(1 + sqrt(1 − χ²)) in m². Check: mass/mass_source − 1 = redshift to < 1e-6.

**Statistic.** P(ΔA > 0), exact over all sample pairs with bootstrap s.e.; ΔA/A_0 median and 90% interval; one-sided σ = Φ⁻¹(P). The Gaussian σ is given for information only. Driver: scripts/area_task5.py, which reuses stats() from area_task4.py.

**Decision rule: "reproduces Isi 2021".** P_theirs are their reported probabilities for N = 1 (Δt0 = 0) and N = 0 (Δt0 = 3 ms) at their reference truncation, read from the paper only after our table is written.
- **Reproduces:** |Φ⁻¹(P_ours) − Φ⁻¹(P_theirs)| ≤ 0.3σ for both N1-primary and N0-primary. 0.3σ covers their rounding and our Monte Carlo error.
- **Reproduces qualitatively:** both differences ≤ 0.6σ and on the same side of P = 0.90.
- **Does not reproduce:** otherwise.
- As a second check, if they quote a fractional area change, our median ΔA/A_0 should be within 0.1 of theirs.
- The spread over all the other "after" variants is reported, but it does not enter the rule.

**What it implies for S6, fixed now.**
- Reproduces: the combination method (frequency-cut "before" × our ringdown "after", exact P) is calibrated against a published result on a known case, and S6 stands as written.
- Our P is lower by > 0.3σ: our pipeline is conservative relative to Isi 2021. The S6 "cannot claim" may partly reflect that, and S6 must say so. The suspected cause is the different "before" method.
- Our P is higher by > 0.3σ: our pipeline may overstate the evidence, and the S6 numbers at 10.5–13 M_f must carry that caveat.

### S7 results (computed 08:50 UTC, after the pre-registration was saved as STATUS.md v13, sha256 7ebcfdc0…; copy in prereg/STATUS_S7_preregistered.md)
Run: scripts/area_task5.py. Log: logs/area_task5_run.log. Table: results/area_task5.csv; provenance in results/area_task5.json. Figure: figures/area_task5.png. Local, 17 s wall.

**Checks.**
- Frame check passed (max |m/m_source − 1 − z| = 6e-8; the CSV stores masses to about 7 digits).
- Lane 2's own area_initial_km2 column equals **our source-frame** A_0 to 5e-8. So that column is source frame and is not comparable to our detector-frame ringdown areas. We do not use it.
- Pre-merger medians (detector frame): m1 = 44.8 and m2 = 31.2 M_sun, a1 = 0.39, a2 = 0.40.
- A_0 (detector frame) = 3.11 [2.47, 4.47] × 10¹¹ m². Source frame, for information: 2.54 [2.05, 3.63] × 10¹¹ m².

| group | run | M_f det | chi_f | ΔA/A_0 median [5%, 95%] | P(ΔA>0) ± s.e. | σ (one-sided) | σ_gauss |
|---|---|---|---|---|---|---|---|
| N=1 | **N1-primary: Isi & Farr 2023 config, 16384 Hz** (`T3_A0_theirs_ds1`) | 68.5 | 0.67 | 0.42 [-0.10, 1.01] | 0.9105 ± 0.0030 | 1.34 | 1.22 |
| N=1 | Isi & Farr 2023 config, 2048 Hz (`T3_A0_theirs_ds8`) | 72.0 | 0.72 | 0.53 [-0.01, 1.09] | 0.9481 ± 0.0026 | 1.63 | 1.62 |
| N=1 | S5 A1a (`T3_A1a_acf_fd`) | 71.8 | 0.71 | 0.53 [-0.01, 1.08] | 0.9472 ± 0.0024 | 1.62 | 1.60 |
| N=1 | S5 A1b (`T3_A1b_acf_slice128`) | 72.5 | 0.73 | 0.54 [0.00, 1.09] | 0.9504 ± 0.0025 | 1.65 | 1.67 |
| N=1 | S5 A2 (`T3_A2_amp_marg`) | 73.3 | 0.74 | 0.57 [0.02, 1.13] | 0.9560 ± 0.0023 | 1.71 | 1.76 |
| N=1 | S5 A3 (`T3_A3_pol_generic`) | 75.3 | 0.76 | 0.63 [0.06, 1.24] | 0.9629 ± 0.0020 | 1.79 | 1.86 |
| N=1 | S5 A4a (`T3_A4a_digfilt`) | 78.4 | 0.79 | 0.73 [0.12, 1.42] | 0.9711 ± 0.0018 | 1.90 | 2.01 |
| N=1 | S5 A4b (`T3_A4b_mmax150`) | 78.5 | 0.79 | 0.73 [0.11, 1.42] | 0.9707 ± 0.0017 | 1.89 | 2.01 |
| N=1 | S5 A4c (= our P, 16 kHz) (`T3_A4c_dataV1`) | 78.5 | 0.79 | 0.73 [0.11, 1.42] | 0.9707 ± 0.0017 | 1.89 | 2.01 |
| N=1 | S5 B2 (`T3_B2_amp_theirs`) | 76.2 | 0.77 | 0.66 [0.05, 1.30] | 0.9604 ± 0.0021 | 1.76 | 1.85 |
| N=1 | S5 B3 (`T3_B3_pol_theirs`) | 74.7 | 0.75 | 0.61 [0.04, 1.26] | 0.9580 ± 0.0022 | 1.73 | 1.72 |
| N=1 | S5 B4 (`T3_B4_digfilt_off`) | 75.3 | 0.76 | 0.63 [0.06, 1.23] | 0.9623 ± 0.0021 | 1.78 | 1.87 |
| N=1 | our P base, 4 kHz (`GW150914_220221_peak`) | 79.1 | 0.80 | 0.75 [0.12, 1.46] | 0.9719 ± 0.0017 | 1.91 | 2.02 |
| N=1 | our P base, 16 kHz (`GW150914_220221_peak_16k`) | 78.5 | 0.79 | 0.73 [0.12, 1.40] | 0.9710 ± 0.0019 | 1.90 | 2.05 |
| N=1 | our P base, 0.05 s (`GW150914_220221_peak_dur0p05`) | 78.7 | 0.78 | 0.75 [0.09, 1.53] | 0.9686 ± 0.0017 | 1.86 | 1.89 |
| N=1 | docs base (`GW150914_220221_peak_docs`) | 82.8 | 0.83 | 0.87 [0.22, 1.60] | 0.9803 ± 0.0016 | 2.06 | 2.38 |
| N=1 | docs base, no high-pass (`GW150914_220221_peak_docs_nohp`) | 82.1 | 0.82 | 0.84 [0.20, 1.56] | 0.9791 ± 0.0017 | 2.04 | 2.33 |
| N=1 | docs base, no high-pass, 16 kHz (`GW150914_220221_peak_docs_nohp_16k`) | 81.1 | 0.82 | 0.81 [0.19, 1.54] | 0.9779 ± 0.0016 | 2.01 | 2.24 |
| N=1 | docs base, no high-pass, 0.05 s (`GW150914_220221_peak_docs_nohp_dur0p05`) | 81.9 | 0.81 | 0.86 [0.19, 1.65] | 0.9787 ± 0.0015 | 2.03 | 2.21 |
| N=0 | **N0-primary: project settings** (`GW150914_220_dt3ms`) | 76.8 | 0.80 | 0.63 [-0.02, 1.32] | 0.9455 ± 0.0022 | 1.60 | 1.63 |
| N=0 | project settings, no high-pass (`GW150914_220_dt3ms_nohp`) | 75.8 | 0.79 | 0.60 [-0.05, 1.30] | 0.9341 ± 0.0023 | 1.51 | 1.51 |

**Numbers, before reading Isi 2021's probabilities.**
- N1-primary (Isi & Farr's own 16384 Hz configuration): **P(ΔA > 0) = 0.911 ± 0.003 (1.34σ)**, ΔA/A_0 = 0.42 [−0.10, 1.01].
- N0-primary (220 only at +3 ms, project settings): **P = 0.946 ± 0.002 (1.60σ)**, ΔA/A_0 = 0.63 [−0.02, 1.32].
- Across all 19 N = 1 runs, P runs from 0.911 to 0.980. It rises with the remnant mass, from the authors' configuration (lowest) through the S5 chain to our settings and the docs settings (highest).
- The S5 settings spread is therefore about 0.7σ in P for GW150914. The decimation-filter step (A3 → A4a) alone moves P from 0.963 to 0.971.

### S7 comparison with Isi et al. 2021 (read at 08:51 UTC, after our numbers were saved as STATUS.md v14, sha256 4fe72778…)
Source: arXiv:2012.04486v2 (PRL 127, 011103; refs.bib key Isi2021area), the PDF text itself (sha256 291d187b…). Cited values:
- **N = 1** (220+221 at the peak): ΔA/A_0 = 0.52 (+0.71, −0.47), 90% credibility, with "agreement with Hawking's area theorem with 97% … probability".
- **N = 0** (220 at +3 ms): ΔA/A_0 = 0.60 (+0.82, −0.60), with 95% probability (Fig. 2 caption; abstract: "97% (95%) probability").
- Truncating the inspiral earlier gives probabilities "within 88−97%" (Fig. 3).

| | Isi 2021 P | our P (primary) | Δσ = Φ⁻¹(ours) − Φ⁻¹(theirs) | Δσ allowing for their rounding (±0.5%) | ΔA/A_0 median, theirs vs ours |
|---|---|---|---|---|---|
| N = 1 | 0.97 | 0.911 | **−0.54** | −0.62 to −0.47 | 0.52 vs 0.42 (diff 0.10) |
| N = 0 | 0.95 | 0.946 | **−0.04** | −0.09 to +0.00 | 0.60 vs 0.63 (diff 0.03) |

**Pre-registered verdict: "reproduces qualitatively", not "reproduces".**
- N = 0 is within 0.3σ. N = 1 is 0.54σ low: outside 0.3σ but inside 0.6σ, and on the same side of 0.90. If their 97% was really ≥ 97.4%, N = 1 would fall outside 0.6σ.
- The secondary check (fractional change within 0.1) passes for N = 0 and is exactly at the limit for N = 1 (0.097).

**For information only (not part of the rule):**
- Across our N = 1 variants, P = 0.911–0.980, which brackets their 97%. The authors' 2048 Hz configuration gives 0.948 (−0.25σ). Our project-settings P base gives 0.972 (+0.03σ).
- So the N = 1 shortfall comes mostly from the 16384 Hz configuration, whose remnant is lighter (68.5 against 72–79 M_sun).
- Their "before" differs from ours: a time-domain NRSur7dq4 analysis truncated at the peak, against our 20–132 Hz XPHM cut. They do not quote A_0 itself in a form we can compare, so that difference cannot be separated here.

**What this implies for S6 (by the pre-registered rule).**
- The rule's "lower by > 0.3σ" branch applies to N = 1: with the overtone configuration, our pipeline is conservative relative to Isi 2021 by about 0.5σ.
- For N = 0 the method reproduces Isi 2021 (−0.04σ). N = 0 is the same construction S6 uses for GW250114: 220-only ringdown with project settings, × a frequency-cut pre-merger posterior, × exact P.
- So the S6 calibration case passes, and S6 stands as written. Sentence 4 is not an artefact of a pipeline that understates the evidence on a known case.
- One caveat goes into S6: this is a single event, and its "before" posterior comes from a different method than Isi 2021's. An agreement at the 0.05σ level in P can therefore partly be a coincidence of compensating differences. The calibration constrains the method to about ±0.3σ in P at P ≈ 0.95, not better.
- GW150914 also gives the size of the S5 settings systematic in P: about 0.7σ across all 19 N = 1 runs. The decimation filter alone contributes about 0.1σ (0.963 → 0.971).

## S8 — Paper section for episode 5 (09:14 UTC; writing only, no fits, no box, no downloads)
- **File:** out/PAPER-SECTION-ep5.md, sha256 75d0e1bd3463c1f517fa4ea4c292409750ce8e2615ac595ae3768f8d90582eb0.
- **Length:** 1195 words by `wc -w`, or 1112 words not counting markdown and math symbols. The limit is 1,200.
- **Content:** the question; the method (20–131 Hz inspiral-only posterior × our 220-mode ringdown fits, exact P(ΔA > 0), start-time scan, conditioning variants); the pre-registered S6 headline (sentence 4) and its numbers; the LVK comparison (same +73% growth at their reference point; Gaussian vs exact-tail significance); the S7 GW150914 calibration against Isi et al. 2021 (reproduces qualitatively, with what it does and does not establish); the open issues (13 → 15 M_f drop, empty decimation-filter slot, second GW250114 pre-merger lane still running); and a "What this does not show" paragraph.
- **Sources:** every number carries a source tag ([S5 results], [S6 pre-registration], [S6 results], [S6 LVK comparison], [S7 pre-registration], [S7 results], [S7 table], [S7 comparison], [Open issue 4]). A script check confirmed that every decimal number in the section appears verbatim in this file.
- **Citations:** refs.bib keys LVK2025GW250114area, Isi2021area, IsiFarr2021ringdown, IsiFarr2023comment, Cabero2018area, Kastha2022systematics and Zenodo16877102, all present in refs.bib.
  - **Missing from refs.bib (to add):** bilby, dynesty, IMRPhenomXPHM, NRSur7dq4 and Hawking's 1971 area theorem. The section names these without a citation key.
  - The companion paper LVK2025GW250114tgr is not cited in the section, because it gives no area number we use (S6).
- **Style:** the analysis is described generically ("the analysis agent"). No software or AI product names appear except the scientific packages and waveform models. The words "first" and "never" do not appear.

## S9 — Task 7: finish episode 5 (PRE-REGISTERED 2026-10-14 15:02 UTC, before any fit or area was computed)
Inputs:
- Lane-2 GW250114 pre-merger posterior: ../premerger/samples/GW250114_082203_premerger_posterior.csv.gz, sha256 df4748f41a5099b807c5edfec5006f5d2dca1d2fc2dbb3965040d689cd370569, 5,046 samples. It was frozen before it saw lane 1 (owner's statement).
- The lane-2 cutoff rule: ../premerger/results/fc_rule.json gives f_c = 131.23 Hz for GW250114 and 133.74 Hz for GW150914 (published 132 Hz).
- Only the checksum, header and row count were read before this section was written.

**(1) Box: is single-mode bias the cause of the 13 → 15 M_f drop?**
- **Fits:** GW250114, 220+221 at 10.5, 12, 13, 15 and 18 M_f (5 fits); then, as a lower priority, 220+330 at the same times (5 fits).
  - Every other setting is identical to the S6 V0 baseline: 4 kHz, ds 2, 20 Hz high-pass, ±128 s, data ACF, m 35–150, a_scale_max 5e-21, generic polarization, NUTS 4 × (1000 + 2000), seed 1234.
  - Configs: configs/task7/. At most 3 fits run at once, with threads capped.
- **Expectation (cited, Kastha2022systematics, arXiv:2111.13664):** on GW150914, a single-mode damped sinusoid at merger "overestimates the final mass" and so overstates confidence in the area theorem; adding the overtone lowers it.
- **Pass rule.** The test passes, meaning single-mode bias is a sufficient explanation, if all three hold:
  - (i) the 220+221 median M_f at 10.5–13 M_f is below the 220-only median at the same time by ≥ 3 M_sun at each time;
  - (ii) the 220+221 drop from 13 to 15 M_f is less than half the 220-only drop (< 4.65 M_sun, half of 9.3);
  - (iii) at 15–18 M_f, 220+221 and 220-only agree within 2 M_sun in median.
- **Partial:** (i) holds at ≥ 1 time but (ii) fails. **Fail:** neither.
- 220+330 is reported with the same numbers but does not enter the rule.
- **Effect on the headline.** The S6 rule and decision set are unchanged; the 220+221 cells are added as variant V4 (in the decision set). P_min is set by the 20 M_f 220-only cell, so the test cannot change which sentence is chosen. If the test passes, the sentence's 10.5–13 M_f range is quoted from the 220+221 cells instead of the 220-only cells, and S6's "strong only at early starts" reading is withdrawn as a single-mode artefact.

**(2) Local: both pre-merger lanes.** Rerun scripts/area_task4.py with --premerger lane1_XPHM_fmax131=<lane 1> --premerger lane2_XPHM_fmax131=<lane 2>; the CSV loader is extended to read .csv.gz.
- S6 rule, applied as written: if the two A_i medians differ by more than the larger 1σ width (half the 16–84% range), report both and apply the decision rule to the union of cells. Otherwise the headline stays tied to lane 1, with lane 2 reported beside it.
- Each lane also gets its own rule outcome (sentence number) in the table.

**(3) Local: why is our A_i 6% above LVK's at −40 t_M?** Hypotheses, each tested only with data on disk, with the outcome reported whichever way it goes:
- H1, frame: are LVK's release inspiral samples (data/pre_-40M_with_lnL_cut.dat) detector-frame? Compare their total mass with our detector- and source-frame totals.
- H2, masses vs spins: split the difference by computing A_i from our masses with their spin distribution, and the reverse (median-matched swaps).
- H3, truncation: find the LVK truncation time whose A_i median equals ours (release scan from −250 to 0 t_M), and convert −40 t_M to an instantaneous GW frequency using the release median waveform (signal_median_time_domain_waveform_H1.dat). If −40 t_M corresponds to well above 131 Hz, the two cuts do not keep the same signal.
- H4, priors: compare the bilby prior in our result file with any prior information in the release (spin_priors.py, area_change_prior.dat). Reweight our samples to theirs where the Jacobian is analytic.
- H5, waveform (XPHM vs their time-domain model): not testable without a rerun; stated as such.

**(4) Local: the 131 Hz cutoff.**
- Run ../premerger/scripts/fc_rule.py, or read its code, to confirm 131.23 Hz from the LVK XPHM medians.
- Sensitivity of P(ΔA > 0) to f_c ± 10%. Rerunning the pre-merger PE at 118 and 144 Hz is not part of this task; its cost is given (lane 1 took 7,770 s wall on 32 cores per run).
- As a **proxy (not a rerun)**, map f_c ± 10% to inspiral truncation times via the release median waveform's instantaneous frequency, take the fractional change of LVK's A_i median between those times from the release scan, scale our A_i by that factor, and recompute P_min.
- Rule: if the proxy moves P_min across 0.90 or across 0.99, the headline gets the qualifier "sensitive to the inspiral cutoff". Otherwise it is unchanged.

**Final headline.** Sentence chosen by the S6 rule on the final decision set (S6 cells + V4 cells, lane choice from (2)), plus any qualifiers triggered by (1) and (4).

### S9 results (written 15:20 UTC; pre-registration saved first as STATUS.md v17, sha256 d9473dea…, copy in prereg/STATUS_S9_preregistered.md)
**Box.** At about 15:04 UTC ws was unreachable (SSH timed out during the banner exchange), so the first submit failed with nothing staged; the owner was told. ws then came up, and job **afb26f81** ran 15:10:25–15:16:19 UTC (5.9 min wall): 10 fits, at most 3 at once, threads capped, 5,166 CPU-s. The data were re-verified by sha256 on ws. Logs: logs/ws_job_afb26f81/. Posteriors: results/ringdown/GW250114_220221_* and _220330_*. The owner was told at about 15:17 UTC that the box could be shut down.

**(1) Single-mode bias test** (M_f detector frame, median [5%, 95%]; same settings as S6 V0):

| start [M_f] | 220-only (S6) M_f | 220+221 M_f | 220+221 chi_f | difference | 220+221 R-hat / ESS |
|---|---|---|---|---|---|
| 10.5 | 76.4 | 64.4 [55.6, 74.3] | 0.62 | −12.0 | 1.00 / 2982 |
| 12 | 76.5 | 62.6 [53.6, 72.5] | 0.59 | −13.9 | 1.00 / 3175 |
| 13 | 74.0 | 61.3 [52.7, 71.3] | 0.56 | −12.7 | 1.00 / 2723 |
| 15 | 64.7 | 65.0 [53.1, 81.9] | 0.64 | +0.3 | 1.00 / 2144 |
| 18 | 65.4 | 65.5 [52.0, 90.0] | 0.66 | +0.2 | 1.00 / 1780 |

- **Pre-registered rule: PASS.**
  - (i) At 10.5/12/13 M_f the overtone lowers M_f by 12.0, 13.9 and 12.7 M_sun (rule: ≥ 3).
  - (ii) With the overtone, the 13 → 15 M_f change is +3.7 M_sun, a small rise rather than a drop (rule: |drop| < 4.65).
  - (iii) At 15 and 18 M_f, 220+221 and 220-only agree within 0.3 M_sun (rule: ≤ 2).
- **So the 13 → 15 M_f drop of Open issue 4 is accounted for by single-mode bias in the early 220-only fits**, as expected from Kastha2022systematics.
- With the overtone, M_f is 61–66 M_sun at every start time. Each 90% interval contains the IMR detector-frame remnant, 68.06 M_sun (Part B).
- **220+330 did not converge**: R-hat 1.49–1.72 and bulk ESS 6–7 for all five start times. These fits cannot be interpreted. They are listed in results/area_task4.csv as X_220330 (not in the decision set), and nothing is concluded from them. A rerun would need more warm-up or tighter amplitude priors; that is not done here.
- LVK's reference fit (220-only at 10.5 M_f, M_f 72.4; S2.1) is also above the IMR remnant. Our test does not establish whether that fit carries the same bias.

**(2) Both lanes** (results/area_task4.csv, now with a `premerger` column and the V4 220+221 cells; log logs/area_task7_final.log). The S6-cell values are unchanged from S6 (max |ΔP| = 0).
- **Lane rule:** A_i medians are 2.992 (lane 1) and 3.024 (lane 2) × 10¹¹ m². The difference, 0.032, is far below the larger 1σ width, 0.308 (both × 10¹¹ m²). **So the headline stays tied to lane 1, with lane 2 reported beside it.** These medians match lane 2's REPORT.md (29.92 and 30.24 × 10⁴ km²).
- **Rule outcome:** P_min is 0.863 for lane 1 and 0.847 for lane 2, both at 20 M_f with no high-pass. **Both give sentence 4.**
- **V4 (220+221) cells, P(ΔA > 0):**

| start [M_f] | lane 1 | lane 2 | ΔA/A_i median, lane 1 [5%, 95%] |
|---|---|---|---|
| 10.5 | 0.956 | 0.948 | 0.35 [0.01, 0.75] |
| 12 | 0.920 | 0.908 | 0.29 [−0.05, 0.69] |
| 13 | 0.892 | 0.877 | 0.25 [−0.07, 0.65] |
| 15 | 0.926 | 0.916 | 0.36 [−0.04, 0.92] |
| 18 | 0.911 | 0.900 | 0.37 [−0.07, 1.07] |

**(3) Why our A_i is 6% above LVK's −40 t_M A_i** (results/area_task7_local.json; scripts/area_task7_local.py; log logs/area_task7_local.log):
- **H1, frame: rejected.** The LVK release inspiral samples have a median total mass of 73.29 M_sun, against our detector-frame 73.59. Both are detector frame.
- **H2: the difference is in the q and spin posteriors.**
  - Ours (lane 1) has q = 0.713 and a1, a2 = 0.21, 0.27. LVK's −40 t_M posterior has q = 0.879 and a1, a2 = 0.34, 0.38. Lane 2 is like ours (q = 0.705; 0.16, 0.28), so this is not an implementation artefact.
  - More unequal masses raise m1² + m2² at fixed total mass, and lower spins raise each area.
  - With independent-draw medians the gap is 2.977 vs 2.793 (+6.6%). Our masses with LVK's spins give 2.871, so the spins carry about 57% of the gap. LVK's masses with our spins give 2.890, so the masses carry about 47%. Together the two account for it.
- **H3, truncation: rejected as the cause.**
  - On the release median H1 waveform, −40 t_M corresponds to an instantaneous GW frequency of about 81 Hz, and 131 Hz to about −9.7 t_M. Our frequency cut keeps more of the late inspiral.
  - But LVK's A_i at −10 t_M is 2.65, lower, and no truncation time in their scan (−250 to 0 t_M) reaches 2.99 (maximum 2.83 at −50 t_M). Keeping more signal moves their A_i the opposite way.
  - Caveat: a frequency-domain cut and a time-domain truncation are not equivalent, so the time–frequency mapping is approximate.
- **H4, priors: partial, not verified.**
  - Ours is uniform in the component masses (bilby UniformInComponentsChirpMass/MassRatio) and uniform in spin magnitude on [0, 0.99].
  - LVK's prior could not be recovered from the release: its ln_prior column does not fit a simple form (regression residual 2.7 against a column SD of 3.1).
  - If LVK used a prior uniform in (M_tot, q), as Isi 2021 did, reweighting ours to that prior gives A_i = 2.944 (−1.6%, about a quarter of the gap; ESS 4,606).
- **H5, waveform and likelihood** (XPHM with a frequency cut vs their time-domain analysis): not testable without new PE runs. It remains the leading candidate for the different q and spin posteriors.
- **Conclusion:** the 6% comes from our more unequal-mass, lower-spin inspiral posterior, not from the frame or the truncation point. The mass prior may explain about a quarter of it; the rest is unexplained.

**(4) The 131 Hz cutoff.**
- Lane 2's fc_rule.py, re-run here, gives **131.23 Hz** both from the medians in fc_rule.json and from medians recomputed directly from the LVK XPHM posterior file on disk (Zenodo 16877102, posterior_samples_PhenomXPHM.h5). On GW150914 it gives 133.7 Hz against the published 132 Hz.
- **Proxy for f_c ± 10%** (not a rerun):
  - 118 Hz maps to about −16.6 t_M and 144 Hz to about −6.9 t_M. Interpolating LVK's A_i scan gives factors of ×1.048 (−10%) and ×1.008 (+10%) on our A_i.
  - P_min becomes 0.806 (−10%) and 0.854 (+10%), against 0.863 nominal (results/area_task7_fc_proxy.csv).
  - It does not cross 0.90 or 0.99, so by the rule **no "cutoff-sensitive" qualifier** is added.
  - Caveat: neighbouring points in LVK's scan scatter by about ±2%, which is comparable to the proxy factors.
- **A real rerun** would need one PE run per f_c value per lane. Lane 1 took 7,770 s wall on 32 cores, so two cutoffs for one lane is about 4.3 h of ws (roughly $7 at the ~$1.6/h on-demand estimate; not a bill).

**Final headline** (S6 rule; decision set = 15 S6 cells + 5 V4 cells = 20; lane 1; qualifiers from (1) and (4) as pre-registered). This is **sentence 4**, with the 10.5–13 M_f range now quoted from the 220+221 cells:
> "Whether the total horizon area of GW250114 grew depends on analysis choices: combining an inspiral-only (20–131 Hz) posterior with our own ringdown fits, P(ΔA > 0) is 0.89–0.96 for fits that include the 221 overtone and start 10.5–13 M_f after the peak, 0.91–0.98 at 15–18 M_f, and 0.86 at 20 M_f, so with our ringdown fits we cannot claim it."
- As pre-registered, S6's reading that "the evidence is strong at early start times" (P = 0.998–0.999 from 220-only fits) is **withdrawn as a single-mode artefact**.
- Every cell still favours an increase: P ≥ 0.846 in all 40 cells across both lanes, and every ΔA/A_i median is positive.

**Paper section updated (S9).** out/PAPER-SECTION-ep5.md now has the S9 headline, the overtone test, both lanes, the A_i-offset finding, the f_c check, and updated open issues. sha256 ab4847b7c738de7db7566bcfe6e43d8287731995f4561078ea4572be03dc29c0; 1126 words by `wc -w`. Same rules as S8: every decimal number appears verbatim in this file (script check), citations are refs.bib keys (now also Kastha2022systematics for the expectation), and no software or AI product names appear apart from the scientific packages. The previous version (sha256 75d0e1bd…) is superseded.

## S10 — Task 8: answers to the independent checker (PRE-REGISTERED 2026-10-14 15:40 UTC, before the checks were run)
Source: CHECKER-EP5.md (owner's folder showtime-local/…/2026-10-14/paper/, read in full). It reviewed S1–S8 and paper version 75d0e1bd, before S9. Its re-derivation script (rederive_ep5.py, in a temporary directory) could not be opened from here, so every check below is our own implementation.

**Planned checks** (diagnostics of existing numbers; no new fits):
1. **Lane-1 input switch.** Use the committed ../premerger-box/GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000_posterior.csv.gz (sha256 7a3d4816ddb36e93989cb9895993c23ff0b195fea3b64c87af2ae3f0a6981c7b) in place of the git-ignored result JSON.
   - Required: mass_1, mass_2, a_1, a_2, redshift and the source masses equal the JSON values exactly.
   - Required: every P, quantile and δ* in results/area_task4.csv is unchanged (seeded reruns).
   - Any difference is reported as a discrepancy.
2. **Fragility** of each S9 decision cell (both lanes). Count the failing pairs (A_f ≤ A_i) and the fraction contributed by the 5 A_i samples that contribute most. Recompute P and the one-sided σ with those 5 samples removed. This is a diagnostic, not a new estimate.
3. **Autocorrelation-aware standard error of P.** The ringdown samples are 4 MCMC chains × 2,000 draws; the pre-merger samples are nested-sampling posterior draws, treated as independent. Two estimators:
   - (a) a chain-block bootstrap: ringdown resampled in contiguous blocks of 100 draws within chains, A_i resampled i.i.d., 400 draws;
   - (b) an ESS-based s.e.: g_j = ECDF_Ai(A_f,j), giving var(g)/ESS(g) with an initial-positive-sequence ESS over the chains, combined in quadrature with the A_i bootstrap term.
   - The larger of the two is reported.
4. **Decision effect, fixed now.** Sentence 4 is unchanged if P_min + 2 × s.e. < 0.90 with the new s.e. Otherwise the headline gets the qualifier "P_min is within 2 s.e. of 0.90". Nothing else in the rule changes.
5. **Wording changes in the paper**, as requested by the owner and the checker; no number changes.

### S10 results (written 15:45 UTC; pre-registration saved first as STATUS.md v19, sha256 2bc6e1b2…, copy in prereg/STATUS_S10_preregistered.md)
**1. Lane-1 input switch.** The committed CSV gives the same mass_1, mass_2, a_1, a_2, redshift and source masses as the result JSON, to within text-export rounding (maximum relative difference 5e-13).
- scripts/area_task7_local.py and scripts/area_task4_lvk_compare.py now read the CSV; the earlier versions are archived in scripts/archive/.
- Rerunning area_task4.py (both lanes), area_task7_local.py and area_task4_lvk_compare.py reproduces every stored value in results/area_task4.csv (90 rows), results/area_task7_fc_proxy.csv, results/area_task4_vs_LVK.csv and results/area_task7_local.json exactly at stored precision. **The S6 and S9 numbers are unchanged.** The pre-switch copies are kept as *_fromJSON.*. Logs: logs/area_task8_*_rerun.log.

**2. Fragility** (results/area_task8_checks.csv; scripts/area_task8_checks.py; log logs/area_task8_checks.log; all 40 S9 decision cells):
- **Early 220-only cells (10.5–13 M_f, V0/V1/V2), the ones S9 withdrew:**
  - 37–87% of the failing pairs (A_f ≤ A_i) come from just 5 of the ~5,000 A_i samples.
  - Removing those 5 raises the one-sided σ by 0.14–0.55.
  - At 10.5 M_f V0, lane 1: 87% of the failing pairs come from 5 samples (A_i = 5.591, 5.446, 5.358, 4.968 and 4.886 × 10¹¹ m², far in the upper tail; the median is 2.99), and σ goes from 3.20 to 3.75 when they are dropped. This reproduces the checker's number.
  - These significances therefore rest on a handful of extreme pre-merger samples.
- **220+221 cells:** at most 2.3% of failing pairs come from the top 5, and σ changes by ≤ 0.011.
- **Late 220-only cells (15–20 M_f):** at most 5.6%, and σ changes by ≤ 0.023.
- **The cells that set the headline are therefore not fragile in this sense.**
- **Consequence for the LVK comparison (S6):** at 10.5 M_f with the 220-only fit, the difference between our exact one-sided 3.2σ and LVK's 3.8σ is the same size as the effect of five tail samples, so it is **not a meaningful difference**; we no longer contrast them. The LVK samples were not tested for the same fragility.

**3. Autocorrelation-aware standard error of P** (same files):
- The naive i.i.d. s.e. used in S6/S9 understates the uncertainty by up to a factor of 2.67 (the ratio of the reported s.e. to the i.i.d. s.e.).
- With a 100-draw chain-block bootstrap and an ESS-based estimator (taking the larger), the s.e. is 0.0003–0.0005 for the early 220-only cells, 0.0033–0.0052 for the 220+221 cells and 0.0013–0.0090 for the late 220-only cells.
- **At 20 M_f it is 0.0065–0.0090 across both lanes and variants** (ESS of the per-sample CDF: 786–1,248 out of 8,000 draws).
- Block lengths from 100 to 2,000 draws give 0.0043–0.0093 at 20 M_f (results/area_task8_blocklen.csv).
- The checker reports 0.011 at 20 M_f with its own chain-block estimate, which we could not open. We quote **P = 0.86 ± 0.01 at 20 M_f**, using the checker's larger value rounded.

**4. Decision effect (pre-registered rule):**
- P_min + 2 × s.e.: lane 1, 0.863 + 2 × 0.011 = 0.885; lane 2, 0.847 + 2 × 0.011 = 0.869. Both are below 0.90.
- **Sentence 4 is unchanged, with no qualifier.**

**5. Wording and other checker points:**
- **Independence.** The inspiral posteriors use the 20–131 Hz band of an 8 s segment (2 s after the trigger; run_meta.json of both lanes). The ringdown fit uses 0.2 s after the peak, above 20 Hz, inside that same segment. The two analyses are therefore disjoint in frequency for the signal they model, not in time. The content of the ringdown window below 131 Hz enters both likelihoods, so treating them as independent is an approximation.
- **Inputs taken from LVK.** The sky position (ra, dec), the polarization angle and the reference peak time (geocent_time) from which the ringdown start times are measured come from LVK's NRSur7dq4 maximum-likelihood sample (data/analysis_settings_maxL_sample.txt in Zenodo 16877102; cited), as recorded in every GW250114 config. The M_f unit for start times uses that sample's final mass, 68.41 M_sun.
- **"σ"** in this project is always one-sided, Φ⁻¹(P).
- **A_i** is 6.6% larger than LVK's −40 t_M value (independent-draw medians, S9), from more unequal masses and lower spins. About a quarter of that may come from the mass prior; the rest is unexplained.
- **Prasad 2026** (Prasad2026multisegment, arXiv:2603.05835; RELATED-WORK.md): an independent area analysis of GW250114 that also splits the signal into pre-merger and ringdown segments. It keeps some extrinsic parameters common across segments, models both with NRSur7dq4, and reports a 4.61σ increase when more than four pre-merger cycles are excluded (cited).
- **Citations added to refs.bib:** Hawking1971area, Ashton2019bilby, Speagle2020dynesty and Pratten2021xphm, copied from the paper build's paper.bib (DOIs checked against Crossref in the owner's BIB-CHECK.md).
- **Checker items answered:**
  - "Strong cells sit where single-mode bias is expected": tested and confirmed in S9; those cells are withdrawn.
  - "Both lanes final" and "the 6% excess": S9.
  - "f_c ± 10%": S9 proxy; a real rerun is not done.
- **Checker items still open:**
  - the overtone fit at 8 M_f (S9 ran 10.5–18 M_f; 8 M_f is outside the decision set);
  - the V3 decimation-filter fit;
  - a real f_c ± 10% rerun;
  - the cause of the q and spin difference;
  - the unconverged 220+330 fits;
  - the difference between our s.e. (0.0065–0.0090) and the checker's 0.011 at 20 M_f.
- **Not independently checked by the checker:** the ringdown fits themselves and the f_c derivation. We checked the f_c derivation in S9.

**Paper section updated (S10).** out/PAPER-SECTION-ep5.md, sha256 057afad9743111bbcfb3932de207815b6b8635fa2b70310832aefb5aa1215a36, 1193 words by `wc -w`. Changes:
- a fragility paragraph;
- P = 0.86 ± 0.01 at 20 M_f, with the P_min + 2 s.e. check;
- "one-sided" throughout;
- the exact-σ contrast with LVK removed as not meaningful;
- A_i described as "6.6% larger … about a quarter possibly from the mass prior; the rest unexplained";
- "disjoint in frequency, not in time";
- LVK maximum-likelihood inputs stated;
- Prasad 2026 cited;
- Hawking/bilby/dynesty/XPHM cited by key;
- no "lane still running".
Every decimal number appears verbatim in this file (script check), and all citation keys are in refs.bib (72 entries). The phrase "the analysis agent" no longer appears. Supersedes ab4847b7….

## S11 — Task 9: sensitivity of the decision to the A_i offset (POST HOC, prompted by an independent review of paper draft 6; PRE-REGISTERED 2026-10-14 16:48 UTC, before computing)
**Status: post hoc.** This analysis was not in the S6 or S9 plans. It was requested after a reviewer pointed out that the unexplained 6.6% A_i excess over LVK (S9 (3)) may decide between sentences 3 and 4. Its result is reported as a sensitivity of the decision. **It does not replace the pre-registered S9 headline.**

**Fixed before computing:**
- **Inputs.** The committed pre-merger samples of both lanes (lane 1 CSV, sha256 7a3d4816…; lane 2, sha256 df4748f4…), the S9 ringdown posteriors, the same area formula, and the same 20-cell decision set per lane (S9).
- **Scalings.** Every pre-merger A_i sample is multiplied uniformly by:
  - (a) 1/1.066, which brings A_i to LVK's −40 t_M level (independent-draw ratio, S9);
  - (b) 2.944/2.992, the lane-1 mass-prior reweighting (S9 H4).
  The same factors are applied to lane 2.
- **Reported quantities.** P(ΔA > 0) for every cell, P_min per lane, and the sentence the S6 rule would give. With the S10 s.e. of 0.011 for the 20 M_f cells, a "within 2 s.e. of 0.90" flag is added if |P_min − 0.90| < 0.022.
- **Crossing factor.** For each lane, the factor k at which P_min = 0.90, found by bisection on k ∈ [0.85, 1.0]. P_min increases monotonically as k decreases, because every A_i shrinks.
- **Reviewer's numbers** (lane 1, 20 M_f): (a) 0.917 (V0), 0.922 (V1); (b) 0.879 and 0.880. They will be reproduced or corrected.
- **Files.** results/area_task9_scale.csv; log logs/area_task9_scale.log; script scripts/area_task9_scale.py.

## Open issues (updated in S10)
1. [S2: investigated] The 220-only remnant at 10.5–13 M_f moves by up to ~1 sigma with conditioning choices (high-pass, PSD, low-frequency treatment). No single change reproduces the published scan at every start time. Next: obtain the published 'ringdown' configuration (conditioning, ACF, priors) to compare like with like, or adopt a pre-declared protocol and carry the conditioning spread as a systematic.
2. [S10: the remaining checker items are listed in S10 §5] [S5: largely explained] GW150914 calibration. Isi & Farr's 2023 settings, translated to ringdown 1.1.0, reproduce their published 220+221 posteriors to within 0.3 M_sun at 2048 Hz and 16384 Hz. At 2048 Hz the 6.5 M_sun gap to our run comes from settings: mainly the decimation filter (≈ 3 M_sun; scipy decimate vs FFT cut), then the polarization model (≈ 2–4 M_sun), with smaller contributions from the amplitude prior and ACF. Analysing at 16384 Hz instead of 2048 Hz lowers the mass by a further ≈ 3.5 M_sun in their settings. Still open:
   - which choice is right, to be settled by an injection with a known answer (rule 3);
   - why a filter acting above ~800 Hz moves M_f by 3 M_sun;
   - the valid B1 rerun on the R1 file (about 1 min);
   - our settings at 16384 Hz without decimation.
3. [S9: both lanes done; lane 2 agrees, A_i 3.024 vs 2.992 × 10¹¹ m²; A_i offset traced to q and spin posteriors; f_c = 131.23 Hz confirmed; 220+330 fits unconverged] [S6: done for lane 1] Area-law combination with the owner's 20–131 Hz pre-merger run: the pre-registered rule gives sentence 4 (P_min = 0.863 at 20 M_f). Still open:
   - the second lane's pre-merger run, which plugs into scripts/area_task4.py with a second --premerger;
   - why our A_i is 6% above LVK's −40 t_M value;
   - the GW250114 decimation-filter fit (V3 slot, empty);
   - the 13 → 15 M_f remnant drop, also present in the LVK samples.
4. [S9: explained by single-mode bias; 220+221 removes it] [S6: also in LVK's own 220 posteriors, 70.2 → 64.3 M_sun] The 220-only remnant mass drops by 9.3 M_sun between 13 and 15 M_f (11.8 M_sun between 12 and 15 M_f) in the baseline scan, and by 6.1 M_sun between 13 and 15 M_f without the high-pass. Start-time choice dominates; any area statement must report the full scan and both conditioning variants.
5. Not supported by the package: calibration marginalisation (bound given in S2.1).
6. Two ws submits failed on script bugs on my side (exit 127: an env-var prefix inside /usr/bin/time; exit 2: a text-substitution placeholder that also matched inside "GW250114"). No fits ran in either; both were resubmitted. Records are in logs/ws_job_*_FAILED/.
7. [S5] GW250114 220-only fits all used FFT-cut decimation, the 1.1.0 default. Testing digital_filter = False at 10.5 M_f is a single fit, not yet run.
8. [S7] GW150914 calibration against Isi 2021: reproduced qualitatively. N = 0 matches (−0.04σ); N = 1 with Isi & Farr's 16 kHz configuration is 0.54σ low. The 'before' methods differ (time-domain NRSur7dq4 truncated at the peak vs 20–132 Hz XPHM), and we have no time-domain pre-merger run to test that difference. Neither pre-merger run is bit-reproducible: bilby ignored --seed because dynesty's rstate took precedence.

## Time and compute used
- **Day 1, Part A:** 02:35–02:58 UTC (about 25 min wall, including the figure at about 03:17). About 12 min of that was the Zenodo download (262 MB, 6 files). Analysis compute was 2.2 s on the local Intel Mac (6 cores), plus a few seconds for the figure.
- **Day 1, Part B:** 03:00–03:30 UTC (about 30 min wall), all on ws (c7a.8xlarge, 32 vCPU, no GPU):
  - environment setup: 1 job, about 1 min;
  - GWOSC download: about 4 min locally (331 MB), plus a re-download on ws verified by sha256;
  - fit job 1 (3 fits): 126 s wall, 2,416 CPU-s;
  - fit job 2 (9 fits): 449 s wall, 12,066 CPU-s;
  - total: about 4.0 core-hours of CPU and about 10 min of busy instance time; ws was in use from about 03:00 to 03:24 UTC.
  - Per-fit CPU and wall times: logs/compute_accounting_raw.txt. At the c7a.8xlarge on-demand price (about $1.6/h; estimate, not from a bill), the cost is under $1.
- Peak memory: about 1.5 GB per fit on ws; about 0.9 GB locally.


- **Session 2 (follow-up):** 03:36–04:20 UTC wall (about 45 min, mostly local analysis and writing). ws was in use from about 03:40 to 04:17 UTC (about 37 min; the owner was told it could be shut down at 04:17). ws jobs: e7f0ae82, 6 fits, 715 s wall; 0200c18a, 3 fits, 94 s; fa544ba8, 6 fits, 179 s; plus 2 failed submits (seconds each, no fits). That is 15 fits and **8.1 core-hours** of CPU (per-fit table: logs/compute_accounting_raw_followup.txt). Job e7f0ae82 ran 6 fits at once on 32 vCPU, about 4x oversubscribed: each GW250114 fit took about 11 min and about 3,000 CPU-s, against about 1.4 min and 750 CPU-s when running ≤3 at a time. About 6 core-hours were wasted to contention; in future, run at most 3 fits at once. Estimated cost of session 2 on ws: under $1.5 (on-demand estimate, not a bill). Local: GWTC-2.1 download (134 MB, about 8 min with two resumed connections); all comparison, combination and plotting scripts take under 1 min of CPU in total.

- **Session 5 (Task 3):** from the Task 3 brief (after 05:31 UTC) to 07:21 UTC, mostly local work (source reading, configs, pre-registration, analysis). The R1 16 kHz download took 10.3 min locally. ws job 52094c2c ran 06:48:23–07:16:35 UTC (28.2 min) on the shared box, with at most 2 fits at once and threads capped: 13 fits, 8,836 CPU-s (2.45 core-hours). A rough cost share is under $1 (on-demand estimate, not a bill). The owner stops the box.

- **Session 6 (Task 4):** local only, no ws: from the Task 4 brief to 08:28 UTC. Area combination 12 s and LVK comparison about 10 s of CPU on the Intel Mac; arXiv PDF download (16.5 MB).

- **Session 7 (Task 5):** local only, from the Task 5 brief to 08:51 UTC. Area combination 17 s; Isi 2021 PDF (arXiv) download; no ws.

- **Session 8 (Task 6):** writing only, from the Task 6 brief to 09:14 UTC; local scripts for word count and number checks only.

- **Session 9 (Task 7):** from the Task 7 brief to 15:20 UTC. ws job afb26f81: 15:10:25–15:16:19 UTC, 10 fits, 5,166 CPU-s (1.4 core-hours; under $0.5 on-demand estimate). One failed submit (ws unreachable, nothing ran). Local analysis about 2 min CPU.

- **Session 10 (Task 8):** local only, from the Task 8 brief to 15:45 UTC; checks about 1 min of CPU in total.

## File checksums of outputs
See CHECKSUMS_outputs.tsv (sha256 of every file in out/ at the time of writing).
