"""Weighting variants, including the weighting of Newcomb's final solution (Astron. Papers vol. 1, p. 457,
items I-III), as linear re-solves around the saved solutions (same Jacobian). Light on CPU.
  Part I weights      : the weights printed on pp. 451-452 (as fitted)
  May x2 only         : every May-transit weight doubled
  Newcomb final       : May x2, 1740 II, 1786 II and 1756 removed, 1677 kept as is
  Newcomb final -1677 : the same, with all 1677 contacts dropped
Reads out/fit_arrays.npz (main run) and, if present, out/fit_time_wide.npz (converged time-form fit).
Writes out/variants_newcomb_final.json."""
import json, math, os, sys
import numpy as np
sys.path.insert(0, os.path.dirname(__file__))
import fit as F

SETS = {}
def weights():
    W, Y, M, K = F.W.copy(), F.YEAR, F.MONTH, np.array(F.KINDS)
    may2 = np.where(M == "May", 2 * W, W)
    final = may2.copy()
    final[(Y == 1740) & (K == "II")] = 0.0
    final[(Y == 1786) & (K == "II")] = 0.0
    final[Y == 1756] = 0.0
    no1677 = np.where(Y == 1677, 0.0, final)
    return {"Part I weights (as fitted)": W, "May x2 only": may2,
            "Newcomb final weighting": final, "Newcomb final weighting, 1677 dropped": no1677}

def resolve(A, y, D0, w):
    sol, cov, res, s2 = F.solve_linear(A, y, w)
    return {"D": float(D0 + sol[6]), "sigma_D": float(math.sqrt(cov[6, 6])), "n": int(np.sum(w > 0))}

if __name__ == "__main__":
    R = json.load(open(F.OUT / "fit_results.json"))
    arr = np.load(F.OUT / "fit_arrays.npz")
    out = {}
    src = {"time (main-run point)": (arr["A_historical_time"], arr["res_historical_time"], R["historical_time"]["D"]),
           "radial": (arr["A_historical_radial"], arr["res_historical_radial"], R["historical_radial"]["D"])}
    wide = F.OUT / "fit_time_wide.npz"
    if wide.exists():
        Rw = json.load(open(F.OUT / "fit_time_wide_headline.json"))  # headline = converged, model-evaluated point
        z = np.load(wide)
        src = {"time (converged wide fit)": (z["A"], z["res"], Rw["D"]), **src}
    for name, (A, y, D0) in src.items():
        out[name] = {k: resolve(A, y, D0, w) for k, w in weights().items()}
        print(name, json.dumps(out[name], indent=1))
    json.dump(out, open(F.OUT / "variants_newcomb_final.json", "w"), indent=1)
