# Episode 3, day-1 kill test: are the historical transit-of-Mercury contacts good enough?

Run date: 13 Oct 2026, from 20:33 to 21:08 CST on the owner's Mac. This test checks data quality
only. No drift of any orbital element was computed (blind rule).

## Verdict: PASS

Measured against JPL Horizons (DE441), the historical contact times scatter by **about 1 to 3 arcseconds**
along Mercury's path. The criterion was 10".

| Set | Contacts | Along-path O-C, RMS | Largest |
|---|---|---|---|
| 1677, Halley alone (St Helena), I to IV, my own reduction | 4 | 3.7" | 5.7" (contact I) |
| 1753, all 34 European egress rows, my own reduction | 34 | 1.6" | 3.5" |
| 1753, rows Newcomb accepted | 26 | 1.1" | 2.1" |
| 1881, all Australian and Californian rows (46 minus Honolulu's 3), my own reduction | 46 − 3 | 1.4" | 5.2" |
| 1881, rows Newcomb accepted | 40 | 1.1" | 3.8" |
| All 58 of Newcomb's concluded geocentric contacts, 23 transits, 1677 to 1881 | 58 | 1.9" | 7.2" (1868 II, his weight 0.5) |
| Same 58, after one constant per contact type (II, III, IV) | 58 | 1.4" (robust sigma 0.6") | 5.6" |

The O-C values in time are tens of seconds, and occasionally a minute or two for the worst early observers.
Mercury moves across the Sun at only 4.0"/min in May transits and 5.9"/min in November transits (taken from
the Horizons geometry at each contact). At those speeds, the 10" threshold corresponds to 100 to 150 s of
clock error, and no accepted contact comes close to that.

**Is a drift of tens of arcseconds per century measurable?** On these numbers, yes. A straight line through
the 58 along-path residuals (no line was fitted; only its precision was computed from the epochs and the
scatter) would be determined to 0.24"/century on the sky with Newcomb's weights, or 0.32"/century without
them. A first-order Kepler derivative puts an unexplained turning of Mercury's perihelion onto the sky at a
factor of about 0.23 at both nodes, with opposite signs in November and May transits. That gives a floor of
about 1 to 1.5" per century in perihelion terms, before correlations with the other orbital elements. The
opposite signs in November and May are what will separate the signal from a clock (Delta T) error, which
shifts both series the same way. Correlations are the real limit and belong to the day 2-5 fit.

## Source and pages

- **The observed contact tables are in volume 1, not volume 6.** Simon Newcomb, "Discussion of observed
  transits of Mercury, 1677-1881", *Astronomical Papers prepared for the use of the American Ephemeris and
  Nautical Almanac*, vol. 1, part VI (Washington, Bureau of Navigation, 1882), pp. 363-487. US government
  work, public domain. Vol. 6 (1898) holds Newcomb's *Tables of the heliocentric motion of Mercury*
  (part II, p. 171 ff.) and no contact table. I checked its OCR. The F5 note named vol. 6 part IV;
  that pointer is wrong for the observations.
- Scan: Google scan of the Oxford University copy, archive.org item `astronomicalpap00newcgoog`. The PDF
  is identical to the one in `01Astronomicalpap00newcgoog` (archive.org sha1
  `9749819712d6de7db321811997d81eabe070bb3d`, matched locally). PDF page index = printed page + 31.
  `fetch.sh` and `SHA256SUMS` are in the episode folder. Horizons responses are cached in
  `data/horizons/`, with their checksums in `SHA256SUMS.horizons`.
- Pages used:
  - p. 369-373: phase definitions
  - p. 374-377: adopted station positions
  - p. 378-379: external contacts and the column definitions
  - p. 384: 1677
  - p. 389-390: 1753
  - p. 419-421: 1881
  - p. 451: interior contacts, concluded geocentric GMT and weights, all transits
  - p. 452: exterior contacts, same
- Each column is defined on p. 379. The local time is apparent time before 1800 and mean time after.
  Next come the reduction to the Earth's centre, any correction for phase, and the Greenwich mean time of
  geocentric contact. All times use the **astronomical day, which starts at noon**: civil = printed + 12 h.
  Station longitudes are printed west-positive.
- Cross-checks: NASA/GSFC Seven Century Catalog of Mercury transits gives 1677 Nov 07 II 09:33, III
  14:48 UT, consistent with Newcomb's 21h 34m (astronomical Nov 6) and 2h 47m (astronomical Nov 7).

