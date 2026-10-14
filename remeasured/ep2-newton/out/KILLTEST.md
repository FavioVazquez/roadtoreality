# Episode 2 kill test: Newton's Moon test and Jupiter's satellites, from the pages Newton used

Run 13 Oct 2026, 21:25–21:55 CST, under PROTOCOL.md. Scripts: `fetch.sh`, `scripts/locate.py` (OCR hit → image), `scripts/crop.py`
(crops for reading), `scripts/moon_test.py`, `scripts/jupiter.py`. Hand transcription: `transcription.json` (the scripts read only this
plus the modern files). Logs: `out/moon_test_log.txt`, `out/jupiter_log.txt`. Machine-readable results: `out/moon_test.json`,
`out/jupiter.json`. Inputs are checksummed in `SHA256SUMS` (52 files, about 42 MB). `fetch.sh` was re-run into a scratch copy, and every file
matched (before the 1726 p. 141 image was added). Python venv: `.venv` (numpy, pillow). Nothing is committed.

## Verdict: PASS

All primary-source numbers were found and read on page images with page and image references, and both computations run (under 0.3 s each).

| Result | Value |
|---|---|
| Moon test, 1687 inputs (60 R, 27 d 7 h 43 m, Picard's 57060 toises), predicted fall of a body at the surface in 1 s | **15.0090 Paris ft** (15 ft 0 in 1.30 lin = 4.8755 m) |
| … against the seconds pendulum, π²L/2 with L = 3 ft 8½ lin (Huygens; Picard; Newton 1726) = 15.0957 ft | **ratio 0.9943 ± 0.025** |
| … against Huygens' own rounded "15 ft and 1 inch" (1673 p. 155; 1687 p. 407) | ratio 0.9951 ± 0.025 |
| Moon test, 1726 inputs (same, plus Newton's solar factor 178 29/40 : 177 29/40) | **15.0935 ft; ratio 0.99985 ± 0.025** (pendulum), 1.0007 (Huygens) |
| Sensitivity: 60½ R in the same formula | ratio 1.0193 |
| Envelope over Newton's own distance range (1687 formula, vs pendulum) | 59 R → 0.945; 60 R → 0.994; 61 R → 1.045 |
| Jupiter, exponent p in T ∝ aᵖ, pooled over the observers Newton tabulates (1726 table, measured values only) | **p = 1.498 ± 0.010** (12 dof) |
| Same, 1687 table | p = 1.498 ± 0.010 (14 dof) |
| Per-observer exponents (1726; 4 points each) | Borelli 1.519 ± 0.025, Townley 1.507 ± 0.033, Cassini (telescope) 1.468 ± 0.006, Cassini (eclipses) 1.499 ± 0.002 |
| Modern, same method (JPL a, Horizons sidereal periods) | p = 1.50025 ± 0.00008 |

The ± on the Moon ratio is 1σ, and 2.50 of the 2.50 % is the Moon's distance (taken as ±0.5 R; see below). The agreement of the 1726 version
to 0.015 % sits inside an envelope a hundred times wider. That the agreement is closer than its uncertainty is the honest statement.

## Part 1. The Moon test

### Page references (every number used)

Image URL: `https://archive.org/download/<id>/page/n<N>.jpg`. Printed page numbers were read on the images. **H** = unambiguous at full
resolution; **M** = readable, but a small fraction glyph at the scan's resolution limit.

| Source (archive.org id) | Printed page | Image n | Read | Conf. |
|---|---|---|---|---|
| Principia 1687, 1st ed. (`philosophiaenat00newt`) | 406 | 403 | Prop. IV: distance 59 (most astronomers), 60 (Vendelinus), 60⅓ (Copernicus, M), 62½ (Kircher), 56½ (Tycho, 61 once refraction is corrected); **assumed 60 R**; **27 d 7 h 43 m** sidereal; **circumference 123 249 600 Paris ft** ("a Gallis mensurantibus nuper definitum"); Moon falls **15 1/12 ft** in 1 min | H |
| same | 407 | 404 | ×60×60; bodies here fall **15 1/12 ft in 1 s** "uti Hugenius … demonstravit"; 30 1/6 ft if two forces; two-body distance **60½ R** (Prop. LX Lib. I) | H |
| Principia 1726, 3rd ed. (`A297190`) | 141 | 182 | Book I, Prop. XLV, Corol. 2: an outside force **357.45** times smaller than the central one (c = 1/357.45) turns the apse 1°31′28″ per revolution; "Apsis lunae est duplo velocior circiter" | H |
| same | 396 | 437 | Prop. III: Sun's action is to the Moon's centripetal force as 2 to 357.45, i.e. 1 to **178 29/40**; Corol.: augment the force in the ratio **177 29/40 to 178 29/40**; basis: apse motion 3°3′ per revolution | H |
| same | 397 | 438 | Prop. IV: 59 (Ptolemy), 60 (Vendelinus, Huygens), 60⅓ (Copernicus), 60⅖ (Street, M), 56½ (Tycho, 60½ corrected); **60 R "in syzygiis"**; 27 d 7 h 43 m; 123 249 600 ft; versed sine **15 ft 1 in 1 4/9 lin**; seconds pendulum at Paris **3 ft 8½ lin** "ut observavit Hugenius"; fall in 1 s **15 ft 1 in 1 7/9 lin** | H |
| same | 413 | 454 | Prop. XIX: Picard **57060 hexapedae** (toises) per degree; circumference 123 249 600 ft, **radius 19 615 800 ft**; fall in 1 s 2173 7/9 lines (2174 in vacuo); latitude of Paris 48°50′10″; sidereal day 23 h 56′ 4″ | H |
| Motte 1729, vol. II (`bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2`) | 216 | 239 | Same numbers in English, but **"the mean distance of 60 diameters in the syzygies"**: a translation slip for semidiameters. Not used. | H |
| same | 217 | 240 | 3 Paris ft 8½ lines; 15 ft 1 in 1 7/9 line; 60½ semidiameters | H |
| Picard, *Mesure de la Terre*, 1671 (`mesure-de-la-terre-par-...-picard-jean-btv-1b-7300361b` = BnF Gallica btv1b7300361b) | 4 | 15 | toise = 6 pieds, pied = 12 pouces, pouce = 12 lignes; seconds pendulum **36 pouces 8½ lignes**, seasonal change "la dixième partie d'une ligne" | H |
| same | 22 | 41 | Art. XI: Malvoisine–Sourdon 1°11′57″ ↔ 68 430 t 3 p → **57 064 t 3 p**/degree; Malvoisine–Amiens 1°22′55″ ↔ 78 850 t → **57 057 t**; "nous ne pouvions répondre de deux secondes … environ 32 Toises sur chaque observation"; adopted **57 060 toises** | H |
| Huygens, *Horologium Oscillatorium*, 1673 (`gpl_3536690`) | 152 | 173 | Paris foot : horary foot = 864 : 881; seconds pendulum = 3 Paris ft **8½ lines** | H |
| same | 155 | 176 | Prop. XXV: π as 355/113; fall in 1 s = 14 ft 9 in 6 lin horary, "proxime pedum **15 & unciae unius**" Paris | H |

Units (cited): the 1799 legal definition 1 m = 443.296 lignes. So 1 ligne = 2.25583 mm, pied du roi = 0.324839 m, toise = 1.949036 m.
"Hexapeda Parisiensis", "Paris foot" and "pied du Roi" are the same units in Latin, English and French. The 1673 "pes horarius" is Huygens'
proposed universal foot (⅓ of the seconds pendulum), converted with his 864:881.

### Computation (`moon_test.py`)

- R = 57060 × 6 × 360 / 2π = 19 615 783 Paris ft (Newton rounds this to 19 615 800), or 6371.98 km. Picard's two arcs recompute to 57 065.0 and 57 057.3 t/deg.
- Moon's fall in one minute = versed sine of the arc it covers in 60 s at 60 R = **15.00900 ft** (the small-angle value is the same to 5 decimals).
  At the surface the force is 60² times larger, and a fall from rest scales as t², so one second is 1/60² of a minute. The two factors cancel exactly for k = 60. That is
  why Newton can compare the Moon's minute directly with the surface's second.
- Observed: π²L/2 with L = 3 ft 8½ lin = **15.09570 ft = 2173.78 lines**. This reproduces Newton's printed 15 ft 1 in 1 7/9 lin, i.e. 2173 7/9.
  Huygens' own route (355/113, horary foot, ×881/864) gives 15.0827 ft = 15 ft 0 in 11.9 lin, which he rounds to 15 ft 1 in.

Uncertainty (1σ, relative, on the predicted fall, which scales as k³R/T²):
- Moon distance: ±0.5 R is "plausible", chosen from the spread of Newton's own list (59 to 61 once Tycho is corrected), and gives ±2.50 %;
- Picard's stated ±2″ per latitude: ±0.066 % (±37 toises);
- the period, rounded to the minute: 0.001 %;
- the observed side: ±0.023 % for the pendulum (Picard's 1/10 ligne), ±0.16 % for Huygens' rounding to the inch.

The distance term dominates every other term by a factor of about 40.

**Findings on Newton's own arithmetic.**
- **1726.** The number Newton calls the versed sine, "15 ft 1 in 1 4/9 lin" (15.09336 ft), is the true versed sine multiplied by his solar factor:
  15.00900 × 1.005627 = 15.0935. It is therefore the Sun-augmented fall, as the "per corol. prop. III" in that sentence implies. The pure versed sine is 15 ft 0 in 1.3 lin.
- **1687.** The printed "15 1/12 ft" for the Moon's minute is **0.49 % larger** than what the 1687 page's own inputs give (15.009 ft). The 1687 text names no
  correction that would close this gap, and none was added. It is reported as found.

### Historical inputs against modern values

Modern values (all cited): Earth's mean radius is 6371.01 km (JPL planetary physical parameters / Horizons 399). Moon: a = 384 400 km, e = 0.0549, sidereal period 27.321582 d (Horizons 301 header).
GM⊕ = 398 600.435, GM☾ = 4902.800 km³/s² (Horizons). WGS84 meridian degree at 49.2° N (Picard's arc runs from about 48.5° to 49.9° N; latitude cited).
g at Paris = WGS84 normal gravity at 48°50′10″ N, 67 m = 9.80945 m/s². This is a model value, and local anomalies of order 10⁻⁴ are possible.

| Input | Historical | Modern | Difference |
|---|---|---|---|
| Degree of meridian (Picard 57060 t) | 111.212 km | 111.214 km at 49.2° N | −0.001 %, i.e. agreement within the ±0.01 % that the arc's uncertain mean latitude allows (±0.5° moves the modern degree by about 0.01 %) |
| Earth radius (Picard sphere) | 6371.98 km | 6371.01 km (mean) | +0.015 % |
| Moon distance in Earth radii | 60 | a/R = 60.336 (time-mean distance 60.43) | −0.56 % |
| Moon distance (60 × Picard R) | 382 319 km | 384 400 km | −0.54 % |
| Sidereal month | 27.321528 d | 27.321582 d | −4.7 s (2 ppm) |
| Seconds pendulum, 3 ft 8½ lin | 0.99369 m | g/π² = 0.99391 m | −0.021 % |
| Fall in 1 s, π²L/2 | 4.90368 m | g/2 = 4.90473 m | −0.021 % |
| Fall in 1 s, Huygens "15 ft 1 in" | 4.89966 m | 4.90473 m | −0.10 % |

**Where the errors cancel.** The product of the factors below times the modern baseline reproduces the 0.9943 exactly.

| Factor | Effect on the ratio |
|---|---|
| k = 60 instead of 60.336 (enters as k³) | −1.66 % (k is taken against the mean radius because Picard's R is a sphere's; against the equatorial radius, a/R = 60.27 and this line becomes about −1.3 %, with the baseline moving the other way and the product unchanged) |
| Picard's R instead of the mean R | +0.015 % |
| The period | 0.000 % |
| Pendulum fall instead of g/2 | +0.021 % |
| **Newton's one-body formula with all-modern inputs** | **+1.07 %** |

The +1.07 % baseline breaks down into physics the 1687 formula leaves out:
- the Moon's own mass: the relative orbit obeys G(M+m), and 1/(1 + m/M) = 0.98785, so −1.2 % on the predicted g;
- the Sun's mean radial pull, 1 + ½(T☾/T⊕)² = 1.00280, which works the other way;
- GM/R² against the actual g at Paris (rotation, flattening, latitude): +0.11 %.

With both orbital terms included, the Moon's orbit gives GM⊕ = 398 634 km³/s², 0.009 % from the modern value.

So in 1687 the low Moon distance (−1.66 %) and the omitted Moon mass (+1.2 %) partly cancel, which leaves −0.57 %. Picard's degree and the
pendulum are good to about 2 × 10⁻⁴ and play almost no part. In 1726 Newton adds a solar factor of 1.00563.
- His first-order solar coefficient is right. Book I Prop. 45 Cor. 2 (1726 p. 141) takes the Sun's force as 1/357.45 of the central force. That is the same
  first-order mean radial term the modern check uses: ½(T☾/T⊕)² = 1/357.45. Recomputed, it turns the apse 91.47′ per revolution; Newton prints 1°31′28″ = 91.47′.
- Newton then writes "apsis lunae est duplo velocior circiter". In Book III Prop. III he infers the force from the observed apse motion of 3°3′,
  so he doubles the coefficient to 2/357.45 = 1/178.7.
- That doubled factor supplies +0.56 % (the modern term is +0.28 %), and it is most of what moves 0.9943 to 0.99985. The doubling is the known
  first-order lunar-apse problem (Clairaut 1749; cited, not re-derived here).

The close 1726 agreement therefore comes from errors of 0.3 to 1.7 % that largely cancel, not from accurate inputs.

## Part 2. Jupiter's satellites

### Page references

| Source | Printed page | Image n | Read | Conf. |
|---|---|---|---|---|
| Principia 1726 | 390 | 431 | Phaenomenon I ("stellis fixis quiescentibus"). Periods **1d 18h 27′ 34″, 3d 13h 13′ 42″, 7d 3h 42′ 36″, 16d 16h 32′ 9″**. Distances in Jupiter semidiameters, satellites 1–4: Borelli 5⅔, 8⅔, 14, 24⅔; Townley (micrometer) 5.52, 8.78, 13.47, 24.72; Cassini (telescope) 5, 8, 13, 23; Cassini (eclipses) 5⅔, 9, **14 23/60, 25 3/10** (M, fraction glyphs; Motte prints the same); "ex temporibus periodicis" 5.667, 9.017, 14.384, 25.299 | H |
| same | 391 | 432 | Pound. Satellite 4: 8′16″ (15 ft tube); satellite 3: 4′42″ (123 ft telescope). Satellites 1 and 2: 2′56″47‴ and 1′51″6‴ **"ex temporibus periodicis"**. Diameter 37¼″ assumed (transits 37⅛″ and 37⅜″, shadow 37″). Hence **5.965, 9.494, 15.141, 26.63** semidiameters | H |
| Motte 1729, vol. II | 206–207 | 229–230 | Periods and table identical to 1726 | H |
| Principia 1687 | 402–403 | 399–400 | Hypoth. V (without the phrase "stellis fixis quiescentibus"). Periods **1d 18h 28⅗′, 3d 13h 17 9/10′, 7d 3h 59⅗′, 16d 18h 5⅕′**. Cassini 5, 8, 13, 23; Borelli 5⅔, 8⅔, 14, 24⅔; Townley **5.51**, 8.78, 13.47, 24.72; Flamsteed (micrometer) 5.31, 8.85, 13.98, 24.23; Flamsteed (eclipses) 5.578, 8.876, 14.159, 24.903; ex temporibus 5.578, 8.878, 14.168, 24.968 | H |

### Fit (`jupiter.py`)

- **Method.** log a is regressed on log T, since the scatter is in the distances and the periods are good to seconds; the slope is then inverted to give p. The naive regression of log T on log a is
  also shown and agrees to within 0.002.
- **Exclusions.** Excluded under the blind rule, because they are products of the law under test:
  - Newton's "ex temporibus periodicis" row (it returns p = 1.5001 with an rms of 3 × 10⁻⁵, as expected for a constructed row);
  - Pound's satellites 1 and 2.

  Pound enters the pooled fit with his two measured values only.
- **Pooled fit.** A common exponent with one scale per observer, because each observer's "semidiameter" differs.

Results, 1726: pooled **1.498 ± 0.010**; the four full rows give 1.519, 1.507, 1.468, 1.499 (mean 1.498, sd 0.022).
1687: pooled **1.498 ± 0.010**; rows 1.470 (Cassini), 1.521 (Borelli), 1.508 (Townley), 1.487 (Flamsteed micrometer), 1.502 (Flamsteed eclipses).

Two caveats:
- Cassini's telescope row is whole numbers. Its small SE (±0.006) understates the rounding error, and its exponent is the outlier.
- The 1687 Flamsteed-eclipse row fits with an rms of 0.03 % and its first value equals the "ex temporibus" 5.578. It may be partly anchored to the law.
  The same applies, less strongly, to Cassini's eclipse row (rms 0.08 %).

### Against modern values

Sources (all cited): JPL SSD planetary satellite mean elements (Laplace plane, epoch 2000-01-01.5, JUP365) for a; Jupiter's 1-bar equatorial radius is 71 492 km (JPL physical parameters).
Sidereal periods were fitted to 4 years of Horizons jup365 Jupiter-centred vectors. JPL's tabulated "P" for Io is 1.762732 d, which does not match the sidereal rate (1.769138 d), so the vectors are used.
Synodic periods are 1/(1/P − 1/P♃), with P♃ = 4332.589 d.

| Satellite | a (km) | a/R♃ | Sidereal P (d) | 1726 − modern | Synodic P (d) | 1687 − synodic |
|---|---|---|---|---|---|---|
| Io | 421 800 | 5.900 | 1.769138 | +1 s | 1.76986 | 0.00 min |
| Europa | 671 100 | 9.387 | 3.551181 | 0 s | 3.55409 | 0.00 min |
| Ganymede | 1 070 400 | 14.972 | 7.154554 | +3 s | 7.16639 | 0.00 min |
| Callisto | 1 882 700 | 26.334 | 16.689023 | −3 s | 16.75356 | +0.08 min |

**Finding: the 1687 periods are synodic** (relative to the Sun, as eclipse timings give them). They match modern synodic periods to within 0.1 min,
and differ from the sidereal ones by 0.04 % (Io) to 0.39 % (Callisto). The 1726 periods are sidereal and are good to a few seconds; the 1726 heading adds
"stellis fixis quiescentibus". Converting the 1687 periods to sidereal lowers every 1687 row exponent by 0.002 to 0.0023. The rows are then Cassini 1.468, Borelli 1.519, Townley 1.505, Flamsteed (micrometer) 1.485 and Flamsteed (eclipses) 1.500.

**Distances against modern a/R♃ (equatorial)**:

| Observer | Satellites 1–4 |
|---|---|
| Cassini (telescope) | −15 % to −13 % |
| Borelli | −8 % to −4 % |
| Townley | −10 % to −6 % |
| Flamsteed (micrometer) | −10 % to −6 % |
| Flamsteed (eclipses) | −5.4 % |
| Cassini (eclipses) | −4 % |
| Pound | **+1.1 %** |

The observers' "semidiameter" is the telescopic disc, which is inflated by the poor optics of the period (Newton says so on p. 391). Pound's assumed
diameter of 37¼″ is 1.7 % below the modern equatorial 37.89″ at 5.2026 AU, and close to the mean-radius value of 37.06″. His measured elongations are 0.59 % below the modern a.
Together these give his +1.1 %.

## Time and cost

- **Wall clock.** About 30 minutes, 21:25–21:55 CST: one Opus agent with no sub-agents and two advisor consultations (one before the computation, one at review). See `COSTS.md`.
- **Compute.** Trivial: each script runs in under 0.3 s on this Intel Mac. The AWS box and Devin were not used.
- **Downloads.** archive.org OCR for 5 books, 18 page images (about 34 MB), and JPL SSD pages and Horizons (7 object queries, 4 vector tables).

What a full run would add:
- the remaining Phaenomena (Saturn's satellites, the planets, p. 391 onward);
- the 1713 second edition, for a three-edition comparison;
- a check of the 1687 "15 1/12" gap against Newton's Book I Prop. 36 route;
- a human spot-check of the fraction readings marked M.
