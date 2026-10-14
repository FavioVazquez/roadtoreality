#!/usr/bin/env bash
# usage: scripts/launch.sh <EVENT> <FMAX> [extra args]; logs to logs/<EVENT>_run.log (with /usr/bin/time -v)
set -euo pipefail
cd "$(dirname "$0")/.."
ev=$1; fmax=$2; shift 2
export OMP_NUM_THREADS=1 MKL_NUM_THREADS=1 OPENBLAS_NUM_THREADS=1
PY=${PY:-$HOME/venvs/bilby/bin/python}
nohup /usr/bin/time -v "$PY" scripts/run_premerger.py --event "$ev" --fmax "$fmax" "$@" > "logs/${ev}_run.log" 2>&1 &
echo "pid $!"
