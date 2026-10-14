#!/usr/bin/env python
"""Task 7 local parts (STATUS S9, pre-registered): (2) lane-choice rule, (3) why our A_i exceeds LVK's -40 t_M A_i,
(4) f_c check and +-10% proxy sensitivity of P(dA>0). Inputs: both pre-merger lanes; LVK release (Zenodo 10.5281/zenodo.16877102;
cited): data/pre_-40M_with_lnL_cut.dat, data/area_law_inspiral_data.hdf5, data/signal_median_time_domain_waveform_H1.dat,
posterior_samples_PhenomXPHM.h5; lane-2 rule premerger/scripts/fc_rule.py + results/fc_rule.json; our ringdown posteriors.
Writes results/area_task7_local.json and results/area_task7_fc_proxy.csv."""
import os, sys, json, h5py, importlib.util, numpy as np, pandas as pd
from scipy.signal import hilbert
from scipy.ndimage import uniform_filter1d
from scipy.stats import norm
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
from combine_area import area, load_table, sha256, G, c, MSUN
from area_task4 import P_gt
OUT = os.path.abspath(os.path.join(HERE, "..")); ROOT = os.path.join(OUT, ".."); REL = os.path.join(ROOT, "data", "zenodo_16877102")
L1P = os.path.join(ROOT, "premerger-box", "GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000", "GW250114_082203_IMRPhenomXPHM_fmax131_full_nlive1000_result.json")
L2P = os.path.join(ROOT, "premerger", "samples", "GW250114_082203_premerger_posterior.csv.gz")
rng = np.random.default_rng(714)
def comp(T, k1="mass_1", k2="mass_2", s1="a_1", s2="a_2"):
    return dict(m1=np.asarray(T[k1], float), m2=np.asarray(T[k2], float), a1=np.asarray(T[s1], float), a2=np.asarray(T[s2], float))
Ai = lambda d: area(d["m1"], d["a1"]) + area(d["m2"], d["a2"])
q = lambda x, p: float(np.quantile(x, p))
lane1 = comp(load_table(L1P, "auto", None)); lane2 = comp(pd.read_csv(L2P))
LV = pd.read_csv(os.path.join(REL, "release", "data", "pre_-40M_with_lnL_cut.dat"), sep=r"\s+"); lvk = comp(LV, s1="spin1_magnitude", s2="spin2_magnitude")
out = {"inputs": {k: sha256(p) for k, p in [("lane1", L1P), ("lane2", L2P), ("lvk_pre_-40M", os.path.join(REL, "release", "data", "pre_-40M_with_lnL_cut.dat")),
                                              ("lvk_inspiral_areas", os.path.join(REL, "release", "data", "area_law_inspiral_data.hdf5")),
                                              ("lvk_median_waveform_H1", os.path.join(REL, "release", "data", "signal_median_time_domain_waveform_H1.dat")),
                                              ("lvk_XPHM_posterior", os.path.join(REL, "posterior_samples_PhenomXPHM.h5"))]}, "script_sha256": sha256(__file__)}
# (2) lane rule
A1, A2 = Ai(lane1), Ai(lane2)
w1, w2 = (q(A1, .84) - q(A1, .16)) / 2, (q(A2, .84) - q(A2, .16)) / 2
out["lane_rule"] = dict(Ai_med_lane1=float(np.median(A1)), Ai_med_lane2=float(np.median(A2)), sigma_lane1=w1, sigma_lane2=w2,
                        diff=float(abs(np.median(A1) - np.median(A2))), larger_sigma=max(w1, w2), use_both=bool(abs(np.median(A1) - np.median(A2)) > max(w1, w2)))
# (3) hypotheses
def swap(ms, ss, n=400000):
    i = rng.integers(0, len(ms["m1"]), n); j = rng.integers(0, len(ss["a1"]), n)
    return area(ms["m1"][i], ss["a1"][j]) + area(ms["m2"][i], ss["a2"][j])
summ = {}
for nm, d in (("lane1", lane1), ("lane2", lane2), ("lvk_-40tM", lvk)):
    summ[nm] = dict(Mtot_med=float(np.median(d["m1"] + d["m2"])), q_med=float(np.median(d["m2"] / d["m1"])), m1_med=float(np.median(d["m1"])), m2_med=float(np.median(d["m2"])),
                    a1_med=float(np.median(d["a1"])), a2_med=float(np.median(d["a2"])), Ai_med_1e11=float(np.median(Ai(d))) / 1e11)
