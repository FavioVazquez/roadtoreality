"""Episode 2, Part 1: Newton's Moon test re-run from the numbers on the pages.

Reads only ../transcription.json (historical inputs, read on page images) and the JPL/Horizons files
in ../data/modern (modern comparison). The only literals here are unit definitions and cited
modern constants, each marked "cited". No expected answer is written anywhere.

Run: .venv/bin/python -I scripts/moon_test.py  -> out/moon_test.json and a log on stdout.
"""
import json, math, re, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
TR = json.loads((ROOT / "transcription.json").read_text())
MT = TR["moon_test"]
MOD = ROOT / "data" / "modern"

# ---------- units (cited: French legal definition of 1799, 1 m = 443.296 lignes of the toise du Perou) ----------
LIGNE_M = 1 / 443.296          # cited
POUCE_M = 12 * LIGNE_M
PIED_M = 12 * POUCE_M          # pied du roi (Paris foot)
TOISE_M = 6 * PIED_M           # hexapeda Parisiensis


def frac(x):
    """[whole, num, den] or number -> float"""
    if isinstance(x, list):
        return x[0] + x[1] / x[2]
    return float(x)


def ft_in_lin(ft=0, inch=0, lin=0):
    return ft + inch / 12 + frac(lin) / 144


def to_ft_in_lin(x_ft):
    ft = math.floor(x_ft)
    rem = (x_ft - ft) * 12
    inch = math.floor(rem)
    lin = (rem - inch) * 12
    return f"{ft} ft {inch} in {lin:.2f} lin"


def dhm_to_s(d=0, h=0, m=0, s=0):
    return ((d * 24 + h) * 60 + frac(m)) * 60 + s


log = []
def say(*a):
    s = " ".join(str(x) for x in a)
    print(s); log.append(s)


out = {}

# ---------- 1. inputs from the pages ----------
pic = MT["PIC1671"]
deg_toises = pic["adopted_degree_toises"]["value"]
R_ft = deg_toises * 6 * 360 / (2 * math.pi)
say("== Inputs (from transcription.json)")
say(f"Picard degree (Mesure de la Terre p.22): {deg_toises} toises")
say(f"  circumference = {deg_toises*6*360:,} Paris ft; Newton prints {MT['P1687']['earth_circumference_paris_ft']['value']:,} (1687 p.406, 1726 p.397)")
say(f"  radius = {R_ft:,.1f} Paris ft; Newton prints {MT['P1726']['earth_radius_paris_ft_printed']['value']:,} (1726 p.413)")
say(f"  = {R_ft*PIED_M/1000:.3f} km")
# Picard's two arcs
deg_s = pic["degree_from_sourdon"]["toises"] + pic["degree_from_sourdon"]["pieds"] / 6
deg_a = pic["degree_from_amiens"]["toises"]
dlat_s = (pic["lat_diff_malvoisine_sourdon"]["deg"] * 3600 + pic["lat_diff_malvoisine_sourdon"]["min"] * 60 + pic["lat_diff_malvoisine_sourdon"]["sec"])
dist_s = pic["meridian_dist_malvoisine_sourdon"]["toises"] + pic["meridian_dist_malvoisine_sourdon"]["pieds"] / 6
dlat_a = (pic["lat_diff_malvoisine_amiens"]["deg"] * 3600 + pic["lat_diff_malvoisine_amiens"]["min"] * 60 + pic["lat_diff_malvoisine_amiens"]["sec"])
dist_a = pic["meridian_dist_malvoisine_amiens"]["toises"]
say(f"  Picard's arcs recomputed: Sourdon {dist_s*3600/dlat_s:.1f} t/deg (printed {deg_s:.1f}), Amiens {dist_a*3600/dlat_a:.1f} t/deg (printed {deg_a})")
sig_obs = pic["stated_precision_per_observation_arcsec"]["value"]
rel_R = math.sqrt(2) * sig_obs / dlat_s       # two latitude observations per arc, Sourdon arc
say(f"  Picard's stated +/-{sig_obs}\" per observation -> +/-{rel_R*100:.3f}% on the degree (+/-{rel_R*deg_toises:.0f} toises)")

T_s = dhm_to_s(**{k: MT["P1687"]["sidereal_period"][k] for k in ("d", "h", "m")})
say(f"Sidereal month (1687 p.406 = 1726 p.397): 27 d 7 h 43 m = {T_s/86400:.6f} d")
T_1726 = dhm_to_s(**{k: MT["P1726"]["sidereal_period"][k] for k in ("d", "h", "m")})
assert T_1726 == T_s

