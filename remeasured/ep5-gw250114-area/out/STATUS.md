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

## Open issues (updated in S2)
1. [S2: investigated] The 220-only remnant at 10.5–13 M_f moves by up to ~1 sigma with conditioning choices (high-pass, PSD, low-frequency treatment). No single change reproduces the published scan at every start time. Next: obtain the published 'ringdown' configuration (conditioning, ACF, priors) to compare like with like, or adopt a pre-declared protocol and carry the conditioning spread as a systematic.
2. [S4: checked] GW150914 calibration: the 220-only fit is consistent with GWTC-2.1. Reproducing Isi et al. 2019 with 220+221 at the peak still fails at about the 1σ level, and neither 16 kHz input nor a 0.05 s window changes that (S4). Next, one change at a time: ACF from a PSD (PE or BayesWave), the amplitude prior, the polarization model; also compare with the public code of Isi & Farr's 2023 comment (github.com/maxisi/gw150914_rd_comment), cited in arXiv:2310.13869.
3. The area-law test needs the inspiral-only A_i (other lane). The combination script is ready and tested.
4. The 220-only remnant mass drops by 9.3 M_sun between 13 and 15 M_f (11.8 M_sun between 12 and 15 M_f) in the baseline scan, and by 6.1 M_sun between 13 and 15 M_f without the high-pass. Start-time choice dominates; any area statement must report the full scan and both conditioning variants.
5. Not supported by the package: calibration marginalisation (bound given in S2.1).
6. Two ws submits failed on script bugs on my side (exit 127: an env-var prefix inside /usr/bin/time; exit 2: a text-substitution placeholder that also matched inside "GW250114"). No fits ran in either; both were resubmitted. Records are in logs/ws_job_*_FAILED/.

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

## File checksums of outputs
See CHECKSUMS_outputs.tsv (sha256 of every file in out/ at the time of writing).