H2 = {"lane1_m_lane1_a": swap(lane1, lane1), "lane1_m_lvk_a": swap(lane1, lvk), "lvk_m_lane1_a": swap(lvk, lane1), "lvk_m_lvk_a": swap(lvk, lvk)}
H2 = {k: float(np.median(v)) / 1e11 for k, v in H2.items()}
w = (1 + lane1["m2"] / lane1["m1"]) ** 2 / (lane1["m1"] + lane1["m2"]); w /= w.sum()      # uniform-in-components -> uniform in (M_tot, q)
o = np.argsort(A1); H4 = dict(Ai_med_reweighted_to_uniform_Mq_1e11=float(A1[o][np.searchsorted(np.cumsum(w[o]), 0.5)]) / 1e11, ess=float(1 / np.sum(w**2)))
U = (MSUN * G / c**2) ** 2
f = h5py.File(os.path.join(REL, "release", "data", "area_law_inspiral_data.hdf5"), "r"); times = f["times"][:]
scan = {int(t): float(np.median(f[f"area_insp_{k}"][:] * U)) / 1e11 for k, t in enumerate(times)}
W = np.loadtxt(os.path.join(REL, "release", "data", "signal_median_time_domain_waveform_H1.dat")); t, h = W[:, 0], W[:, 1]; dt = t[1] - t[0]
an = hilbert(h); ipk = int(np.argmax(np.abs(an))); fi = uniform_filter1d(np.gradient(np.unwrap(np.angle(an)), dt) / (2 * np.pi), 9)
tM = 71.84887420410978 * MSUN * G / c**3        # M_tot used by the release (compute_inspiral_area.py; cited)
f_at = lambda n: float(fi[ipk + int(round(n * tM / dt))])
seg = slice(ipk - int(0.2 / dt), ipk); tt = (np.arange(len(fi))[seg] - ipk) * dt / tM; ff = fi[seg]
t_of_f = lambda fc: float(tt[np.where(ff < fc)[0][-1]])
spec = importlib.util.spec_from_file_location("fc", os.path.join(ROOT, "premerger", "scripts", "fc_rule.py")); fcm = importlib.util.module_from_spec(spec); spec.loader.exec_module(fcm)
FJ = json.load(open(os.path.join(ROOT, "premerger", "results", "fc_rule.json")))
X = h5py.File(os.path.join(REL, "posterior_samples_PhenomXPHM.h5"), "r")["bilby-IMRPhenomXPHM-SpinTaylor_prod-reweighted"]["posterior_samples"]
xmed = {k: float(np.median(X[n])) for k, n in [("m1", "mass_1"), ("m2", "mass_2"), ("a1", "a_1"), ("a2", "a_2"), ("tilt1", "tilt_1"), ("tilt2", "tilt_2"), ("phi12", "phi_12")]}
fc = fcm.fc_from_medians(**xmed)
out["hypotheses"] = dict(summaries=summ, H2_median_swaps_1e11=H2, H4=H4, H3=dict(lvk_Ai_median_vs_truncation_tM=scan, f_inst_Hz={"-100": f_at(-100), "-50": f_at(-50), "-40": f_at(-40), "-30": f_at(-30), "0": f_at(0)},
                    t_of_f_tM={"118.1": t_of_f(0.9 * fc), "131.23": t_of_f(fc), "144.4": t_of_f(1.1 * fc)}))
out["fc"] = dict(fc_json=FJ["GW250114_082203"]["f_c_Hz"], fc_recomputed_from_json_medians=fcm.fc_from_medians(**FJ["GW250114_082203"]["medians"]), fc_from_XPHM_file_medians=fc,
                 XPHM_file_medians=xmed, GW150914_validation=dict(script=FJ["GW150914"]["f_c_Hz"], published=FJ["GW150914"]["published_f_c_Hz"]))
# (4) proxy: f_c +-10% -> truncation time -> fractional change of LVK A_i median (linear interpolation in their scan) -> scale our A_i
ts = np.array(sorted(scan)); As = np.array([scan[k] for k in ts]); Aint = lambda x: float(np.interp(x, ts, As))
tc = out["hypotheses"]["H3"]["t_of_f_tM"]; base = Aint(tc["131.23"])
fac = {"-10%": Aint(tc["118.1"]) / base, "+10%": Aint(tc["144.4"]) / base}
out["fc_proxy_factors"] = fac
RD = os.path.join(OUT, "results", "ringdown"); rows = []
cells = [(10.5, "", "V0"), (10.5, "_nohp", "V1"), (10.5, "_pePSD", "V2"), (12, "", "V0"), (12, "_nohp", "V1"), (12, "_pePSD", "V2"), (13, "", "V0"), (13, "_nohp", "V1"), (13, "_pePSD", "V2"),
         (15, "", "V0"), (15, "_nohp", "V1"), (18, "", "V0"), (18, "_nohp", "V1"), (20, "", "V0"), (20, "_nohp", "V1")]
for tstart, sfx, v in cells:
    lab = f"GW250114_220_{tstart:g}".replace(".", "p") + "M" + sfx; R = np.load(os.path.join(RD, lab + "_posterior.npz")); Af = area(R["m"], R["chi"])
    r = dict(start_Mf=tstart, variant=v, label=lab)
    for nm, k in (("nominal", 1.0), ("fc_minus10", fac["-10%"]), ("fc_plus10", fac["+10%"])):
        r["P_" + nm] = P_gt(np.sort(A1 * k), Af)
    rows.append(r)
D = pd.DataFrame(rows); D.to_csv(os.path.join(OUT, "results", "area_task7_fc_proxy.csv"), index=False, float_format="%.6g")
out["fc_proxy_Pmin"] = {k: float(D[k].min()) for k in ("P_nominal", "P_fc_minus10", "P_fc_plus10")}
json.dump(out, open(os.path.join(OUT, "results", "area_task7_local.json"), "w"), indent=1)
print(json.dumps({k: out[k] for k in ("lane_rule", "fc", "fc_proxy_factors", "fc_proxy_Pmin")}, indent=0))
print(json.dumps(out["hypotheses"]["H2_median_swaps_1e11"]), json.dumps(out["hypotheses"]["H4"]), json.dumps(out["hypotheses"]["H3"]["f_inst_Hz"]), json.dumps(out["hypotheses"]["H3"]["t_of_f_tM"]))
print(pd.DataFrame(summ).round(3).to_string()); print(D.round(4).to_string(index=False))
