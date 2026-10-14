#!/usr/bin/env bash
# Episode 3 data fetch. Everything lands in data/ (gitignored). Verify with: shasum -a 256 -c SHA256SUMS
# Source volume: Simon Newcomb, "Discussion of observed transits of Mercury, 1677-1881",
# Astronomical Papers prepared for the use of the American Ephemeris and Nautical Almanac, vol. 1, part VI
# (Washington: Bureau of Navigation, 1882), pp. 363-487. US government work, public domain.
# Scan: Google Books scan of the Oxford University copy, archive.org item astronomicalpap00newcgoog
# (the item 01Astronomicalpap00newcgoog carries the identical PDF; archive.org sha1 of the PDF in both:
#  9749819712d6de7db321811997d81eabe070bb3d). PDF page index (0-based) = printed page + 31.
# The system curl is used because the Python/anaconda CA bundle on the owner's Mac rejects these TLS chains.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/src data/ref
C=/usr/bin/curl
$C -sfL -o data/src/vol1.pdf      https://archive.org/download/astronomicalpap00newcgoog/astronomicalpap00newcgoog.pdf
$C -sfL -o data/src/vol1_djvu.txt https://archive.org/download/astronomicalpap00newcgoog/astronomicalpap00newcgoog_djvu.txt
# Vol. 6 (1898) OCR, fetched only to rule it out: it holds Newcomb's Tables of Mercury, not the observed contacts.
$C -sfL -o data/src/vol6_djvu.txt https://archive.org/download/06AstronomicalPapersPreparedForTheUse/06-Astronomical_Papers_Prepared_for_the_Use_djvu.txt
# Delta T polynomials (Espenak & Meeus 2006, from Morrison & Stephenson 2004)
$C -sfL -o data/ref/deltatpoly2004.html https://eclipse.gsfc.nasa.gov/SEhelp/deltatpoly2004.html
# NASA/GSFC Mercury transit catalog (cross-check of dates) and the 2006 transit page (finder validation)
$C -sfL -o data/ref/MercuryCatalog.html https://eclipse.gsfc.nasa.gov/transit/catalog/MercuryCatalog.html
$C -sfL -o data/ref/transit06.html      https://eclipse.gsfc.nasa.gov/OH/transit06.html
# JPL Horizons (DE441) responses are fetched and cached by scripts/hz.py into data/horizons/ when
# scripts/validate_2006.py and scripts/run_killtest.py run. Their text carries a generation timestamp, so their
# checksums (SHA256SUMS.horizons) document this run rather than a re-fetch.
# Page images used for reading: data/pages/ is regenerated with scripts/crop.py from data/src/vol1.pdf.
echo "fetched; now: shasum -a 256 -c SHA256SUMS"
