# Episode 1 kill test: Tycho's Mars nights against JPL Horizons

Run 13 Oct 2026, under PROTOCOL.md. Scripts: `fetch.sh`, `locate.py`, `reduce.py`, `legibility.py`. Hand transcription:
`transcription.json`. Logs: `out/reduction_log.txt`, `out/legibility_log.txt`. Machine-readable results: `out/reduction.json`,
`out/legibility.json`. Inputs are checksummed in `SHA256SUMS`. Nothing is committed.

## Verdict: PASS

| Night (Julian date, Hven) | Elongation from the Sun (Horizons) | Δλ·cos β | Δβ | Total |
|---|---|---|---|---|
| 1595 Oct 25, evening (6 days before opposition) | 172.2° | −0.31′ | −0.82′ | **0.87′** |
| 1595 Jul 22, morning (at quadrature) | 93.9° | +0.66′ | +0.49′ | **0.82′** |

The residuals are reduced − Horizons: Mars barycenter (body 4), DE441, geocentric, apparent ecliptic longitude and latitude of date (ObsEcLon/ObsEcLat).
Both nights agree to better than 1′, against a 5′ threshold. The legibility count is also above the bar. The OCR finds Mars sessions near all 10
oppositions from 1580 to 1600, with 8 of them well covered, plus about 276 off-opposition sessions (details below). Because the test passed, the fallback dataset was not evaluated.

Side results:

- **Tycho's own reduction, printed on the page for 1595 Jul 22:** 4°11⅙′ ♉ = 34°11′10″, latitude 2°30′ S. It differs from Horizons by +0.14′ in longitude and +0.13′ in latitude. Recomputing his arithmetic
  from the printed numbers gives his right ascension 32°47′13″ (he printed 32°47′14″) and a longitude 29″ larger than his printed value.
