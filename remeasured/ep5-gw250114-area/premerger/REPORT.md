# Episode 5, pre-merger lane: progenitor masses, spins and initial horizon area

**Lane question (blind):** using public LIGO strain and only the pre-merger (inspiral) part of the signal, what were the two black holes' masses and spins, and what was their total horizon area A_i = A1 + A2, with the Kerr area A = 8π(GM/c²)²(1 + √(1 − χ²))?
This lane does not compute or quote the remnant or any area comparison; the ringdown lane covers those.
GW150914 is the calibration run and was done before GW250114_082203.

## Departures from the brief (read before the results)
1. **No published inspiral-only component masses exist for GW150914.** The LVK GW150914 tests-of-GR paper (cited: arXiv:1602.03841) ran an inspiral-only analysis below 132 Hz. It shows that analysis only as final mass and spin estimates, which are remnant quantities and so out of scope here. No component-mass table from it is public. Our masses are therefore compared with:
   - (a) the cited GWTC-1 full-signal posteriors (LIGO-P1800370);
   - (b) the cited discovery-paper chirp mass, about 30 M☉ in the detector frame, which was obtained from the inspiral frequency evolution (PRL 116, 061102).
2. **No published f_c for GW250114.** The LVK rule (below) was applied to the cited LVK GW250114 median parameters, giving 131 Hz.
3. **Relative binning was tried but not used.** It gave a 1.3–1.5× speed-up at best and its fiducial optimisation stalled; both events use the full likelihood. Details are under "What failed".
4. **The `--seed` argument had no effect.** bilby logged "Kwargs contain both 'rstate' and 'seed', ignoring 'seed'", so these runs cannot be reproduced bit-for-bit. Re-running reproduces the posteriors only up to sampling noise.

## Data (measured inputs)
- GWOSC open strain, CC BY 4.0, H1 and L1, 4 kHz, 4096 s files. `fetch.sh` downloads them into `data/`, which is git-ignored, and checks them against `SHA256SUMS`.
  - GW150914: `H-H1_GWOSC_4KHZ_R1-1126257415-4096.hdf5`, `L-L1_GWOSC_4KHZ_R1-1126257415-4096.hdf5` (GWTC-1-confident v3)
  - GW250114_082203: `H-H1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5`, `L-L1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5` (O4b 4 kHz R1)
- Cited reference posteriors are used only for the f_c rule and the GW150914 comparison, never as a fit input. `fetch_reference.sh` downloads them and `SHA256SUMS.reference` holds their checksums:
  - GWTC-1 GW150914 PE release (cited: LIGO-P1800370)
  - LVK GW250114 IMRPhenomXPHM release (cited: Zenodo 16877102)

## Inspiral cutoff f_c
- **cited:** GW150914 f_c = 132 Hz. LVK, "Tests of general relativity with GW150914", PRL 116, 221101 (2016), arXiv:1602.03841, sets the frequency at which the inspiral ends at 132 Hz.
- **Rule (cited, from the LVK inspiral-merger-ringdown consistency test):** f_c is the GW frequency of the (2,2) mode at the Kerr innermost stable circular orbit (ISCO) of the remnant. The remnant mass and spin come from NR fits evaluated at the median detector-frame masses and spins of the full-signal analysis.
  - `scripts/fc_rule.py` implements this with LALSuite `nrutils`: final-mass fits UIB2016 + HL2016, final-spin fits UIB2016 + HBR2016 + HL2016.
  - The remnant values are intermediate quantities inside the script and are not written out.
- **Validation:** on the cited GWTC-1 GW150914 medians the script gives 133.7 Hz, against the published 132 Hz.
- **GW250114_082203:** on the cited LVK XPHM medians the script gives 131.2 Hz, so this analysis uses 131 Hz. See `results/fc_rule.json`.

## Method and settings (both events identical except f_c)
- **Software:** bilby 2.8.2, dynesty 3.1.0, LALSuite 7.26.16, gwpy 3.0.14, Python 3.10.12; full pins in `requirements.txt`.
- **Waveform:** IMRPhenomXPHM, f_ref = 20 Hz, generated only up to f_c. It ran without problems, so the IMRPhenomPv2 fallback was not needed.
- **Data conditioning:**
  - 8 s analysis segment ending 2 s after the trigger time.
  - Resampled from 4096 Hz to 1024 Hz with gwpy (Nyquist frequency 512 Hz, well above f_c).
  - PSD: median-Welch estimate from the 256 s just before the segment, 8 s segments with a 0.2 s Tukey roll-off, no overlap.
  - Likelihood band 20 Hz to f_c.