sf = MT["P1726"]["solar_factor"]
F_solar = frac(sf["to"]) / frac(sf["from"])
say(f"1726 solar factor (p.396): {frac(sf['to'])} / {frac(sf['from'])} = {F_solar:.6f}")

# observed fall at the surface in one second
huy = MT["HUY1673"]
L_ft = huy["seconds_pendulum"]["paris_ft"] + frac(huy["seconds_pendulum"]["lines"]) / 144
s_pend = math.pi ** 2 * L_ft / 2
s_huy_direct = huy["fall_1s_paris_rounded"]["ft"] + huy["fall_1s_paris_rounded"]["unc"] / 12
h = huy["fall_1s_horary"]
s_huy_horary_ft = h["ft"] + h["unc"] / 12 + h["lin"] / 144
s_huy_converted = s_huy_horary_ft * huy["paris_to_horary_foot"]["horary"] / huy["paris_to_horary_foot"]["paris"]
pic_L_ft = (pic["seconds_pendulum"]["pouces"] + frac(pic["seconds_pendulum"]["lignes"]) / 12) / 12
s_1687 = frac(MT["P1687"]["surface_fall_1s_paris_ft_huygens"]["value"])
s_1726_printed = ft_in_lin(MT["P1726"]["surface_fall_1s_printed"]["ft"], MT["P1726"]["surface_fall_1s_printed"]["in"], MT["P1726"]["surface_fall_1s_printed"]["lin"])
say("Surface fall in 1 s:")
say(f"  seconds pendulum 3 ft 8 1/2 lin (Huygens p.152; Newton 1726 p.397; Picard p.4 '36 pouces 8 1/2 lignes' = {pic_L_ft:.6f} ft)")
say(f"  pi^2 L / 2 = {s_pend:.5f} ft = {to_ft_in_lin(s_pend)} = {s_pend*144:.2f} lines; Newton prints {to_ft_in_lin(s_1726_printed)} = {s_1726_printed*144:.2f} lines (p.413: 2173 7/9)")
say(f"  Huygens p.155: 14 ft 9 in 6 lin horary x 881/864 = {s_huy_converted:.5f} Paris ft = {to_ft_in_lin(s_huy_converted)}; he rounds to 15 ft 1 in = {s_huy_direct:.5f}")
say(f"  1687 p.407 (as Newton cites Huygens): 15 1/12 ft = {s_1687:.5f}")
out["inputs"] = {"R_paris_ft": R_ft, "R_km": R_ft * PIED_M / 1000, "T_days": T_s / 86400, "F_solar_1726": F_solar,
                 "s_obs_pendulum_ft": s_pend, "s_obs_huygens_direct_ft": s_huy_direct, "s_obs_huygens_horary_converted_ft": s_huy_converted,
                 "rel_sigma_R_picard": rel_R}


# ---------- 2. the comparison ----------
def moon_minute_fall(k, R, T):
    """versed sine of the arc described in 60 s at distance k*R (Paris ft); and small-angle value"""
    th = 2 * math.pi * 60 / T
    return k * R * (1 - math.cos(th)), k * R * th ** 2 / 2


def surface_second_fall(k, R, T, F=1.0):
    """Moon's fall in one minute scaled by k^2 (inverse square) gives the surface fall in one minute;
    a fall from rest goes as t^2, so one second is 1/3600 of it. For k = 60 the two factors cancel exactly."""
    d, d_small = moon_minute_fall(k, R, T)
    return d * F * k ** 2 / 3600, d, d_small


say("\n== Moon test")
variants = {
    "A_1687": dict(k=MT["P1687"]["moon_distance_earth_radii_assumed"]["value"], F=1.0,
                    note="1687 Prop. IV as printed: 60 R, no solar term"),
    "B_1726": dict(k=MT["P1726"]["moon_distance_earth_radii_assumed"]["value"], F=F_solar,
                    note="1726 Prop. IV: 60 R in syzygies, force augmented by 178 29/40 : 177 29/40 (Prop. III Corol.)"),
    "C_60half": dict(k=frac(MT["P1687"]["two_body_distance_earth_radii"]["value"]), F=1.0,
                    note="sensitivity: 60 1/2 R in the one-body formula (Newton's two-body distance, 1687 p.407; also his corrected Tycho value, 1726 p.397)"),
}
obs = {"pendulum pi^2 L/2 (1726 basis)": s_pend, "Huygens 15 ft 1 in (1673 p.155; 1687 p.407)": s_huy_direct}
# uncertainties (1 sigma, relative)
SIG_K = 0.5   # plausible: Newton's own list (59, 60, 60 1/3, 60 2/5, corrected Tycho 60 1/2 or 61) has a spread of about this
sig = {"k (moon distance, +/-0.5 R plausible)": 3 * SIG_K / 60,
       "R (Picard's +/-2\" per latitude)": rel_R,
       "T (rounded to the minute, +/-0.5 min uniform)": 2 * (30 / math.sqrt(3)) / T_s}
