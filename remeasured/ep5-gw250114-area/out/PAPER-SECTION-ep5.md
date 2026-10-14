# Episode 5 — Did the total horizon area of GW250114 grow?

## Question

Hawking's area theorem (Hawking1971area) requires the remnant horizon area A_f of a binary merger to be at least the sum A_i of the initial areas. For GW250114, the LIGO–Virgo–KAGRA analysis reports A_f > A_i at 4.4σ (LVK2025GW250114area). We asked whether this holds with our own ringdown fits and the exact one-sided tail probability P(ΔA > 0) instead of a Gaussian approximation.

## What was done

Each horizon area is A = 8π(GM/c²)²(1 + √(1 − χ²)), evaluated in the detector frame on both sides [S6 pre-registration].

- **Before.** Two independent inspiral-only posteriors, both IMRPhenomXPHM (Pratten2021xphm) at 20–131 Hz, sampled with bilby (Ashton2019bilby) and dynesty (Speagle2020dynesty): 4,772 samples (lane 1) and 5,046 samples (lane 2) [S6 pre-registration], [S9 pre-registration]. The cutoff follows the LVK remnant-ISCO rule (131.23 Hz from the LVK medians; 133.7 Hz against the published 132 Hz on GW150914) [S9 results].
- **After.** Our own ringdown fits with the `ringdown` package (IsiFarr2021ringdown), 8,000 samples each [S6 pre-registration].
  - 220-only fits start 8–20 M_f after the peak; 220+221 fits start 10.5–18 M_f [S9 pre-registration].
  - The sky position, polarization angle and the reference peak time come from LVK's maximum-likelihood sample [S10 results].
- **Independence.** The inspiral analysis uses the 20–131 Hz band of an 8 s segment, and the ringdown fit uses 0.2 s after the peak within that same segment. They are disjoint in frequency, not in time; treating them as independent is an approximation [S10 results].
- **Pre-registration.** The decision set, the headline statistic (the minimum P over that set, P_min), four candidate sentences and every later addition were fixed before computing [S6 pre-registration], [S9 pre-registration].

## A single-mode bias, found and removed

Our 220-only remnant mass dropped by 9.3 M_sun between the 13 and 15 M_f starts [Open issue 4], as do LVK's own 220 posteriors [S6 LVK comparison]. Kastha et al. found that a single damped sinusoid near merger "overestimates the final mass" (Kastha2022systematics), so we pre-registered a test with the 221 overtone [S9 pre-registration].

- At 10.5, 12 and 13 M_f the overtone lowers M_f by 12.0, 13.9 and 12.7 M_sun.
- At 15 and 18 M_f the two agree within 0.3 M_sun.
- The drop disappears, so the early 220-only probabilities (0.998–0.999) are withdrawn as a single-mode artefact [S9 results].
- A 220+330 variant did not converge (R-hat 1.49–1.72) and is not interpreted [S9 results].

## Result

The lanes give A_i medians of 2.992 and 3.024 × 10¹¹ m², far closer than the 1σ width (0.308 × 10¹¹ m²), so by the pre-registered rule lane 1 carries the headline [S9 results]. P_min is 0.863 for lane 1 and 0.847 for lane 2, which selects sentence 4 [S9 results]:

> Whether the total horizon area of GW250114 grew depends on analysis choices: combining an inspiral-only (20–131 Hz) posterior with our own ringdown fits, P(ΔA > 0) is 0.89–0.96 for fits that include the 221 overtone and start 10.5–13 M_f after the peak, 0.91–0.98 at 15–18 M_f, and 0.86 at 20 M_f, so with our ringdown fits we cannot claim it.

- **Uncertainty on P.** Allowing for autocorrelation in the ringdown chains, P = 0.86 ± 0.01 at 20 M_f; P_min + 2 s.e. = 0.885 stays below 0.90 [S10 results].
- **Cutoff.** A ±10% cutoff change (proxy, not a rerun) moves P_min to 0.806 and 0.854 [S9 results].
- **Direction.** Every cell favours growth (P ≥ 0.846 in all 40 cells, both lanes) [S9 results].