- **Likelihood:** bilby `GravitationalWaveTransient` (full, no relative binning), with distance marginalisation.
- **Priors** (`priors/<event>.prior`, written from `make_priors()`):
  - Detector-frame chirp mass on 10–100 M☉ and mass ratio on 0.125–1, both uniform in component masses
  - Spin magnitudes a₁, a₂ uniform on 0–0.99, isotropic spin directions
  - Luminosity distance uniform in the source frame on 50–3000 Mpc (Planck15)
  - Coalescence time within ±0.1 s of the trigger
  - Sky position, inclination, polarisation and phase: bilby defaults
- **Sampler:** dynesty with acceptance-walk, nlive = 1000, naccept = 60, dlogz = 0.1, using a multiprocessing pool on all 8 cores (Intel Xeon Platinum 8559C, 31 GiB RAM). Thread counts were set to OMP/MKL/OPENBLAS = 1.
- **Source frame:** masses are divided by (1 + z), with z from the sampled luminosity distance in Planck15.
- **Kerr areas:** computed per posterior sample in km², with G = 6.67430×10⁻¹¹, c = 299 792 458 m/s and M☉ = 1.988409870698051×10³⁰ kg. Here χᵢ = aᵢ is the dimensionless spin magnitude.
  - `area_*_km2` columns use source-frame masses.
  - `area_*_det_km2` columns use detector-frame (redshifted) masses, so they are (1 + z)² larger. They were added before the comparison with lane 1.
- **To reproduce:** run `./fetch.sh`, then `scripts/launch.sh <EVENT> <f_c> --likelihood full --nlive 1000 --npool 8`, then `python scripts/postprocess.py --run <EVENT>=out/<label>/<label>_result.json`.

## Runs

| event | f_c [Hz] | wall time | cores (CPU used) | likelihood calls | posterior samples | ln BF (signal vs noise) |
|---|---|---|---|---|---|---|
| GW150914 | 132 | 4 h 58 min 56 s | 8 (563% average) | 25.5 M | 5142 | 142.3 |
| GW250114_082203 | 131 | 6 h 31 min 12 s | 8 (569% average) | 33.5 M | 5046 | 877.9 |

For about 40 min at its start, the GW150914 run shared the machine with the likelihood benchmarks, so its wall time is a slight overestimate.

## Results (source frame; median with 5th–95th percentile range, measured)
The full table, including detector-frame masses, chirp mass, mass ratio, χ_eff and distance, is in `premerger_posterior_quantiles.csv`.

| event | m₁ [M☉] | m₂ [M☉] | χ₁ | χ₂ | A₁ [10⁴ km²] | A₂ [10⁴ km²] | **A_i = A₁ + A₂ [10⁴ km²]** |
|---|---|---|---|---|---|---|---|
| GW150914 | 40.7 (+15.0/−7.0) | 28.2 (+6.1/−9.0) | 0.39 (+0.50/−0.35) | 0.40 (+0.51/−0.35) | 16.8 (+15.1/−5.5) | 8.0 (+4.2/−4.3) | **25.4 (+10.9/−4.9)** |
| GW250114_082203 | 39.1 (+9.0/−5.5) | 27.4 (+4.8/−5.5) | 0.16 (+0.37/−0.14) | 0.28 (+0.50/−0.25) | 16.5 (+8.1/−4.5) | 7.9 (+3.2/−3.0) | **24.8 (+5.5/−3.3)** |

GW250114_082203 (pre-merger, 20–131 Hz), further measured values: detector-frame chirp mass 31.4 (+1.9/−1.6) M☉, source-frame chirp mass 28.3 (+1.6/−1.3) M☉, mass ratio 0.70 (+0.25/−0.24), χ_eff 0.03 (+0.15/−0.13), redshift 0.109 (+0.018/−0.030). Detector-frame initial area (redshifted masses): A_i,det = 30.2 (+7.1/−4.1) ×10⁴ km² for GW250114_082203 and 31.1 (+13.7/−6.4) ×10⁴ km² for GW150914.

The spin magnitudes are only weakly constrained by the inspiral alone: the posteriors are broad and lean towards low values. A_i is much less sensitive to spin than to mass, because the spin factor 1 + √(1 − χ²) only ranges from 1 to 2.

## Freeze (GW250114_082203 posterior, recorded before opening lane 1)
This section and the results above were committed and pushed before anything under `premerger-box/` or `out/` on `road-remeasured` was opened.
- `samples/GW250114_082203_premerger_posterior.csv.gz` (committed, 5046 samples): sha256 `df4748f41a5099b807c5edfec5006f5d2dca1d2fc2dbb3965040d689cd370569`
- `out/GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000/GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000_result.json` (bilby result, not committed, 25 MB): sha256 `1ceb91cfec18c2a3d57bc1ac50d8008b33cb3001355e019961e044d6ce15cab5`
- `samples/GW150914_premerger_posterior.csv.gz` (committed, 5142 samples): sha256 `93666cccc7d31d6956ce906e17920f2fd30f98ffc60bca071bc0e48fdd1e7dac`
- Run: converged at dlogz < 0.1 after 6 h 31 min on 8 cores, exit status 0; ln Z = −1392.30, ln BF = 877.92 (`results/GW250114_082203_run_meta.json`).