sig_obs = {"pendulum pi^2 L/2 (1726 basis)": (0.1 / 440.5),   # Picard p.4: seasonal 1/10 ligne
           "Huygens 15 ft 1 in (1673 p.155; 1687 p.407)": (0.5 / 181) / math.sqrt(3)}  # rounded to the inch, uniform
out["variants"] = {}
for name, v in variants.items():
    s, d, d_small = surface_second_fall(v["k"], R_ft, T_s, v["F"])
    say(f"[{name}] {v['note']}")
    say(f"  Moon's fall in 1 min at {v['k']} R: versed sine {d:.5f} ft = {to_ft_in_lin(d)} (small-angle {d_small:.5f})")
    say(f"  predicted surface fall in 1 s: {s:.5f} ft = {to_ft_in_lin(s)} = {s*PIED_M:.4f} m")
    rec = {"k": v["k"], "F": v["F"], "moon_fall_1min_ft": d, "moon_fall_1min_small_angle_ft": d_small, "pred_surface_fall_1s_ft": s,
           "pred_surface_fall_1s_m": s * PIED_M, "ratios": {}}
    for oname, so in obs.items():
        r = s / so
        sr_in = math.sqrt(sum(x * x for x in sig.values()))
        sr = math.sqrt(sr_in ** 2 + sig_obs[oname] ** 2)
        say(f"  ratio predicted/observed vs {oname}: {r:.5f}  (1 sigma {sr*100:.2f}%; distance alone {sig['k (moon distance, +/-0.5 R plausible)']*100:.2f}%)")
        rec["ratios"][oname] = {"ratio": r, "sigma_rel": sr}
    out["variants"][name] = rec

# Newton's printed intermediate values vs ours
d60 = moon_minute_fall(60, R_ft, T_s)[0]
vs = MT["P1726"]["moon_versed_sine_1min_printed"]
vs_ft = ft_in_lin(vs["ft"], vs["in"], vs["lin"])
say(f"\nNewton's printed versed sine (1726 p.397): {to_ft_in_lin(vs_ft)} = {vs_ft:.5f} ft; recomputed {d60:.5f} ft (diff {(d60/vs_ft-1)*100:+.3f}%)")
say(f"Newton's printed 15 1/12 ft (1687 p.406): diff {(d60/s_1687-1)*100:+.3f}%")
out["newton_arithmetic_check"] = {"versed_sine_printed_ft": vs_ft, "recomputed_ft": d60}

# error budget and envelope
say("\nUncertainty budget (relative, 1 sigma) on the predicted surface fall:")
for kk, vv in sig.items():
    say(f"  {kk}: {vv*100:.3f}%")
for kk, vv in sig_obs.items():
    say(f"  observed, {kk}: {vv*100:.3f}%")
env = {}
for k in (59, 60, 61):
    env[k] = surface_second_fall(k, R_ft, T_s)[0] / s_pend
say("Envelope over Newton's printed distance range (1687 formula, vs pendulum): " +
    ", ".join(f"{k} R -> {r:.4f}" for k, r in env.items()))
out["envelope_vs_pendulum"] = env
out["sigma_components"] = {**sig, **{"obs " + k: v for k, v in sig_obs.items()}}

# ---------- 3. modern comparison ----------
say("\n== Modern values (cited)")
def grab(path, pat):
    m = re.search(pat, (MOD / path).read_text())
    return float(m.group(1))
