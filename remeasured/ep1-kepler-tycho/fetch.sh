#!/usr/bin/env bash
# Episode 1 kill test: re-download every input into data/ (gitignored), then check SHA256SUMS.
# Sources: Dreyer (ed.), Tychonis Brahe Dani Opera Omnia, vols 10-13 (Copenhagen 1913-1926), public domain,
# University of Toronto scans on archive.org (identifiers operaomniaedidit{10..13}brahuoft).
# Page images: https://archive.org/download/<id>/page/n<N>.jpg, where N is the position of the leaf in
# <id>_page_numbers.json (see locate.py). Printed page numbers were read on the images themselves.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/ocr data/pages data/catalog
get() { # url out
  [ -s "$2" ] && return 0
  for i in 1 2 3 4 5; do curl -sfL -o "$2" "$1" && return 0; sleep 3; done
  echo "FAILED $1" >&2; return 1
}
for v in 10 11 12 13; do
  id=operaomniaedidit${v}brahuoft
  get "https://archive.org/download/$id/${id}_djvu.txt"                 data/ocr/v$v.txt
  get "https://archive.org/download/$id/${id}_page_numbers.json"        data/ocr/v${v}_pages.json
  get "https://archive.org/download/$id/${id}_hocr_searchtext.txt.gz"   data/ocr/v${v}_search.txt.gz
  get "https://archive.org/download/$id/${id}_hocr_pageindex.json.gz"   data/ocr/v${v}_pageidx.json.gz
  gunzip -kf data/ocr/v${v}_search.txt.gz data/ocr/v${v}_pageidx.json.gz
done

# Page images used in the kill test: "vol n leaf printed-page"
while read -r v n leaf page; do
  [ -z "$v" ] && continue
  get "https://archive.org/download/operaomniaedidit${v}brahuoft/page/n${n}.jpg" "data/pages/v${v}_p${page}_leaf${leaf}.jpg"
done <<'EOF'
12 454 491 441
12 455 492 442
12 459 496 446
12 460 497 447
12 461 498 448
10 216 217 175
11 196 197 183
13 261 262 244
EOF

# Tycho's star catalogue, Verbunt & van Gent 2010 (A&A 516, A28; arXiv 1003.3836), CDS J/A+A/516/A28
get "https://cdsarc.cds.unistra.fr/ftp/J/A+A/516/A28/ReadMe"    data/catalog/ReadMe
get "https://cdsarc.cds.unistra.fr/ftp/J/A+A/516/A28/keplere.dat" data/catalog/keplere.dat
get "https://cdsarc.cds.unistra.fr/ftp/J/A+A/516/A28/names.dat"   data/catalog/names.dat
get "https://cdsarc.cds.unistra.fr/ftp/J/A+A/516/A28/variant.dat" data/catalog/variant.dat

# Hipparcos (new reduction, van Leeuwen 2007, CDS I/311) for the reference and clock stars
mkdir -p data/hip
get "https://vizier.cds.unistra.fr/viz-bin/asu-tsv?-source=I/311/hip2&-out=HIP,RArad,DErad,Plx,pmRA,pmDE,Hpmag&HIP=21421,9884,15863,113963,97649,107315,80763,65474,30438,37279,36850" data/hip/hip2_refstars.tsv

# JPL Horizons replies are fetched by reduce.py and legibility.py into data/horizons/ (raw text kept).
# Note: Horizons and VizieR stamp the query time into their replies, so a fresh download of those files will not
# match SHA256SUMS byte for byte; compare the numbers instead (the archive.org and CDS files must match exactly).
# Strict check for the archive.org and CDS files; Horizons and VizieR replies are stamped with the query time, so they
# are listed for information only (fetch them with reduce.py / legibility.py and compare the numbers).
grep -v -E '  data/(horizons|hip)/' SHA256SUMS | shasum -a 256 -c
echo "(informational, query-time stamped:)"; grep -E '  data/(horizons|hip)/' SHA256SUMS | sed 's/^/  /'