## Comparison with lane 1 (after freeze)
Written after the freeze commit 497bcd8 was pushed. Lane 1 is the build-box run of the same config (`premerger-box/`, npool 32, 2 h 10 min, 4772 samples).
- **Files opened:**
  - everything in `premerger-box/`;
  - the `premerger/lane1_XPHM_fmax131` block of `out/results/area_task4.json`;
  - lines 229–230 of `out/STATUS.md`, which identify that block as the `premerger-box` result (sha256 b45ccfdf…3151).
- No remnant or area-change number from `out/` is used or quoted here.
- **Not available:** the lane-1 `_result.json` is not committed; only its checksum is. The committed lane-1 numbers are medians of mass_1, mass_2, a_1, a_2 and the 5/50/95% quantiles of A_i. So lane-1 90% intervals for the masses and spins, and any lane-1 redshift value, cannot be given here. With the result JSON (sha256 b45ccfdf…) the table can be completed in a few minutes.
- **Lane-1 areas:** computed by lane 1 with the same Kerr formula and constants, and converted here from m² to km². I did not recompute them, because the lane-1 samples are not committed.

| quantity (detector frame unless stated) | this lane (8 cores), median [5%, 95%] | lane 1 (`premerger-box`, 32 cores) |
|---|---|---|
| mass_1 [M☉] | 43.22 [37.09, 53.56] | 42.78 (median only) |
| mass_2 [M☉] | 30.33 [24.42, 35.62] | 30.45 (median only) |
| a_1 | 0.160 [0.018, 0.526] | 0.207 (median only) |
| a_2 | 0.280 [0.034, 0.782] | 0.268 (median only) |
| redshift | 0.109 [0.079, 0.127] | not committed |
| **A_i, detector frame [10⁴ km²]** | **30.24 [26.15, 37.30]** | **29.92 [25.40, 36.80]** |
| A_i, source frame [10⁴ km²] (for information) | 24.76 [21.47, 30.25] | 24.55 [20.87, 29.83] |
| posterior samples | 5046 | 4772 |
| ln Z | −1392.30 ± 0.15 | −1392.10 ± 0.18 |
| ln BF (signal vs noise) | 877.92 | 878.12 |
| likelihood calls | 33.5 M | 33.8 M |

- **Detector-frame A_i agrees.** The medians differ by 0.32×10⁴ km² (1.1%), about 3% of either 90% width (11.2 and 11.4 ×10⁴ km²). The 5% and 95% bounds differ by 0.5–0.8 ×10⁴ km².
- **Masses agree.** The lane-1 medians of mass_1 and mass_2 lie within 0.5 M☉ of ours, well inside our 90% intervals.
- **Spins agree within sampling noise.** a_1 differs by 0.05 at the median, against a 90% width of 0.51; a_2 differs by 0.01.
- **ln Z agrees.** The two values differ by 0.2, about 0.9 combined standard errors.
- The two runs used different random streams: `--seed` is ignored, and the pool sizes differ. They agree to within the scatter expected between independent dynesty runs at nlive 1000.

## GW150914 calibration: comparison with published masses (cited)

| quantity | this lane (pre-merger, 20–132 Hz) | cited: GWTC-1 full signal (P1800370) |
|---|---|---|
| m₁ source [M☉] | 40.7 (+15.0/−7.0) | 35.6 (+4.7/−3.1) |
| m₂ source [M☉] | 28.2 (+6.1/−9.0) | 30.6 (+3.0/−4.4) |
| chirp mass, source [M☉] | 29.0 (+3.5/−2.5) | 28.6 (+1.7/−1.5) |
| chirp mass, detector [M☉] | 32.0 (+4.3/−2.9) | 31.2 (+1.7/−1.6); cited discovery paper about 30 |

- Each cited GWTC-1 median falls inside our 90% interval.
- Our intervals are about 2–3 times wider. That is expected, since we drop the merger and ringdown, which carry most of the information on total mass for a system this heavy.
- Our m₁ is shifted upwards and m₂ downwards because the inspiral alone constrains the mass ratio poorly (q = 0.70, +0.26/−0.35).
- The chirp mass agrees to within 0.5 M☉ in the source frame. By this check the calibration passes.

