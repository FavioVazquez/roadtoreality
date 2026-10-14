#!/usr/bin/env bash
# Episode 2 kill test: re-download every input into data/ (gitignored), then check SHA256SUMS.
# All historical sources are public domain scans on archive.org:
#   P1687  philosophiaenat00newt            Principia, 1st ed. 1687 (Smithsonian / Dibner copy)
#   P1726  A297190                          Principia, 3rd ed. 1726 (Universidad de Sevilla copy)
#   M1729  bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2   Motte's translation, vol. II (ECCO)
#   PIC    mesure-de-la-terre-par-...-picard-jean-btv-1b-7300361b   Picard, Mesure de la Terre 1671 (BnF Gallica btv1b7300361b)
#   HUY    gpl_3536690                      Huygens, Horologium Oscillatorium 1673 (George Peabody Library)
# Page images: https://archive.org/download/<id>/page/n<N>.jpg ; N = image index (see transcription.json, scripts/locate.py).
# Modern: JPL SSD satellite mean elements and planetary physical parameters; JPL Horizons API (object data, Galilean vectors).
# The system curl is used for JPL because the anaconda curl/CA bundle on the owner's Mac rejects the TLS chain.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/ocr data/pages data/modern
C=/usr/bin/curl
get() { # url out
  [ -s "$2" ] && return 0
  for i in 1 2 3 4 5; do $C -sfL -o "$2" "$1" && return 0; sleep 3; done
  echo "FAILED $1" >&2; return 1
}
PIC='mesure-de-la-terre-par-...-picard-jean-btv-1b-7300361b'
PICF='Mesure_de_la_terre_%5Bpar_%5B...%5DPicard_Jean_btv1b7300361b'
while read -r key id file; do
  [ -z "$key" ] && continue
  get "https://archive.org/download/$id/${file}_djvu.txt"                 data/ocr/$key.txt
  get "https://archive.org/download/$id/${file}_page_numbers.json"        data/ocr/${key}_pages.json
  get "https://archive.org/download/$id/${file}_hocr_searchtext.txt.gz"   data/ocr/${key}_search.txt.gz
  get "https://archive.org/download/$id/${file}_hocr_pageindex.json.gz"   data/ocr/${key}_pageidx.json.gz
  gunzip -f data/ocr/${key}_search.txt.gz data/ocr/${key}_pageidx.json.gz
done <<EOT
p1687 philosophiaenat00newt philosophiaenat00newt
p1726 A297190 A297190
m1729 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2
picard $PIC $PICF
huy gpl_3536690 gpl_3536690
EOT
# page images used: "out-name id n"
while read -r out id n; do
  [ -z "$out" ] && continue
  get "https://archive.org/download/$id/page/n$n.jpg" "data/pages/$out.jpg"
done <<EOT
p1687_n399 philosophiaenat00newt 399
p1687_n400 philosophiaenat00newt 400
p1687_n403 philosophiaenat00newt 403
p1687_n404 philosophiaenat00newt 404
p1726_n182 A297190 182
p1726_n431 A297190 431
p1726_n432 A297190 432
p1726_n437 A297190 437
p1726_n438 A297190 438
p1726_n454 A297190 454
m1729_n229 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2 229
m1729_n230 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2 230
m1729_n239 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2 239
m1729_n240 bim_eighteenth-century_principia-english-th_newton-sir-isaac_1729_2 240
picard_n15 $PIC 15
picard_n41 $PIC 41
huy_n173 gpl_3536690 173
huy_n176 gpl_3536690 176
EOT
# modern
get "https://ssd.jpl.nasa.gov/sats/elem/sep.html"      data/modern/jpl_sat_elem_sep.html
get "https://ssd.jpl.nasa.gov/sats/phys_par/sep.html"  data/modern/jpl_sat_phys_sep.html
get "https://ssd.jpl.nasa.gov/planets/phys_par.html"   data/modern/jpl_planet_phys.html
H="https://ssd.jpl.nasa.gov/api/horizons.api?format=text"
for b in 301 399 501 502 503 504 599; do
  get "$H&COMMAND='$b'&OBJ_DATA=YES&MAKE_EPHEM=NO" data/modern/horizons_obj_$b.txt
done
for b in 501 502 503 504; do
  get "$H&COMMAND='$b'&OBJ_DATA=NO&MAKE_EPHEM=YES&EPHEM_TYPE=VECTORS&CENTER='500@599'&START_TIME='2000-01-01'&STOP_TIME='2004-01-01'&STEP_SIZE='6%20h'&VEC_TABLE='1'&CSV_FORMAT=YES&REF_PLANE=ECLIPTIC" data/modern/horizons_vec_$b.txt
done
# The JPL HTML pages are live documents and may change; the SHA256SUMS record the copies used on 2026-10-13.
shasum -a 256 -c SHA256SUMS