GM_E = grab("horizons_obj_399.txt", r"GM, km\^3/s\^2\s*=\s*([\d.]+)")
GM_M = grab("horizons_obj_301.txt", r"GM, km\^3/s\^2\s*=\s*([\d.]+)")
a_M = grab("horizons_obj_301.txt", r"Semi-major axis, a\s*=\s*([\d.]+)")
e_M = grab("horizons_obj_301.txt", r"Eccentricity\s*=\s*([\d.]+)")
T_M = grab("horizons_obj_301.txt", r"Orbit period\s*=\s*([\d.]+)") * 86400
R_mean = grab("horizons_obj_399.txt", r"Vol. Mean Radius \(km\)\s*=\s*([\d.]+)")
T_E = 365.25636 * 86400       # cited: sidereal year
# WGS84 (cited)
A84, F84 = 6378.137, 1 / 298.257223563
E2 = F84 * (2 - F84)
phi_paris = math.radians(MT["P1726"]["latitude_paris"]["deg"] + MT["P1726"]["latitude_paris"]["min"] / 60 + MT["P1726"]["latitude_paris"]["sec"] / 3600)
H_PARIS = 0.067                # km, cited: Paris Observatory about 67 m
phi_arc = math.radians(49.2)   # cited: Picard's arc runs from Malvoisine (~48.5 N) to Amiens (~49.9 N)
M_arc = A84 * (1 - E2) / (1 - E2 * math.sin(phi_arc) ** 2) ** 1.5
deg_modern_km = M_arc * math.pi / 180
s2 = math.sin(phi_paris) ** 2
g_paris = 9.7803253359 * (1 + 0.00193185265241 * s2) / math.sqrt(1 - E2 * s2) - 3.086e-6 * H_PARIS * 1000  # WGS84 normal gravity + free-air (cited)
say(f"Earth mean radius (JPL) {R_mean} km; meridian degree at 49.2 N (WGS84) {deg_modern_km:.4f} km = {deg_modern_km*1000/TOISE_M:.1f} toises")
say(f"Moon a = {a_M} km, e = {e_M}, a/R_mean = {a_M/R_mean:.4f}; time-mean distance a(1+e^2/2) = {a_M*(1+e_M**2/2):.0f} km ({a_M*(1+e_M**2/2)/R_mean:.4f} R)")
say(f"Sidereal month (Horizons 301) {T_M/86400:.6f} d; GM_earth {GM_E}, GM_moon {GM_M} km^3/s^2")
say(f"g at Paris (WGS84 normal gravity, 48 50' 10\" N, 67 m): {g_paris:.5f} m/s^2 -> fall in 1 s {g_paris/2:.5f} m = {g_paris/2/PIED_M:.5f} Paris ft")

cmp = {
    "Picard degree": (deg_toises * TOISE_M / 1000, deg_modern_km, "km"),
    "Earth radius (Picard sphere vs mean)": (R_ft * PIED_M / 1000, R_mean, "km"),
    "Moon distance (60 R vs a/R_mean)": (60.0, a_M / R_mean, "R"),
    "Moon distance in km (60 x Picard R vs a)": (60 * R_ft * PIED_M / 1000, a_M, "km"),
    "Sidereal month": (T_s / 86400, T_M / 86400, "d"),
    "Seconds pendulum (3 ft 8.5 lin vs g/pi^2)": (L_ft * PIED_M, g_paris / math.pi ** 2, "m"),
    "Fall in 1 s (pi^2 L/2 vs g/2)": (s_pend * PIED_M, g_paris / 2, "m"),
    "Fall in 1 s (Huygens 15 ft 1 in vs g/2)": (s_huy_direct * PIED_M, g_paris / 2, "m"),
}
say("\nHistorical vs modern:")
out["historical_vs_modern"] = {}
for kk, (hv, mv, u) in cmp.items():
    say(f"  {kk}: {hv:.6g} vs {mv:.6g} {u}  ({(hv/mv-1)*100:+.3f}%)")
    out["historical_vs_modern"][kk] = {"historical": hv, "modern": mv, "unit": u, "rel_diff": hv / mv - 1}

# how each historical input moves the 1687 ratio (log contributions, s_pred ~ k^3 R / T^2 ; obs ~ g)
say("\nWhere the 1687 ratio comes from (each factor = effect of using the historical instead of the modern value):")
k_mod = a_M / R_mean
contrib = {
    "k = 60 instead of a/R": (60 / k_mod) ** 3,
    "Picard R instead of mean R": (R_ft * PIED_M / 1000) / R_mean,
    "27d7h43m instead of modern month": (T_M / T_s) ** 2,
    "pendulum fall instead of g/2 (Paris)": (g_paris / 2) / (s_pend * PIED_M),
}
prod = 1
for kk, vv in contrib.items():
    prod *= vv
    say(f"  {kk}: x{vv:.5f} ({(vv-1)*100:+.3f}%)")
