"""Headline of the pre-registered time-offset form, from the converged wide fit (out/fit_time_wide.json).
fit_time_wide.py stops when the proposed change of D is below 0.005 "/cy. Its JSON stores the parameters after one
more *linear* step (D + dyn_remainder). In this flat valley that extrapolation is not reliable: evaluating the
model there gives a weighted rms of 8.299 s against 8.182 s at the converged point (this script re-evaluates both).
So the headline D is the converged, model-evaluated point; sigma_D is the formal sigma from the Jacobian at that
point. Variants are re-solved linearly around it (differences relative to the Part I solution, added to the
headline). Run with EP3_WIDE=1 (the contact search window must match). Writes out/fit_time_wide_headline.json."""
import json, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F, nbody as N

if __name__ == "__main__":
    assert os.environ.get("EP3_WIDE")
    s = json.load(open(F.OUT / "fit_time_wide.json"))
    R = json.load(open(F.OUT / "fit_results.json"))
    z = np.load(F.OUT / "fit_time_wide.npz")
    cpd = R["calibration"]["c_per_D"]
    G = F.T_OBS["jd_tt_horizons"]
    tables = N.earth_tables(G)
    p_lin = np.array([s["params"][n] for n in F.NAMES[:7]])
    p_eval = p_lin - np.array(s["dyn_remainder"])
    F._init(F.STATES, F.KINDS, G, tables, cpd)
    X = F.offsets_matrix("time")
    wr = {}
    for lab, q in (("converged_point", p_eval), ("after_linear_step", p_lin)):
        wr[lab] = {"D": float(q[6]), "wrms_s": F._project((F.T_OBS["jd_tt_obs_em"] - F._model(q)) * 86400, X, F.W)}
    out = {"D": wr["converged_point"]["D"], "sigma_D": s["sigma_D"], "wrms_s": wr["converged_point"]["wrms_s"],
           "evaluations": wr, "linear_step_D_in_fit_time_wide_json": s["D"]}
    p_full = np.concatenate([p_eval, [s["params"][n] for n in F.NAMES[7:]]])
    dT_shift = (F.T_OBS["jd_tt_obs_hz"] - F.T_OBS["jd_tt_obs_em"]) * 86400
    f = {"A": z["A"], "res": z["res"], "p": p_full}
    # variants() returns pH[6] + shift; shifts are relative to the Part I solution, so they are anchored here
    # at the headline instead of at the linear-step point
    v = F.variants(f, "time", dT_shift)
    out["variants"] = v
    json.dump(out, open(F.OUT / "fit_time_wide_headline.json", "w"), indent=1)
    print(json.dumps({k: x for k, x in out.items() if k != "variants"}, indent=1))
    print(json.dumps({k: (x if not isinstance(x, dict) else {a: b for a, b in x.items() if a != "values"}) for k, x in v.items()}, indent=1))
