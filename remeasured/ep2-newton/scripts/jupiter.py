"""Episode 2, Part 2: the period-distance power law of Jupiter's satellites from Newton's tables.

Reads only ../transcription.json and the JPL/Horizons files in ../data/modern. Fits T = C a^p with p free.
Excluded from every fit, because they are outputs of the law under test: Newton's "ex temporibus periodicis" row,
and Pound's 1st and 2nd elongations (derived "ex temporibus periodicis", 1726 p.391).

Run: .venv/bin/python -I scripts/jupiter.py  -> out/jupiter.json and out/jupiter_log.txt
"""
import json, math, re, html as htmlmod, pathlib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
TR = json.loads((ROOT / "transcription.json").read_text())["jupiter"]
MOD = ROOT / "data" / "modern"
log = []
def say(*a):
    s = " ".join(str(x) for x in a); print(s); log.append(s)

def frac(x):
    return x[0] + x[1] / x[2] if isinstance(x, list) else float(x)

def period_days(p):
    m = frac(p.get("m", 0))
    return p["d"] + p["h"] / 24 + m / 1440 + p.get("s", 0) / 86400

def ols(x, y):
    """y = a + b x; returns b, se_b, residual rms"""
    X = np.vstack([np.ones_like(x), x]).T
    beta, *_ = np.linalg.lstsq(X, y, rcond=None)
    r = y - X @ beta
    dof = len(x) - 2
    s2 = (r @ r) / dof
    cov = s2 * np.linalg.inv(X.T @ X)
    return beta[1], math.sqrt(cov[1, 1]), math.sqrt((r @ r) / len(x))

def pooled(groups):
    """common slope, one intercept per observer; groups: list of (x, y)"""
    xs = np.concatenate([g[0] for g in groups]); ys = np.concatenate([g[1] for g in groups])
    cols = []
    for i, g in enumerate(groups):
        c = np.zeros(len(xs)); off = sum(len(h[0]) for h in groups[:i]); c[off:off + len(g[0])] = 1; cols.append(c)
    X = np.vstack(cols + [xs]).T
    beta, *_ = np.linalg.lstsq(X, ys, rcond=None)
    r = ys - X @ beta; dof = len(xs) - X.shape[1]
    cov = (r @ r) / dof * np.linalg.inv(X.T @ X)
    return beta[-1], math.sqrt(cov[-1, -1]), dof

out = {}
for ed in ("P1687", "P1726"):
    E = TR[ed]
    T = np.array([period_days(p) for p in E["periods"]])
    say(f"== {ed}: periods (d) {', '.join(f'{t:.6f}' for t in T)}  [{E['periods_qualifier']}]")
    lT = np.log(T)
    res = {"periods_d": T.tolist(), "rows": {}}
    groups = []
    for name, row in E["rows"].items():
        a = np.array([frac(v) for v in row["a"]])
        use = np.array(row.get("measured", [True] * 4))
        la = np.log(a[use]); lt = lT[use]
        if use.sum() >= 3:
            b, se_b, rms = ols(lt, la)          # log a on log T (scatter is in a)
            p, se_p = 1 / b, se_b / b ** 2
            q, se_q, _ = ols(la, lt)            # naive log T on log a
            say(f"  {name:28s} a = {', '.join(f'{v:.3f}' for v in a)}  ->  p = {p:.4f} +/- {se_p:.4f} (log a on log T, n={use.sum()});  naive log T on log a: {q:.4f} +/- {se_q:.4f}; rms {rms*100:.2f}% in a")
            res["rows"][name] = {"a": a.tolist(), "used": use.tolist(), "p": p, "se_p": se_p, "p_naive": q, "se_naive": se_q, "rms_log_a": rms}
            groups.append((lt, la))
        else:
            p2 = (lt[1] - lt[0]) / (la[1] - la[0])
            say(f"  {name:28s} a = {', '.join(f'{v:.3f}' for v in a)}  ->  only {use.sum()} measured values (sat. {', '.join(str(i+1) for i in np.where(use)[0])}): two-point p = {p2:.4f}; enters the pooled fit")
            res["rows"][name] = {"a": a.tolist(), "used": use.tolist(), "p_two_point": p2}
            groups.append((lt, la))
    b, se_b, dof = pooled(groups)
    p, se_p = 1 / b, se_b / b ** 2
    say(f"  POOLED (common exponent, one scale per observer, {dof} dof): p = {p:.4f} +/- {se_p:.4f}")
    res["pooled"] = {"p": p, "se_p": se_p, "dof": dof}
    et = np.array(E["ex_temporibus_periodicis"]["a"])
    q, _, rms = ols(np.log(et), lT)
    say(f"  (not a fit: Newton's 'ex temporibus periodicis' row reproduces p = {q:.4f}, rms {rms*1e4:.1f}e-4 -- it was built from the law)")
    res["ex_temporibus_implied_p"] = q
    out[ed] = res

# ---------- modern ----------
say("\n== Modern (JPL SSD mean elements, Laplace plane, epoch 2000-01-01.5, JUP365; Horizons jup365 vectors)")
html = (MOD / "jpl_sat_elem_sep.html").read_text()
txt = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html))
jpl = {}
for nm, code in (("Io", 501), ("Europa", 502), ("Ganymede", 503), ("Callisto", 504)):
    m = re.search(rf"{nm} {code} ([\d.]+) ([\d.]+) [\d.]+ [\d.]+ [\d.]+ [\d.]+ ([\d.]+) ([\d.]+)", txt)
    jpl[nm] = {"a_km": float(m.group(1)), "e": float(m.group(2)), "P_table_d": float(m.group(3)), "P_apsis_yr": float(m.group(4))}
