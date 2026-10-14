#!/usr/bin/env bash
# Download the GWOSC open strain (CC BY 4.0) used by this lane into ./data and verify it against SHA256SUMS.
# Data are never committed (see remeasured/PROTOCOL.md rule 4).
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data
urls=(
  # GW150914, GWTC-1-confident v3, 4 kHz, 4096 s
  https://gwosc.org/eventapi/json/GWTC-1-confident/GW150914/v3/H-H1_GWOSC_4KHZ_R1-1126257415-4096.hdf5
  https://gwosc.org/eventapi/json/GWTC-1-confident/GW150914/v3/L-L1_GWOSC_4KHZ_R1-1126257415-4096.hdf5
  # GW250114_082203, O4b bulk release, 4 kHz, 4096 s (URLs from gwosc.locate.get_event_urls)
  https://gwosc.org/archive/data/O4b_4KHZ_R1/1420820480/H-H1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5
  https://gwosc.org/archive/data/O4b_4KHZ_R1/1420820480/L-L1_GWOSC_O4b_4KHZ_R1-1420877824-4096.hdf5
)
for u in "${urls[@]}"; do
  f="data/$(basename "$u")"
  [ -s "$f" ] || curl -fL --retry 3 -o "$f" "$u"
done
if [ -f SHA256SUMS ]; then
  (cd data && sha256sum -c ../SHA256SUMS)
fi