## Extracted values (read from the page images at 300-500 dpi, not from OCR)

The full transcription, with descriptions, Newcomb's use, and a confidence and a note for every row, is in
`out/newcomb_extract.csv`. That file has 86 rows. Station coordinates are in `out/stations.csv`. All Newcomb
inputs used in the reduction are marked **cited** there: longitudes, latitudes, equation of time, and the
reduction to the geocentre. Confidence is **high** unless noted. High means the digits are legible and
Newcomb's own arithmetic reproduces his GMT column from them.

**1677 Nov 7 (p. 384).** Equation of time is printed as −15m 56s for ingress and −15m 54s for egress.
St Helena is at 15°55' S, 0h 22m 52s W (cited). Halley's local apparent times (astronomical date) and
Newcomb's GMT of geocentric contact:

| Observer | Contact | Local app. time | Red. | Phase corr. | GMT geoc. | Newcomb's use |
|---|---|---|---|---|---|---|
| Halley | I | 21 26 17 (Nov 6) | +29 | | 21 33 42 | rejected (all first contacts rejected) |
| Halley | II | 21 27 30 | +29.2 | | 21 34 55 | weight 0.1, p. 451 lists 21 34 01 |
| Halley | III | 2 40 08 (Nov 7) | +22.0 | | 2 47 28 | weight 0.1 |
| Halley | IV | 2 41 54 | +22 | +20 | 2 49 34 | weight 0.1 |
| Gallet, Avignon | IV | 3 26 56 | −4 | +30 | 2 52 14 | rejected |
| Townley, Lancashire | IV | 2 54 00 | −8 | | — | not used, no longitude |

**1753 May 6 civil (astronomical May 5) (p. 389).** Only egress was seen, all of it in Europe. The equation
of time is printed in the header (−3m, seconds as printed in the CSV). London times are mean times. There
are 16 internal-contact (III) rows: Naples, Bologna, 3 at Rouen, 6 at Paris, Leiden, the Hague, Haarlem
and 2 at London. There are 18 external (IV) rows. Newcomb's concluded values are III 22h 6m 0.5s and
IV 22h 8m 45.0s GMT (p. 390). Every row is in the CSV. One row has medium confidence: Bouguer IV, where
the seconds carry a doubt colon in print.

**1881 Nov 7-8 (pp. 419-420).** Local mean times: Melbourne (Ellery, White, Moerlin, Turner), Windsor NSW
(Tebbutt), Sydney (Russell, Lenehan, Wright, Morrice, Hargrave, Bladen, Conder, Brooks), Mt Hamilton
(Holden, Burnham) and Honolulu (Rockwell). That is 46 rows in all: 18 at II, 15 at III, 13 at IV. Newcomb's
concluded values are II 10h 18m 38s, III 15h 35m 54s and IV 15h 37m 33s GMT (astronomical Nov 7).
Reading flags:

- Brooks II prints local seconds "86". The GMT column implies 36. Medium confidence.
- Lenehan II prints GMT minutes "10" where 18 is meant. Medium.
- Turner III and Bladen III print GMT seconds as "85" and "73", meaning 36m 25s and 36m 13s. Medium.
- Tebbutt III prints his reduction as −20, but the GMT needs +20, which is Sydney's value. It is a sign
  misprint. Medium.
- Tebbutt IV has a malformed first seconds digit, read as 36. Medium.
- Rockwell (Honolulu) has a local-time column that is not Honolulu mean time; it looks like Greenwich
  time. Low confidence, so it is used only through Newcomb's GMT and is excluded from the topocentric
  reduction.

The Melbourne, Windsor, Sydney and Mt Hamilton longitudes are not in Newcomb's station table. They were
backed out of his own row arithmetic (local + reduction − GMT): 9h 39m 55s E, 10h 3m 22s E, 10h 4m 51s E
and 8h 6m 32s W. These are cited-derived values.

**All transits (pp. 451-452):** the concluded geocentric GMT, Newcomb's weight and his Le Verrier tabular
time for every contact are in `out/newcomb_geocentric_summary.csv`. That file has 58 rows. Three printing
issues:

- 1782's first interior row is labelled III, but it is contact II.
- 1786 II is printed as a bracketed pair. The mean is used.
- 1848 IV is dated Nov 8 but must be astronomical Nov 9.

## Method