## How fragile the significance is

In the early 220-only cells, 37–87% of failing pairs (A_f ≤ A_i) come from 5 extreme pre-merger samples; removing them raises the one-sided σ by 0.14–0.55 (3.20 to 3.75 at 10.5 M_f) [S10 results]. In the overtone and late cells that set the headline, the top five supply at most 5.6% of failing pairs (σ moves ≤ 0.023) [S10 results].

## Comparison with LVK

LVK truncate the inspiral at −40 t_M, fit 220 at 10.5 M_f and quote a Gaussian significance; the release files give 4.447σ, matching their 4.4σ [S6 LVK comparison].

- **At their reference point both analyses find about +73% growth** [S6 LVK comparison].
- **On the Gaussian statistic the two agree:** 4.6σ (ours), 4.4σ (theirs) [S6 LVK comparison]. The exact one-sided tail is lower for both, but at this cell it rests on a few tail samples, so the difference between our exact value and theirs is not meaningful [S10 results].
- **Our A_i is 6.6% larger**, from more unequal masses (q 0.713 against 0.879) and lower spins. About a quarter of the gap may come from the mass prior; the rest is unexplained [S9 results], [S10 results].
- **The offset bears on the decision (post hoc).** At LVK's A_i level P_min would be 0.917 (sentence 3); removing only the prior's quarter gives 0.879 (sentence 4); the crossing is at a 4.0% lower A_i. The choice between the two sentences lies inside the unexplained part of the offset [S11 results].
- **Their reference fit** (220-only at 10.5 M_f, M_f 72.4) lies above the IMR remnant; whether it shares the bias is untested [S9 results].
- **Prasad 2026** (Prasad2026multisegment) also splits the signal, models both segments with NRSur7dq4, and reports a 4.61σ increase when more than four pre-merger cycles are excluded [S10 results].

## Calibration on GW150914

Isi et al. report P = 97% with the overtone (N = 1) and 95% without (N = 0) (Isi2021area) [S7 comparison]. With an independent 20–132 Hz "before" posterior [S7 pre-registration] we obtain:

- N = 0: P = 0.946, against 95% (−0.04σ) [S7 table];
- N = 1: P = 0.911, against 97% (−0.54σ), using the authors' configuration (IsiFarr2023comment) [S7 table].

By the pre-registered rule this "reproduces qualitatively", fixing the method's accuracy to about ±0.3σ in P, but only for one event, with a different "before" method (time-domain NRSur7dq4), and with analysis settings alone moving P by about 0.7σ [S7 comparison].

## Open issues

1. **The decimation-filter fit for GW250114 is missing.** On GW150914 the downsampling filter moved M_f by 3.2 M_sun [S5 results].
2. **The overtone fit at 8 M_f was not run**; the 220+330 fits did not converge [S10 results].
3. **The q and spin difference from LVK's −40 t_M posterior is unexplained**; testing it needs new parameter-estimation runs [S9 results].
4. **A real f_c ± 10% rerun** would cost about 4.3 h of compute for two cutoffs in one lane [S9 results].
5. **Our standard error at 20 M_f (0.0065–0.0090) is below the checker's 0.011** [S10 results].

## What this does not show

This is not evidence against the area theorem: every combination favours an increase [S9 results]. Nor is it a high-significance detection: with the overtone no cell exceeds 0.96, and no retained 220-only cell exceeds 0.982 [S9 results]. It does not show that the LVK result is wrong; at their reference point the fractional growth agrees [S6 LVK comparison]. Choosing the correct start time or conditioning needs injections, not run here. The closest earlier work is Cabero2018area, Isi2021area, Kastha2022systematics and Prasad2026multisegment. We could not find a published analysis that reports P(ΔA > 0) against ringdown start time, with and without the overtone, for GW250114.
