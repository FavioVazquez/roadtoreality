#!/usr/bin/env bash
# Cited LVK posterior releases used ONLY to set the inspiral cutoff f_c by the LVK rule (scripts/fc_rule.py)
# and for the GW150914 comparison. Not committed (data/ is git-ignored); checksums in SHA256SUMS.reference.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p data/reference
get() { [ -s "data/reference/$2" ] || curl -fL --retry 3 -o "data/reference/$2" "$1"; }
get https://dcc.ligo.org/public/0157/P1800370/005/GW150914_GWTC-1.hdf5 GW150914_GWTC-1.hdf5               # GWTC-1 PE, CC BY 4.0
get "https://zenodo.org/api/records/16877102/files/posterior_samples_PhenomXPHM.h5/content" GW250114_posterior_samples_PhenomXPHM.h5  # CC BY 4.0
[ -f SHA256SUMS.reference ] && (cd data/reference && sha256sum -c ../../SHA256SUMS.reference)