1. **Reduction from the station (my own, independent of Newcomb's reduction column).** I took the printed
   local time on the astronomical day and added 12 h. For apparent time, I added Newcomb's equation of time
   (cited; sign: mean = apparent + E) and subtracted the east longitude (cited) to get UT1. Adding Delta T
   gives TT.
2. **Prediction.** I asked Horizons for apparent airless RA/Dec and angular diameters of the Sun (10) and
   Mercury (199) as seen from the station (geodetic site, elevation 0), on a 1-second grid ±20 min around
   the observed instant. I computed the true angular separation of the centres myself. Contact is where
   that separation equals R☉ − r☿ (II, III) or R☉ + r☿ (I, IV), using Horizons' radii: Sun 695,700 km,
   Mercury 2,440 km. I did not ask Horizons for contact times.
   The result is insensitive to station latitude: moving Melbourne by 0.5° shifts its contact by 0.3 s.
3. **Residuals.** O−C (s) is the observed TT minus the predicted TT, so positive means the observer was
   late. The along-path error (") is O−C times Mercury's speed with respect to the Sun's centre, taken from
   the same grid. The radial error (") is the predicted centre separation at the observed instant minus
   the contact separation, which is what a contact actually measures. The two agree in size except where
   the path meets the limb obliquely (1736, 1740, 1782, 1786, 1822). At ingress they have opposite signs by
   construction: a late ingress puts Mercury already inside the contact circle.
   Positions are airless. Differential refraction across the solar disc is below about 1" for Sun
   altitudes above about 30°. Neither Newcomb nor I applied it. It is a day-2 systematic and irrelevant at
   the 10" level.
4. **Geocentric comparison.** I took Newcomb's GMT of geocentric contact (+12 h) and compared it with the
   Horizons geocentric (500@399) contact. This was done per observation for the three transits, and for
   all 58 concluded contacts.
5. **Delta T.** I used Espenak and Meeus (2006) polynomials fitted to Morrison and Stephenson (2004), cited
   from NASA's `deltatpoly2004.html` (cached in `data/ref/`). The values come to 17.0 s for 1677, 13.9 s
   for 1753 and −5.3 s for 1881. Horizons' own TDB−UT at the same instants is 23.6, 18.0 and −3.8 s.
   Its manual cites Stephenson, Morrison and Hohenkerk (2016, Proc. R. Soc. A 472:20160404) plus the 2020
   addendum (Morrison et al. 2021) for pre-1962 dates. Using Horizons' values instead shifts every
   residual by +0.1" to +0.8". The difference is largest in the 1690s and falls with time, and its size (about 0.3"/century on
   the sky) is comparable to the trend floor. It must be carried as a systematic in the fit.
6. **Checks.**
   - Finder validation on the 2006 Nov 8 transit against NASA/GSFC's published geocentric contacts:
     ±4.8 s, with ingress later and egress earlier. The cause is the solar radius: Horizons uses 695,700 km,
     NASA the larger Auwers value, a difference of about 0.4" (`out/validation_2006.csv`).
   - Newcomb's printed equation of time against Horizons' local apparent hour angle of the Sun at
     Greenwich: it agrees within 0.9 s at all three epochs checked (`out/deltat_eot.csv`).
   - My topocentric reduction against Newcomb's printed reductions:
     - It agrees within 1.4 s for every 1753 and 1881 row, and to 0.0 s for Halley III.
     - Where Newcomb added a "correction for phase", the difference equals that correction.
     - **Halley's ingress, 1677 contacts I and II: a value Newcomb corrected himself.** The Part I table
       (p. 384) prints the reduction to the geocentre as +29.2 s. Horizons gives −25.1 s for St Helena at
       that moment. The same site's egress agrees to 0.0 s, so the site is right. The volume's own corrigenda
       (printed p. 484) read: "Page 384, Reduction to geocentric phase for contacts I and II, for +29s.2 read
       −25s.1, and carry the correction forward." Our reduction therefore recovered, independently and before
       we found the corrigenda, the value Newcomb himself corrected in his errata. We take this as a check of
       the reduction, not as a finding about his work.
     - Replacing the printed +29.2 s by −25.1 s moves the time by 29.2 + 25.1 = 54.3 s (a sign flip alone
       would move it by 58.4 s): 21h 34m 55.2s − 54.3 s = 21h 34m 00.9s. That agrees to 0.3 s with the value
       Newcomb carries into Part II (p. 451: 21h 34m 01s). So Part II already has the corrected contact. It
       also explains why my independent topocentric O−C for Halley II (+26.1 s, 2.6") equals the O−C of
       Newcomb's concluded value.
     - The uncorrected value is what makes Halley's ingress look "a minute or more late" in the p. 384
       commentary. Reduced with the corrected value, it is 26 s late.
     - The same corrigenda leaf also corrects p. 405 (Altona, +58 to +54 s) and p. 406 (1832 contacts II,
       21h 3m 32s to 21h 3m 30s; the summary CSV already carries 21:03:30), and warns that the longitude list
       beginning on p. 374 "does not, in all cases, give the longitude of the station actually adopted". That
       remark accounts for the 5 s (London) and 4 s (Sydney) differences recorded in `out/stations.csv`
       between his table and his row arithmetic.
7. **Systematic phase offsets, reported and not removed in the headline numbers.**
   - Interior ingress (II) averages −1.5" (observed early).
   - Interior egress (III) averages +0.1".
   - Exterior egress (IV) averages −1.6" (the notch is lost before geometric contact, as Newcomb says on
     p. 378).
   - The II/III asymmetry is what a slightly larger effective solar disc (irradiation, plus the 0.4"
     radius convention) produces. Day 2-5 should fit one constant per contact type.

Scripts, all in `scripts/`:

- `hz.py`: Horizons API with a cache
- `transit.py`: time conversion, Delta T and contact geometry
- `validate_2006.py`
- `run_killtest.py`: writes `residuals_obs.csv`, `residuals_summary.csv`, `deltat_eot.csv` and
  `killtest_stats.json`
- `stats_extra.py`: the per-type offsets, the trend floor and the node factors
- `crop.py`: page crops for reading

## How much data the table holds

- **23 transits** from 1677 to 1881. Newcomb reduces them to **58 concluded geocentric contacts**: 37
  interior (18 at II, 19 at III) and 21 exterior egress (IV). He rejects all first external contacts.
  Weights run from 0.1 (Halley 1677, 1740) to 6 (1868 III, 1878 II).
- Behind these sit the individual observer rows of the tabular summary (pp. 384-421), estimated at
  **about 770 tabulated rows**: 1 at I, 315 at II, 203 at III, 253 at IV. A sub-agent counted
  them from 130-dpi renders, ±2 on dense pages, so about ±3% overall. It matches my own transcription for
  1677 (6 rows) and 1881 (46). For 1753 it has 33. My 34 also counts the Bologna row, which is a mean of
  two unnamed observers; the agent counted that row as a summarized mean.
- Another 124 observations appear only as means: 109 American in 1878 from Eastman and Paul, 13 in 1832
  and 2 in 1753. In 1868 the 61 fourth-contact rows are tabulated, but Newcomb did not reduce them
  separately. A full transcription would therefore cover about 770 rows.
- November transits dominate: 16 transits against 7 in May. May contacts are slower (4.0"/min against
  5.9"/min), so the same clock error costs fewer arcseconds there.

## Time spent and cost drivers

- **Wall clock:** 35 minutes, 20:33 to 21:08, with overlapping stages:
  - finding the volume, including learning that vol. 6 holds only tables: about 7 minutes;
  - reading page images and transcribing: about 15 minutes;
  - code, Horizons runs and checks: about 10 minutes;
  - write-up: about 10 minutes.
  The row count ran in parallel for 8 minutes.
- **Compute:** trivial. Horizons is free. It took about 180 cached API calls, around 3 minutes of network
  time on the first run and 2 s on re-runs. Neither the AWS box nor REBOUND was needed.
- **Main cost driver:** agent tokens spent reading page images. Each table needs 300-500 dpi crops,
  because the OCR scrambles the numbers (the 1881 table is unreadable in OCR). Transcribing the full
  tabular summary (about 770 rows) is the expensive part of days 2-5. The 58-row summary on
  pp. 451-452 is cheap and already in hand.
- **Other agents:** one sub-agent counted rows on 38 page images (about 190k tokens, 39 tool calls).
  The 1677 ingress reduction was later checked against the volume's own corrigenda (see above).

## Fallback (not triggered)

If this had failed, the episode would have become the data-free version. That version runs a
Newtonian-only N-body integration (REBOUND, modern masses) over 1677-1881 and compares it with Horizons.
The data-driven version passes, so the fallback remains only the planned control experiment.
