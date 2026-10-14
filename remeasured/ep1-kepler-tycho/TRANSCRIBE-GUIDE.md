# Transcribing Tycho's Mars sessions: the worker guide

You will read Mars observing sessions from the page images of Dreyer's edition of Tycho Brahe's journals, and write
each one as JSON. Read this whole guide before your first session. Then work through your chunk of `WORKLIST.json`:
priority 1 sessions first, then priority 2, then priority 3.

The reduction to positions happens later, in `reduce.py`, and it is not your job. Your job is to record exactly what
the page says, with a confidence for every number, so that someone can later check each number against the image.

## 0. Rules (protocol, not style)

1. **Transcribe only.** Do not compute positions. Do not look up any ephemeris (JPL Horizons, Stellarium, tables, websites)
   or any modern position of Mars. Do not search the web for these observations or for anyone's reduction of them.
   You may look up the reference stars, but only through `star_index.csv` (Tycho's own catalogue, with modern identifications).
2. **Measurements and Tycho's own reduced positions only.** Skip these entirely:
   - the comparison values from tables ("Calculus Alphons.", "Copern.", "Prut.", "Ex Alphonsino", "Ex Copernico");
   - remarks on planetary theory;
   - Dreyer's footnotes. The exception is a footnote that corrects or qualifies a printed number or names the
     source codex ("Falsa, debet esse 6° 23′", "Sic in codice", "E codice V", "In margine adscriptum"): copy that one into `footnotes`.
3. **Use neutral vocabulary in your notes.** Describe what is on the page in plain words ("distance to Aldebaran,
   repeated twice"). Do not add interpretation of the planet's motion, and do not name later astronomers or their results.
4. **Never guess a digit.** If a digit cannot be read on a full-resolution crop, write your best reading, give it confidence
   **L**, and say why in `note`.
5. **One session = one heading** ("DIE 25 OCTOBRIS, VESPERI.", "EODEM DIE AD VESPERAS.", "NOCTE QUÆ PRÆCEDEBAT 5
   JANUARIJ."). When a date has a mane and a vesperi heading, write two sessions. The worklist lists the extra headings
   under `more_headings`.

## 1. Setup and tools

All commands run from `ep1-kepler-tycho/`. Run Python as `data/.venv/bin/python -I`.

**First-time setup.** `data/` is not in git. In a fresh clone or worktree, run these once before anything else:
`python3 -m venv data/.venv && data/.venv/bin/pip install astropy numpy scipy pillow && bash fetch.sh`. The last command
downloads the OCR, page-number maps and catalogue, and checks their checksums.

| Task | Command |
|---|---|
| Download your pages (each session's leaf plus the next one) | `data/.venv/bin/python -I fetch_pages.py --chunk N` |
| Download one more leaf | `... fetch_pages.py --leaf VOL LEAF` |
| Crop a region at full resolution, 2× upscaled, for reading numbers | `... fetch_pages.py --crop VOL LEAF x0 y0 x1 y1` (fractions of the page, e.g. `0.5 0.3 1.0 0.6` for the right column, middle) |
| Check your file | `... validate.py transcriptions/chunkN.json` (it must report 0 errors) |
| Look up a star | `star_index.csv`: Tycho's catalogue (Verbunt & van Gent 2010), with the Latin description, the HIP number, and Tycho's longitude/latitude for 1601 |
| Find a heading in the OCR | `... locate.py VOL "REGEX"` (it returns leaf, image n and the guessed page) |

- **Read numbers only on crops.** A full page shown to you is downscaled, and fractions like ⅙ and ⅚ become indistinguishable there.
  Crop the table, then read it.
- The archive.org OCR (`data/ocr/`) is useful for finding headings, but it is wrong about numbers. It drops fractions, mangles ♂ into
  `cf`, `cT`, `(^` or `d'`, and merges columns. Never copy a number from the OCR.
- Write your output to `transcriptions/chunkN.json` (N = your chunk), using the format in §7. Save after every session.

## 2. Citing the source

- The volume is 10, 11, 12 or 13 (Dreyer's vols X–XIII), from the archive.org items `operaomniaedidit{10..13}brahuoft`.
- The **leaf** is the scan leaf. The **image n** is the index in the URL `https://archive.org/download/<item>/page/n<N>.jpg`. Both are
  in `WORKLIST.json`, and `fetch_pages.py` prints them.
- The **printed page** is the number in the running head (e.g. "1595   447"). Read it on the image: the worklist's
  `printed_page_guess` comes from archive.org's automatic detection and can be wrong or empty.
- A session that runs onto the next page lists every page: `"pages": [446, 447], "leaves": [496, 497], "image_n": [459, 460]`.
  Give `columns` as "left", "right", or "right, lower half".
- If the worklist's leaf does not hold the heading, find the right leaf (neighbours, `locate.py`). Cite the right one, and
  put `worklist_leaf_wrong` in `flags`.

## 3. The page and the session, by period

All pages are Dreyer's typeset edition (1913–1926), not the manuscripts: the print is clean. Each year runs **Sun →
Saturn → Jupiter → Mars → Venus → Mercury → fixed stars**. Vols XI–XIII have a heading `OBSERUATIONES MARTIS.` per
year. In vol X (1580–1585) the planets are mixed in one section per year, so check the ♂ sign before you transcribe. Appendices
after each year hold other observers (for example David Fabricius) and are **not** in your worklist.

### 3a. 1580–1582 (vol X): radius, quadrant, azimuth–altitude

- **Prose lines.** Example: "10ᴴ17ᴹ Distabat ♂ a superiore pede Erichtonij 9° 0′". Distances were taken with the radius
  (cross-staff), often with "Puto has observationes esse per Radium" or "per Radium". Record them as `obs` rows with `instr: "Radius"`.
- **Meridian altitudes.** Example: "♂ in Meridiano, Alt. 57 24", sometimes with a reference star's meridian altitude ("Aldeboran in
  meridiano habens alt. 49 45") for the quadrant correction. Record them as `merid_alt_mars` / `merid_alt_star`.
- **Tables (1582).** Columns are H. M. S. | Dist. ♂ per Sext. Trig. a ⟨star⟩ | Azim. ♂ a ⟨mer./sept.⟩ vers. ⟨ort./occ.⟩ per Q. minorem |
  Alt. ♂. Each line is one `obs` row with `dist`, `az_mars` + `az_ref`, and `alt_mars`. For `az_ref`, take the header words:
  - "a mer. vers. ort." (from the south point toward east) → `mer_ort`
  - "a mer. vers. occ." → `mer_occ`
  - "a sept. vers. ort." (from north toward east) → `sept_ort`
  - "a sept. vers. occ." → `sept_occ`

  The header can change between blocks, so check it at each block.
- **Clock remarks.** Example: "Proxime sequenti meridie Horologium maius ... 23 [minutis] celerius mouebatur". Copy them verbatim into `clock_notes`.

### 3b. 1582–1585 (vol X): sextant blocks "Inter ♂ & ⟨star⟩"

- A block headed "Inter ♂ & cor ♌" is followed by lines of time | distance | (Alt. ♂). Each line is an `obs` row with that block's star.
- "Altit. ♂ merid. 50 59 per Tichon." is a meridian altitude with instrument `Q. Tichon.`.
- Tycho's "Inquisitio loci ♂ ..." blocks end with "Longitudo ♂ 27 29½ ♌, Latitudo 4 20 B.". Transcribe them into
  `tycho_reduction`. Keep only the "Ex observatione" values, not the Alphonsine or Copernican ones.

### 3c. 1586–1597 (vols XI–XII, early XIII): Hven tables

Typical columns are: H. M. (or "Tempus correctum", or "Tempus in horol.") | Dist. ♂ a ⟨star⟩ | Declin. ♂ (two values, one per sight;
"vtroque" means both sights gave the same value) | Altit. ♂ | ⟨clock star⟩ or./occ.

- **Distances** are by sextant: `instr: "Sext."`.
- **Declinations** are by the armillary sphere. Record both sights as a list: `"dec_mars": ["17 30 1/6", "17 30"]`. For "vtroque",
  record one value with `"qualifiers": ["vtroque"]`. Give the direction in `dec_dir`: "B." means north (`B`); "A." or "M." means south (`A` or `M`).
  When the table does not say, take it from the header or from Tycho's reduction on the same page, and give `dec_dir` confidence M.
- **The clock-star column** is the star's **hour angle** in degrees (its distance from the meridian along the equator), read on
  the armillary. "or." means east (`side: "or"`) and "occ." means west (`side: "occ"`). **It is not an altitude**, even though it
  sits next to the altitude column: Vultur (Altair) never rises above 43° at Hven, yet the column reaches 60°. When the
  header says "Alt." or "Altit." with a star name, it is an altitude: record it as `alt_star`.
- **Armillary right-ascension pairs.** Example (1587): "Vultur or. 40 42 | ♂ occid. 73 21½ | Dist. aequat. 114 3½". Record `clock` = {star:
  Vultur, ha: "40 42", side: "or"}, `ha_mars: "73 21 1/2"`, `ha_mars_side: "occ"`, and the printed sum in `verbatim` only.
- **Meridian altitudes.** Examples: "Altitudo ♂ Meridiana per Chalyb. 21 38, per Volub. 21 38½"; "Transiit ♂ per Meridianum
  habens altit. per Chalyb. 21 42 30". Record a `merid_alt_mars` row with one entry per instrument. Instruments: `Chalyb.`
  (steel quadrant), `Volub.` (revolving quadrant), `Q. Tichon.` / `Q. maior` / `Q. minor`, `Sext.`.
- **Calibration rows.** Copy these whenever they appear, because the reducer uses them:
  - "Declinatio Aldeborae 15 40⅓" and "Pro corrigendis Armillis: Declin. Lucidae ♈ 21 30" → `dec_star`
  - "Pro Sextante examinando Aldebora a Lucida ♈ 35 32" → `star_star`
  - a reference star's meridian altitude → `merid_alt_star`
- **Times.** "Tempora correcta", "Horologium correctum est" and "Temp. corr." mean corrected times. A pair like "{12 7½ / 12 2 corr.}" is a
  clock reading plus its corrected time: put the first in `t` and the second in `t_corr`.
- **Clock-star notes.** "Resp. H.2 M.50" printed beside a clock-star reading is the time the observers derived from it: put it in `clock.resp`.

### 3d. 1597–1599: travels

Tycho left Hven in 1597. Expect Copenhagen, Rostock, Wandsbek (to autumn 1598), Dresden and Wittenberg (1598–99).

- Many distances are "per Radium".
- Times are often marked "πλατ:" (πλατικῶς, roughly). Add the qualifier `approx_time`, and give `t` confidence M.
- "Fuit in perpendiculo ad Polarem ..." (alignment remarks) go in an `other` row, verbatim.
- 1598 pages say "stylo veteri" (old style, the Julian calendar).
- Find the place on the page or in the nearby headings: "Wandesburgi", "Wittebergae", "in arce Bennachia", "Girsitz", "Pragae".

### 3e. 1599–1601: Bohemia (Girsitz, Benátky, Prague)

- **Meridian altitudes and distances relative to the transit.** Examples: "Duabus horis post transitum illius per meridianum" and
  "Mane una hora ante transitum". When no clock time is printed, set `at` instead of `t`: `"transit"`, `"transit+2"` or `"transit-1"` (hours after/before Mars's
  meridian transit).
- **Night headings.** "NOCTU QUÆ PRÆCEDEBAT 1 JANUARIJ" and "EA NOCTE QUÆ PRÆCESSIT DIEM 20 JANUARIJ" mean `night_before: true`, with
  `date_julian` set to the printed date.
- **Calendar.** Dates in Bohemia appear to be **Gregorian**. Evidence: the session of 1600 Jan 1 in `transcription.json` fits only as Gregorian.
  Record any explicit note ("stylo novo/veteri") in `calendar_evidence`, and set `calendar` only when the page says it.
- **Printed instrument corrections.** Example (vol XIII p.219): instruments at Benátky read 2′ high from 28 Aug 1599, "corrected
  wherever found". Copy any such note verbatim into `instrument_notes`.
- Tycho's results: "Verus locus ♂ 17 29 47 ♌, Latitudo 3 45 43 B." → `tycho_reduction`.

## 4. Time, date and calendar

- **Hour notation.** "H. 8 M. 4⅖" is 8 h 4.4 min. "7 22 20" is H M S. "8ᴴ17ᴹ" is the same thing. Write the time exactly as printed:
  `"8 4 2/5"`, `"7 22 20"`.
- **`time_basis`:**
  - `from_noon`: vesperi sessions, "P.M.", "post meridiem", and astronomical hours that run past 12 ("Die 14 Januarij H. 16
    M. 40 P.M." is 16 h after noon, i.e. 4:40 the next morning; "Post mediam noctem ... 12 32½" is also from noon).
  - `from_midnight`: mane sessions with small hours ("DIE 22 JULIJ, MANE. 2 32½"), "A.M.", "P.M.N." (= post mediam noctem) with small hours.
  - **Any printed hour of 12 or more is counted from noon, whatever the label.** Vol XI p.182 prints "12 24½ A.M." (1587 Mar 3) for the small
    hours: that is 12 h 24½ min after noon. Write it as printed; the reducer reads every hour ≥ 12 as from noon.
  - If the page mixes both, use the basis of the majority and put the rest in `note` for those rows. If you cannot tell, use `unknown` and
    say why. The reducer tests the basis against the clock stars.
- **`session`:** `vesperi`, `mane`, `nocte`, `meridie`, or `unknown`, taken from the heading.
- **Calendar.** Dates are as printed. Denmark and the Protestant towns used the Julian calendar. `date_julian` is the printed date, whatever
  the calendar; the reducer applies the calendar by site (§3e). Do not convert any date.
- **Clock notes.** "Horologium velocius mouebatur 7½" and "tardius ibat 2 minutis" go verbatim into `clock_notes`. Do not apply
  them yourself.

## 5. Numbers, fractions, abbreviations

| Printed | Write | Meaning |
|---|---|---|
| ⅙ ⅓ ½ ⅔ ⅚ ¼ ¾ ⅖ ⅗ ⅛ ⅝ | `1/6 1/3 1/2 2/3 5/6 1/4 3/4 2/5 3/5 1/8 5/8` | the fraction of the **last** unit printed (minutes in "17 30⅙", minutes of time in "8 4⅖") |
| 19 53 0 | `"19 53 0"` | degrees, minutes, seconds |
| P. 37 M. 40 | `"37 40"` | partes (degrees) and minutes |
| 35⅙ (alone in an altitude column) | `"35 1/6"` | 35⅙ **degrees**: write it as printed. The parser reads one number plus a fraction as degrees |
| vtroque | qualifier `vtroque` | both sights or both observers gave this value |
| bis, ter | `repeat_count: 2` or `3` | the same value was found 2 or 3 times |
| Repetita, Eadem dist. | a new row | a repeated measurement; give its own time if printed |
| Vice versa | qualifier `vice versa` | the observers swapped ends of the sextant |
| Pone ..., limitata, "atque hae duae sunt meliores" | `adopted: true` (for Pone/limitata) or qualifier `meliores` | the observers' chosen value; the reducer keeps the raw rows |
| dubia, incerta, inter nubes, non satis certo, non satis bonae | qualifiers, verbatim | the reducer gives these rows half weight |
| fere, circiter, quasi, πλατ: | qualifier `approx` (or `approx_time` for times) | about |
| exacte, exactissime, bona | qualifier, verbatim | stated as good |
| B. / A. / M. | `dec_dir` / `lat_dir` | Borealis (north) / Australis or Meridionalis (south) |
| ♈ ♉ ♊ ♋ ♌ ♍ ♎ ♏ ♐ ♑ ♒ ♓ | `aries taurus gemini cancer leo virgo libra scorpius sagittarius capricornus aquarius pisces` | zodiac signs, 30° each, in `lon_sign` |
| ♂ ♃ ♄ ♀ ☿ ☉ ☾ | Mars, Jupiter, Saturn, Venus, Mercury, Sun, Moon | the OCR renders ♃ as `2|` and ♂ as `cf`/`(^` |
| ☍ □ △ | opposition, quadrature, trine (aspects with the Sun) | copy the words into `note` only |
| ſ, ß | s, ss | long s and its ligature |

## 6. Reference stars

1. The page names the star in Latin, often with a zodiac sign: "Cor ♌", "Lucida ♈", "ab oculo ♉", "a Lucido Latere Persei", "inferius
   caput ♊", "a pede Erichtonij", "a bor. lance ♎". Copy that name into `name_on_page`.
2. Find it in `star_index.csv` (search the constellation and the Latin description) and take the `hip` from there. Give `modern`
   (e.g. "alpha Tau (Aldebaran)") and `why`.
3. **Check it.** If the page prints the star's own position (an RA/Dec in Tycho's reduction, or a longitude/latitude), compare it with the index:
   - longitude: index `lon_1601_deg` minus 51″ × (1601 − year), within about 0.3°;
   - latitude: within about 0.3°.

   If it does not match, find the star that does.
4. Set `id_confidence`:
   - **H**: the star is named, the index entry is unambiguous, and (when printed) its coordinates match.
   - **M**: the name is generic ("ab humero ♒", "a pede ♊"), or it is checked only by the name.
   - **L**: inferred, or in conflict.

   Give `hip: null` and confidence L when the index has no HIP.
5. **Clock stars** go in `stars` too (Vultur, Canicula, Spica, Os Pegasi and the rest), because the reducer needs their positions.

Starting points (verify every one in `star_index.csv`):

| Journal name | Star | HIP |
|---|---|---|
| Lucida ♈ | α Ari Hamal | 9884 |
| prima / australis in cornu ♈ | γ Ari | 8832 |
| altera / borealis in cornu ♈ | β Ari | 8903 |
| oculus ♉, Aldebaran, Aldebora, Palilicium | α Tau | 21421 |
| boreus oculus ♉ | ε Tau | 20889 |
| cornu ♉ communis cum pede Erichtonij (Heniochi) | β Tau El Nath | 25428 |
| extremum (australe) cornu ♉ | ζ Tau | 26451 |
| lucida Pleiadum | η Tau | 17702 |
| Lucidum Latus Persei, Fulgens in dextro latere | α Per Mirfak | 15863 |
| Caput Medusae, Algol | β Per | 14576 |
| Capella | α Aur | 24608 |
| superius caput ♊, Castor | α Gem | 36850 |
| inferius / meridionale caput ♊, Pollux | β Gem | 37826 |
| lucida pedis ♊ | γ Gem | 31681 |
| Canis minor, Procyon | α CMi | 37279 |
| Canicula, Canis maior, Sirius | α CMa | 32349 |
| lucidus / dexter / sequens humerus Orionis | α Ori | 27989 |
| sinister / praecedens humerus Orionis | γ Ori | 25336 |
| prima, media, extrema/ultima balthei Orionis | δ, ε, ζ Ori | 25930, 26311, 26727 |
| pes Orionis (lucida in sinistro pede), Regel | β Ori | 24436 |
| Cor ♌, Regulus, Basiliscus | α Leo | 49669 |
| lucida cervicis / coli ♌ | γ Leo | 50583 |
| Cauda ♌ (in extremo caudae) | β Leo | 57632 |
| lucida lumborum ♌ (quae sequitur lucida) | δ Leo | 54872 |
| Spica ♍ | α Vir | 65474 |
| Vindemiatrix | ε Vir | 63608 |
| borealis lanx ♎ | β Lib | 74785 |
| australis lanx ♎ | α Lib | 72622 |
| Cor ♏, Antares | α Sco | 80763 |
| frons ♏ (suprema, media) | β, δ Sco | 78820, 78401 |
| Arcturus | α Boo | 69673 |
| Lucida coronae | α CrB | 76267 |
| Vultur (Aquila), lucida in scapulis | α Aql Altair | 97649 |
| Lucida Lyrae | α Lyr | 91262 |
| cauda Cygni | α Cyg | 102098 |
| Os Pegasi | ε Peg Enif | 107315 |
| prima alae Pegasi, Marchab | α Peg Markab | 113963 |
| extrema alae Pegasi | γ Peg Algenib | 1067 |
| caput Andromedae (umbilicus Pegasi) | α And | 677 |
| sinister humerus ♒ | β Aqr | 106278 |
| dexter humerus ♒ | α Aqr | 109074 |
| lucida nodi ♓ (in nexu linorum) | α Psc | 9487 |
| lucida mandibulae Ceti | α Cet Menkar | 14135 |
| cauda Ceti (australis) | β Cet | 3419 |
| cornu ♑ (borealis / australis in cornu praecedente) | α², β Cap | 100064, 100345 |
| Cor Hydrae | α Hya | 46390 |
| Polaris | α UMi | 11767 |
| Fomahant | α PsA | 113368 |

## 7. The JSON format (`tycho-mars-session/2`)

The file holds `{"schema": "tycho-mars-session/2", "chunk": N, "transcriber": "...", "sessions": [ ... ]}`. Worked examples:
`transcription.json` has three sessions (1595-10-25V and 1595-07-22M from the kill test, and 1600-01-01N, a
meridian-altitude night in Bohemia). Copy their shape.

**Values are strings exactly as printed**, with ASCII fractions: `"20 17 1/6"`, `"15 23 5/6"`, `"19 53 0"`, `"8 4 2/5"`.
Never convert to decimals.

### Session

| Key | Required | Content |
|---|---|---|
| `id` | yes | `YYYY-MM-DD` + `M` (mane) / `V` (vesperi) / `N` (night, "nocte", "noctu quae praecedebat") / `D` (day), plus a digit if needed: `1595-10-25V`, `1587-03-03V2` |
| `date_julian` | yes | the printed date, `YYYY-MM-DD` (the name is historical: this is the printed date in whatever calendar the page uses) |
| `heading` | yes | the heading as printed, long s as s |
| `session` | yes | `vesperi` / `mane` / `nocte` / `meridie` / `unknown` |
| `night_before` | if so | `true` for "nocte quae praecedebat ..." |
| `time_basis` | yes | `from_noon` / `from_midnight` / `unknown` (§4) |
| `time_kind` | no | "corrected", "clock", "mixed", "none printed", with the words that tell you |
| `clock_notes` | no | list of verbatim clock remarks |
| `site` | yes | `Hven`, `Copenhagen`, `Rostock`, `Wandsbek`, `Wittenberg`, `Dresden`, `Girsitz`, `Benatky`, `Prague`, or `other:<text>` |
| `site_evidence` | yes | why: "before 1597", or the words on the page |
| `calendar` | no | only if the page says it ("stylo veteri" → `julian`); put the words in `calendar_evidence` |
| `source` | yes | `{"volume", "pages": [...], "leaves": [...], "image_n": [...], "columns"}` (§2) |
| `observer_note` | no | e.g. "Ego tunc Hafniae fui" (Tycho absent; assistants observed) |
| `instrument_notes` | no | verbatim notes on instrument errors or corrections |
| `stars` | yes | `{ key: {"name_on_page", "hip", "modern", "id_confidence", "why"} }`. The key is your short name, used in rows |
| `rows` | yes | below; one row per printed line, in page order |
| `tycho_reduction` | if printed | below |
| `footnotes` | no | `[{"verbatim", "applies_to_row"}]`, only textual corrections and source notes |
| `flags` | yes | list (may be empty), from §8 |
| `minutes_spent` | yes | your time on this session |

### Rows

Every row has `type`, `verbatim` (the printed line; table cells joined with ` | `; ♂ written as Mars), and `conf`
(one H/M/L per field you filled; §9). Use only the fields that apply.

| `type` | Fields |
|---|---|
| `obs` | `t`, `t_corr`, `t_assumed` (only if you infer a missing time; explain in `note`), `at` (transit-relative, §3e), `star` + `dist` + `instr`, `dec_mars` (list) + `dec_dir`, `alt_mars`, `az_mars` + `az_ref`, `ha_mars` + `ha_mars_side`, `clock` = `{"star", "ha", "side", "resp"}`, `alt_star` = `{"star", "alt"}`, `body` + `body_dist` (distance to a planet or the Moon: recorded, not used), `repeat_count`, `adopted`, `qualifiers`, `note` |
| `merid_alt_mars` | `t` or `at: "transit"`, `alt`: `[{"instr": "Volub.", "alt": "58 54 1/2"}, ...]`, `qualifiers`, `note` |
| `merid_alt_star` | `star`, `alt`: `[{"instr", "alt"}]`, `t` |
| `dec_star` | `star`, `dec` (list), `dec_dir`, `instr: "Armill."`, `t` (or `t_assumed`), `alt_star` (string) |
| `star_star` | `star_a`, `star_b`, `dist` (list), `instr`, `t`, `clock` |
| `alt_star` | `star`, `alt`, `t` (a star altitude used for time) |
| `other` | `verbatim` only (alignments, prose you cannot place). Use it rather than dropping a line that has numbers |

### Tycho's own reduction

`tycho_reduction`: `[{"t" or "at", "ra", "dec", "dec_dir", "lon", "lon_sign", "lat", "lat_dir", "verbatim", "conf"}]`.

- Fill in the fields that are printed.
- Copy the observed-position values only: "Resp. Longitudo", "Ergo Longitudo", "Verus locus", "Vera ♂ a Refractione & Parallaxi libera"
  (if both a raw and a "vera" value are printed, write two entries and say which in `verbatim`).
- Do not copy table comparisons.
- `lon` is the degrees within the sign, as printed: `"4 11 1/6"` with `lon_sign: "taurus"`.

## 8. Flags (session `flags`; add a few words after a colon)

| Flag | Use when |
|---|---|
| `no_mars_data` | the heading has no Mars measurement (it happens in vol X, where the OCR finder guessed) |
| `extra_session_not_in_worklist` | you found a Mars heading on your pages that the worklist does not list: transcribe it |
| `worklist_leaf_wrong` | the heading is on another leaf |
| `star_name_conflict` | the table header and the reduction name different stars (the known case is p.441, 1595 Jul 22: header "ab ore Peg." (Enif), reduction "prima alae Peg." (Markab), with Tycho's printed RA/Dec = Markab). Use the star whose printed coordinates match, and keep both names in `name_on_page` |
| `clock_slip_suspected` | one clock-star column jumps by about 1° against the others (vol XII p.447: three Vultur readings exactly 1° high). Transcribe what is printed; do not fix it |
| `altitudes_suspect` | an "Altit." column changes faster than the clock (on Oct 25 1595 the printed Mars altitudes rose about 10°/h, which is impossible there). Transcribe them, flag them; the reducer does not use bare altitudes |
| `copy_codex_K` | every 1593 session. Dreyer printed 1593 from codex K, a copy of the lost 1593 volume, and calls its copyist not always reliable |
| `dreyer_correction` | a footnote corrects a printed number |
| `time_basis_uncertain`, `site_uncertain`, `calendar_note` | as named |
| `illegible:<what>` | a value cannot be read even on a crop |
| `long_session` | the measurements span more than 2 h |

## 9. Confidence, per cell

| Code | Meaning |
|---|---|
| **H** | the digits and fraction are unambiguous on a full-resolution crop |
| **M** | readable, but a small fraction glyph (⅙ vs ⅚ vs ⅛), a broken type, or a value whose column you had to infer |
| **L** | a guess, a value Dreyer marks "dubia" or questions, or a column you are unsure of |

Give `conf` for each field you filled: `"conf": {"t": "H", "dist": "H", "dec_mars": "M", "clock": "H"}`. For a list
(`dec_mars`), one code covers the list, so use the worst one.

## 10. Known traps (all found on real pages)

1. **Clock-star columns are hour angles, not altitudes** (§3c).
2. **A header can name the wrong star** (§8 `star_name_conflict`). Check against printed coordinates.
3. **1° slips in clock readings** (§8). Never fix them.
4. **Printed Mars altitudes may be unusable** for timing (§8). Transcribe them anyway.
5. **1593** is a copy (§8 `copy_codex_K`).
6. **After 1597 the site changes**, and the calendar may too: Bohemia appears Gregorian (§3e).
7. **Astronomical hours past 12** ("H. 16 M. 40 P.M.") are the next civil morning. Keep `time_basis: from_noon`.
8. **"Nocte quae praecedebat X"** belongs to the night before X: set `night_before: true` and keep X as the date.
9. **Fixed-star blocks inside a year** (e.g. "ALTITUDINES MERIDIANÆ & DISTANTIÆ FIXARUM", vol XIII p.182) are not Mars. If the
   worklist sends you there, flag `no_mars_data`.
10. **The worklist's printed page is a guess.** Read the running head.
11. **Distances repeated "bis"** (`repeat_count`) are one row, not two.
12. **A distance of ♂ to a planet** ("a ♃", "a ♄", "a ☾") is `body_dist`, not a star.
13. **"Pone ..." / "limitata" values** are the observers' adopted values (`adopted: true`), not new measurements.
14. **Tables split by Dreyer across columns or pages** continue the same session. Cite every page.

## 11. Handing in

- `validate.py` must report 0 errors.
- Every session in your chunk must be present, with `no_mars_data` if empty.
- Report:
  - the sessions done;
  - the flags you set and how often;
  - the extra sessions you found;
  - your total minutes;
  - three sessions you are least sure of, and why.
- Do not run `reduce.py`, and do not compare your numbers with anything. The coordinator merges the chunks
  (`validate.py --merge transcriptions/chunk*.json`) and runs the reducer. About 1 session in 10 is re-read independently, and
  the owner spot-checks a sample against the images.
