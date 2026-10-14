# Related work for the *remeasured* series

Literature pass of 2026-10-14. Sources: the arXiv API, OpenAlex, CrossRef and publisher landing pages; full texts were opened where they were accessible. Every citation below is in [refs.bib](refs.bib) with its DOI or arXiv id, and the `x-verification` field there says what was actually read. Entries marked † were verified only as a CrossRef or publisher record because the full text is paywalled, so they are cited only for what their title and record establish. The entry marked ‡ (KeplerBench) has no DOI or arXiv id; it is included at the project owner's request, with content relayed from a PDF they obtained. The Literature Graph connector was not attached to this session, so the same underlying sources were queried directly.

For each episode, the most similar earlier work comes first; then what this series does differently, then a one-sentence statement on novelty.

## Historical episodes

### 1. Kepler's Mars orbit from Tycho's observing logs

The most similar earlier work is KeplerBench ([anonymous 2026](https://openreview.net/forum?id=RdErwlc7jJ)‡), an anonymous NeurIPS 2026 submission under review. Its pilot fits a six-parameter Mars ellipse, with Earth's orbit supplied from modern values, to Tycho's Mars declinations as transcribed by W. Pafko (2000) from Dreyer's *Opera Omnia*. The data are 354 nightly epochs from 1582–1600: 268 before 1594 are used for training and 86 are held out. The median absolute residual is 2.66′ in sample and 13.31′ on the held-out epochs, against a noise floor of about 2′ for Tycho. ‡ We did not open this source ourselves; the details are from the PDF obtained by the project owner, and the OpenReview page is behind a browser check.

Next comes Carman's ongoing reconstruction, from the manuscripts, of how Tycho, Longomontanus and Kepler actually computed with Tycho's Mars observations.
- **Kepler at Benatky:** Carman reconstructs Kepler's first months there (February–June 1600), when Kepler first had unrestricted access to Tycho's Mars observations ([Carman 2025a](https://doi.org/10.1007/s00407-024-00344-2)).
- **Tycho's table of Mars mean oppositions:** Carman analyses the table and compares it with the entries in Tycho's observing logs ([Carman 2025b](https://doi.org/10.1016/j.hm.2025.09.006)†). A web-search excerpt of the article body, not its abstract, lists for one of the cases examined that the table values match the logs and that there is no evidence of tampering. We have not read the article itself, so its overall conclusion is not stated here.
- **Related reconstructions:** Kepler's 1604–1605 ephemerides ([Carman 2025c](https://doi.org/10.1007/s00407-025-00354-8)†), the Tychonic eccentricity-ratio method ([Carman 2021](https://doi.org/10.1177/00218286211014311)), and Tycho's 1593 Mars latitude theory ([Carman & Recio 2022](https://doi.org/10.1177/00218286221099993)).

These are historical reconstructions of the computations of the time, not modern statistical fits of Mars's orbit to the full set of log entries.

**Earlier quantitative checks.** The Kepler symposium volume of *Vistas in Astronomy* includes a computer re-examination of how Kepler treated redundant observations ([Gingerich 1975](https://doi.org/10.1016/0083-6656%2875%2990165-8)†) and a study of perturbation effects in the Mars observations Kepler used ([Schmeidler 1975](https://doi.org/10.1016/0083-6656%2875%2990142-7)†). Two classic studies show that the figures printed in *Astronomia nova* are Kepler's own constructions, not raw data: [Wilson 1968](https://doi.org/10.1086/350331)† on his derivation of the ellipse, and [Donahue 1988](https://doi.org/10.1177/002182868801900401)† on his "fabricated figures". That matters for any reanalysis which starts from Kepler's tables.

**Error budget for reducing the logs.** [Wesley 1978](https://doi.org/10.1177/002182867800900102)† assesses the accuracy of Tycho's instruments. [Verbunt & van Gent 2010](https://doi.org/10.1051/0004-6361/201014002) supply machine-readable versions of Tycho's star catalogue, with longitude and latitude errors of about 2′ against Hipparcos; this is the reference-star frame a reduction of the logs would use.

**The other machine-learning reanalyses start downstream of Tycho's logs.**
- [Li, Ji & Zhang 2021](https://arxiv.org/abs/2111.12210) fit 28 heliocentric Mars longitudes and distances that Kepler had already computed, taken from the Donahue translation of *Astronomia nova*. This confirms the point that they used Kepler's reduced table, not Tycho's logs.
- [Khoo et al. 2023a](https://doi.org/10.1007/978-3-031-39821-6_41) use the 180 heliocentric positions in Kepler's Rudolphine Tables.
- [Khoo et al. 2023b](https://doi.org/10.1007/978-3-031-48316-5_21) use sightings generated from the JPL Horizons ephemeris.
- [Krisciunas 2016](https://arxiv.org/abs/1610.05750) is the only empirical redo found from raw angular measurements. They are his own cross-staff observations of Mars, not Tycho's, and give an eccentricity of 0.093 ± 0.012.

**What is different here.** This episode reduces Tycho's raw instrument readings as printed in Dreyer's *Opera Omnia* (vols. X–XIII) to ecliptic longitude and latitude, with per-session errors, in a modern reference frame. It then fits Mars's orbit and Earth's orbit jointly from the same data, with stated uncertainties under a blind protocol, and only afterwards compares with Kepler. KeplerBench, by contrast, fits declinations from a transcription with Earth's orbit supplied. Dreyer and Pafko's transcription have no DOI and are therefore not in refs.bib.

**Novelty.** An ellipse has already been fitted to a transcription of Tycho's Mars record, using declinations only (KeplerBench, under review). We could not find a reduction of the raw instrument readings to longitude and latitude with per-session errors, nor a joint fit of Earth's orbit from the same data. The other close work consists of Carman's manuscript-based reconstructions of Tycho's and Kepler's own computations, and ML studies that start from Kepler's already-reduced tables.

### 2. Newton's Moon test and the Jupiter-satellite exponent

**The Moon test.** The closest prior work on the accuracy of the Moon test as printed in the *Principia* is [Aoki 1992](https://doi.org/10.1007/BF00374744)†, whose title states its subject as the accuracy of the inverse-square law implied by the test. Aoki later published corrections ([Aoki 1996](https://doi.org/10.1007/BF00374705)†). I could not open either full text, so their method and numbers are not described here.

Other work on Newton's numbers:
- [Westfall 1973](https://doi.org/10.1126/science.179.4075.751)† is the classic argument that Newton adjusted his numbers, the Moon test among them.
- [Garisto 1991](https://doi.org/10.1119/1.16704) traces an error in Newton's mass of the Earth in Book III and resolves several smaller inconsistencies.
- [Cohen 1998](https://doi.org/10.1007/s004070050022)† treats Newton's masses and densities of the Sun, Jupiter, Saturn and the Earth.
- [Nauenberg 2015](https://arxiv.org/abs/1503.06861) recomputes Newton's unpublished early Moon test. With about 61 miles per degree and 5000 ft per mile it gives a ratio of 4320 instead of ≈3600; with Picard's 69.2 miles per degree it gives 3606.

**The Jupiter exponent.** The closest quantitative work fits Galileo's *Sidereus Nuncius* satellite observations rather than Newton's table ([Longhin 2025](https://arxiv.org/abs/2503.12543)). It recovers semi-major axes to 2–4% and periods to 0.1–0.3%, and infers Kepler's third law for the Jovian system.

**What is different here.** The inputs are only the numbers Newton printed in Book III (Phenomenon 1 table; Proposition 4). The precision implied by Newton's own digits is propagated into a fitted period–distance exponent and a Moon-test ratio, each with an uncertainty.

**Novelty.** We could not find a published fit, with uncertainties, of the period–distance exponent to the *Principia*'s own Jupiter-satellite table. For the Moon test the closest work is Aoki (1992), which we have not been able to read in full.

### 3. Mercury's anomalous perihelion advance from Newcomb's transit contacts

**The closest prior work is close.** [Morrison & Ward 1975](https://doi.org/10.1093/mnras/173.1.183) compared about 2400 observed internal-contact times of Mercury transits from 1677 to 1973 with ephemeris times from the gravitational theories of Mercury and the Earth. They adopted ΔT from lunar observations and solved for corrections to Mercury's orbital elements plus a quadratic term. They report a lunar tidal acceleration of −26 ± 2″ cy⁻² and an excess of the observed over the Newtonian perihelion motion of +41.9 ± 0.5″ per century. (Their abstract prints the unit as cy⁻², which must be a typo for per century.)

**Other re-derivations from historical data.**
- [Constantin 2011](https://arxiv.org/abs/1104.0548) re-solved Le Verrier's meridian observations by least squares, fitting the eccentricity correction he had neglected, and obtained 42.8″/cy against Le Verrier's 38.3″/cy.
- [Duncombe 1956](https://doi.org/10.1086/107423) re-examined the inner planets with a revised mass system and quotes an observed-minus-theory value of 43.11 ± 0.45″/cy for Mercury, against 43.03 from relativity.
- [Clemence 1947](https://doi.org/10.1103/revmodphys.19.361)† is the standard mid-century summary of the relativity effect in planetary motions.
- [Wolf, Sanchioni & Read 2024](https://doi.org/10.1007/s13194-024-00617-1) discuss from a philosophy-of-science angle what the classic perihelion test does and does not confirm.

Newcomb's 1882 *Discussion and results of observations on transits of Mercury from 1677 to 1881* has no DOI and is not in refs.bib; it will be cited from its printed edition.

**What is different here.** Only Newcomb's 1882 contact compilation is used, refit with a modern numerically integrated N-body model. The ΔT and solar-radius treatment is stated explicitly, and the uncertainty comes out of the fit rather than being adopted.

**Novelty.** We could not find a refit of Newcomb's 1882 contact compilation with a modern numerically integrated ephemeris. The closest is Morrison & Ward (1975), who fitted a larger 1677–1973 set of contact timings with the analytical theories of their day and reported 41.9 ± 0.5″ per century. Our result should be read as an independent check against theirs.

### 4. Comparison with general relativity's 42.98″/cy

The GR coefficient comes from [Will 2014](https://doi.org/10.12942/lrr-2014-4), Sec. 4.2, Eq. (67):

  ω̇ = 42.98″/cy × [(2 + 2γ − β)/3 + 3×10⁻⁴ (J₂/10⁻⁷)]

(read in the full text). [Nobili & Will 1986](https://doi.org/10.1038/320039a0)† is the paper usually cited for the "real value" of the advance.

**Modern determinations far exceed what historical data can reach.**
- Radar ranging: [Shapiro et al. 1972](https://doi.org/10.1103/physrevlett.28.1594).
- Planetary ephemerides constraining the PPN parameters: [Pitjeva & Pitjev 2013](https://doi.org/10.1093/mnras/stt695); [Fienga & Minazzoli 2024](https://doi.org/10.1007/s41114-023-00047-0).
- MESSENGER ranging: [Park et al. 2017](https://doi.org/10.3847/1538-3881/aa5be2) give a total precession rate of 575.3100 ± 0.0015″/cy and J₂ = (2.25 ± 0.09) × 10⁻⁷.
- [Will 2018](https://doi.org/10.1103/physrevlett.120.191101) identifies an additional post-Newtonian cross-term contribution, 100 times larger than the 2PN term.

**What is different here.** Nothing about the comparison itself is new. Its purpose is to put a historical-data-only measurement next to the GR prediction with a complete error budget, including the J₂ and planetary-mass terms.

**Novelty.** This step is not new as a test of GR; it is a consistency check for the episode-3 result.

## Gravitational-wave episode

### 5. GW250114 horizon-area increase

**The LVK analyses.** The closest work is the collaboration's own: [LVK 2025a](https://doi.org/10.1103/kw5g-d732) ([arXiv:2509.08054](https://arxiv.org/abs/2509.08054)). Using analyses that exclude up to five of the strongest merger cycles, they find the remnant area larger than the sum of the initial areas to high credibility. The companion paper ([LVK 2025b](https://arxiv.org/abs/2509.08099)) adds a full-signal area bound in its supplement, alongside its spectroscopy results.

**Independent area analyses of GW250114.** Two exist:
- [Prasad 2026](https://arxiv.org/abs/2603.05835) also splits the signal into pre-merger and ringdown segments, but keeps some extrinsic parameters common across them and models both with NRSur7dq4 rather than with a quasinormal-mode ringdown. Excluding more than four pre-merger cycles, it reports a 4.61σ area increase.
- [Chung et al. 2026](https://arxiv.org/abs/2606.06592) infer a Kerr-equivalent area from the near-merger "direct wave". [Kankani & McWilliams 2026](https://arxiv.org/abs/2607.02380) argue that this method only works by coincidence near χ_f ≈ 0.7.

Other independent ringdown analyses of the same data ([Kumar et al. 2026](https://arxiv.org/abs/2610.09503); [Suzuki et al. 2026](https://doi.org/10.1103/6x5z-q9ml)) and a pre-release simulation study ([Akyüz et al. 2025](https://arxiv.org/abs/2507.08789)) do not compute the area change.

**Method lineage on earlier events.**
- [Cabero et al. 2018](https://doi.org/10.1103/PhysRevD.97.124069) defined the separate inspiral and ringdown area test.
- [Isi et al. 2021](https://doi.org/10.1103/PhysRevLett.127.011103) applied it to GW150914 in the time domain: 97% agreement with the theorem including overtones, 95% excluding them.
- [Kastha et al. 2022](https://doi.org/10.1103/PhysRevD.105.064042) showed that a single-mode damped sinusoid overestimates the final mass and inflates the confidence: above 99% with one mode, about 94% with an overtone, about 85–90% with a full merger-ringdown model. This bears directly on our high-M_f 220-only fits (STATUS.md, S2).
- [Correia & Capano 2024](https://doi.org/10.1103/PhysRevD.110.044018) marginalise over sky location and coalescence time, which earlier analyses held fixed.
- [Tang et al. 2026a](https://doi.org/10.1016/j.scib.2025.11.002) repeat the test on GW230814; [Tang et al. 2026b](https://arxiv.org/abs/2608.16563) propose a population-level version.
- [Gerosa et al. 2022](https://doi.org/10.1088/1361-6382/ac8332) recast the posteriors in terms of irreducible mass.
- [Weinstein 2021](https://arxiv.org/abs/2107.10680) questions in what sense such a test "confirms" the theorem.

**The GW150914 overtone debate (context for Task 2).** It turns on the same data-conditioning choices that moved our fits:
- [Isi et al. 2019](https://doi.org/10.1103/PhysRevLett.123.111102) report the overtone; [Cotesta et al. 2022](https://doi.org/10.1103/PhysRevLett.129.111102) dispute it.
- Isi & Farr reply in [2022](https://arxiv.org/abs/2202.02941) and in a [2023](https://doi.org/10.1103/PhysRevLett.131.169001) comment that reports a software bug in the Cotesta et al. analysis.
- [Finch & Moore 2022](https://doi.org/10.1103/PhysRevD.106.043005), [Ma et al. 2023](https://doi.org/10.1103/PhysRevD.107.084010), [Wang et al. 2025](https://doi.org/10.1103/3gqn-297f) and [Correia et al. 2024](https://doi.org/10.1103/physrevd.110.l041501) analyse it with independent methods.
- [Wang & Shao 2023](https://doi.org/10.1103/PhysRevD.108.123018) trace the disagreement to noise estimation combined with sampling rate (2 kHz in Isi et al. versus 16 kHz in Cotesta et al.). They also describe resampling and 20 Hz high-pass steps that bias the PSD if handled incorrectly. This is the most relevant prior for our Isi 2019 check.

**Tools and data.**
- The `ringdown` method paper: [Isi & Farr 2021](https://arxiv.org/abs/2107.05609).
- GWOSC open-data papers: [O1/O2](https://doi.org/10.1016/j.softx.2021.100658); [through O4b](https://arxiv.org/abs/2605.27090).
- Catalogues: [GWTC-1](https://doi.org/10.1103/PhysRevX.9.031040); [GWTC-2.1](https://arxiv.org/abs/2108.01045).
- Zenodo data releases: [GW250114](https://doi.org/10.5281/zenodo.16877102); [GWTC-2.1 PE](https://doi.org/10.5281/zenodo.6513631).
- The GW150914 test-of-GR paper: [LVK 2016](https://doi.org/10.1103/PhysRevLett.116.221101).

**What is different here.** The analysis is blind, run with a public package from public data, and calibrated on GW150914 before touching GW250114. Every number traces to checksummed inputs and logged runs. The spread of the 220-only remnant across conditioning choices and start times is reported in full. A_i will come from a separate inspiral-only lane.

**Novelty.** We could not find an independent re-measurement of the GW250114 area change that reports the conditioning and start-time spread of the ringdown remnant. The closest independent analyses are Prasad (2026) and Chung et al. (2026), and our method closely follows LVK (2025a) and Isi et al. (2021). Our contribution is therefore a transparent replication, not a new test.

## Open points from this pass
- KeplerBench (2026) is cited from the owner's PDF (‡), not opened by us. Its numbers should be re-checked against the published version once the review is over.
- 13 entries (†) are record-only because the full text is paywalled. The most important are Aoki 1992 and 1996 for episode 2, and Gingerich 1975, Schmeidler 1975 and Donahue 1988 for episode 1. These need institutional access or uploaded PDFs before the series can describe their methods.
- Primary sources without DOI or arXiv id (Dreyer's *Opera Omnia*, Newton's *Principia*, Newcomb 1882) need a separate citation style; they are deliberately absent from refs.bib.
