"""Figures for MEASUREMENT.md (static PNGs, light surface). Palette: dataviz reference palette, first
three categorical slots (validated all-pairs), text in ink tokens, recessive grid."""
import json
import os
import sys

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import nbody as N

OUT = N.hz.ROOT / "out"
FIG = OUT / "figures"
FIG.mkdir(exist_ok=True)
SURF, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e4e3df"
S1, S2, S3 = "#2a78d6", "#eb6834", "#1baf7a"
plt.rcParams.update({"figure.facecolor": SURF, "axes.facecolor": SURF, "axes.edgecolor": GRID,
                     "axes.labelcolor": INK2, "xtick.color": INK2, "ytick.color": INK2, "text.color": INK,
                     "axes.grid": True, "grid.color": GRID, "grid.linewidth": 0.8, "font.size": 10,
                     "axes.spines.top": False, "axes.spines.right": False, "legend.frameon": False})
R = json.load(open(OUT / "fit_results.json"))
HEAD = "time"  # pre-registered parametrization of the per-type constants
A = np.load(OUT / "fit_arrays.npz")
year, kind, month, w = A["year"], A["kind"], A["month"], A["w"]
rows = [l.split(",") for l in open(OUT / "measure_input.csv").read().splitlines()[1:]]
v = np.array([float(r[8]) for r in rows])  # "/min along path


def by_type(ax, x, y, title):
    for k, c, mk in (("II", S1, "o"), ("III", S2, "s"), ("IV", S3, "^")):
        m = kind == k
        ax.scatter(x[m], y[m], s=10 + 14 * np.sqrt(w[m]), color=c, marker=mk, edgecolor=SURF, linewidth=1,
                   label=f"contact {k}", zorder=3)
    ax.axhline(0, color=INK2, linewidth=1)
    ax.set_title(title, loc="left", fontsize=10, color=INK)


# 1. residuals after the fit: control and historical, same y-scale, arcsec along the path
fig, axs = plt.subplots(1, 2, figsize=(10, 3.8), sharey=True)
for ax, key, title in ((axs[0], "control", "Control: Horizons contact instants"),
                       (axs[1], "historical", "Historical: Newcomb's 58 contacts")):
    by_type(ax, year, A[f"res_{key}_{HEAD}"] * v / 60, title)
    ax.set_xlabel("year")
axs[0].set_ylabel('residual after fit, arcsec along path')
axs[1].legend(loc="lower right", fontsize=8)
fig.tight_layout()
fig.savefig(FIG / "residuals_after_fit.png", dpi=160, bbox_inches="tight")

# 1b. before any fit: Newtonian model from Horizons' 1780 state vs Horizons' contacts
fig, ax = plt.subplots(figsize=(6, 3.4))
pre = (A["jd_tt_horizons"] - A["prefit_model"]) * 86400
by_type(ax, year, pre, "Horizons minus Newtonian model, same 1780 state, nothing fitted")
ax.set_ylabel("seconds")
ax.set_xlabel("year")
ax.legend(fontsize=8)
fig.tight_layout()
fig.savefig(FIG / "prefit_drift.png", dpi=160, bbox_inches="tight")

# 2. leverage: the part of the D column that no other parameter can mimic (weighted projection)
Afull = A[f"A_historical_{HEAD}"]
sw = np.sqrt(w)
others = np.delete(Afull, 6, axis=1)
coef, *_ = np.linalg.lstsq(others * sw[:, None], Afull[:, 6] * sw, rcond=None)
uniq = Afull[:, 6] - others @ coef
fig, axs = plt.subplots(1, 2, figsize=(10, 3.6))
for mo, c in (("Nov", S1), ("May", S2)):
    m = month == mo
    axs[0].scatter(year[m], Afull[m, 6], color=c, s=26, edgecolor=SURF, linewidth=1, label=f"{mo} transits", zorder=3)
    axs[1].scatter(year[m], uniq[m], color=c, s=26, edgecolor=SURF, linewidth=1, label=f"{mo} transits", zorder=3)
for ax in axs:
    ax.axhline(0, color=INK2, linewidth=1)
    ax.set_xlabel("year")
axs[0].set_ylabel('s of contact time per 1"/century')
axs[0].set_title("Raw partial derivative (other elements held fixed)", loc="left", fontsize=10)
axs[1].set_title("Unique part: after removing what the other 9 parameters mimic", loc="left", fontsize=10)
axs[0].legend(fontsize=8)
fig.tight_layout()
fig.savefig(FIG / "sensitivity_D.png", dpi=160, bbox_inches="tight")

# 3. variants dot plot
items = []
for xk, lab in (("time", "time offsets (pre-registered)"), ("radial", "radial offsets")):
    c = R[f"control_{xk}"]
    items.append((f"Control ({xk} offsets)", c["D"], c["sigma_D"], S2))
    V = R[f"variants_{xk}"]
    for name in ("Newcomb weights", "unweighted", "Delta T from Horizons (SMH 2016)",
                 "without weight-0.1 contacts", "interior contacts only (II, III)"):
        items.append((f"Historical ({xk}): {name}", V[name]["D"], V[name]["sigma_D"], S1))
fig, ax = plt.subplots(figsize=(10, 5.2))
for i, (name, d, s, c) in enumerate(items[::-1]):
    ax.errorbar(d, i, xerr=s, fmt="o", color=c, ecolor=c, elinewidth=2, capsize=0, markersize=6)
ax.set_yticks(range(len(items)))
ax.set_yticklabels([it[0] for it in items[::-1]], fontsize=7.5)
ax.set_xlabel('D, extra advance of the perihelion (arcsec per century), 1-sigma bars; orange = control')
ax.grid(axis="y", visible=False)
fig.tight_layout()
fig.savefig(FIG / "D_variants.png", dpi=160, bbox_inches="tight")

# 4. planetary budget (1000-yr secular rates)
B = json.load(open(OUT / "planet_budget.json"))["1000yr"]
names = ["Venus", "Jupiter", "Earth-Moon", "Saturn", "Mars", "Uranus", "Neptune", "Pluto"]
vals = [B[n] for n in names]
fig, ax = plt.subplots(figsize=(6, 3.4))
ax.barh(range(len(names))[::-1], vals, color=S1, height=0.6)
for i, (n, val) in enumerate(zip(names, vals)):
    ax.text(val + (max(vals) * 0.01), len(names) - 1 - i, f"{val:.1f}", va="center", fontsize=8, color=INK2)
ax.set_yticks(range(len(names))[::-1])
ax.set_yticklabels(names, fontsize=9)
ax.set_xlabel("advance of Mercury's perihelion, arcsec per century (Newtonian, this model)")
ax.grid(axis="y", visible=False)
fig.tight_layout()
fig.savefig(FIG / "planet_budget.png", dpi=160, bbox_inches="tight")
print("figures written to", FIG)
