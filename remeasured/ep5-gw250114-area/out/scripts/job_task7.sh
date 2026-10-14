set -x
set -o pipefail
date -u +%s > t_start
D=~/remeasured/ep5/data
tail -n +3 gwosc_CHECKSUMS.tsv | grep GW250114 | while IFS=$'\t' read ev ifo fn nbytes md5 sha url; do
  [ -f $D/$fn ] || curl -sS -L --retry 5 -o $D/$fn "$url"
  echo "$sha  $D/$fn" | sha256sum -c - || exit 3; ln -sf $D/$fn ./$fn; done || exit 3
source ~/remeasured/venv-ringdown/bin/activate
export XLA_FLAGS="--xla_cpu_multi_thread_eigen=false"
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=4 MKL_NUM_THREADS=4 NUMEXPR_NUM_THREADS=4
{ date -u; nproc; uptime; free -g; } > box_state_start.txt
printf '%s\n' GW250114_220221_10p5M GW250114_220221_12M GW250114_220221_13M GW250114_220221_15M GW250114_220221_18M GW250114_220330_10p5M GW250114_220330_12M GW250114_220330_13M GW250114_220330_15M GW250114_220330_18M \
  | xargs -P 3 -I{} sh -c 'date -u +"%s start {}" >> fit_times.txt; /usr/bin/time -v python ringdown_fit.py {} cfg_{}.json > {}.log 2>&1; rc=$?; echo "$(date -u +%s) end {} rc=$rc" >> fit_times.txt'
date -u +%s > t_end
{ date -u; uptime; free -g; } > box_state_end.txt
grep -h "^DONE" *.log | cut -c1-240