s_mod_newton = 2 * math.pi ** 2 * a_M ** 3 / (R_mean ** 2 * T_M ** 2) * 1000  # m, Newton's formula with modern inputs
base = s_mod_newton / (g_paris / 2)
say(f"  Newton's one-body formula with all-modern inputs: predicted/observed = {base:.5f}")
say(f"  product of input factors x modern baseline = {prod*base:.5f} (= variant A vs pendulum: {out['variants']['A_1687']['ratios']['pendulum pi^2 L/2 (1726 basis)']['ratio']:.5f})")
out["contributions_1687"] = contrib
out["modern_baseline_newton_formula"] = base

# what the modern baseline is made of: physics Newton's 1687 formula leaves out
say("\nModern physics behind the baseline (each factor multiplies the predicted g):")
n_M = 2 * math.pi / T_M
mass = 1 / (1 + GM_M / GM_E)
solar_true = 1 + 0.5 * (T_M / T_E) ** 2  # mean radial solar term, first order (cited theory)
GM_pred = (n_M ** 2) * a_M ** 3 * mass * solar_true
say(f"  two-body: 1/(1+m/M) = {mass:.5f}")
say(f"  Sun, mean radial term 1 + (1/2)(T_moon/T_year)^2 = {solar_true:.5f}  [Newton 1726 uses {F_solar:.5f}, from the 3 deg 3 min apse motion]")
say(f"  GM_earth implied by the Moon's orbit with both = {GM_pred:.1f} km^3/s^2 vs {GM_E} ({(GM_pred/GM_E-1)*100:+.3f}%)")
g_mean = GM_E / R_mean ** 2 * 1000
say(f"  GM/R_mean^2 = {g_mean:.5f} m/s^2 vs normal gravity at Paris {g_paris:.5f} ({(g_mean/g_paris-1)*100:+.3f}%: rotation, flattening, latitude, height)")
# Newton's solar factor from the apse motion, Prop. 45 Cor. 2: apsidal angle = 180 deg * sqrt((1-c)/(1-4c))
aps = frac(sf["apse_motion_per_rev_deg"]) if isinstance(sf["apse_motion_per_rev_deg"], list) else sf["apse_motion_per_rev_deg"]
ang = 180 + aps / 2
q = (ang / 180) ** 2
c = (q - 1) / (4 * q - 1)
say(f"  check: Prop. 45 Cor. 2 with apse motion {aps:.4f} deg/rev gives solar fraction 1/{1/c:.2f}; Newton prints 1/{frac(sf['to']):.3f}; modern mean radial term 1/{1/(solar_true-1):.1f}")
b45 = MT["P1726"]["book1_prop45_cor2"]
c45 = 1 / b45["c_denominator"]
apse45 = 2 * (180 * math.sqrt((1 - c45) / (1 - 4 * c45)) - 180)
pr = b45["apse_motion_per_rev_printed"]
say(f"  Book I Prop. 45 Cor. 2 (1726 p.141): c = 1/{b45['c_denominator']} -> apse motion {apse45*60:.3f}' per rev; printed {pr['deg']} deg {pr['min']}' {pr['sec']}\" = {(pr['deg']*60+pr['min']+pr['sec']/60):.3f}'")
say(f"  Newton's first-order coefficient 1/{b45['c_denominator']} vs modern mean radial term 1/{1/(solar_true-1):.2f} ({((1/b45['c_denominator'])/(solar_true-1)-1)*100:+.2f}%); Book III Prop. III uses 2/{b45['c_denominator']} = 1/{frac(sf['to']):.3f}")
out["book1_prop45"] = {"c": c45, "apse_arcmin_per_rev": apse45 * 60}
out["modern_physics"] = {"two_body_factor": mass, "solar_mean_radial_factor": solar_true, "GM_pred": GM_pred, "GM_earth": GM_E,
                         "g_mean_over_g_paris": g_mean / g_paris, "newton_solar_fraction_from_apse": c}

(ROOT / "out").mkdir(exist_ok=True)
(ROOT / "out" / "moon_test.json").write_text(json.dumps(out, indent=1))
(ROOT / "out" / "moon_test_log.txt").write_text("\n".join(log) + "\n")