- **Tycho's catalogue as the star frame instead of Hipparcos:** Oct 25 is off by −1.23′ in longitude and −3.62′ in latitude. Jul 22 is off by +0.64′ and +0.38′. The Oct 25 error comes from Mirfak: the catalogue
  (Verbunt & van Gent 2010, CDS J/A+A/516/A28, file `keplere.dat`, the CDS name for the 1627 printed edition of Tycho's catalogue) lists it 14.3′ off in longitude. This is why the modern frame is the primary one; see below.
- **Refraction weather:** ±1 kPa or ±10 °C moves either result by 0.05′ or less. With no refraction at all, the residuals become +0.30′/+0.33′ (Oct) and +0.87′/+2.02′ (Jul).

## Page references (every number used)

All pages come from J. L. E. Dreyer (ed.), *Tychonis Brahe Dani Opera Omnia*, vol. XII (Copenhagen 1913), in the University of Toronto scan on
archive.org, identifier `operaomniaedidit12brahuoft`. The image URL is `https://archive.org/download/operaomniaedidit12brahuoft/page/n<N>.jpg`.

| Use | Printed page | Leaf | Image n |
|---|---|---|---|
| 1595 Mars section opens ("OBSERUATIONES MARTIS"); **Jul 22 mane table and Tycho's reduction** (right column) | 441 | 491 | 454 |
| Sep 7 entry; context (Tycho in Copenhagen, assistants observing at Uraniborg) | 442 | 492 | 455 |
| Oct 16 (Tycho's RA/Dec of Lucida ♈ and Aldebaran), Oct 25 mane table | 446 | 496 | 459 |
| **Oct 25 vesperi table** (right column); Oct 25 mane triangle reduction (Mirfak's and Aldebaran's longitude/latitude) | 447 | 497 | 460 |
| Oct 26 vesperi (context) | 448 | 498 | 461 |

The following pages were checked only for legibility: vol X p. 175 (leaf 217, n216; 1582 Nov 24 to Dec 3), vol XI p. 183 (leaf 197, n196; 1587 Mar 3–4,
two days before opposition), and vol XIII p. 244 (leaf 262, n261; 1600 appendix). In vol XII, archive.org's hOCR page index equals the leaf number, and the image
index n is that leaf's position in `_page_numbers.json`. `locate.py` maps OCR hits to leaf, n and page. Its printed page numbers come from archive.org's
detection; the ones above were read on the images.

## Transcriptions (read on the page images, not the OCR)

Notation: Tycho's fractions of a minute are written as printed (⅙ = 10″, ⅓ = 20″, ½ = 30″, ⅔ = 40″, ⅚ = 50″; in the time column ⅖ min = 24 s).
Confidence: **H** means the digits are unambiguous at full resolution; **M** means readable, but a small fraction glyph or an inferred identification.

### 1595 Oct 25 (Julian) = Nov 4 (Gregorian), vesperi. Vol XII p. 447, right column, "♂ a Lucida ♈"

| Clock (h m, after noon) | Star | Distance | Declination of ♂ (two sights) | Altitude of ♂ | Clock star hour angle | Conf. |
|---|---|---|---|---|---|---|
| 6 10½ | Lucida ♈ (Hamal) | 20°17⅙′ | 17°32⅓′, 17°34½′ | 14°17′ | Os Pegasi (Enif), east, 9°15′ | M (low altitude; not used) |
| (no time) | Declination of Aldebaran: 15°41′, 15°40⅓′; Aldebaran's altitude 15°30′ | | | | | H |
| 7 54½ | Hamal | 20°16′ | 17°30½′, 17°31′ | — | Vultur (Altair), west, 45°7′ | H |
| 7 57½ | Hamal | 20°15½′ | 17°31½′ (both) | 26°40′ | 45°44′ | H |
| 8 1 | Hamal | 20°16′ | 17°30½′ (both) | 27°15′ | 46°44′ | H |
| 8 4⅖ | Lucidum Latus Persei (Mirfak) | 30°57½′ | 17°30⅙′, 17°30′ | 27°42′ | 48°35′ | H |
| 8 7½ | Mirfak | 30°57½′ | 17°30′ (both) | 28°18′ | — | H |
| 8 10 | Mirfak | 30°57⅓′ | — | 28°45′ | 50°0′ | H |
| 8 15⅔ | Oculus ♉ (Aldebaran) | 15°23⅚′ | 17°30′, 17°30⅓′ | (Aldebaran 19°5′) | 51°25′ | H |
| 8 18 | Declination of Aldebaran: 15°40⅓′, 15°40½′ | | | | | H |
| 8 23⅔ | Aldebaran | 15°23½′ | 17°30⅙′, 17°30¼′ | (Aldebaran 19°55′) | 52°24′ | H |
| 8 26⅓ | Aldebaran | 15°24′ | 17°30⅓′, 17°30½′ | (Aldebaran 20°25′) | 53°4′ | H |
| 8 46 | Sextant check: Aldebaran–Hamal 35°32′, 35°32⅙′; Aldebaran's declination 15°39⅔′, 15°39¾′; its altitude 22°37′ | | | | 57°57′ | H |

The page has no reduction by Tycho for this evening. His triangle reduction on the same page is for the morning of Oct 25: 19°53′0″ ♉, latitude 0°13′50″ S.

### 1595 Jul 22 (Julian) = Aug 1 (Gregorian), mane. Vol XII p. 441, right column

| Clock (h m, after midnight) | Star | Distance | Declination of ♂ | Altitude of ♂ | Clock star | Conf. |
|---|---|---|---|---|---|---|
| 2 32½ | Markab (see note) | 50°28′ | 10°35½′, 10°36′ | 33°32′ | | H |
| 2 36⅓ | Markab | 50°27½′ | | | | H |
| 2 37⅗ | Markab | 50°28⅔′ | | | | M (fraction glyph) |
| 2 41⅔ | Oculus ♉ (Aldebaran) | 29°58½′ | | 34°32′ | | H |
| 2 43⅔ | Aldebaran | 29°58½′ | | | | H |
| 2 46 | Jupiter (not a reference star; unused) | 30°16¾′ | | | | H |
| 2 47⅓ | Jupiter | 30°17½′ | 10°35′, 10°35′ | 35⅙° | Vultur (Altair), west, 60°30′, "Resp. H.2 M.50" | H |
| (no time) | "Pro corrigendis Armillis": declination of Lucida ♈ (Hamal) 21°30′, both sights | | | | | H |

Tycho's reduction printed below the table reads: "H.2 M.40, distance of ♂ from prima alae Peg. 50 28, from Aldebaran 29 58½; declination of ♂ 10°36′
corrected; Aldebaran RA 63 12½, Dec 15 37; Primae alae Peg. RA 341 9¼, Dec 13 3 37 B; ascensional differences 51 35 5 and 30 22 23; hence RA of ♂
32 47 14; longitude 4 11⅙ ♉, latitude 2 30 M[eridional]."

**Star identification note (Jul 22).** The table header says "Dist. ♂ ab ore Peg." (Os Pegasi = Enif), but Enif was about 71° from Mars that morning,
not 50°. Tycho's reduction uses "prima alae Peg." at RA 341°9¼′, Dec 13°3′37″. His catalogue calls this star "Prima alae, Marchab", and those coordinates are
α Peg (Markab) precessed to 1595. The 50°28′ distance fits only Markab, so Markab is used. Either the codex header or Dreyer's print names the wrong star.

Identifications: Lucida ♈ = α Ari (Hamal). Lucidum Latus Persei = α Per (Mirfak). Oculus ♉ = α Tau (Aldebaran). Vultur = α Aql (Altair). Os Pegasi = ε Peg (Enif).
Each was checked against Tycho's own coordinates on pp. 446–447 and against the modern star precessed to 1595.

## Reduction (reduce.py; every step is a function there)

1. **Calendar and clock.** Dates are Julian. Oct 25 Julian = Nov 4 Gregorian, and Jul 22 Julian = Aug 1 Gregorian. The "Vultur occid." column is Altair's hour angle west of the
   meridian, read on the armillary. It cannot be an altitude: Altair never rises above 43° at Hven, and the column advances 15°/h. Local sidereal time is
   Altair's apparent RA plus that hour angle; other rows are offset by their clock difference at the sidereal rate.
   - Check, Jul 22: this gives local apparent solar time 2h51.1m at clock 2h47⅓m. Tycho wrote "Resp. H.2 M.50". This confirms the Julian date and that morning hours are counted from midnight.
   - Check, Oct 25: the clock reading 8h46m gives 20h45.3m.
   - Finding: three Altair readings on Oct 25 (8:04⅖, 8:10, 8:15⅔) are exactly 1° too large compared with the other six, which agree to 0.3 min. This is a misread or miscopied degree; the median clock offset is used.
   - UT1 comes from inverting Greenwich apparent sidereal time (ERFA gst06a). ΔT is 122 s (Espenak–Meeus, cited); it is irrelevant because Mars moves under 1′ per hour.
2. **Reference stars, primary frame.** Hipparcos (van Leeuwen 2007, CDS I/311; cited) with proper motion, parallax and radial velocity (SIMBAD, cited) is propagated
   405 years to the date. The apparent place on the true equator and equinox of date (astropy TETE: precession, nutation, annual aberration) follows.
   This frame is primary because the test is against a modern ephemeris. A star-frame error would contaminate the residual and could not be told apart from a
   measurement error. Tycho's catalogue frame is run as a side track.
3. **Forward model with refraction.** Mars and each star are refracted with Saemundsson's formula (101 kPa, 10 °C; a guess, and the sensitivity is shown) at each row's
   sidereal time. The model distance is the arc between the two refracted points. The armillary declination is modelled as the refracted declination plus a zero point,
   taken from the reference star the observers measured that night: Aldebaran on Oct 25 (−0.26′ mean) and Hamal on Jul 22 (−1.27′). This mirrors their
   "pro corrigendis armillis" step, but against modern apparent places. The Oct 25 mean combines two groups: −1.75′ and −2.42′ from the untimed early reading
   (assumed at 7:00), and +0.5′ to +0.9′ from the timed ones. It does not enter the Oct 25 result, because that night is solved from distances only.
4. **Least squares** solves for Mars's true topocentric RA/Dec at the mean epoch of the rows. Mars's own motion is about 1′/h near opposition, and the rows lie
   within ±16 min of the mean epoch, so fitting at that epoch absorbs it to about ±0.2′.
   - Oct 25 uses 9 distances to three stars that are well spread around Mars. Distance residuals are −0.33′ to +0.19′ (RMS 0.23′), and the armillary declinations agree with the distance-only
     solution to within ±0.5′ (one at +1.1′).
   - Jul 22: Markab and Aldebaran lie on nearly opposite sides of Mars, so the two distances fix RA but hardly fix declination (the distance-only latitude is off by 6.7′). The armillary declination is therefore
     part of the fit, as in Tycho's own reduction. All five measured distances come out 0.35′ to 1.5′ *shorter* than the fitted position implies (mean about 1.2′).
   - The sextant systematic is not constant. On Oct 25 the observers' own star-to-star check (Aldebaran–Hamal, 8:46) reads 1.05′ and 1.22′ *longer* than the modern refracted
     arc, yet that night's Mars distances show no net bias (mean residual about −0.1′). A fixed index correction would therefore be wrong. The full run needs a per-night
     (or per-arc) sextant term, tied to the observers' own star-to-star checks where they exist.
5. **Parallax.** The geocentric direction is the topocentric vector plus the observatory's geocentric position (Uraniborg 55.9075° N, 12.6967° E; cited). The Earth–Mars distance comes from
   Horizons (cited); the shift is 15.8″ (Oct) and 8.2″ (Jul). The result is rotated to the true ecliptic of date (IAU 2006 obliquity plus nutation, 23.4942°).
   In the Tycho side tracks, his obliquity 23°31′30″ and his precession of 51″/yr are cited values: they are Tycho's published constants, not numbers on the pages read here.
   The 23°31′30″ reproduces his printed Jul 22 result to 29″.
6. **Horizons** is queried through the API with body `4`, `CENTER=500@399` (geocentric), and also from the Hven site as a topocentric check. The time is given as a JD in UT
   (`TLIST`), which avoids any calendar ambiguity. Reply headers read "Target body name: Mars Barycenter (4) {source: DE441}" and "Center body name: Earth (399) {source: DE441}".
   The raw replies are in `data/horizons/`. Topocentric RA/Dec differences are −0.08′/−0.87′ (Oct) and +0.46′/+0.68′ (Jul).

Not used, and why. The "Altit." column on Oct 25 disagrees with the computed altitude of Mars by 18′ to 39′. It rises faster (about 10°/h) than any object can rise at
Hven in that part of the sky (at most 8.4°/h), so those altitudes were not taken at the recorded times. Refraction at 27° changes by less than 0.05′ per 0.5° of altitude, so
it does not matter here. On Jul 22 the printed altitudes agree within 6.5′ to 8′.

## Legibility estimate (legibility.py)

Method:

- Vols XI–XIII (1586–1601) give each year an "OBSERUATIONES MARTIS" section. Every "DIE <day> <month>" heading in it counts as one Mars session.
- Vol X (1580–1585) mixes the planets. There a "DIE" block counts when the OCR's renderings of the ♂ sign, or the words Mars/Martis, occur in it.
- Appendices are excluded: they hold other observers, such as David Fabricius in 1600, and later reductions.
- Dates are converted on the Julian calendar. A Horizons daily elongation table (body 4, 1580–1602) classifies each session.

Results:

- **413 distinct Mars dates** in total.
- Sessions per year: 1580: 7, 1581: 4, 1582: 14, 1583: 25, 1584: 9, 1585: 44, 1586: 14, 1587: 30, 1588: 11,
  1589: 22, 1590: 11, 1591: 31, 1592: 7, 1593: 35, 1594: 5, 1595: 35, 1596: 15, 1597: 10, 1598: 12, 1599: 47, 1600: 23, 1601: 2.
- **Oppositions** (Horizons elongation maxima, Julian dates), with sessions within ±20 days: 1580 Nov 18: 1 (Nov 17, the opposition night itself, distances by radius);
  1582 Dec 29: 7; 1585 Jan 31: 15; 1587 Mar 7: 15; 1589 Apr 15: 10; 1591 Jun 9: 9; 1593 Aug 26: 8; 1595 Oct 31: 11; 1597 Dec 14: 6;
  1600 Jan 19: 3. **10 of 10 covered, 8 of them with 6 or more sessions.**
- **Off-opposition sessions** (elongation < 135°): 276, of which 198 have elongation < 110°. Another 52 fall between 135° and the opposition windows.

**Correction (13 Oct 2026, while building `WORKLIST.json`).** The count above included 41 false sessions: fixed-star blocks inside
the 1599 year (vol XIII p. 182, "ALTITUDINES MERIDIANÆ & DISTANTIÆ FIXARUM"), whose dates the finder read as Mars headings.
It also missed six "NOCTE QUÆ PRÆCEDEBAT …" headings. The corrected finder (`legibility.py`) gives:
- **379 Mars dates**;
- **10 of 10 oppositions covered** (1600 Jan 19 now has 7 sessions);
- **238 off-opposition sessions** (159 below 110°).

The verdict is unchanged.

**Note on `reduce.py`.** After commit 0eab93b, `reduce.py` was replaced by the batch reducer (session format of `TRANSCRIBE-GUIDE.md`).
The kill-test version of the script is in that commit. Run as `reduce.py --check`, the batch reducer reproduces both kill-test nights:
- 1595-10-25V: 0.66′ (with the sextant index fitted from three stars and the armillary declinations included);
- 1595-07-22M: 0.60′.

Legibility on the images is not the bottleneck. The pages are Dreyer's typeset edition, not the manuscript, and every sampled page is crisp at the archive's full
resolution: vol X p. 175, vol XI p. 183, vol XII pp. 441, 442, 446–448 and 478, and vol XIII p. 244. Numerals and fractions read unambiguously once cropped at full size. The OCR is the
weak link: it mangles ♂ (as cf, cT, (^, d′), drops fractions, and splits tables across columns. Every number must therefore be read on the image, as was done here.
Discounting heavily (only half the off-opposition sessions turn out to have a usable star distance plus declination) still leaves more than 100 off-opposition nights,
far above the 20 needed.

Caveats for the count:

- Vol X's Mars detection is rough. 103 sessions are counted there, 72 of them with two or more sign hits.
- From late 1597 Tycho observes from other places: Wandsbek, Wittenberg, Girsitz, Benátky. Each needs its own latitude and longitude, and some instruments are smaller.
- 1580–1585 mostly use other instruments (radius, azimuth quadrant, altitude-azimuth pairs) and need a different reduction.
- The vol XII "1593" block exists even though Tycho's 1593 codex is lost. Where Dreyer took it from must be checked before use.

## Time and cost

- Wall clock: about 25 minutes (20:33–20:58), one Opus agent with no sub-agents and two advisor (Fable) consultations, one before the reduction and one at review.
  The costs are recorded in `COSTS.md`. Compute is trivial (each script runs in about 3 s on this Intel Mac).
- Downloads: 11 MB of OCR, 5.5 MB for 8 page images, the CDS catalogue, a Hipparcos extract, and 3 Horizons queries. The AWS box was not used.

What would make the full run expensive:

1. **Image reading per session.** There are about 410 sessions, and each needs the page image read at full resolution, with crops for fractions, because the OCR is unusable for numbers.
   That is roughly 250 pages and the main token cost. The full run should transcribe every row (times, distances, both declination sights, clock-star hour angles) and keep the
   page, leaf and n for each.
2. **Per-night identification.**
   - The reference star has to be identified from Latin descriptions. The Jul 22 header names the wrong star, so each identification must be checked against Tycho's own printed coordinates or the geometry.
   - The clock star and its hour-angle convention vary (Vultur, Canicula, Spica, Os Pegasi, Arcturus; "or." versus "occid.").
   - The instrument varies by period (sextant, armillary, radius, quadrant), and so does the site after 1597.
3. **Systematics to model**:
   - sextant systematics of ±1′ to 1.5′ that change sign between nights (Jul 22: Mars distances 1.2′ short; Oct 25: star-to-star check 1.1′ long), fitted per night using the
     observers' own star-to-star checks;
   - the armillary zero point, taken from the reference-star declination the observers recorded;
   - occasional 1° slips in clock-star readings;
   - recorded altitudes that cannot be trusted.
4. **A cross-check resource.** Tycho's own reduced positions ("Resp. Longitudo … Latitudo") are printed for many nights, with about 140 "Longitudo" lines in the vols XI–XIII
   Mars sections, some of them his Alphonsine or Copernican comparison values. The one tested here agrees with Horizons to 0.2′. They are useful as a transcription check, and
   they are Tycho's own data, not later work.
5. **Human spot-check.** The owner should compare a sample of transcribed rows with the images, about 1 in 10, as the plan says.