ptxt = re.sub(r"\s+", " ", htmlmod.unescape(re.sub(r"<[^>]+>", " ", (MOD / "jpl_planet_phys.html").read_text())))
R_J = float(re.search(r"Jupiter ([\d.]+) \[ D \]", ptxt).group(1))
R_Jvol = float(re.search(r"Jupiter [\d.]+ \[ D \] ±\d+ ([\d.]+) \[ D \]", ptxt).group(1))
P_jup = float(re.search(r"Sidereal orbit period = ([\d.]+) d", (MOD / "horizons_obj_599.txt").read_text()).group(1))

def sidereal_from_vectors(code):
    rows = []
    for line in (MOD / f"horizons_vec_{code}.txt").read_text().split("$$SOE")[1].split("$$EOE")[0].strip().splitlines():
        f = line.split(",")
        rows.append((float(f[0]), float(f[2]), float(f[3])))
    a = np.array(rows)
    ang = np.unwrap(np.arctan2(a[:, 2], a[:, 1]))
    k, c = np.polyfit(a[:, 0], ang, 1)
    return 2 * math.pi / k

names = ["Io", "Europa", "Ganymede", "Callisto"]
mod = {}
for i, nm in enumerate(names):
    Ps = sidereal_from_vectors(501 + i)
    Psyn = 1 / (1 / Ps - 1 / P_jup)
    mod[nm] = {**jpl[nm], "P_sid_d": Ps, "P_syn_d": Psyn, "a_RJ_eq": jpl[nm]["a_km"] / R_J}
say(f"Jupiter equatorial radius (1 bar) {R_J} km, mean {R_Jvol} km; sidereal year {P_jup} d")
lt = np.log([mod[n]["P_sid_d"] for n in names]); la = np.log([mod[n]["a_km"] for n in names])
b, se_b, _ = ols(lt, la)
say(f"Modern fit (same method): p = {1/b:.5f} +/- {se_b/b**2:.5f}")
out["modern"] = {"R_J_eq_km": R_J, "R_J_vol_km": R_Jvol, "P_jupiter_d": P_jup, "sats": mod, "p_fit": 1 / b}

say("\nPeriods: 1726 (fixed stars) vs modern sidereal; 1687 vs modern sidereal and synodic (relative to the Sun)")
for i, nm in enumerate(names):
    t26 = out["P1726"]["periods_d"][i]; t87 = out["P1687"]["periods_d"][i]; m = mod[nm]
    say(f"  {nm:9s} 1726 {t26:.6f} vs sid {m['P_sid_d']:.6f} ({(t26/m['P_sid_d']-1)*1e6:+.0f} ppm, {(t26-m['P_sid_d'])*86400:+.0f} s) | "
        f"1687 {t87:.5f} vs sid ({(t87/m['P_sid_d']-1)*100:+.3f}%) vs syn {m['P_syn_d']:.5f} ({(t87-m['P_syn_d'])*1440:+.2f} min) | JPL table P {m['P_table_d']}")
say("  (JPL's tabulated P for Io, 1.762732 d, differs from the sidereal rate in the Horizons vectors; the vectors are used.)")

say("\nDistances in Jupiter semidiameters: each observer vs modern a / 71492 km")
for ed in ("P1687", "P1726"):
    for name, r in out[ed]["rows"].items():
        d = [(r["a"][i] / mod[n]["a_RJ_eq"] - 1) * 100 for i, n in enumerate(names)]
        say(f"  {ed} {name:28s} " + "  ".join(f"{x:+6.1f}%" for x in d))
say(f"  modern a/R_J: " + ", ".join(f"{mod[n]['a_RJ_eq']:.3f}" for n in names))

# Pound's angles at Jupiter's mean distance
pd = TR["P1726"]["rows"]["Pound"]
AU = 149597870.7          # km, cited (IAU 2012)
a_J = 5.2026              # AU, cited: Jupiter's mean distance from the Sun (JPL approximate elements)
diam = frac(pd["diameter_arcsec_assumed"])
mod_diam_eq = 2 * R_J / (a_J * AU) * 206264.806
mod_diam_vol = 2 * R_Jvol / (a_J * AU) * 206264.806
say(f"\nPound's Jupiter diameter {diam:.3f}\" vs modern at {a_J} AU: equatorial {mod_diam_eq:.2f}\", mean {mod_diam_vol:.2f}\" ({(diam/mod_diam_eq-1)*100:+.2f}% vs equatorial)")
for s, key in ((4, "4"), (3, "3")):
    el = pd["elong_arcsec"][key]; el_as = el[0] * 60 + el[1]
    km = el_as / 206264.806 * a_J * AU
    nm = names[s - 1]
    say(f"  Pound's satellite {s}: {el[0]}'{el[1]}\" -> {km:,.0f} km vs JPL a {mod[nm]['a_km']:,.0f} ({(km/mod[nm]['a_km']-1)*100:+.2f}%); "
        f"his {pd['a'][s-1]} semidiam. vs modern {mod[nm]['a_RJ_eq']:.3f} ({(pd['a'][s-1]/mod[nm]['a_RJ_eq']-1)*100:+.2f}%)")
out["pound"] = {"diam_arcsec": diam, "modern_eq_arcsec": mod_diam_eq, "modern_vol_arcsec": mod_diam_vol}

(ROOT / "out" / "jupiter.json").write_text(json.dumps(out, indent=1))
(ROOT / "out" / "jupiter_log.txt").write_text("\n".join(log) + "\n")
