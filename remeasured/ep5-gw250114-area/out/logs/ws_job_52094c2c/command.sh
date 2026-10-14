set -x
set -o pipefail
date -u +%s > t_start
D=~/remeasured/ep5/data
for ck in gwosc_CHECKSUMS_16k.tsv gwosc_CHECKSUMS_16k_R1.tsv; do
  tail -n +3 $ck | grep GW150914 | while IFS=$'\t' read ev ifo fn nbytes md5 sha url; do
    [ -f $D/$fn ] || curl -sS -L --retry 5 -o $D/$fn "$url"
    echo "$sha  $D/$fn" | sha256sum -c - || exit 3; ln -sf $D/$fn ./$fn; done || exit 3
done
source ~/remeasured/venv-ringdown/bin/activate
# shared box (owner's bilby run uses ~19 of 32 cores): at most 2 fits at once, threads capped per fit
export XLA_FLAGS="--xla_cpu_multi_thread_eigen=false"
export OMP_NUM_THREADS=4 OPENBLAS_NUM_THREADS=4 MKL_NUM_THREADS=4 NUMEXPR_NUM_THREADS=4
python -c "import numpyro; numpyro.set_host_device_count(8); import jax, os; print('xla preflight ok', jax.devices()[:2], os.environ['XLA_FLAGS'])" || exit 4
{ date -u; nproc; uptime; free -g; } > box_state_start.txt
python test_their_ini_rd110.py config-ds8.ini > T3_parse_test.log 2>&1; echo "parse test exit $?" >> T3_parse_test.log
printf '%s\n' T3_A0_theirs_ds1 T3_A0_theirs_ds8 T3_A1a_acf_fd T3_A1b_acf_slice128 T3_A2_amp_marg T3_A3_pol_generic T3_A4a_digfilt T3_A4b_mmax150 T3_A4c_dataV1 T3_B1_acf_theirs T3_B2_amp_theirs T3_B3_pol_theirs T3_B4_digfilt_off \
  | xargs -P 2 -I{} sh -c 'date -u +"%s start {}" >> fit_times.txt; /usr/bin/time -v python ringdown_fit.py {} cfg_{}.json > {}.log 2>&1; rc=$?; echo "$(date -u +%s) end {} rc=$rc" >> fit_times.txt'
date -u +%s > t_end
{ date -u; uptime; free -g; } > box_state_end.txt
grep -h "^DONE" *.log | cut -c1-240
grep -h "FAILED\|unknown model\|Error" T3_parse_test.log | head -20