## What a collaboration-grade run would change
- Marginalise over detector calibration (spline amplitude and phase), and use a BayesWave on-source PSD in place of the off-source Welch median.
- Use more live points (nlive ≥ 2000) and naccept ≥ 100, combine several independent runs, and check that they agree.
- Analyse at 4096 Hz with a longer segment and, where the data allow, f_min below 20 Hz.
- Cover waveform systematics: SEOBNRv5PHM and NRSur7dq4, combined as in LVK practice.
- Use the cited LVK prior conventions, with population-informed or reweighted priors where relevant.
- Check glitches and data quality around both events (gating if needed), and run the PSD-variation tests.
- For f_c, use the full rule distribution (LVK takes the median-parameter value) and test how sensitive the result is to ±10% changes in f_c.

## What failed or was dropped
- **Relative binning:**
  - The initial benchmark started the fiducial optimisation from a random prior draw (lnL ≈ −26) and had not converged after 9 min (`logs/GW150914_relbin_benchmark_aborted.log`).
  - Seeded with the maximum-likelihood point from the running checkpoint (lnL 67.2), a call took 3.25 ms, against 4.1–5.1 ms for the full likelihood (`logs/GW150914_relbin_benchmark.log`).
  - That 1.3–1.5× gain did not justify a second likelihood path. Over 20–132 Hz with 8 s of data there are only about 900 frequency bins, so the full likelihood is already cheap.
- **Seed:** `--seed` was ignored by bilby/dynesty (see above).
- **Lost launch:** the GW150914 run's initial launch was lost because the launching shell was killed. The run was relaunched under `nohup` through `scripts/launch.sh`. No results were affected.

## Files
- `fetch.sh`, `SHA256SUMS`, `fetch_reference.sh`, `SHA256SUMS.reference`: data fetch and checksums.
- `scripts/`:
  - `run_premerger.py`: bilby run
  - `launch.sh`
  - `fc_rule.py`: f_c rule
  - `published_gw150914.py`: cited GWTC-1 quantiles
  - `postprocess.py`: areas, quantiles, corner plots, downsampled samples
  - `write_priors.py`
  - `fiducial_from_checkpoint.py`: relbin benchmark only
- `priors/`: prior files.
- `results/`: `fc_rule.json`, `gw150914_gwtc1_cited_quantiles.csv` (cited), `<event>_run_meta.json`.
- `premerger_posterior_quantiles.csv`: measured quantiles for both events.
- `samples/<event>_premerger_posterior.csv.gz`: every posterior sample. Each file is under 20 MB, so nothing was thinned.
- `figures/<event>_premerger_corner.{png,pdf}` and `figures/<event>_premerger_corner_extrinsic.png`.
- `logs/<event>_run.log` (sampler output plus `/usr/bin/time -v`), `logs/<event>_bilby.log`, relbin benchmark logs.
- Code commit: the commit of this file on branch `remeasured-ep5-premerger`.

## Memory notes (for agent-memory-showtime; the owner adds them)
- **ep5 pre-merger lane:**
  - f_c for GW150914 is 132 Hz (cited: arXiv:1602.03841).
  - f_c for GW250114 is 131 Hz from the LVK rule: the Kerr-ISCO (2,2) frequency of the NR-fit remnant at the median full-signal parameters.
  - The rule implementation was validated on GW150914: 133.7 Hz against the published 132 Hz.
- LVK never tabulated inspiral-only component masses for GW150914. Compare against GWTC-1 full-signal masses plus the discovery-paper chirp mass of about 30 M☉ (detector frame).
- At 20–132 Hz with 8 s of data at 1024 Hz there are about 900 frequency bins. Relative binning gives only 1.3–1.5× there, and its fiducial optimiser stalls when started from a random prior draw.
- Timing with bilby 2.8.2, dynesty 3.1.0, XPHM, nlive 1000 on 8 cores:
  - GW150914, inspiral only: 5.0 h, 25.5 M likelihood calls.
  - GW250114: 6.5 h, 33.5 M likelihood calls (louder signal, so a tighter posterior and more iterations).
- bilby 2.8.2 ignores `seed` when it also gets `rstate`. For reproducible dynesty runs, pass a seeded `rstate` (numpy Generator) explicitly.
- On the Devin box, never `pkill -f` a pattern that also appears in the exec shell's own command line; it kills the shell. Kill by PID.

## Note on commit hashes (added 14 Oct 2026, after the PR)
The branch's commits were re-authored to the project's single author before merging (same contents, same author dates; tool attribution lines removed), so their hashes changed: acf0fc0 → d740d69, 60d6b8d → 13f4010, 497bcd8 (freeze) → dae20b1, 1005436 (comparison) → bd978df. The freeze commit's author date is 2026-10-14 14:47:20 UTC and the comparison's 14:48:44 UTC (84 s later); the original push order is visible in pull request #29's history. The posterior checksums above are unchanged and are the primary freeze evidence.
